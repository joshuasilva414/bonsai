import { env } from "cloudflare:workers";
import { notFound, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import {
	getRequestHeaders,
	setResponseHeader,
} from "@tanstack/react-start/server";
import { and, asc, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "#/lib/auth";
import type { CurriculumSubtreeRow } from "#/lib/curriculum";
import { db } from "#/lib/db";
import { loadCurriculumSubtreeRows } from "#/lib/db/queries";
import { curriculum, curriculumNode } from "#/lib/db/schema";

export interface CourseOutline {
	id: string;
	title: string;
	createdAt: string;
	updatedAt: string;
	topicCount: number;
	objectiveCount: number;
	topics: Array<{
		id: string;
		name: string;
		subtopics: Array<{
			id: string;
			name: string;
			objectives: Array<{ id: string; name: string }>;
		}>;
	}>;
}

export type CurriculumSubtreeNode = CurriculumSubtreeRow;

async function loadCourseOutlines(userId: string, courseId?: string) {
	const rows = await db
		.select({
			curriculumId: curriculum.id,
			createdAt: curriculum.createdAt,
			updatedAt: curriculum.updatedAt,
			nodeId: curriculumNode.id,
			parentId: curriculumNode.parentId,
			name: curriculumNode.name,
			level: curriculumNode.level,
			position: curriculumNode.position,
		})
		.from(curriculum)
		.leftJoin(curriculumNode, eq(curriculumNode.curriculumId, curriculum.id))
		.where(
			courseId
				? and(eq(curriculum.userId, userId), eq(curriculum.id, courseId))
				: eq(curriculum.userId, userId),
		)
		.orderBy(desc(curriculum.updatedAt), asc(curriculumNode.position));

	const grouped = new Map<string, (typeof rows)[number][]>();

	for (const row of rows) {
		const courseRows = grouped.get(row.curriculumId) ?? [];
		courseRows.push(row);
		grouped.set(row.curriculumId, courseRows);
	}

	return Array.from(grouped.values()).map((courseRows) => {
		const first = courseRows[0];
		const nodes = courseRows.filter(
			(
				row,
			): row is typeof row & {
				nodeId: string;
				name: string;
				level: "subject" | "topic" | "subtopic" | "objective";
				position: number;
			} => row.nodeId !== null,
		);
		const root = nodes.find((node) => node.level === "subject");
		const childrenOf = (parentId: string) =>
			nodes
				.filter((node) => node.parentId === parentId)
				.sort((left, right) => left.position - right.position);
		const topics = root
			? childrenOf(root.nodeId)
					.filter((node) => node.level === "topic")
					.map((topic) => ({
						id: topic.nodeId,
						name: topic.name,
						subtopics: childrenOf(topic.nodeId)
							.filter((node) => node.level === "subtopic")
							.map((subtopic) => ({
								id: subtopic.nodeId,
								name: subtopic.name,
								objectives: childrenOf(subtopic.nodeId)
									.filter((node) => node.level === "objective")
									.map((objective) => ({
										id: objective.nodeId,
										name: objective.name,
									})),
							})),
					}))
			: [];

		return {
			id: first.curriculumId,
			title: root?.name ?? "Untitled course",
			createdAt: first.createdAt.toISOString(),
			updatedAt: first.updatedAt.toISOString(),
			topicCount: topics.length,
			objectiveCount: topics.reduce(
				(total, topic) =>
					total +
					topic.subtopics.reduce(
						(subtotal, subtopic) => subtotal + subtopic.objectives.length,
						0,
					),
				0,
			),
			topics,
		};
	});
}

async function requireUserId() {
	const session = await auth.api.getSession({ headers: getRequestHeaders() });

	if (!session) {
		throw redirect({ to: "/sign-in" });
	}

	setResponseHeader("Cache-Control", "private, no-store");
	setResponseHeader("Vary", "Cookie");

	return session.user.id;
}

export const getMyCourseOutlines = createServerFn({ method: "GET" }).handler(
	async (): Promise<CourseOutline[]> =>
		loadCourseOutlines(await requireUserId()),
);

export const getCourseOutline = createServerFn({ method: "GET" })
	.validator(z.object({ courseId: z.string().min(1) }))
	.handler(async ({ data }): Promise<CourseOutline> => {
		const courses = await loadCourseOutlines(
			await requireUserId(),
			data.courseId,
		);
		const course = courses[0];

		if (!course) {
			throw notFound();
		}

		return course;
	});

export const getCurriculumSubtree = createServerFn({ method: "GET" })
	.validator(z.object({ curriculumNodeId: z.string().min(1) }))
	.handler(async ({ data }): Promise<CurriculumSubtreeNode[]> => {
		const userId = await requireUserId();
		const nodes = await loadCurriculumSubtreeRows(
			env.DB,
			data.curriculumNodeId,
			{ scope: "user", userId },
		);

		if (nodes.length === 0) {
			throw notFound();
		}

		return nodes;
	});

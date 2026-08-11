import assert from "node:assert/strict";
import test from "node:test";
import type { CourseOutline } from "#/functions/courses";
import {
	courseOutlineToGraphNodes,
	visibleCurriculumGraphNodes,
} from "./curriculum-graph";

const course = {
	id: "course-1",
	rootId: "subject-1",
	title: "Distributed systems",
	createdAt: "2026-08-11T00:00:00.000Z",
	updatedAt: "2026-08-11T00:00:00.000Z",
	topicCount: 1,
	objectiveCount: 1,
	topics: [
		{
			id: "topic-1",
			name: "Coordination",
			subtopics: [
				{
					id: "subtopic-1",
					name: "Consensus",
					objectives: [{ id: "objective-1", name: "Explain Raft" }],
				},
			],
		},
	],
} satisfies CourseOutline;

test("flattens a course outline into canonical graph nodes", () => {
	const nodes = courseOutlineToGraphNodes(course);

	assert.deepEqual(
		nodes.map(({ id, parentId, level, siblingOrder, childCount }) => ({
			id,
			parentId,
			level,
			siblingOrder,
			childCount,
		})),
		[
			{
				id: "subject-1",
				parentId: null,
				level: "subject",
				siblingOrder: 1,
				childCount: 1,
			},
			{
				id: "topic-1",
				parentId: "subject-1",
				level: "topic",
				siblingOrder: 1,
				childCount: 1,
			},
			{
				id: "subtopic-1",
				parentId: "topic-1",
				level: "subtopic",
				siblingOrder: 1,
				childCount: 1,
			},
			{
				id: "objective-1",
				parentId: "subtopic-1",
				level: "objective",
				siblingOrder: 1,
				childCount: 0,
			},
		],
	);
});

test("hides every descendant of a collapsed node", () => {
	const nodes = courseOutlineToGraphNodes(course);
	const visibleNodes = visibleCurriculumGraphNodes(nodes, new Set(["topic-1"]));

	assert.deepEqual(
		visibleNodes.map((node) => node.id),
		["subject-1", "topic-1"],
	);
});

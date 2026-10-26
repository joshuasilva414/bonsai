import { and, asc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { db } from "#/lib/db";
import { curriculum, curriculumNode } from "#/lib/db/schema";

export async function getNextSubtopic(courseId: string, userId: string) {
	const parentSubtopic = alias(curriculumNode, "objective_parent_subtopic");
	const parentTopic = alias(curriculumNode, "objective_parent_topic");

	const [nextSubtopicForIncompleteObjective] = await db
		.select({
			id: parentSubtopic.id,
			curriculumId: curriculumNode.curriculumId,
			name: parentSubtopic.name,
		})
		.from(curriculumNode)
		.innerJoin(curriculum, eq(curriculum.id, curriculumNode.curriculumId))
		.innerJoin(
			parentSubtopic,
			and(
				eq(parentSubtopic.id, curriculumNode.parentId),
				eq(parentSubtopic.curriculumId, curriculumNode.curriculumId),
				eq(parentSubtopic.level, "subtopic"),
			),
		)
		.innerJoin(
			parentTopic,
			and(
				eq(parentTopic.id, parentSubtopic.parentId),
				eq(parentTopic.curriculumId, curriculumNode.curriculumId),
				eq(parentTopic.level, "topic"),
			),
		)
		.where(
			and(
				eq(curriculumNode.curriculumId, courseId),
				eq(curriculum.userId, userId),
				eq(curriculumNode.level, "objective"),
				eq(curriculumNode.isComplete, false),
			),
		)
		.orderBy(
			asc(parentTopic.position),
			asc(parentSubtopic.position),
			asc(curriculumNode.position),
		)
		.limit(1);

	if (!nextSubtopicForIncompleteObjective) return null;

	const objectives = await db
		.select({
			id: curriculumNode.id,
			name: curriculumNode.name,
		})
		.from(curriculumNode)
		.where(
			and(
				eq(
					curriculumNode.curriculumId,
					nextSubtopicForIncompleteObjective.curriculumId,
				),
				eq(curriculumNode.parentId, nextSubtopicForIncompleteObjective.id),
				eq(curriculumNode.level, "objective"),
			),
		)
		.orderBy(asc(curriculumNode.position));

	return { ...nextSubtopicForIncompleteObjective, objectives };
}

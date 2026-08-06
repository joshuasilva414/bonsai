import { nanoid } from "nanoid";
import { z } from "zod";
import type { NewCurriculum, NewCurriculumNode } from "./db/schema";
import type { IndexForArray } from "./utils";

export const NamedCurriculumNode = z.object({
	name: z.string(),
});
export type NamedCurriculumNode = z.infer<typeof NamedCurriculumNode>;

export const LearningObjective = NamedCurriculumNode;
export type LearningObjective = z.infer<typeof LearningObjective>;

export const SubtopicSchema = NamedCurriculumNode.extend({
	objectives: z.array(LearningObjective).min(1),
});
export type Subtopic = z.infer<typeof SubtopicSchema>;

export const TopicSchema = NamedCurriculumNode.extend({
	subtopics: z.array(SubtopicSchema).min(1),
});
export type Topic = z.infer<typeof TopicSchema>;

export const SubjectSchema = NamedCurriculumNode.extend({
	topics: z.array(TopicSchema).min(3),
});
export type Subject = z.infer<typeof SubjectSchema>;

export const curriculumTreeLevels = [
	"subject",
	"topic",
	"subtopic",
	"objective",
] as const;
export type CurriculumTreeLevel = (typeof curriculumTreeLevels)[number];
export type CurriculumTreeLevelIndex = IndexForArray<
	typeof curriculumTreeLevels
>;

export type CurriculumNode = Subject | Topic | Subtopic | LearningObjective;

export function childrenOf(node: CurriculumNode): CurriculumNode[] {
	if ("topics" in node) return node.topics;
	if ("subtopics" in node) return node.subtopics;
	if ("objectives" in node) return node.objectives;
	return [];
}

type FlatCurriculumTree = {
	curriculum: NewCurriculum;
	nodes: NewCurriculumNode[];
};
export function flattenCurriculumTree(
	root: Subject,
	userId: string,
): FlatCurriculumTree {
	const curriculumId = nanoid();
	const nodes: NewCurriculumNode[] = [];

	function visit(
		node: CurriculumNode,
		parentId: string | null,
		levelIndex: CurriculumTreeLevelIndex,
		position: number,
	) {
		const id = nanoid();

		nodes.push({
			id,
			curriculumId,
			parentId,
			name: node.name,
			level: curriculumTreeLevels[levelIndex],
			position,
		});

		childrenOf(node).forEach((child, childPosition) => {
			visit(
				child,
				id,
				(levelIndex + 1) as CurriculumTreeLevelIndex,
				childPosition,
			);
		});
	}

	visit(root, null, 0, 0);

	return {
		curriculum: { id: curriculumId, userId },
		nodes,
	};
}

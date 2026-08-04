import { z } from "zod";
import type { IndexForArray } from "./utils";

export const NamedCurriculumNode = z.object({
	name: z.string(),
});
export type NamedCurriculumNode = z.infer<typeof NamedCurriculumNode>;

export const LearningObjective = NamedCurriculumNode;
export type LearningObjective = z.infer<typeof LearningObjective>;

export const Subtopic = NamedCurriculumNode.extend({
	objectives: z.array(LearningObjective).min(1),
});
export type Subtopic = z.infer<typeof Subtopic>;

export const Topic = NamedCurriculumNode.extend({
	subtopics: z.array(Subtopic).min(1),
});
export type Topic = z.infer<typeof Topic>;

export const Subject = NamedCurriculumNode.extend({
	topics: z.array(Topic).min(3),
});
export type Subject = z.infer<typeof Subject>;

export const curriculumTreeLevels = [
	"objective",
	"subtopic",
	"topic",
	"subject",
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

type FlatCurriculumNode = {
	id: string;
	parentId: string | null;
	name: string;
	levelIndex: CurriculumTreeLevelIndex;
	position: number;
};

export function flattenCurriculumTree(root: Subject): FlatCurriculumNode[] {
	const rows: FlatCurriculumNode[] = [];
	function visit(
		node: NamedCurriculumNode,
		parentId: string | null,
		levelIndex: CurriculumTreeLevelIndex,
		position: number,
	) {
		const id = crypto.randomUUID();

		rows.push({
			id,
			parentId,
			name: node.name,
			levelIndex,
			position,
		});

		childrenOf(node).forEach((child, childPosition) => {
			const childLevel = (levelIndex + 1) as CurriculumTreeLevelIndex;
			visit(child, id, childLevel, childPosition);
		});
	}

	visit(root, null, 0, 0);
	return rows;
}

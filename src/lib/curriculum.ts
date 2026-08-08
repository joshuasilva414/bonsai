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

export type FlatCurriculumNode = {
	id: string;
	parentId: string | null;
	name: string;
	level: CurriculumTreeLevel;
	position: number;
};

export type CurriculumSubtreeRow = FlatCurriculumNode & {
	curriculumId: string;
	depth: number;
};

export function childrenOf(node: CurriculumNode): CurriculumNode[] {
	if ("topics" in node) return node.topics;
	if ("subtopics" in node) return node.subtopics;
	if ("objectives" in node) return node.objectives;
	return [];
}

export function inflateCurriculumTree(
	rows: readonly FlatCurriculumNode[],
	rootId: string,
): CurriculumNode {
	const nodesById = new Map<string, FlatCurriculumNode>();

	for (const row of rows) {
		if (nodesById.has(row.id)) {
			throw new Error(`Curriculum node "${row.id}" appears more than once`);
		}
		nodesById.set(row.id, row);
	}

	const root = nodesById.get(rootId);
	if (!root) {
		throw new Error(`Curriculum node "${rootId}" was not found`);
	}

	for (const row of rows) {
		const path = new Set<string>();
		let current: FlatCurriculumNode | undefined = row;

		while (current) {
			if (path.has(current.id)) {
				throw new Error(
					`Curriculum subtree contains a cycle at "${current.id}"`,
				);
			}

			path.add(current.id);
			current = current.parentId ? nodesById.get(current.parentId) : undefined;
		}
	}

	const childrenByParentId = new Map<string, FlatCurriculumNode[]>();
	for (const row of rows) {
		if (row.id === rootId) continue;
		if (row.parentId === null || !nodesById.has(row.parentId)) {
			throw new Error(
				`Curriculum node "${row.id}" is not connected to root "${rootId}"`,
			);
		}

		const children = childrenByParentId.get(row.parentId) ?? [];
		children.push(row);
		childrenByParentId.set(row.parentId, children);
	}

	for (const children of childrenByParentId.values()) {
		children.sort((left, right) => left.position - right.position);
	}

	const visited = new Set<string>();

	const buildNode = (row: FlatCurriculumNode): CurriculumNode => {
		const children = childrenByParentId.get(row.id) ?? [];
		let node: CurriculumNode;

		switch (row.level) {
			case "objective":
				node = LearningObjective.parse({ name: row.name });
				break;
			case "subtopic":
				node = SubtopicSchema.parse({
					name: row.name,
					objectives: children.map(buildNode),
				});
				break;
			case "topic":
				node = TopicSchema.parse({
					name: row.name,
					subtopics: children.map(buildNode),
				});
				break;
			case "subject":
				node = SubjectSchema.parse({
					name: row.name,
					topics: children.map(buildNode),
				});
				break;
		}

		visited.add(row.id);
		return node;
	};

	const tree = buildNode(root);
	if (visited.size !== rows.length) {
		throw new Error(
			`Curriculum subtree rooted at "${rootId}" contains unreachable nodes`,
		);
	}

	return tree;
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

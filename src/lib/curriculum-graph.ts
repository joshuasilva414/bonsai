import type { CourseOutline } from "#/functions/courses";
import type { CurriculumTreeLevel } from "#/lib/curriculum";

export interface CurriculumGraphNode {
	id: string;
	parentId: string | null;
	name: string;
	level: CurriculumTreeLevel;
	siblingOrder: number;
	childCount: number;
}

export function courseOutlineToGraphNodes(
	course: CourseOutline,
): CurriculumGraphNode[] {
	const nodes: CurriculumGraphNode[] = [];

	if (course.rootId) {
		nodes.push({
			id: course.rootId,
			parentId: null,
			name: course.title,
			level: "subject",
			siblingOrder: 1,
			childCount: course.topics.length,
		});
	}

	for (const [topicIndex, topic] of course.topics.entries()) {
		nodes.push({
			id: topic.id,
			parentId: course.rootId,
			name: topic.name,
			level: "topic",
			siblingOrder: topicIndex + 1,
			childCount: topic.subtopics.length,
		});

		for (const [subtopicIndex, subtopic] of topic.subtopics.entries()) {
			nodes.push({
				id: subtopic.id,
				parentId: topic.id,
				name: subtopic.name,
				level: "subtopic",
				siblingOrder: subtopicIndex + 1,
				childCount: subtopic.objectives.length,
			});

			for (const [objectiveIndex, objective] of subtopic.objectives.entries()) {
				nodes.push({
					id: objective.id,
					parentId: subtopic.id,
					name: objective.name,
					level: "objective",
					siblingOrder: objectiveIndex + 1,
					childCount: 0,
				});
			}
		}
	}

	return nodes;
}

export function visibleCurriculumGraphNodes(
	nodes: readonly CurriculumGraphNode[],
	collapsedNodeIds: ReadonlySet<string>,
): CurriculumGraphNode[] {
	const hiddenNodeIds = new Set<string>();
	const childrenByParentId = new Map<string, CurriculumGraphNode[]>();

	for (const node of nodes) {
		if (!node.parentId) continue;
		const siblings = childrenByParentId.get(node.parentId) ?? [];
		siblings.push(node);
		childrenByParentId.set(node.parentId, siblings);
	}

	const hideDescendants = (nodeId: string) => {
		for (const child of childrenByParentId.get(nodeId) ?? []) {
			hiddenNodeIds.add(child.id);
			hideDescendants(child.id);
		}
	};

	for (const nodeId of collapsedNodeIds) hideDescendants(nodeId);

	return nodes.filter((node) => !hiddenNodeIds.has(node.id));
}

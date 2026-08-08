import type { CurriculumSubtreeRow } from "#/lib/curriculum";
import { db } from ".";
import {
	curriculum,
	curriculumNode,
	type NewCurriculum,
	type NewCurriculumNode,
} from "./schema";

// Each node insert binds six values. Keep individual statements below D1's
// SQLite variable limit, including room for future persisted node fields.
const nodeInsertBatchSize = 15;

type CurriculumSubtreeAccess =
	| { scope: "all" }
	| { scope: "user"; userId: string };

export async function loadCurriculumSubtreeRows(
	database: D1Database,
	nodeId: string,
	access: CurriculumSubtreeAccess,
): Promise<CurriculumSubtreeRow[]> {
	const userId = access.scope === "user" ? access.userId : "";
	const { results } = await database
		.prepare(
			`with recursive subtree (
				id,
				curriculum_id,
				parent_id,
				name,
				level,
				position,
				depth,
				sort_path,
				visited_ids
			) as (
				select
					node.id,
					node.curriculum_id,
					node.parent_id,
					node.name,
					node.level,
					node.position,
					0,
					printf('%020d', node.position),
					'|' || node.id || '|'
				from curriculum_node as node
				inner join curriculum as course
					on course.id = node.curriculum_id
				where node.id = ?
					and (? = 'all' or course.user_id = ?)

				union all

				select
					child.id,
					child.curriculum_id,
					child.parent_id,
					child.name,
					child.level,
					child.position,
					subtree.depth + 1,
					subtree.sort_path || '.' || printf('%020d', child.position),
					subtree.visited_ids || child.id || '|'
				from curriculum_node as child
				inner join subtree
					on child.parent_id = subtree.id
					and child.curriculum_id = subtree.curriculum_id
				where subtree.level <> 'objective'
					and instr(subtree.visited_ids, '|' || child.id || '|') = 0
			)
			select
				id,
				curriculum_id as curriculumId,
				parent_id as parentId,
				name,
				level,
				position,
				depth
			from subtree
			order by sort_path`,
		)
		.bind(nodeId, access.scope, userId)
		.all<CurriculumSubtreeRow>();

	return results;
}

export async function saveCurriculumTree(
	newCurriculum: NewCurriculum,
	newNodes: NewCurriculumNode[],
) {
	const nodeInsertBatches = Array.from(
		{ length: Math.ceil(newNodes.length / nodeInsertBatchSize) },
		(_, index) =>
			newNodes.slice(
				index * nodeInsertBatchSize,
				(index + 1) * nodeInsertBatchSize,
			),
	);

	await db.batch([
		db.insert(curriculum).values(newCurriculum),
		...nodeInsertBatches.map((nodes) =>
			db.insert(curriculumNode).values(nodes),
		),
	]);

	return newCurriculum.id;
}

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

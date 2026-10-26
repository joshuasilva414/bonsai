import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { drizzle } from "drizzle-orm/sqlite-proxy";
import { flattenCurriculumTree } from "../curriculum";

test("saves a curriculum across statements within D1's parameter limit", async (t) => {
	using sqlite = new DatabaseSync(":memory:");
	sqlite.exec("PRAGMA foreign_keys = ON");
	const migrations = new URL("../../../drizzle/", import.meta.url);
	for (const name of readdirSync(migrations).sort()) {
		sqlite.exec(
			readFileSync(new URL(`${name}/migration.sql`, migrations), "utf8"),
		);
	}
	sqlite.exec(
		"INSERT INTO user (id, name, email) VALUES ('test-user', 'Test', 'test@example.com')",
	);

	const parameterCounts: number[] = [];
	const database = drizzle(
		async () => {
			throw new Error("Curriculum writes must use a batch");
		},
		async (statements) =>
			statements.map(({ sql, params }) => {
				parameterCounts.push(params.length);
				assert.ok(
					params.length <= 100,
					`Statement binds ${params.length} parameters; D1 allows at most 100`,
				);
				sqlite.prepare(sql).run(...params);
				return { rows: [] };
			}),
	);
	t.mock.module(new URL("./index.ts", import.meta.url), {
		namedExports: { db: database },
	});
	const { saveCurriculumTree } = await import("./queries");
	const { curriculum, nodes } = flattenCurriculumTree(
		{
			name: "Data Structures and Algorithms",
			topics: Array.from({ length: 3 }, (_, topic) => ({
				name: `Topic ${topic}`,
				subtopics: [
					{
						name: "Subtopic",
						objectives: Array.from({ length: 12 }, (_, objective) => ({
							name: `Objective ${objective}`,
						})),
					},
				],
			})),
		},
		"test-user",
	);

	assert.equal(await saveCurriculumTree(curriculum, nodes), curriculum.id);
	assert.ok(
		parameterCounts.length > 2,
		"Expected multiple node insert statements",
	);
	assert.equal(
		sqlite.prepare("SELECT count(*) AS count FROM curriculum_node").get()
			?.count,
		nodes.length,
	);
	assert.deepEqual(sqlite.prepare("PRAGMA foreign_key_check").all(), []);
});

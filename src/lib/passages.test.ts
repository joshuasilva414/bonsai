import assert from "node:assert/strict";
import test from "node:test";
import { passageClosingExcerpt } from "./passages";

test("passageClosingExcerpt keeps focused local context instead of a long prose tail", () => {
	const opening =
		"An earlier paragraph that should not influence the next opening. ".repeat(
			10,
		);
	const penultimate =
		"Formal charge gives us a way to compare candidate structures and account for where each valence electron has gone.";
	const closing =
		"That accounting becomes essential when a single molecule can be drawn in more than one reasonable way.";

	const excerpt = passageClosingExcerpt(
		`${opening}\n\n${penultimate}\n\n${closing}`,
	);

	assert.equal(excerpt, `${penultimate}\n\n${closing}`);
	assert.doesNotMatch(excerpt, /earlier paragraph/);
});

test("passageClosingExcerpt bounds an unusually long final paragraph", () => {
	const excerpt = passageClosingExcerpt("start ".repeat(200), 120, 60);

	assert.ok(excerpt.length <= 120);
	assert.match(excerpt, /start$/);
});

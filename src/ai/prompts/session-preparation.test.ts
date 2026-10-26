import assert from "node:assert/strict";
import test from "node:test";
import { buildSessionArtifactPlanPrompt } from "./artifact-plan";
import { buildSessionOutlinePrompt } from "./session-outline";

const sessionContext = {
	lastSession: null,
	nextSubtopic: {
		name: "Promise composition",
		objectives: [
			{ name: "Chain dependent promises" },
			{ name: "Run independent promises concurrently" },
		],
	},
};

test("scopes a session outline to the whole next subtopic", () => {
	const prompt = buildSessionOutlinePrompt(sessionContext);

	assert.match(prompt, /Session Subtopic: Promise composition/);
	assert.match(prompt, /1\. Chain dependent promises/);
	assert.match(prompt, /2\. Run independent promises concurrently/);
	assert.match(prompt, /addressing every learning objective/);
	assert.doesNotMatch(prompt, /Session Objective/);
});

test("scopes the artifact plan to the subtopic and includes outline content", () => {
	const prompt = buildSessionArtifactPlanPrompt(sessionContext, {
		content:
			"Teach promise chains, concurrent composition, and error handling.",
	});

	assert.match(
		prompt,
		/<session-subtopic>Promise composition<\/session-subtopic>/,
	);
	assert.match(
		prompt,
		/Teach promise chains, concurrent composition, and error handling\./,
	);
	assert.match(prompt, /Chain dependent promises/);
	assert.match(prompt, /Run independent promises concurrently/);
	assert.match(prompt, /Support every learning objective in the subtopic/);
	assert.doesNotMatch(prompt, /\[object Object\]/);
});

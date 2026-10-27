import assert from "node:assert/strict";
import { mock, test } from "node:test";
import { createOpenaiChat } from "@tanstack/ai-openai";
import { z } from "zod";
import type { PassageContentUpdate } from "#/lib/passage-stream";

let output: unknown;
let truncate = false;
let providerSignal: AbortSignal | null | undefined;

function responseObject() {
	return {
		id: "response-test",
		object: "response",
		model: "gpt-5.6-luna",
		status: "completed",
		output: [
			{
				id: "message-test",
				type: "message",
				role: "assistant",
				status: "completed",
				content: [
					{
						type: "output_text",
						text: JSON.stringify(output),
						annotations: [],
					},
				],
			},
		],
	};
}

// Keep TanStack's engine and OpenAI adapter real; replace only the provider HTTP transport.
mock.module(new URL("./models.ts", import.meta.url), {
	namedExports: {
		createTinyModel: () =>
			createOpenaiChat("gpt-5.6-luna", "test-key", {
				fetch: async (_input, init) => {
					providerSignal = init?.signal;
					const body: unknown = JSON.parse(String(init?.body));
					const { stream } = z.object({ stream: z.boolean() }).parse(body);
					if (!stream) return Response.json(responseObject());

					const raw = JSON.stringify(output);
					const events = [
						{
							type: "response.created",
							response: { id: "response-test", model: "gpt-5.6-luna" },
						},
						...Array.from(
							{ length: Math.ceil(raw.length / 8) },
							(_, index) => ({
								type: "response.output_text.delta",
								item_id: "message-test",
								output_index: 0,
								content_index: 0,
								delta: raw.slice(index * 8, (index + 1) * 8),
							}),
						),
						...(truncate
							? []
							: [{ type: "response.completed", response: responseObject() }]),
					];
					const encoder = new TextEncoder();
					return new Response(
						new ReadableStream({
							pull(controller) {
								const event = events.shift();
								if (!event) return controller.close();
								controller.enqueue(
									encoder.encode(
										`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`,
									),
								);
							},
						}),
						{ headers: { "Content-Type": "text/event-stream" } },
					);
				},
			}),
	},
});

const {
	generateCurriculumTree,
	generateNextPassage,
	generateSessionOutline,
	generateSessionArtifactPlan,
} = await import("./generate");

const passage = {
	content:
		'An electron has a negative charge.\n\nConsider "charge" and \\alpha.',
	continuation: {
		summary: "Private handoff context",
		keyIdeas: ["charge"],
		openThreads: [],
		nextMove: "Introduce protons",
	},
};

test("structured generators return the existing curriculum, outline, and artifact contracts", async () => {
	output = {
		name: "Physics",
		topics: Array.from({ length: 3 }, (_, index) => ({
			name: `Topic ${index}`,
			subtopics: [{ name: "Atoms", objectives: [{ name: "Explain charge" }] }],
		})),
	};
	assert.deepEqual(await generateCurriculumTree("Teach physics"), output);
	output = {
		content: "An outline for learning about atomic structure. ".repeat(4),
	};
	assert.deepEqual(await generateSessionOutline("Plan a session"), output);
	output = {
		type: "diagram",
		description: "An atom",
		requirements: "Label the particles",
	};
	assert.deepEqual(
		await generateSessionArtifactPlan("Plan an artifact"),
		output,
	);
});

test("passages stream decoded Markdown without continuation metadata and return the complete object", async () => {
	output = passage;
	const updates: PassageContentUpdate[] = [];
	const result = await generateNextPassage(
		"Write a passage",
		new AbortController().signal,
		(update) => updates.push(update),
	);
	assert.deepEqual(result, passage);
	assert.ok(
		updates.length > 1,
		"Expected incremental updates before the final result",
	);
	let content = "";
	for (const update of updates) {
		content =
			update.operation === "replace"
				? update.content
				: content + update.content;
		assert.ok(passage.content.startsWith(content));
	}
	assert.equal(content, passage.content);
});

test("invalid completed output fails instead of completing the passage", async () => {
	output = { content: "Visible text", continuation: { summary: 42 } };
	await assert.rejects(
		generateNextPassage(
			"Write a passage",
			new AbortController().signal,
			() => {},
		),
	);
});

test("a truncated provider stream fails instead of completing the passage", async () => {
	output = passage;
	truncate = true;
	try {
		await assert.rejects(
			generateNextPassage(
				"Write a passage",
				new AbortController().signal,
				() => {},
			),
		);
	} finally {
		truncate = false;
	}
});

test("cancellation stops progress and reaches the provider request", async () => {
	output = passage;
	const controller = new AbortController();
	let updates = 0;
	await assert.rejects(
		generateNextPassage("Write a passage", controller.signal, () => {
			updates += 1;
			controller.abort();
		}),
		{ name: "AbortError" },
	);
	assert.equal(updates, 1);
	assert.equal(providerSignal?.aborted, true);
});

test("an already cancelled passage never emits progress", async () => {
	await assert.rejects(
		generateNextPassage("Write a passage", AbortSignal.abort(), () =>
			assert.fail("Unexpected progress"),
		),
		{ name: "AbortError" },
	);
});

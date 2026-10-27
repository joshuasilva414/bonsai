import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import type { ModelMessage } from "@tanstack/ai";
import { reconstructChat } from "@tanstack/ai-persistence";
import { createWhiteboardStore } from "./whiteboard-store";

function openStore(sqlite: DatabaseSync) {
	return createWhiteboardStore({
		exec(query, ...bindings) {
			const rows = sqlite.prepare(query).all(...bindings);
			return { toArray: () => rows };
		},
	});
}

const transcript = [
	{ id: "user-1", role: "user", content: "What is charge?" },
	{
		id: "assistant-1",
		role: "assistant",
		content: "Charge determines electrical interactions.",
	},
] satisfies [ModelMessage, ModelMessage];

test("ownership is durable, idempotent, and cannot be reassigned", () => {
	using sqlite = new DatabaseSync(":memory:");
	const store = openStore(sqlite);
	assert.equal(store.getSession("alice"), null);
	store.initialize("board-1", "alice");
	store.initialize("board-1", "alice");
	assert.deepEqual(openStore(sqlite).getSession("alice"), { id: "board-1" });
	assert.equal(store.getSession("bob"), null);
	assert.equal(store.owns("alice", "board-1"), true);
	assert.equal(store.owns("alice", "board-2"), false);
	assert.equal(store.owns("bob", "board-1"), false);
	assert.throws(() => store.initialize("board-1", "bob"));
	assert.throws(() => store.initialize("board-2", "alice"));
});

test("transcripts survive closing and reopening SQLite", async () => {
	const directory = mkdtempSync(join(tmpdir(), "bonsai-chat-"));
	try {
		const path = join(directory, "session.sqlite");
		{
			using sqlite = new DatabaseSync(path);
			const store = openStore(sqlite);
			store.initialize("board-1", "alice");
			await store.persistence.stores.messages.saveThread("board-1", transcript);
		}
		using reopened = new DatabaseSync(path);
		const store = openStore(reopened);
		assert.equal(store.owns("alice", "board-1"), true);
		assert.deepEqual(
			await store.persistence.stores.messages.loadThread("board-1"),
			transcript,
		);
	} finally {
		rmSync(directory, { recursive: true });
	}
});

test("message storage replaces the full transcript, preserves IDs, and isolates threads", async () => {
	using sqlite = new DatabaseSync(":memory:");
	const messages = openStore(sqlite).persistence.stores.messages;
	assert.deepEqual(await messages.loadThread("unknown"), []);
	await messages.saveThread("board-1", transcript);
	await messages.saveThread("board-2", [transcript[0]]);
	await messages.saveThread("board-1", [transcript[1]]);
	assert.deepEqual(await messages.loadThread("board-1"), [transcript[1]]);
	assert.deepEqual(await messages.loadThread("board-2"), [transcript[0]]);
});

test("tool calls and results survive persistence without losing their arguments", async () => {
	using sqlite = new DatabaseSync(":memory:");
	const messages = openStore(sqlite).persistence.stores.messages;
	const toolTranscript: ModelMessage[] = [
		{
			id: "assistant-tool",
			role: "assistant",
			content: null,
			toolCalls: [
				{
					id: "call-1",
					type: "function",
					function: { name: "read_board", arguments: '{"page":"one"}' },
				},
			],
		},
		{
			id: "result-1",
			role: "tool",
			toolCallId: "call-1",
			content: '{"shapes":[]}',
		},
	];
	await messages.saveThread("board-1", toolTranscript);
	assert.deepEqual(await messages.loadThread("board-1"), toolTranscript);
});

test("hydration restores renderable messages and rejects other users or threads", async () => {
	using sqlite = new DatabaseSync(":memory:");
	const store = openStore(sqlite);
	store.initialize("board-1", "alice");
	await store.persistence.stores.messages.saveThread("board-1", transcript);
	const request = new Request(
		"https://bonsai.test/agents/whiteboard-agent/board-1?threadId=board-1",
	);
	const response = await reconstructChat(store.persistence, request, {
		authorize: (threadId) => store.owns("alice", threadId),
	});
	assert.equal(response.status, 200);
	const body: unknown = await response.json();
	assert.deepEqual(body, {
		messages: [
			{
				id: "user-1",
				role: "user",
				parts: [{ type: "text", content: "What is charge?" }],
			},
			{
				id: "assistant-1",
				role: "assistant",
				parts: [
					{
						type: "text",
						content: "Charge determines electrical interactions.",
					},
				],
			},
		],
		activeRun: null,
		interrupts: null,
	});
	const denied = await reconstructChat(store.persistence, request, {
		authorize: (threadId) => store.owns("bob", threadId),
	});
	assert.equal(denied.status, 403);
	const wrongThread = await reconstructChat(
		store.persistence,
		new Request(`${request.url}-other`),
		{ authorize: (threadId) => store.owns("alice", threadId) },
	);
	assert.equal(wrongThread.status, 403);
});

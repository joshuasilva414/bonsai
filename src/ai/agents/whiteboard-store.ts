import {
	chatParamsFromRequestBody,
	convertMessagesToModelMessages,
	modelMessagesToUIMessages,
	uiMessagesToWire,
} from "@tanstack/ai";
import {
	defineAIPersistence,
	defineMessageStore,
} from "@tanstack/ai-persistence";
import { z } from "zod";

type WhiteboardDatabase = {
	exec(
		query: string,
		...bindings: (string | number | null)[]
	): {
		toArray(): unknown[];
	};
};

const SessionSchema = z.object({
	session_id: z.string(),
	owner_id: z.string(),
});
const TranscriptSchema = z.object({ messages: z.string() });
export const WhiteboardContextSchema = z.object({
	shapes: z.array(
		z.object({
			id: z.string(),
			type: z.string(),
			text: z.string().optional(),
			bounds: z.object({
				x: z.number(),
				y: z.number(),
				w: z.number(),
				h: z.number(),
			}).optional(),
		})
	)
});

export type WhiteboardContext = z.infer<
	typeof WhiteboardContextSchema
>;

/** One Agent owns one session. Ownership is assigned only through server-side RPC. */
export function createWhiteboardStore(database: WhiteboardDatabase) {
	database.exec(`CREATE TABLE IF NOT EXISTS whiteboard_session (
		id INTEGER PRIMARY KEY CHECK (id = 1),
		session_id TEXT NOT NULL,
		owner_id TEXT NOT NULL
	)`);
	database.exec(`CREATE TABLE IF NOT EXISTS whiteboard_transcript (
		thread_id TEXT PRIMARY KEY,
		messages TEXT NOT NULL
	)`);

	function session() {
		const row = database
			.exec("SELECT session_id, owner_id FROM whiteboard_session WHERE id = 1")
			.toArray()[0];
		return row ? SessionSchema.parse(row) : null;
	}

	const persistence = defineAIPersistence({
		stores: {
			messages: defineMessageStore({
				async loadThread(threadId) {
					const row = database
						.exec(
							"SELECT messages FROM whiteboard_transcript WHERE thread_id = ?",
							threadId,
						)
						.toArray()[0];
					if (!row) return [];
					const messages: unknown = JSON.parse(
						TranscriptSchema.parse(row).messages,
					);
					// Use TanStack's wire validation and conversion rather than duplicating its message schema.
					const parsed = await chatParamsFromRequestBody({
						threadId,
						runId: "restore",
						messages,
						tools: [],
						context: [],
						state: {},
						forwardedProps: {},
					});
					return convertMessagesToModelMessages(parsed.messages).map(
						(message) => ({
							...message,
							content: message.content ?? null,
						}),
					);
				},
				async saveThread(threadId, messages) {
					database.exec(
						`INSERT INTO whiteboard_transcript (thread_id, messages) VALUES (?, ?)
						ON CONFLICT(thread_id) DO UPDATE SET messages = excluded.messages`,
						threadId,
						JSON.stringify(
							uiMessagesToWire(modelMessagesToUIMessages(messages)),
						),
					);
				},
			}),
		},
	});

	return {
		persistence,
		initialize(sessionId: string, userId: string) {
			database.exec(
				"INSERT OR IGNORE INTO whiteboard_session (id, session_id, owner_id) VALUES (1, ?, ?)",
				sessionId,
				userId,
			);
			const existing = session();
			if (existing?.session_id !== sessionId || existing.owner_id !== userId) {
				throw new Error("Session already belongs to another owner");
			}
		},
		getSession(userId: string) {
			const existing = session();
			return existing?.owner_id === userId ? { id: existing.session_id } : null;
		},
		owns(userId: string, threadId: string) {
			const existing = session();
			return existing?.owner_id === userId && existing.session_id === threadId;
		},
	};
}

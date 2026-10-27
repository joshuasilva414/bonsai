import { chat, parsePartialJSON } from "@tanstack/ai";
import { nanoid } from "nanoid";
import { ArtifactPlanSchema } from "#/lib/artifacts";
import { type Subject, SubjectSchema } from "#/lib/curriculum";
import {
	type PassageContentUpdate,
	passageContentUpdate,
} from "#/lib/passage-stream";
import { type GeneratedPassage, GeneratedPassageSchema } from "#/lib/passages";
import { SessionOutlineSchema } from "#/lib/sessions";
import { createTinyModel } from "@/ai/models";

const PassageContentSchema = GeneratedPassageSchema.pick({ content: true });

export async function generateCurriculumTree(prompt: string): Promise<Subject> {
	return chat({
		adapter: createTinyModel(),
		outputSchema: SubjectSchema,
		messages: [{ role: "user", content: prompt }],
		threadId: nanoid(),
	});
}

export async function generateNextPassage(
	prompt: string,
	abortSignal: AbortSignal,
	onContent: (update: PassageContentUpdate) => void,
): Promise<GeneratedPassage> {
	abortSignal.throwIfAborted();
	const abortController = new AbortController();
	const abort = () => abortController.abort(abortSignal.reason);
	abortSignal.addEventListener("abort", abort, { once: true });

	let lastContent = "";
	let raw = "";
	let structuredMessageId: string | undefined;
	let result: GeneratedPassage | undefined;

	function publishContent(content: string) {
		if (content === lastContent) return;
		const update = passageContentUpdate(lastContent, content);
		lastContent = content;
		onContent(update);
	}

	try {
		const stream = chat({
			adapter: createTinyModel(),
			outputSchema: GeneratedPassageSchema,
			stream: true,
			messages: [{ role: "user", content: prompt }],
			threadId: nanoid(),
			abortController,
			reasoning: "off",
		});

		for await (const chunk of stream) {
			abortSignal.throwIfAborted();
			if (chunk.type === "RUN_ERROR") throw new Error(chunk.message);
			if (chunk.type === "CUSTOM") {
				if (chunk.name === "structured-output.start") {
					structuredMessageId = chunk.value.messageId;
					raw = "";
				} else if (chunk.name === "structured-output.complete") {
					result = chunk.value.object;
					publishContent(result.content);
				}
			} else if (
				chunk.type === "TEXT_MESSAGE_CONTENT" &&
				chunk.messageId === structuredMessageId
			) {
				raw += chunk.delta;
				// Only Markdown content is public; continuation metadata stays server-side.
				const partial: unknown = parsePartialJSON(raw);
				const parsed = PassageContentSchema.safeParse(partial);
				if (parsed.success) publishContent(parsed.data.content);
			}
		}

		abortSignal.throwIfAborted();
		if (!result)
			throw new Error("Passage stream ended without a complete output");
		return result;
	} finally {
		abortSignal.removeEventListener("abort", abort);
	}
}

export async function generateSessionOutline(prompt: string) {
	return chat({
		adapter: createTinyModel(),
		outputSchema: SessionOutlineSchema,
		messages: [{ role: "user", content: prompt }],
		threadId: nanoid(),
	});
}

export async function generateSessionArtifactPlan(prompt: string) {
	return chat({
		adapter: createTinyModel(),
		outputSchema: ArtifactPlanSchema,
		messages: [{ role: "user", content: prompt }],
		threadId: nanoid(),
	});
}

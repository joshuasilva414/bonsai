import { generateText, Output, streamText } from "ai";
import { type Subject, SubjectSchema } from "#/lib/curriculum";
import {
	type PassageContentUpdate,
	passageContentUpdate,
} from "#/lib/passage-stream";
import { GeneratedPassageSchema } from "#/lib/passages";
import { TINY_MODEL } from "@/ai/models";

export async function generateCurriculumTree(prompt: string): Promise<Subject> {
	const { output } = await generateText({
		model: TINY_MODEL,
		output: Output.object({ schema: SubjectSchema }),
		prompt,
	});

	return output;
}

export async function generateNextPassage(
	prompt: string,
	abortSignal: AbortSignal,
	onContent: (update: PassageContentUpdate) => void,
) {
	const result = streamText({
		model: TINY_MODEL,
		output: Output.object({ schema: GeneratedPassageSchema }),
		prompt,
		abortSignal,
		reasoning: "none",
	});

	let lastContent = "";

	for await (const partialOutput of result.partialOutputStream) {
		const content = partialOutput.content;
		if (typeof content !== "string" || content === lastContent) continue;

		const update = passageContentUpdate(lastContent, content);

		lastContent = content;
		onContent(update);
	}

	return await result.output;
}

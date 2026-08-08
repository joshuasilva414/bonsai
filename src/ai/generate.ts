import { generateText, Output } from "ai";
import { type Subject, SubjectSchema } from "#/lib/curriculum";
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
) {
	const { output } = await generateText({
		model: TINY_MODEL,
		prompt,
		abortSignal,
	});

	return output;
}

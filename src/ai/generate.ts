import { generateText, Output } from "ai";
import { Subject } from "#/lib/curriculum";
import { TINY_MODEL } from "@/ai/models";

export async function generateCurriculumTree(prompt: string) {
	const { output } = await generateText({
		model: TINY_MODEL,
		output: Output.object({ schema: Subject }),
		prompt,
	});

	return output;
}

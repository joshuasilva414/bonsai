import { z } from "zod";

export type Passage = {
	content: string;
};

export const PassageContinuationSchema = z.object({
	summary: z
		.string()
		.describe(
			"A compact cumulative account of the reader's conceptual path through this passage.",
		),
	keyIdeas: z
		.array(z.string())
		.max(6)
		.describe(
			"The most relevant terms, claims, examples, and notation established so far.",
		),
	openThreads: z
		.array(z.string())
		.max(4)
		.describe(
			"Relevant questions or ideas still open after this passage, including carried-forward threads.",
		),
	nextMove: z
		.string()
		.describe(
			"The most natural pedagogical move from this exact stopping point.",
		),
});

export const GeneratedPassageSchema = z.object({
	content: z
		.string()
		.describe("The reader-facing textbook passage in Markdown."),
	continuation: PassageContinuationSchema.describe(
		"Internal handoff context for writing the following passage. Do not include it in content.",
	),
});

export type GeneratedPassage = z.infer<typeof GeneratedPassageSchema>;
export type PassageContinuation = z.infer<typeof PassageContinuationSchema> & {
	passageNumber: number;
	closingExcerpt: string;
};

export function passageClosingExcerpt(
	content: string,
	maximumLength = 600,
	minimumLength = 160,
): string {
	const paragraphs = content
		.trim()
		.split(/\n\s*\n/)
		.map((paragraph) => paragraph.trim())
		.filter(Boolean);

	let excerpt = "";

	for (let index = paragraphs.length - 1; index >= 0; index -= 1) {
		const paragraph = paragraphs[index];
		if (!paragraph) continue;

		const candidate = excerpt ? `${paragraph}\n\n${excerpt}` : paragraph;
		if (candidate.length > maximumLength && excerpt.length >= minimumLength)
			break;

		excerpt = candidate;
		if (excerpt.length >= minimumLength) break;
	}

	if (excerpt.length <= maximumLength) return excerpt;

	return excerpt.slice(-maximumLength).trimStart();
}

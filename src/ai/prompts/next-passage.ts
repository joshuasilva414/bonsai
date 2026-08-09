import type { CurriculumNode } from "#/lib/curriculum";
import type { PassageContinuation } from "#/lib/passages";

type NextPassagePromptContext = {
	curriculumSubtree: CurriculumNode;
	previousPassage: PassageContinuation | null;
};

export function nextPassagePrompt({
	curriculumSubtree,
	previousPassage,
}: NextPassagePromptContext): string {
	const passageNumber = (previousPassage?.passageNumber ?? 0) + 1;
	const continuityContext = previousPassage
		? JSON.stringify(previousPassage, null, 2)
		: "This is the first passage. Orient the reader naturally without referring to earlier material.";

	return `
You are writing passage ${passageNumber} of a continuous, adaptive textbook. Write the next part of the book, not a standalone lesson or a recap.

<curriculum_map>
${JSON.stringify(curriculumSubtree, null, 2)}
</curriculum_map>

<continuity_from_previous_passage>
${continuityContext}
</continuity_from_previous_passage>

Choose the most useful next pedagogical move supported by the curriculum map. You may deepen the current idea, resolve an open thread, give a clarifying example, or advance to a nearby objective. Prefer conceptual coherence over mechanically visiting the curriculum in order.

Continuity requirements:
- Treat closingExcerpt as text already printed immediately above your response. Begin by adding new information; no bridge sentence is required.
- Do not paraphrase the final sentence, repeat its conclusion, or reuse its opening grammatical frame. In particular, avoid beginning with the same demonstrative phrase, subject, or first three content words.
- Prefer implicit continuity: carry the idea forward through the substance of the explanation rather than announcing or restating the connection.
- Build on established keyIdeas without redefining or summarizing them unless a brief reminder is needed for clarity.
- Use openThreads and nextMove as guidance, not as text to quote or a mandatory outline.
- Avoid transition labels and meta-commentary such as "in the previous passage", "in this passage", "next we will", or "as we continue".
- Do not add a title or heading merely because a new passage is being generated; use one only when the subject genuinely changes enough to require it.
- Do not restart with a broad introduction, repeat the previous conclusion, or abruptly change subject.
- End at a meaningful hinge: complete the immediate thought while leaving a natural direction for another passage.

Writing requirements:
- Write polished explanatory prose for a curious learner, with concrete examples when they improve understanding.
- Return reader-facing Markdown only in content. Do not expose the curriculum map or continuation metadata.
- Use $...$ for inline math and $$...$$ on separate lines for display math.
- Do not use \\(...\\), \\[...\\], or bare square brackets as math delimiters.

For the internal continuation handoff, update the prior handoff into a compact reader-state after this passage. Carry forward earlier context and open threads only while they remain relevant; add only ideas the generated content actually establishes. Keep summary cumulative but concise, keyIdeas and openThreads specific, and nextMove actionable for the writer of the following passage.
`.trim();
}

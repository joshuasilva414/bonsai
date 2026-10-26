import type { SessionPreparationContext } from "#/lib/sessions";

export function buildSessionOutlinePrompt(
	sessionCtx: SessionPreparationContext,
): string {
	const learningObjectives = sessionCtx.nextSubtopic.objectives
		.map((objective, index) => `${index + 1}. ${objective.name}`)
		.join("\n");

	return `
  Create a session outline for the following course subtopic:

  Session Subtopic: ${sessionCtx.nextSubtopic.name}
  Learning Objectives:
  ${learningObjectives}

  Cover the whole subtopic by addressing every learning objective in this session.
  Last Session: ${sessionCtx.lastSession ? sessionCtx.lastSession.name : "None"}
  `;
}

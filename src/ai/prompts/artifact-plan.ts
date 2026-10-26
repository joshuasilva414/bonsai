import type { SessionOutline, SessionPreparationContext } from "#/lib/sessions";

export const buildSessionArtifactPlanPrompt = (
	sessionCtx: SessionPreparationContext,
	sessionOutline: SessionOutline,
): string => {
	const learningObjectives = sessionCtx.nextSubtopic.objectives.map(
		(objective) => objective.name,
	);

	return `
	Create a session artifact plan that describes the artifact to be built of one of the following types:
        - Diagram: A visual representation of a concept or process.
        - Quiz: A set of questions to assess understanding of the session's content.
		- Demo: A demonstration of a concept or process.
	<session-information>
		<session-subtopic>${sessionCtx.nextSubtopic.name}</session-subtopic>
		<learning-objectives>${JSON.stringify(learningObjectives)}</learning-objectives>
		<coverage>Support every learning objective in the subtopic.</coverage>
		<session-outline>${sessionOutline.content}</session-outline>
	</session-information>
  `;
};

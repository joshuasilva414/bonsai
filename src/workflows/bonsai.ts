import {
	WorkflowEntrypoint,
	type WorkflowEvent,
	type WorkflowStep,
} from "cloudflare:workers";
import { generateCurriculumTree } from "#/ai/generate";
import { createCoursePrompt } from "#/ai/prompts/create-course";

type CreateCourseWorkflowParams = { description: string };

export class CreateCourseWorkflow extends WorkflowEntrypoint<
	Env,
	CreateCourseWorkflowParams
> {
	async run(
		event: WorkflowEvent<CreateCourseWorkflowParams>,
		step: WorkflowStep,
	) {
		const tree = await step.do(
			"generate curriculum tree",
			async () =>
				await generateCurriculumTree(
					createCoursePrompt`${event.payload.description}`,
				),
		);

		return {
			tree,
		};

		// TODO: Create course structures
	}
}

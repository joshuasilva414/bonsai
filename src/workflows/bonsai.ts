import {
	WorkflowEntrypoint,
	type WorkflowEvent,
	type WorkflowStep,
} from "cloudflare:workers";
import { generateCurriculumTree } from "#/ai/generate";
import { createCoursePrompt } from "#/ai/prompts/create-course";
import type { Subject } from "#/lib/curriculum";
import { flattenCurriculumTree } from "#/lib/curriculum";
import { saveCurriculumTree } from "#/lib/db/queries";

type CreateCourseWorkflowParams = { description: string; userId: string };

export class CreateCourseWorkflow extends WorkflowEntrypoint<
	Env,
	CreateCourseWorkflowParams
> {
	async run(
		event: WorkflowEvent<CreateCourseWorkflowParams>,
		step: WorkflowStep,
	) {
		const tree: Subject = await step.do(
			"generate curriculum tree",
			async () => {
				const result = await generateCurriculumTree(
					createCoursePrompt`${event.payload.description}`,
				);
				// console.log(JSON.stringify(tree));
				return result;
			},
		);

		const courseId = await step.do("save curriculum tree", async () => {
			const { curriculum, nodes } = flattenCurriculumTree(
				tree,
				event.payload.userId,
			);
			return await saveCurriculumTree(curriculum, nodes);
		});

		return {
			tree,
			courseId,
		};
	}
}

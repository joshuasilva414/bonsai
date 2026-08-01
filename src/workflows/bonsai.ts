import {
	WorkflowEntrypoint,
	type WorkflowEvent,
	type WorkflowStep,
} from "cloudflare:workers";

type BonsaiWorkflowParams = Record<string, never>;

export class BonsaiWorkflow extends WorkflowEntrypoint<
	Env,
	BonsaiWorkflowParams
> {
	async run(
		_event: WorkflowEvent<BonsaiWorkflowParams>,
		_step: WorkflowStep,
	): Promise<void> {
		// Workflow steps will be added here.
	}
}

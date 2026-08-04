import { env } from "cloudflare:workers";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { Subject } from "#/lib/curriculum";

const WorkflowOutput = z.object({
	tree: Subject,
});

const getWorkflowStatus = createServerFn({ method: "GET" })
	.validator(
		z.object({
			workflowId: z.string().min(1),
		}),
	)
	.handler(async ({ data }) => {
		try {
			const instance = await env.CREATE_COURSE_WORKFLOW.get(data.workflowId);

			const details = await instance.status();
			const output = WorkflowOutput.safeParse(details.output);

			return {
				workflowId: instance.id,
				status: details.status,
				error: details.error ?? null,
				output: output.success ? output.data : null,
			};
		} catch {
			throw new Error("Workflow not found");
		}
	});

export default getWorkflowStatus;

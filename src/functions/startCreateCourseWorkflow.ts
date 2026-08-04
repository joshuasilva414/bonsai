import { env } from "cloudflare:workers";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const startCreateCourseWorkflow = createServerFn({ method: "POST" })
	.validator(
		z.object({
			description: z.string().min(5),
		}),
	)
	.handler(async ({ data }) => {
		const instance = await env.CREATE_COURSE_WORKFLOW.create({
			params: data,
		});

		return {
			success: true,
			workflowId: instance.id,
		};
	});

export default startCreateCourseWorkflow;

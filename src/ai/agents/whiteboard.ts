import {
	chat,
	chatParamsFromRequest,
	toServerSentEventsResponse,
} from "@tanstack/ai";
import { createOpenaiChat } from "@tanstack/ai-openai";
import { Agent } from "agents";
import { auth } from "#/lib/auth";

export class WhiteboardAgent extends Agent<Env> {
	async onRequest(request: Request): Promise<Response> {
		if (request.method !== "POST") {
			return new Response("Method not allowed", {
				status: 405,
				headers: { Allow: "POST" },
			});
		}

		const session = await auth.api.getSession({ headers: request.headers });
		if (!session) return new Response("Unauthorized", { status: 401 });

		try {
			const params = await chatParamsFromRequest(request);
			const abortController = new AbortController();
			const stream = chat({
				adapter: createOpenaiChat("gpt-5.6-luna", this.env.OPENAI_API_KEY),
				messages: params.messages,
				threadId: params.threadId,
				runId: params.runId,
				parentRunId: params.parentRunId,
				...(params.resume ? { resume: params.resume } : {}),
				abortController,
				systemPrompts: [
					"You are Bonsai, a helpful learning assistant in a whiteboard session. Explain ideas clearly and concisely. You cannot see or edit the whiteboard yet. Ask the learner to describe it when needed, and never claim to have changed it.",
				],
			});

			return toServerSentEventsResponse(stream, { abortController });
		} catch (error) {
			if (error instanceof Response) return error;
			throw error;
		}
	}
}

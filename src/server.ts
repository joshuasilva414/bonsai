import handler from "@tanstack/react-start/server-entry";
import { routeAgentRequest } from "agents";

export { TextbookAgent } from "./ai/agents/textbook";
export { CreateCourseWorkflow } from "./workflows/bonsai";

export default {
	async fetch(request: Request, env: Env) {
		const url = new URL(request.url);
		const nodeId = url.searchParams.get("nodeId");

		const agentResponse = await routeAgentRequest(request, env, {
			props: nodeId ? { nodeId } : {},
		});

		return agentResponse ?? handler.fetch(request);
	},
} satisfies ExportedHandler<Env>;

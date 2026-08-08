import handler from "@tanstack/react-start/server-entry";
import { routeAgentRequest } from "agents";

export { CounterAgent } from "./ai/agents/textbook";
export { CreateCourseWorkflow } from "./workflows/bonsai";

export default {
	async fetch(request: Request, env: Env) {
		return (await routeAgentRequest(request, env)) ?? handler.fetch(request);
	},
} satisfies ExportedHandler<Env>;

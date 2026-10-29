import { env } from "cloudflare:workers";
import { createOpenaiChat } from "@tanstack/ai-openai";

export function createTinyModel() {
	return createOpenaiChat("gpt-6-luna", env.OPENAI_API_KEY);
}

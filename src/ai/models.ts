import { env } from "cloudflare:workers";
import { createOpenAI } from "@ai-sdk/openai";

// import { createWorkersAI } from "workers-ai-provider";

// const workersai = createWorkersAI({ binding: env.AI });
const openai = createOpenAI({
	apiKey: env.OPENAI_API_KEY,
});

export const TINY_MODEL = openai("gpt-5.6-luna");

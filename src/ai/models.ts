// import { env } from "cloudflare:workers";
import { openai } from "@ai-sdk/openai";
// import { createWorkersAI } from "workers-ai-provider";

// const workersai = createWorkersAI({ binding: env.AI });

export const TINY_MODEL = openai("gpt-5.6-luna");

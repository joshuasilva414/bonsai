import { env } from "cloudflare:workers";
import { createWorkersAI } from "workers-ai-provider";

const workersai = createWorkersAI({ binding: env.AI });

export const TINY_MODEL = workersai("openai/gpt-5.6-luna");

import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import { relations } from "./schema/relations";

export interface Env {
	DB: D1Database;
}

export const db = drizzle(env.DB, { relations });

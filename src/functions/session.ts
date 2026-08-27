import { desc, eq } from "drizzle-orm";
import { db } from "#/lib/db";
import { session } from "#/lib/db/schema";

export async function getLastSession(userId: string) {
	const [lastSession] = await db
		.select()
		.from(session)
		.where(eq(session.userId, userId))
		.orderBy(desc(session.updatedAt))
		.limit(1);

	return lastSession ?? null;
}

import { env } from "cloudflare:workers";
import { notFound, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import {
	getRequestHeaders,
	setResponseHeader,
} from "@tanstack/react-start/server";
import { getAgentByName } from "agents";
import { nanoid } from "nanoid";
import { z } from "zod";
import { auth } from "#/lib/auth";

async function requireUserId() {
	setResponseHeader("Cache-Control", "private, no-store");
	setResponseHeader("Vary", "Cookie");
	const session = await auth.api.getSession({ headers: getRequestHeaders() });
	if (!session) throw redirect({ to: "/sign-in" });
	return session.user.id;
}

export const createWhiteboardSession = createServerFn({
	method: "POST",
}).handler(async () => {
	const userId = await requireUserId();
	const id = nanoid();
	const agent = await getAgentByName(env.WhiteboardAgent, id);
	await agent.initialize(id, userId);
	return { id };
});

export const getWhiteboardSession = createServerFn({ method: "GET" })
	.validator(z.object({
		sessionId: z.string().regex(/^[A-Za-z0-9_-]{21}$/),
	}))
	.handler(async ({ data }) => {
		const userId = await requireUserId(); // 1
		const agent = await getAgentByName(env.WhiteboardAgent, data.sessionId);
		using session = await agent.getSession(userId);
		if (!session) throw notFound();

		return {
			id: session.id,
			document: await agent.loadDocument(userId), // 2
		};
	});

export const saveWhiteboardDocument = createServerFn({ method: "POST" })
	.validator(z.object({
		sessionId: z.string().regex(/^[A-Za-z0-9_-]{21}$/),
		document: z.string(),
	}))
	.handler(async ({ data }) => {
		const userId = await requireUserId(); // 3
		const agent = await getAgentByName(env.WhiteboardAgent, data.sessionId);
		await agent.saveDocument(userId, data.document); // 4
		return { saved: true };
	});

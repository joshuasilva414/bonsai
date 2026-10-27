import { createFileRoute, redirect } from "@tanstack/react-router";
import { createWhiteboardSession } from "#/functions/whiteboard";

export const Route = createFileRoute("/session/whiteboard/")({
	beforeLoad: async ({ preload }) => {
		if (preload) return;
		const session = await createWhiteboardSession();
		throw redirect({
			to: "/session/whiteboard/$sessionId",
			params: { sessionId: session.id },
			replace: true,
		});
	},
});

import { createFileRoute } from "@tanstack/react-router";
import Whiteboard from "#/components/whiteboard/Whiteboard";
import { getWhiteboardSession } from "#/functions/whiteboard";

export const Route = createFileRoute("/session/whiteboard/$sessionId")({
	loader: ({ params }) =>
		getWhiteboardSession({ data: { sessionId: params.sessionId } }),
	component: RouteComponent,
});

function RouteComponent() {
	const session = Route.useLoaderData();
	return (
		<div className="absolute inset-4 rounded-lg border border-line overflow-hidden">
			<Whiteboard key={session.id} sessionId={session.id} />
		</div>
	);
}

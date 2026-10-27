import { createFileRoute } from "@tanstack/react-router";
import Whiteboard from "#/components/whiteboard/Whiteboard";

export const Route = createFileRoute("/session/whiteboard/")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="absolute inset-4 rounded-lg border border-line overflow-hidden">
			<Whiteboard />
		</div>
	);
}

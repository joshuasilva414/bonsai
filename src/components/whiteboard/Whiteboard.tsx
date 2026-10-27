import { Tldraw } from "tldraw";
import Chat from "#/components/whiteboard/Chat";
import "tldraw/tldraw.css";

export default function Whiteboard({ sessionId }: { sessionId: string }) {
	return (
		<Tldraw>
			<Chat conversationId={sessionId} />
		</Tldraw>
	);
}

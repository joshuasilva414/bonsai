import { Tldraw } from "tldraw";
import Chat from "#/components/whiteboard/Chat";
import "tldraw/tldraw.css";

export default function Whiteboard() {
	return (
		<Tldraw>
			<Chat />
		</Tldraw>
	);
}

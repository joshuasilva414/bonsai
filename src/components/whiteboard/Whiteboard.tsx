import { useCallback, useState } from "react";
import { type Editor, getSnapshot, loadSnapshot, Tldraw } from "tldraw";
import { saveWhiteboardDocument } from "#/functions/whiteboard";
import Chat from "#/components/whiteboard/Chat";
import "tldraw/tldraw.css";

export default function Whiteboard({ sessionId, initialDocument }: { sessionId: string, initialDocument: string | null }) {
	const [saveError, setSaveError] = useState(false);

	const handleMount = useCallback((editor: Editor) => {
		if (initialDocument !== null) {
			loadSnapshot(editor.store, {
				document: JSON.parse(initialDocument),
			}); // 1
		}

		let saves = Promise.resolve();

		return editor.store.listen(() => {
			const document = JSON.stringify(
				getSnapshot(editor.store).document,
			); // 2

			saves = saves
				.then(async () => {
					await saveWhiteboardDocument({
						data: { sessionId, document },
					});
					setSaveError(false);
				}) // 3
				.catch(() => {
					setSaveError(true);
				});
		}, {
			source: "all",
			scope: "document",
		}); // 4
	}, [sessionId, initialDocument]);

	return (
		<Tldraw onMount={handleMount}>
			{saveError && (
				<div role="alert" className="absolute top-16 left-4 z-400 bg-card p-2">
					Whiteboard save failed. Your latest changes may not be saved.
				</div>
			)}
			<Chat conversationId={sessionId} />
		</Tldraw>
	);
}

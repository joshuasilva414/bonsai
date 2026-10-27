import { ArrowUpIcon, PauseIcon } from "lucide-react";
import { type SubmitEvent, useState } from "react";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupTextarea,
} from "@/components/ui/input-group";

type ChatInputProps = {
	busy: boolean;
	onSend: (text: string) => Promise<void>;
	onStop: () => void;
};

export default function ChatInput({ busy, onSend, onStop }: ChatInputProps) {
	const [text, setText] = useState("");
	const canSend = text.trim().length > 0 && !busy;

	async function onSubmit(event: SubmitEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!canSend) return;
		const message = text.trim();
		setText("");
		try {
			await onSend(message);
		} catch {
			setText((current) => current || message);
		}
	}

	return (
		<form onSubmit={onSubmit}>
			<InputGroup>
				<InputGroupTextarea
					aria-label="Message the whiteboard assistant"
					value={text}
					onChange={(event) => setText(event.target.value)}
					onKeyDown={(event) => {
						if (
							event.key === "Enter" &&
							!event.shiftKey &&
							!event.nativeEvent.isComposing
						) {
							event.preventDefault();
							event.currentTarget.form?.requestSubmit();
						}
					}}
					placeholder="Ask a question…"
					className="p-3"
				/>
				<InputGroupAddon align="block-end">
					{busy ? (
						<InputGroupButton
							type="button"
							size="icon-sm"
							variant="default"
							className="ml-auto rounded-full"
							onClick={onStop}
							aria-label="Stop response"
						>
							<PauseIcon />
						</InputGroupButton>
					) : (
						<InputGroupButton
							type="submit"
							size="icon-sm"
							variant="default"
							className="ml-auto rounded-full"
							disabled={!canSend}
							aria-label="Send"
						>
							<ArrowUpIcon />
						</InputGroupButton>
					)}
				</InputGroupAddon>
			</InputGroup>
		</form>
	);
}

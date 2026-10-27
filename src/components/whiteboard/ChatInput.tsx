import { ArrowUpIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupTextarea,
} from "@/components/ui/input-group";

export default function ChatInput() {
	const [text, setText] = useState("");
	const busy = false;
	const canSend = text.trim().length > 0 && !busy;
	function onSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!canSend) {
			return;
		}
		if (draft === null && nextMessage) {
			void sendMessage(nextMessage);
		} else {
			void sendMessage({ text: text.trim() });
		}
		setDraft(null);
	}

	return (
		<form ref={formRef} onSubmit={onSubmit}>
			<InputGroup>
				<InputGroupTextarea
					value={text}
					onChange={(event) => setText(event.target.value)}
					placeholder="Ask the agent to change your code..."
					className="p-3"
				/>
				<InputGroupAddon align="block-end">
					<InputGroupButton
						size="icon-sm"
						variant="outline"
						className="rounded-full"
						aria-label="Attach files"
						onClick={() => inputRef.current?.click()}
					>
						<PlusIcon />
					</InputGroupButton>
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
				</InputGroupAddon>
			</InputGroup>
		</form>
	);
}

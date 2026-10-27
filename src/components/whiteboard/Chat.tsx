import { fetchServerSentEvents, useChat } from "@tanstack/ai-react";
import { MoveDiagonal2Icon } from "lucide-react";
import { nanoid } from "nanoid";
import { Resizable } from "re-resizable";
import { useState } from "react";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { MessageScrollerProvider } from "@/components/ui/message-scroller";
import ChatContent from "@/components/whiteboard/ChatContent";
import ChatInput from "@/components/whiteboard/ChatInput";

export default function Chat() {
	const [conversationId] = useState(() => nanoid());
	const { messages, sendMessage, isLoading, error, stop } = useChat({
		connection: fetchServerSentEvents(
			`/agents/whiteboard-agent/${conversationId}`,
		),
		threadId: conversationId,
	});

	return (
		<div className="pointer-events-none absolute inset-4 bottom-2 z-350 sm:right-2">
			<Resizable
				className="pointer-events-auto"
				style={{ position: "absolute", bottom: 0, right: 0 }}
				defaultSize={{ width: 384, height: 512 }}
				minWidth={280}
				minHeight={280}
				maxWidth="100%"
				maxHeight="100%"
				bounds="parent"
				boundsByDirection
				enable={{
					top: true,
					left: true,
					topLeft: true,
					right: false,
					bottom: false,
					topRight: false,
					bottomRight: false,
					bottomLeft: false,
				}}
				handleStyles={{ topLeft: { width: 24, height: 24, top: -8, left: -8 } }}
				handleComponent={{
					topLeft: (
						<span
							title="Drag to resize chat"
							className="flex size-full items-center justify-center rounded-full border bg-card text-muted-foreground shadow-sm"
						>
							<MoveDiagonal2Icon aria-hidden="true" className="size-3" />
						</span>
					),
				}}
			>
				<div
					role="dialog"
					aria-label="Whiteboard chat"
					className="h-full"
					onPointerDown={(event) => event.stopPropagation()}
					onKeyDown={(event) => event.stopPropagation()}
					onKeyUp={(event) => event.stopPropagation()}
					onWheel={(event) => event.stopPropagation()}
				>
					<MessageScrollerProvider autoScroll>
						<Card className="h-full shadow-xl">
							<CardHeader className="shrink-0 border-b">
								<CardTitle>Whiteboard chat</CardTitle>
							</CardHeader>
							<CardContent className="min-h-0 flex-1">
								<ChatContent messages={messages} isLoading={isLoading} />
							</CardContent>
							<CardFooter className="shrink-0 flex-col items-stretch gap-2">
								{error && (
									<p role="alert" className="text-sm text-destructive">
										Could not complete the response. {error.message}
									</p>
								)}
								<ChatInput
									busy={isLoading}
									onSend={sendMessage}
									onStop={stop}
								/>
							</CardFooter>
						</Card>
					</MessageScrollerProvider>
				</div>
			</Resizable>
		</div>
	);
}

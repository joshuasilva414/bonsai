import type { UIMessage } from "@tanstack/ai-react";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Message, MessageContent } from "@/components/ui/message";
import {
	MessageScroller,
	MessageScrollerButton,
	MessageScrollerContent,
	MessageScrollerItem,
	MessageScrollerViewport,
} from "@/components/ui/message-scroller";

type ChatContentProps = {
	messages: readonly UIMessage[];
	isLoading: boolean;
};

export default function ChatContent({ messages, isLoading }: ChatContentProps) {
	return (
		<MessageScroller>
			<MessageScrollerViewport>
				<MessageScrollerContent aria-live="polite" aria-busy={isLoading}>
					{messages.length === 0 && (
						<p className="text-sm text-muted-foreground">
							Ask a question to start your learning session.
						</p>
					)}
					{messages.map((message, index) => {
						const text = message.parts
							.filter((part) => part.type === "text")
							.map((part) => part.content)
							.join("");
						if (!text) return null;
						const align = message.role === "user" ? "end" : "start";
						return (
							<MessageScrollerItem
								key={message.id}
								scrollAnchor={index === messages.length - 1}
							>
								<Message align={align}>
									<MessageContent>
										<Bubble
											align={align}
											variant={message.role === "user" ? "default" : "tinted"}
										>
											<BubbleContent className="whitespace-pre-wrap">
												{text}
											</BubbleContent>
										</Bubble>
									</MessageContent>
								</Message>
							</MessageScrollerItem>
						);
					})}
					{isLoading && (
						<output className="text-sm text-muted-foreground">
							Responding…
						</output>
					)}
				</MessageScrollerContent>
			</MessageScrollerViewport>
			<MessageScrollerButton />
		</MessageScroller>
	);
}

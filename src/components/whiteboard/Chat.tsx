import { Bubble, BubbleContent } from "@/components/ui/bubble";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Message, MessageContent } from "@/components/ui/message";
import {
	MessageScroller,
	MessageScrollerButton,
	MessageScrollerContent,
	MessageScrollerItem,
	MessageScrollerProvider,
	MessageScrollerViewport,
} from "@/components/ui/message-scroller";
import ChatInput from "@/components/whiteboard/ChatInput";

export default function Chat() {
	return (
		<div className="pointer-events-auto absolute bottom-16 right-16 z-20 w-96 max-w-[calc(100%-2rem)]">
			<MessageScrollerProvider autoScroll>
				<div className="relative flex flex-col gap-4 min-h-96">
					<Card>
						<CardHeader className="border-b">
							<CardTitle>Untitled Session</CardTitle>
						</CardHeader>
						<CardContent>
							<MessageScroller>
								<MessageScrollerViewport>
									<MessageScrollerContent>
										<MessageScrollerItem scrollAnchor>
											<Message align="end">
												<MessageContent>
													<Bubble align="end" variant="outline">
														<BubbleContent>
															{
																"We've been trying to reach you regarding your car's extended warranty"
															}
														</BubbleContent>
													</Bubble>
												</MessageContent>
											</Message>
										</MessageScrollerItem>
										<MessageScrollerItem>
											<Message align="start">
												<MessageContent>
													<Bubble align="start" variant="default">
														<BubbleContent>{"Who Dis?"}</BubbleContent>
													</Bubble>
												</MessageContent>
											</Message>
										</MessageScrollerItem>
									</MessageScrollerContent>
								</MessageScrollerViewport>
								<MessageScrollerButton />
							</MessageScroller>
						</CardContent>
						<CardFooter>
							<ChatInput></ChatInput>
						</CardFooter>
					</Card>
				</div>
			</MessageScrollerProvider>
		</div>
	);
}

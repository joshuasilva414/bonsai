import type { Passage } from "./passages";

export type PassageContentUpdate = {
	content: string;
	operation: "append" | "replace";
};

export type PassageProgressMessage = PassageContentUpdate & {
	type: "passageProgress";
	requestId: string;
};

export type TextbookAgentMessage =
	| { type: "passageStart"; requestId: string }
	| PassageProgressMessage
	| { type: "passageReady"; requestId: string; passage: Passage }
	| { type: "passageFailed"; requestId: string };

export function passageContentUpdate(
	previousContent: string,
	content: string,
): PassageContentUpdate {
	return content.startsWith(previousContent)
		? { content: content.slice(previousContent.length), operation: "append" }
		: { content, operation: "replace" };
}

export function isTextbookAgentMessage(
	value: unknown,
): value is TextbookAgentMessage {
	if (
		typeof value !== "object" ||
		value === null ||
		!("type" in value) ||
		!("requestId" in value) ||
		typeof value.requestId !== "string"
	) {
		return false;
	}

	switch (value.type) {
		case "passageStart":
		case "passageFailed":
			return true;
		case "passageProgress":
			return (
				"content" in value &&
				typeof value.content === "string" &&
				"operation" in value &&
				(value.operation === "append" || value.operation === "replace")
			);
		case "passageReady":
			return (
				"passage" in value &&
				typeof value.passage === "object" &&
				value.passage !== null &&
				"content" in value.passage &&
				typeof value.passage.content === "string"
			);
		default:
			return false;
	}
}

import { createFileRoute } from "@tanstack/react-router";
import { useAgent } from "agents/react";
import { useEffect, useRef, useState } from "react";
import type { TextbookAgent, TextbookState } from "#/ai/agents/textbook";
import { getCurriculumSubtree } from "#/functions/courses";
import type { Passage } from "#/lib/passages";

type TextbookAgentMessage = {
	type: "passageReady";
	passage: Passage;
};

export const Route = createFileRoute("/session/textbook/$curriculumNodeId")({
	loader: ({ params: { curriculumNodeId } }) =>
		getCurriculumSubtree({ data: { curriculumNodeId } }),
	component: RouteComponent,
});

function RouteComponent() {
	const subtree = Route.useLoaderData();
	const { curriculumNodeId } = Route.useParams();

	const [passages, setPassages] = useState<Passage[]>([]);
	const sentinelRef = useRef<HTMLDivElement>(null);

	const agent = useAgent<TextbookAgent, TextbookState>({
		agent: "TextbookAgent",
		name: curriculumNodeId,
		query: {
			nodeId: curriculumNodeId,
		},
		onStateUpdate: (_, source) => {
			if (source === "client") return;
		},
		onMessage(event) {
			if (typeof event.data !== "string") return;

			let message: unknown;

			try {
				message = JSON.parse(event.data);
			} catch {
				return;
			}

			if (
				typeof message === "object" &&
				message !== null &&
				"type" in message &&
				message.type === "passageReady"
			) {
				const { passage } = message as TextbookAgentMessage;

				setPassages((current) => {
					return [...current, passage];
				});
			}
		},
	});

	useEffect(() => {
		const sentinel = sentinelRef.current;

		if (
			!sentinel ||
			agent.state?.status !== "ready" ||
			agent.state.generation.status !== "idle"
		) {
			return;
		}

		const observer = new IntersectionObserver(
			([entry]) => {
				if (!entry?.isIntersecting) return;

				void agent.stub.requestReadAhead();
			},
			{
				threshold: 0,
				rootMargin: "0px 0px 50% 0px",
			},
		);

		observer.observe(sentinel);
		return () => observer.disconnect();
	}, [agent, agent.state]);

	return (
		<main>
			<h1>Curriculum subtree</h1>
			<section aria-label="Textbook Outline">
				<pre>
					{subtree
						.map(
							(node) =>
								`${"  ".repeat(node.depth)}${node.name} (${node.level})`,
						)
						.join("\n")}
				</pre>
			</section>

			<section aria-label="Textbook Content">
				{passages.map((passage) => (
					<article key="">{passage.content}</article>
				))}

				<div ref={sentinelRef} aria-hidden="true" />
			</section>
		</main>
	);
}

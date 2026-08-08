import { createFileRoute } from "@tanstack/react-router";
import { useAgent } from "agents/react";
import { useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { TextbookAgent, TextbookState } from "#/ai/agents/textbook";
import { getCurriculumSubtree } from "#/functions/courses";
import type { Passage } from "#/lib/passages";

type TextbookAgentMessage = {
	type: "passageReady";
	passage: Passage;
};

type RenderedPassage = Passage & {
	key: string;
};

export const Route = createFileRoute("/session/textbook/$curriculumNodeId")({
	loader: ({ params: { curriculumNodeId } }) =>
		getCurriculumSubtree({ data: { curriculumNodeId } }),
	component: RouteComponent,
});

function RouteComponent() {
	const subtree = Route.useLoaderData();
	const { curriculumNodeId } = Route.useParams();
	const sectionTitle = subtree[0]?.name ?? "Textbook session";

	const [passages, setPassages] = useState<RenderedPassage[]>([]);
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
					return [...current, { ...passage, key: crypto.randomUUID() }];
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

	const passageStatus =
		agent.state?.status !== "ready"
			? "Connecting to your textbook…"
			: passages.length === 0
				? "Preparing your first passage…"
				: "Preparing the next passage…";

	return (
		<main className="textbook-page">
			<aside className="textbook-outline" aria-labelledby="outline-title">
				<h2 id="outline-title">In this section</h2>
				<ol>
					{subtree.map((node) => (
						<li
							className={`textbook-outline-depth-${node.depth}`}
							key={node.id}
						>
							<span>{node.name}</span>
							<small>{node.level}</small>
						</li>
					))}
				</ol>
			</aside>

			<div className="textbook-reader">
				<header className="textbook-reader-header">
					<h1>{sectionTitle}</h1>
				</header>

				<section className="textbook-content" aria-label="Textbook content">
					{passages.map((passage) => (
						<article className="textbook-passage" key={passage.key}>
							<div className="textbook-prose prose prose-xl max-w-none">
								<Markdown remarkPlugins={[remarkGfm]}>
									{passage.content}
								</Markdown>
							</div>
						</article>
					))}

					<div ref={sentinelRef} className="textbook-sentinel">
						<span className="textbook-sentinel-mark" aria-hidden="true" />
						<span className="sr-only" aria-live="polite">
							{passageStatus}
						</span>
					</div>
				</section>
			</div>
		</main>
	);
}

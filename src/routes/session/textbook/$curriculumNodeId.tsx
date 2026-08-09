import { createFileRoute } from "@tanstack/react-router";
import { useAgent } from "agents/react";
import { useCallback, useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import type { TextbookAgent, TextbookState } from "#/ai/agents/textbook";
import { Button } from "#/components/ui/button";
import { getCurriculumSubtree } from "#/functions/courses";
import { normalizeMathDelimiters } from "#/lib/markdown";
import {
	isTextbookAgentMessage,
	type PassageProgressMessage,
} from "#/lib/passage-stream";
import type { Passage } from "#/lib/passages";

const markdownRehypePlugins = [rehypeKatex];
const markdownRemarkPlugins = [remarkGfm, remarkMath];

export const Route = createFileRoute("/session/textbook/$curriculumNodeId")({
	loader: ({ params: { curriculumNodeId } }) =>
		getCurriculumSubtree({ data: { curriculumNodeId } }),
	component: RouteComponent,
});

function RouteComponent() {
	const subtree = Route.useLoaderData();
	const { curriculumNodeId } = Route.useParams();
	const sectionTitle = subtree[0]?.name ?? "Textbook session";

	const [passages, setPassages] = useState<Passage[]>([]);
	const [streamingPassage, setStreamingPassage] = useState<{
		requestId: string;
		content: string;
	} | null>(null);
	const sentinelRef = useRef<HTMLDivElement>(null);
	const pendingProgressRef = useRef<PassageProgressMessage | null>(null);
	const progressFrameRef = useRef<number | null>(null);

	const cancelPendingProgress = useCallback(() => {
		if (progressFrameRef.current !== null) {
			cancelAnimationFrame(progressFrameRef.current);
		}

		progressFrameRef.current = null;
		pendingProgressRef.current = null;
	}, []);

	const queueProgress = useCallback((progress: PassageProgressMessage) => {
		const pending = pendingProgressRef.current;
		pendingProgressRef.current =
			pending?.requestId === progress.requestId &&
			progress.operation === "append"
				? { ...pending, content: pending.content + progress.content }
				: progress;
		if (progressFrameRef.current !== null) return;

		progressFrameRef.current = requestAnimationFrame(() => {
			const progress = pendingProgressRef.current;
			progressFrameRef.current = null;
			pendingProgressRef.current = null;
			if (!progress) return;

			setStreamingPassage((current) => {
				if (current?.requestId !== progress.requestId) return current;

				return {
					requestId: progress.requestId,
					content:
						progress.operation === "replace"
							? progress.content
							: current.content + progress.content,
				};
			});
		});
	}, []);

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

			if (!isTextbookAgentMessage(message)) return;

			switch (message.type) {
				case "passageStart":
					cancelPendingProgress();
					setStreamingPassage({ requestId: message.requestId, content: "" });
					break;
				case "passageProgress":
					queueProgress(message);
					break;
				case "passageReady":
					cancelPendingProgress();
					setPassages((current) => [...current, message.passage]);
					setStreamingPassage((current) =>
						current?.requestId === message.requestId ? null : current,
					);
					break;
				case "passageFailed":
					cancelPendingProgress();
					break;
			}
		},
	});

	useEffect(() => cancelPendingProgress, [cancelPendingProgress]);

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
				rootMargin: "0px 0px 120% 0px",
			},
		);

		observer.observe(sentinel);
		return () => observer.disconnect();
	}, [agent, agent.state]);

	const isGenerating =
		agent.state?.status === "ready" &&
		(agent.state.generation.status === "queued" ||
			agent.state.generation.status === "running");
	const passageStatus = isGenerating
		? "Writing the next passage…"
		: agent.state?.status !== "ready"
			? "Connecting to your textbook…"
			: passages.length === 0
				? "Preparing your first passage…"
				: "Preparing the next passage…";
	const generationError =
		agent.state?.status === "ready" &&
		agent.state.generation.status === "failed"
			? agent.state.generation.message
			: null;

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
					{passages.length > 0 || streamingPassage !== null ? (
						<article aria-busy={isGenerating} className="textbook-passage">
							<div className="textbook-prose prose prose-xl max-w-none">
								{passages.length > 0 ? (
									<Markdown
										rehypePlugins={markdownRehypePlugins}
										remarkPlugins={markdownRemarkPlugins}
									>
										{normalizeMathDelimiters(
											passages.map((passage) => passage.content).join("\n\n"),
										)}
									</Markdown>
								) : null}
								{streamingPassage?.content ? (
									<Markdown
										rehypePlugins={markdownRehypePlugins}
										remarkPlugins={markdownRemarkPlugins}
									>
										{normalizeMathDelimiters(streamingPassage.content)}
									</Markdown>
								) : null}
							</div>
						</article>
					) : null}

					{generationError ? (
						<div className="textbook-generation-error" role="alert">
							<p>{generationError}</p>
							<Button
								onClick={() => void agent.stub.requestReadAhead()}
								size="sm"
								type="button"
								variant="outline"
							>
								Try again
							</Button>
						</div>
					) : null}

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

import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import getWorkflowStatus from "#/functions/getWorkflowStatus";
import type { Subject } from "#/lib/curriculum";

export const Route = createFileRoute("/wait")({
	validateSearch: (search: Record<string, unknown>) => {
		return {
			workflowId: (search.workflowId as string) ?? "",
		};
	},
	component: WaitPage,
});

function WaitPage() {
	const { workflowId } = useSearch({ from: "/wait", shouldThrow: true });
	const workflowStatus = useQuery({
		queryKey: ["workflow-status", workflowId],
		queryFn: () => getWorkflowStatus({ data: { workflowId } }),
		refetchInterval: (query) => {
			const s = query.state.data?.status;
			if (s === "complete" || s === "errored" || s === "terminated")
				return false;
			return 2000;
		},
	});

	if (workflowStatus.isError) {
		return (
			<WorkflowShell>
				<div className="workflow-state workflow-state-error" role="alert">
					<span className="workflow-state-mark" aria-hidden="true">
						!
					</span>
					<p className="workflow-state-label">We couldn't check your path</p>
					<h1>Something interrupted the connection.</h1>
					<p className="workflow-state-copy">{workflowStatus.error.message}</p>
					<div className="workflow-actions">
						<button type="button" onClick={() => workflowStatus.refetch()}>
							Try again
						</button>
						<Link to="/">Return home</Link>
					</div>
				</div>
			</WorkflowShell>
		);
	}

	const result = workflowStatus.data;
	const hasFailed =
		result?.status === "errored" || result?.status === "terminated";

	if (hasFailed) {
		return (
			<WorkflowShell>
				<div className="workflow-state workflow-state-error" role="alert">
					<span className="workflow-state-mark" aria-hidden="true">
						!
					</span>
					<p className="workflow-state-label">Path generation stopped</p>
					<h1>Your learning path wasn't completed.</h1>
					<p className="workflow-state-copy">
						{result.error?.message ??
							"The workflow ended before it could return a curriculum."}
					</p>
					<div className="workflow-actions">
						<Link to="/">Start a new path</Link>
					</div>
				</div>
			</WorkflowShell>
		);
	}

	if (result?.status === "complete" && result.output) {
		return (
			<WorkflowShell>
				<CurriculumOutline tree={result.output.tree} />
			</WorkflowShell>
		);
	}

	if (result?.status === "complete") {
		return (
			<WorkflowShell>
				<div className="workflow-state workflow-state-error" role="alert">
					<span className="workflow-state-mark" aria-hidden="true">
						!
					</span>
					<p className="workflow-state-label">Unexpected result</p>
					<h1>Your path finished, but its outline was unreadable.</h1>
					<div className="workflow-actions">
						<Link to="/">Start a new path</Link>
					</div>
				</div>
			</WorkflowShell>
		);
	}

	return (
		<WorkflowShell>
			<section className="workflow-state" aria-live="polite">
				<div className="workflow-growth" aria-hidden="true">
					<span />
					<span />
					<span />
				</div>
				<p className="workflow-state-label">Growing your learning path</p>
				<h1>Finding the shape of what comes next.</h1>
				<p className="workflow-state-copy">
					Bonsai is organizing your subject into topics, subtopics, and clear
					learning objectives. This page will update when the outline is ready.
				</p>
				<div className="workflow-skeleton" aria-hidden="true">
					<span />
					<span />
					<span />
				</div>
			</section>
		</WorkflowShell>
	);
}

function WorkflowShell({ children }: { children: React.ReactNode }) {
	return <main className="workflow-page">{children}</main>;
}

function CurriculumOutline({ tree }: { tree: Subject }) {
	const objectiveCount = tree.topics.reduce(
		(total, topic) =>
			total +
			topic.subtopics.reduce(
				(subtotal, subtopic) => subtotal + subtopic.objectives.length,
				0,
			),
		0,
	);

	return (
		<article className="curriculum-result">
			<header className="curriculum-header">
				<div>
					<p className="workflow-state-label">Your learning path is ready</p>
					<h1>{tree.name}</h1>
					<p>
						{tree.topics.length} topics · {objectiveCount} learning objectives
					</p>
				</div>
				<Link to="/">Create another path</Link>
			</header>

			<ol className="curriculum-topics">
				{tree.topics.map((topic, topicIndex) => (
					<li key={topic.name}>
						<div className="topic-heading">
							<span aria-hidden="true">
								{String(topicIndex + 1).padStart(2, "0")}
							</span>
							<h2>{topic.name}</h2>
						</div>
						<ol className="curriculum-subtopics">
							{topic.subtopics.map((subtopic) => (
								<li key={subtopic.name}>
									<h3>{subtopic.name}</h3>
									<ul>
										{subtopic.objectives.map((objective) => (
											<li key={objective.name}>{objective.name}</li>
										))}
									</ul>
								</li>
							))}
						</ol>
					</li>
				))}
			</ol>
		</article>
	);
}

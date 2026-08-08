import { createFileRoute } from "@tanstack/react-router";
import { useAgent } from "agents/react";
import { useState } from "react";
import type { CounterAgent, CounterState } from "#/ai/agents/textbook";
import { Button } from "#/components/ui/button";
import { getCurriculumSubtree } from "#/functions/courses";

export const Route = createFileRoute("/session/textbook/$curriculumNodeId")({
	loader: ({ params: { curriculumNodeId } }) =>
		getCurriculumSubtree({ data: { curriculumNodeId } }),
	component: RouteComponent,
});

function RouteComponent() {
	const subtree = Route.useLoaderData();
	const [count, setCount] = useState<number>(0);

	const agent = useAgent<CounterAgent, CounterState>({
		agent: "CounterAgent",
		onStateUpdate: (state) => setCount(state.count),
	});

	return (
		<main>
			<h1>Curriculum subtree</h1>
			<section>
				<pre>
					{subtree
						.map(
							(node) =>
								`${"  ".repeat(node.depth)}${node.name} (${node.level})`,
						)
						.join("\n")}
				</pre>
			</section>

			<section>
				{count}
				<Button onClick={() => agent.stub.increment()}>+</Button>
				<Button onClick={() => agent.stub.decrement()}>-</Button>
			</section>
		</main>
	);
}

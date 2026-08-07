import { createFileRoute } from "@tanstack/react-router";
import { getCurriculumSubtree } from "#/functions/courses";

export const Route = createFileRoute("/session/textbook/$curriculumNodeId")({
	loader: ({ params: { curriculumNodeId } }) =>
		getCurriculumSubtree({ data: { curriculumNodeId } }),
	component: RouteComponent,
});

function RouteComponent() {
	const subtree = Route.useLoaderData();

	return (
		<main>
			<h1>Curriculum subtree</h1>
			<pre>
				{subtree
					.map(
						(node) => `${"  ".repeat(node.depth)}${node.name} (${node.level})`,
					)
					.join("\n")}
			</pre>
		</main>
	);
}

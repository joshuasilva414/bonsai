import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Network } from "lucide-react";
import { CurriculumGraph } from "#/components/curriculum-graph/CurriculumGraph";
import { getCourseOutline } from "#/functions/courses";
import "#/styles/curriculum-graph.css";

export const Route = createFileRoute("/courses/$courseId/graph")({
	loader: ({ params: { courseId } }) =>
		getCourseOutline({ data: { courseId } }),
	head: ({ loaderData }) => ({
		meta: [
			{ title: `${loaderData?.title ?? "Course"} map — Bonsai` },
			{
				name: "description",
				content: "Explore this course as a connected curriculum map.",
			},
		],
	}),
	component: CurriculumGraphPage,
});

function CurriculumGraphPage() {
	const course = Route.useLoaderData();

	return (
		<main className="curriculum-map-page">
			<header className="curriculum-map-header">
				<div>
					<Link
						className="course-back-link"
						to="/courses/$courseId"
						params={{ courseId: course.id }}
					>
						<ArrowLeft aria-hidden="true" />
						Course outline
					</Link>
					<h1>{course.title}</h1>
				</div>
				<div className="curriculum-map-summary">
					<Network aria-hidden="true" />
					<span>
						{course.topicCount} topics · {course.objectiveCount} objectives
					</span>
				</div>
			</header>

			{course.rootId ? (
				<CurriculumGraph course={course} />
			) : (
				<div className="curriculum-map-empty">
					<h2>This course does not have a map yet.</h2>
					<p>Return to the outline and add curriculum nodes first.</p>
				</div>
			)}
		</main>
	);
}

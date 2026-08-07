import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import SessionDialog from "#/components/SessionDialog";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "#/components/ui/accordion";
import { getCourseOutline } from "#/functions/courses";

export const Route = createFileRoute("/courses/$courseId/")({
	loader: ({ params }) =>
		getCourseOutline({ data: { courseId: params.courseId } }),
	head: ({ loaderData }) => ({
		meta: [
			{ title: `${loaderData?.title ?? "Course"} — Bonsai` },
			{
				name: "description",
				content: "Review your course outline and learning objectives.",
			},
		],
	}),
	component: CourseDetailsPage,
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
	month: "short",
	day: "numeric",
	year: "numeric",
	timeZone: "UTC",
});

function CourseDetailsPage() {
	const course = Route.useLoaderData();

	return (
		<main className="courses-page course-details-page">
			<Link className="course-back-link" to="/courses">
				<ArrowLeft aria-hidden="true" />
				All courses
			</Link>

			<header className="course-details-header">
				<p className="courses-kicker">Course outline</p>
				<h1>{course.title}</h1>
				<div className="course-details-meta">
					<span>
						Updated {dateFormatter.format(new Date(course.updatedAt))}
					</span>
					<span>{course.topicCount} topics</span>
					<span>{course.objectiveCount} objectives</span>
				</div>
			</header>

			<section className="course-detail-outline" aria-label="Course outline">
				<h2 className="sr-only">Course outline</h2>
				<div className="saved-outline-meta">
					<span>
						Created {dateFormatter.format(new Date(course.createdAt))}
					</span>
					<span>Living outline</span>
				</div>
				{course.topics.length > 0 ? (
					<Accordion
						className="course-accordion"
						defaultValue={[course.topics[0].id]}
						hiddenUntilFound
						multiple
						render={<ol />}
					>
						{course.topics.map((topic, topicIndex) => {
							const objectiveCount = topic.subtopics.reduce(
								(total, subtopic) => total + subtopic.objectives.length,
								0,
							);

							return (
								<AccordionItem
									className="course-accordion-item"
									key={topic.id}
									render={<li />}
									value={topic.id}
								>
									<div className="course-accordion-heading">
										<span
											className="course-accordion-number"
											aria-hidden="true"
										>
											{String(topicIndex + 1).padStart(2, "0")}
										</span>

										{/* <button
											className="course-accordion-title"
											type="button"
											onClick={toggleSelectedNode}
											onKeyDown={(event) => {
												if (event.key === "Enter") {
													event.preventDefault();
													toggleSelectedNode();
												}
											}}
										>
											{topic.name}
										</button> */}

										<SessionDialog curriculumNodeId={topic.id}>
											<span className="course-accordion-title">
												{topic.name}
											</span>
										</SessionDialog>

										<span className="course-accordion-counts">
											{topic.subtopics.length}{" "}
											{topic.subtopics.length === 1 ? "subtopic" : "subtopics"}
											<span aria-hidden="true"> · </span>
											{objectiveCount}{" "}
											{objectiveCount === 1 ? "objective" : "objectives"}
										</span>
										<AccordionTrigger className="course-accordion-trigger">
											<span className="sr-only">
												Toggle {topic.name} outline
											</span>
										</AccordionTrigger>
									</div>
									<AccordionContent>
										{topic.subtopics.length > 0 ? (
											<div className="saved-subtopic-list">
												{topic.subtopics.map((subtopic) => (
													<section key={subtopic.id}>
														<SessionDialog curriculumNodeId={subtopic.id}>
															<h3 className="cursor-pointer hover:underline">
																{subtopic.name}
															</h3>
														</SessionDialog>
														<ul>
															{subtopic.objectives.map((objective) => (
																<SessionDialog
																	key={objective.id}
																	curriculumNodeId={objective.id}
																>
																	<li className="cursor-pointer hover:underline">
																		{objective.name}
																	</li>
																</SessionDialog>
															))}
														</ul>
													</section>
												))}
											</div>
										) : (
											<p className="course-accordion-empty">
												No subtopics have been added to this topic yet.
											</p>
										)}
									</AccordionContent>
								</AccordionItem>
							);
						})}
					</Accordion>
				) : (
					<p className="saved-outline-unavailable">
						This course does not have a readable outline yet.
					</p>
				)}
			</section>
		</main>
	);
}

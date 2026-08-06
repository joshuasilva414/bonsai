import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, ChevronDown, Plus, Sprout } from "lucide-react";
import type { CourseOutline } from "#/functions/courses";
import { getMyCourseOutlines } from "#/functions/courses";

export const Route = createFileRoute("/courses")({
	loader: () => getMyCourseOutlines(),
	head: () => ({
		meta: [
			{ title: "My courses — Bonsai" },
			{
				name: "description",
				content: "Review the course outlines you have created with Bonsai.",
			},
		],
	}),
	component: CoursesPage,
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
	month: "short",
	day: "numeric",
	year: "numeric",
	timeZone: "UTC",
});

function CoursesPage() {
	const courses = Route.useLoaderData();

	return (
		<main className="courses-page">
			<header className="courses-page-header">
				<div>
					<p className="courses-kicker">Your learning paths</p>
					<h1>Course outlines</h1>
					<p className="courses-intro">
						Return to the structure Bonsai made from your goals and source
						material. Each outline stays ready to inspect as your learning path
						grows.
					</p>
				</div>
				<Link className="courses-create-button" to="/">
					<Plus aria-hidden="true" />
					Create a course
				</Link>
			</header>

			{courses.length > 0 ? (
				<section className="course-library" aria-labelledby="library-title">
					<div className="course-library-heading">
						<h2 id="library-title">
							{courses.length} {courses.length === 1 ? "course" : "courses"}
						</h2>
						<span>Most recently updated first</span>
					</div>
					<div className="course-outline-list">
						{courses.map((course, index) => (
							<CourseOutlineItem
								key={course.id}
								course={course}
								initiallyOpen={index === 0}
							/>
						))}
					</div>
				</section>
			) : (
				<section className="courses-empty" aria-labelledby="empty-title">
					<span className="courses-empty-mark" aria-hidden="true">
						<Sprout />
					</span>
					<h2 id="empty-title">
						Your first outline starts with what you have.
					</h2>
					<p>
						Bring a syllabus, notes, or simply describe what you want to
						understand. Bonsai will organize it into topics, subtopics, and
						clear learning objectives.
					</p>
					<Link className="courses-create-button" to="/">
						<Plus aria-hidden="true" />
						Create your first course
					</Link>
				</section>
			)}
		</main>
	);
}

function CourseOutlineItem({
	course,
	initiallyOpen,
}: {
	course: CourseOutline;
	initiallyOpen: boolean;
}) {
	return (
		<details className="course-outline-item" open={initiallyOpen}>
			<summary>
				<span className="course-book-mark" aria-hidden="true">
					<BookOpen />
				</span>
				<span className="course-summary-copy">
					<strong>{course.title}</strong>
					<span>
						Updated {dateFormatter.format(new Date(course.updatedAt))}
					</span>
				</span>
				<span className="course-summary-counts">
					<span>{course.topicCount} topics</span>
					<span>{course.objectiveCount} objectives</span>
				</span>
				<ChevronDown className="course-chevron" aria-hidden="true" />
			</summary>

			<div className="saved-outline">
				<div className="saved-outline-meta">
					<span>
						Created {dateFormatter.format(new Date(course.createdAt))}
					</span>
					<span>Living outline</span>
				</div>
				{course.topics.length > 0 ? (
					<ol className="saved-topic-list">
						{course.topics.map((topic, topicIndex) => (
							<li key={topic.id}>
								<div className="saved-topic-heading">
									<span aria-hidden="true">
										{String(topicIndex + 1).padStart(2, "0")}
									</span>
									<h3>{topic.name}</h3>
								</div>
								<div className="saved-subtopic-list">
									{topic.subtopics.map((subtopic) => (
										<section key={subtopic.id}>
											<h4>{subtopic.name}</h4>
											<ul>
												{subtopic.objectives.map((objective) => (
													<li key={objective.id}>{objective.name}</li>
												))}
											</ul>
										</section>
									))}
								</div>
							</li>
						))}
					</ol>
				) : (
					<p className="saved-outline-unavailable">
						This course does not have a readable outline yet.
					</p>
				)}
			</div>
		</details>
	);
}

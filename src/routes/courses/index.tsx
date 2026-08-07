import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, ChevronRight, Plus, Sprout } from "lucide-react";
import type { CourseOutline } from "#/functions/courses";
import { getMyCourseOutlines } from "#/functions/courses";

export const Route = createFileRoute("/courses/")({
	loader: () => getMyCourseOutlines(),
	head: () => ({
		meta: [
			{ title: "My courses — Bonsai" },
			{
				name: "description",
				content: "Return to the courses you have created with Bonsai.",
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
					<h1>My courses</h1>
					<p className="courses-intro">
						Return to the learning paths Bonsai made from your goals and source
						material. Open a course to review its full outline.
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
					<div className="course-card-grid">
						{courses.map((course) => (
							<CourseCard key={course.id} course={course} />
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

function CourseCard({ course }: { course: CourseOutline }) {
	return (
		<Link
			className="course-card"
			to="/courses/$courseId"
			params={{ courseId: course.id }}
		>
			<div className="course-card-topline">
				<span className="course-book-mark" aria-hidden="true">
					<BookOpen />
				</span>
				<span className="course-card-updated">
					Updated {dateFormatter.format(new Date(course.updatedAt))}
				</span>
			</div>
			<div className="course-card-copy">
				<h3>{course.title}</h3>
				<p>
					{course.topicCount} {course.topicCount === 1 ? "topic" : "topics"}
					<span aria-hidden="true"> · </span>
					{course.objectiveCount}{" "}
					{course.objectiveCount === 1 ? "objective" : "objectives"}
				</p>
			</div>
			<span className="course-card-action">
				View course
				<ChevronRight aria-hidden="true" />
			</span>
		</Link>
	);
}

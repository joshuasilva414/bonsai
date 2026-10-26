import { sql } from "drizzle-orm";
import {
	index,
	integer,
	sqliteTable,
	text,
	uniqueIndex,
} from "drizzle-orm/sqlite-core";
import type { ArtifactPlan } from "#/lib/artifacts";
import type { SessionOutline } from "#/lib/sessions";
import { user } from "./auth-schema";
import { curriculum, curriculumNode } from "./curriculum-tree";

const now = sql`(cast(unixepoch('subsecond') * 1000 as integer))`;

const learningSessionStatuses = ["preparing", "prepared", "failed"] as const;

/** A durable study-session plan, separate from Better Auth login sessions. */
export const learningSession = sqliteTable(
	"learning_session",
	{
		id: text("id").primaryKey(),
		courseId: text("curriculum_id")
			.notNull()
			.references(() => curriculum.id, { onDelete: "cascade" }),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		subtopicId: text("subtopic_id")
			.notNull()
			.references(() => curriculumNode.id, { onDelete: "cascade" }),
		outline: text("outline", { mode: "json" })
			.$type<SessionOutline>()
			.notNull(),
		artifactPlan: text("artifact_plan", { mode: "json" })
			.$type<ArtifactPlan>()
			.notNull(),
		artifactWorkflowId: text("artifact_workflow_id").notNull(),
		status: text("status", { enum: learningSessionStatuses })
			.default("preparing")
			.notNull(),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(now)
			.notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.default(now)
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("learning_session_course_id_idx").on(table.courseId),
		index("learning_session_user_id_idx").on(table.userId),
		index("learning_session_subtopic_id_idx").on(table.subtopicId),
		uniqueIndex("learning_session_artifact_workflow_id_idx").on(
			table.artifactWorkflowId,
		),
	],
);

export type LearningSession = typeof learningSession.$inferSelect;
export type NewLearningSession = typeof learningSession.$inferInsert;

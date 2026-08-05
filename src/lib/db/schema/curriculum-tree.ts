import { sql } from "drizzle-orm";
import {
	type AnySQLiteColumn,
	check,
	index,
	integer,
	sqliteTable,
	text,
	uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { curriculumTreeLevels } from "#/lib/curriculum";
import { user } from "./auth-schema";

const now = sql`(cast(unixepoch('subsecond') * 1000 as integer))`;

/** A saved curriculum owned by one user. Its subject is the root node. */
export const curriculum = sqliteTable(
	"curriculum",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(now)
			.notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.default(now)
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [index("curriculum_user_id_idx").on(table.userId)],
);

/**
 * An ordered adjacency list for the subject -> topic -> subtopic -> objective
 * hierarchy. Nested objects remain the LLM interchange format; these rows are
 * the persistence format.
 */
export const curriculumNode = sqliteTable(
	"curriculum_node",
	{
		id: text("id").primaryKey(),
		curriculumId: text("curriculum_id")
			.notNull()
			.references(() => curriculum.id, { onDelete: "cascade" }),
		parentId: text("parent_id").references(
			(): AnySQLiteColumn => curriculumNode.id,
			{ onDelete: "cascade" },
		),
		name: text("name").notNull(),
		level: text("level", { enum: curriculumTreeLevels }).notNull(),
		position: integer("position").notNull(),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(now)
			.notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.default(now)
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("curriculum_node_parent_id_idx").on(table.parentId),
		uniqueIndex("curriculum_node_sibling_position_idx").on(
			table.curriculumId,
			table.parentId,
			table.position,
		),
		uniqueIndex("curriculum_node_one_root_idx")
			.on(table.curriculumId)
			.where(sql`${table.parentId} is null`),
		check(
			"curriculum_node_name_nonempty",
			sql`length(trim(${table.name})) > 0`,
		),
		check("curriculum_node_position_nonnegative", sql`${table.position} >= 0`),
		check(
			"curriculum_node_root_is_subject",
			sql`(${table.parentId} is null and ${table.level} = 'subject') or (${table.parentId} is not null and ${table.level} <> 'subject')`,
		),
	],
);

export type Curriculum = typeof curriculum.$inferSelect;
export type NewCurriculum = typeof curriculum.$inferInsert;
export type CurriculumNodeRow = typeof curriculumNode.$inferSelect;
export type NewCurriculumNode = typeof curriculumNode.$inferInsert;

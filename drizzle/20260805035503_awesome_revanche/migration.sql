CREATE TABLE `curriculum` (
	`id` text PRIMARY KEY,
	`user_id` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_curriculum_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `curriculum_node` (
	`id` text PRIMARY KEY,
	`curriculum_id` text NOT NULL,
	`parent_id` text,
	`name` text NOT NULL,
	`level` text NOT NULL,
	`position` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_curriculum_node_curriculum_id_curriculum_id_fk` FOREIGN KEY (`curriculum_id`) REFERENCES `curriculum`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_curriculum_node_parent_id_curriculum_node_id_fk` FOREIGN KEY (`parent_id`) REFERENCES `curriculum_node`(`id`) ON DELETE CASCADE,
	CONSTRAINT "curriculum_node_name_nonempty" CHECK(length(trim("name")) > 0),
	CONSTRAINT "curriculum_node_position_nonnegative" CHECK("position" >= 0),
	CONSTRAINT "curriculum_node_root_is_subject" CHECK(("parent_id" is null and "level" = 'subject') or ("parent_id" is not null and "level" <> 'subject'))
);
--> statement-breakpoint
CREATE INDEX `curriculum_user_id_idx` ON `curriculum` (`user_id`);--> statement-breakpoint
CREATE INDEX `curriculum_node_parent_id_idx` ON `curriculum_node` (`parent_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `curriculum_node_sibling_position_idx` ON `curriculum_node` (`curriculum_id`,`parent_id`,`position`);--> statement-breakpoint
CREATE UNIQUE INDEX `curriculum_node_one_root_idx` ON `curriculum_node` (`curriculum_id`) WHERE "curriculum_node"."parent_id" is null;
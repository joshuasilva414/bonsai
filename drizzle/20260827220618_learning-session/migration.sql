CREATE TABLE `learning_session` (
	`id` text PRIMARY KEY,
	`curriculum_id` text NOT NULL,
	`user_id` text NOT NULL,
	`subtopic_id` text NOT NULL,
	`outline` text NOT NULL,
	`artifact_plan` text NOT NULL,
	`artifact_workflow_id` text NOT NULL,
	`status` text DEFAULT 'preparing' NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_learning_session_curriculum_id_curriculum_id_fk` FOREIGN KEY (`curriculum_id`) REFERENCES `curriculum`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_learning_session_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_learning_session_subtopic_id_curriculum_node_id_fk` FOREIGN KEY (`subtopic_id`) REFERENCES `curriculum_node`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX `learning_session_course_id_idx` ON `learning_session` (`curriculum_id`);--> statement-breakpoint
CREATE INDEX `learning_session_user_id_idx` ON `learning_session` (`user_id`);--> statement-breakpoint
CREATE INDEX `learning_session_subtopic_id_idx` ON `learning_session` (`subtopic_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `learning_session_artifact_workflow_id_idx` ON `learning_session` (`artifact_workflow_id`);
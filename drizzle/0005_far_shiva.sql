CREATE TABLE `person_tags` (
	`person_id` integer NOT NULL,
	`tag_id` integer NOT NULL,
	PRIMARY KEY(`person_id`, `tag_id`),
	FOREIGN KEY (`person_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `people` ADD `current_status` text DEFAULT 'undefined' NOT NULL;--> statement-breakpoint
ALTER TABLE `people` ADD `started_at` integer;--> statement-breakpoint
ALTER TABLE `people` ADD `ended_at` integer;--> statement-breakpoint
ALTER TABLE `people` ADD `how_ended` text;--> statement-breakpoint
ALTER TABLE `people` ADD `general_notes` text;--> statement-breakpoint
ALTER TABLE `tags` ADD `label` text;--> statement-breakpoint
ALTER TABLE `tags` ADD `scope` text DEFAULT 'both' NOT NULL;--> statement-breakpoint
ALTER TABLE `tags` ADD `updated_at` integer;--> statement-breakpoint
ALTER TABLE `timeline_events` ADD `title` text;--> statement-breakpoint
ALTER TABLE `timeline_events` ADD `event_type` text;--> statement-breakpoint
ALTER TABLE `timeline_events` ADD `channel` text;--> statement-breakpoint
ALTER TABLE `timeline_events` ADD `location_type` text;--> statement-breakpoint
ALTER TABLE `timeline_events` ADD `emotional_tone` text;--> statement-breakpoint
ALTER TABLE `timeline_events` ADD `outcome` text;
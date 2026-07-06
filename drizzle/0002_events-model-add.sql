CREATE TABLE `event_tags` (
	`event_id` integer NOT NULL,
	`tag_id` integer NOT NULL,
	PRIMARY KEY(`event_id`, `tag_id`),
	FOREIGN KEY (`event_id`) REFERENCES `timeline_events`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `timeline_events` ADD `date_precision` text DEFAULT 'day' NOT NULL;--> statement-breakpoint
ALTER TABLE `timeline_events` ADD `status` text DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE `timeline_events` ADD `note` text;--> statement-breakpoint
ALTER TABLE `timeline_events` ADD `updated_at` integer NOT NULL;
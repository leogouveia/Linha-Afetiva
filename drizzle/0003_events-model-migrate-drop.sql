INSERT INTO `timeline_events` (`person_id`, `date`, `date_precision`, `status`, `note`, `created_at`, `updated_at`)
SELECT `id`, `started_at`, 'day', `status`,
	CASE
		WHEN `notes` IS NOT NULL AND `how_ended` IS NOT NULL THEN `notes` || char(10) || 'Como terminou: ' || `how_ended`
		WHEN `how_ended` IS NOT NULL THEN 'Como terminou: ' || `how_ended`
		ELSE `notes`
	END,
	`created_at`, `updated_at`
FROM `people`;--> statement-breakpoint
INSERT INTO `event_tags` (`event_id`, `tag_id`)
SELECT te.`id`, pt.`tag_id`
FROM `person_tags` pt
JOIN `timeline_events` te ON te.`person_id` = pt.`person_id`;--> statement-breakpoint
DROP TABLE `person_tags`;--> statement-breakpoint
ALTER TABLE `people` DROP COLUMN `status`;--> statement-breakpoint
ALTER TABLE `people` DROP COLUMN `started_at`;--> statement-breakpoint
ALTER TABLE `people` DROP COLUMN `ended_at`;--> statement-breakpoint
ALTER TABLE `people` DROP COLUMN `how_ended`;--> statement-breakpoint
ALTER TABLE `people` DROP COLUMN `notes`;--> statement-breakpoint
ALTER TABLE `timeline_events` DROP COLUMN `title`;--> statement-breakpoint
ALTER TABLE `timeline_events` DROP COLUMN `description`;
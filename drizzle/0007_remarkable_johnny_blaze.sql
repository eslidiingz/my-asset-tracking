CREATE TABLE `asset_group` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `asset_group_user_id_idx` ON `asset_group` (`user_id`);--> statement-breakpoint
ALTER TABLE `assets` ADD `group_id` integer REFERENCES asset_group(id);
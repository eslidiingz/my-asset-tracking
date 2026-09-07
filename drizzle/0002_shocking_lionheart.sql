CREATE TABLE `portfolio_snapshot` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`recorded_at` integer DEFAULT (unixepoch()) NOT NULL,
	`total_value` real NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `portfolio_snapshot_user_date_idx` ON `portfolio_snapshot` (`user_id`,`recorded_at`);--> statement-breakpoint
ALTER TABLE `assets` ADD `user_id` text REFERENCES user(id);--> statement-breakpoint
ALTER TABLE `assets` ADD `dividend_yield` real;--> statement-breakpoint
CREATE INDEX `assets_user_id_idx` ON `assets` (`user_id`);
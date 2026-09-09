CREATE TABLE `asset_group_value_transaction` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`group_id` integer NOT NULL,
	`total_value` real NOT NULL,
	`recorded_at` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`group_id`) REFERENCES `asset_group`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `asset_group_value_transaction_user_group_date_idx` ON `asset_group_value_transaction` (`user_id`,`group_id`,`recorded_at`);

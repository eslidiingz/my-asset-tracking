CREATE TABLE `currency_settings` (
	`user_id` text PRIMARY KEY NOT NULL,
	`usd_to_thb_rate` real NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);

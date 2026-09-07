CREATE TABLE `dividend_transaction` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`symbol` text NOT NULL,
	`dividend_amount` real NOT NULL,
	`withholding_tax` real DEFAULT 0 NOT NULL,
	`received_at` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `dividend_transaction_user_date_idx` ON `dividend_transaction` (`user_id`,`received_at`);
CREATE TABLE `transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`card_id` text NOT NULL,
	`amount` real NOT NULL,
	`type` text DEFAULT 'purchase' NOT NULL,
	`merchant` text DEFAULT '' NOT NULL,
	`date` integer NOT NULL,
	`cycle_label` text DEFAULT 'current' NOT NULL,
	`statement_month` text NOT NULL,
	`is_manual` integer DEFAULT true NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_transactions_card_id` ON `transactions` (`card_id`);--> statement-breakpoint
CREATE INDEX `idx_transactions_card_statement` ON `transactions` (`card_id`,`statement_month`);
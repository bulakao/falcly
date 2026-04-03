ALTER TABLE `profile` ADD `notify_statement_reminder` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `profile` ADD `notify_due_reminder` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `profile` ADD `notify_high_utilization` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `profile` ADD `currency_symbol` text DEFAULT '₱' NOT NULL;--> statement-breakpoint
ALTER TABLE `profile` ADD `default_interest_rate` real DEFAULT 0.02 NOT NULL;--> statement-breakpoint
ALTER TABLE `profile` ADD `default_min_payment_pct` real DEFAULT 0.05 NOT NULL;--> statement-breakpoint
ALTER TABLE `profile` ADD `default_min_payment_floor` real DEFAULT 500 NOT NULL;

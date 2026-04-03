CREATE TABLE `installments` (
	`id` text PRIMARY KEY NOT NULL,
	`card_id` text NOT NULL,
	`name` text NOT NULL,
	`merchant` text DEFAULT '' NOT NULL,
	`total_amount` real NOT NULL,
	`monthly_amount` real NOT NULL,
	`total_months` integer NOT NULL,
	`start_date` integer NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);--> statement-breakpoint
CREATE INDEX `idx_installments_card_id` ON `installments` (`card_id`);--> statement-breakpoint
CREATE TABLE `subscription_items` (
	`id` text PRIMARY KEY NOT NULL,
	`card_id` text NOT NULL,
	`name` text NOT NULL,
	`amount` real NOT NULL,
	`billing_day` integer NOT NULL,
	`frequency` text DEFAULT 'monthly' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);--> statement-breakpoint
CREATE INDEX `idx_subscription_items_card_id` ON `subscription_items` (`card_id`);

CREATE TABLE `cards` (
	`id` text PRIMARY KEY NOT NULL,
	`bank_name` text NOT NULL,
	`credit_limit` real NOT NULL,
	`outstanding_balance` real DEFAULT 0 NOT NULL,
	`statement_day` integer NOT NULL,
	`due_day_offset` integer DEFAULT 21 NOT NULL,
	`interest_rate` real DEFAULT 0.02 NOT NULL,
	`min_payment_pct` real DEFAULT 0.05 NOT NULL,
	`min_payment_floor` real DEFAULT 500 NOT NULL,
	`pending_transactions` real DEFAULT 0 NOT NULL,
	`installments_monthly_amount` real DEFAULT 0 NOT NULL,
	`subscriptions_this_cycle` real DEFAULT 0 NOT NULL,
	`annual_fee` real DEFAULT 0 NOT NULL,
	`annual_fee_month` integer DEFAULT 0 NOT NULL,
	`balance_updated_at` integer NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `profile` (
	`id` text PRIMARY KEY DEFAULT 'local' NOT NULL,
	`cash_on_hand` real,
	`cash_updated_at` integer,
	`monthly_income` real,
	`payday` integer,
	`committed_expenses` real,
	`analytics_opt_out` integer DEFAULT false NOT NULL
);

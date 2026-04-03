ALTER TABLE `profile` ADD `payoff_strategy` text NOT NULL DEFAULT 'full';--> statement-breakpoint
ALTER TABLE `profile` ADD `fixed_payoff_amount` real;

ALTER TABLE `cards` ADD `currency` text;
--> statement-breakpoint
UPDATE `profile` SET `currency_symbol` = 'PHP' WHERE `currency_symbol` = '₱';

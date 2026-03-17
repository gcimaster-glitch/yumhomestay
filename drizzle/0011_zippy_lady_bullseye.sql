ALTER TABLE `bookings` MODIFY COLUMN `basePriceJpy` int DEFAULT 55000;--> statement-breakpoint
ALTER TABLE `bookings` ADD `cardFeeJpy` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `bookings` ADD `affiliateFeeJpy` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `bookings` ADD `platformProfitJpy` int DEFAULT 0;
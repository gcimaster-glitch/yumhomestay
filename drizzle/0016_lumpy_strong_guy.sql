ALTER TABLE `kycSubmissions` MODIFY COLUMN `documentType` enum('passport','drivers_license','residence_card','stripe_identity') NOT NULL;--> statement-breakpoint
ALTER TABLE `kycSubmissions` MODIFY COLUMN `documentFrontUrl` text;--> statement-breakpoint
ALTER TABLE `kycSubmissions` ADD `stripeVerificationSessionId` varchar(255);--> statement-breakpoint
ALTER TABLE `kycSubmissions` ADD `stripeVerificationStatus` varchar(64);--> statement-breakpoint
ALTER TABLE `kycSubmissions` ADD `stripeVerificationReportId` varchar(255);
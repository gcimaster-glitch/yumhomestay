CREATE TABLE `agentMembers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`agentId` int NOT NULL,
	`role` enum('owner','staff') NOT NULL DEFAULT 'staff',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agentMembers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `agents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`nameEn` varchar(255),
	`contactEmail` varchar(320),
	`commissionRate` decimal(5,4) DEFAULT '0.1000',
	`stripeAccountId` varchar(255),
	`status` enum('active','suspended') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `auditLogs` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`userId` int,
	`impersonatorId` int,
	`action` varchar(100) NOT NULL,
	`targetResource` varchar(100),
	`targetId` varchar(64),
	`payload` text,
	`ipAddress` varchar(45),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bookings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`guestId` int NOT NULL,
	`hostId` int NOT NULL,
	`experienceId` int NOT NULL,
	`agentId` int,
	`startTime` timestamp NOT NULL,
	`endTime` timestamp NOT NULL,
	`adultsCount` int NOT NULL DEFAULT 1,
	`childrenCount` int NOT NULL DEFAULT 0,
	`amountTotal` int NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'JPY',
	`exchangeRateToJpy` decimal(18,6) DEFAULT '1.000000',
	`amountJpy` int NOT NULL,
	`serviceFeeJpy` int NOT NULL,
	`hostPayoutJpy` int NOT NULL,
	`agentFeeJpy` int DEFAULT 0,
	`dietaryRestrictions` text,
	`specialRequests` text,
	`status` enum('pending','confirmed','completed','cancelled_by_guest','cancelled_by_host','cancelled_by_admin') NOT NULL DEFAULT 'pending',
	`confirmedAt` timestamp,
	`completedAt` timestamp,
	`cancelledAt` timestamp,
	`cancellationReason` text,
	`reminder10DaySent` boolean DEFAULT false,
	`reminder3DaySent` boolean DEFAULT false,
	`reminder1DaySent` boolean DEFAULT false,
	`reminderDaySent` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bookings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `coupons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`discountType` enum('percentage','fixed_jpy') NOT NULL,
	`discountValue` int NOT NULL,
	`maxUses` int,
	`usedCount` int NOT NULL DEFAULT 0,
	`expiresAt` timestamp,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `coupons_id` PRIMARY KEY(`id`),
	CONSTRAINT `coupons_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `exchangeRates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`currency` varchar(3) NOT NULL,
	`rateToJpy` decimal(18,6) NOT NULL,
	`fetchedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `exchangeRates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `experiences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`hostId` int NOT NULL,
	`titleJa` varchar(255),
	`titleEn` varchar(255) NOT NULL,
	`descriptionJa` text,
	`descriptionEn` text NOT NULL,
	`priceJpy` int NOT NULL,
	`durationMinutes` int NOT NULL DEFAULT 180,
	`maxGuests` int NOT NULL DEFAULT 6,
	`minGuests` int NOT NULL DEFAULT 1,
	`cuisineType` varchar(100),
	`dietaryOptions` text,
	`experienceType` enum('cooking','culture','both') DEFAULT 'cooking',
	`cancellationPolicy` enum('flexible','moderate','strict') DEFAULT 'moderate',
	`approvalStatus` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`isActive` boolean NOT NULL DEFAULT false,
	`imageUrls` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `experiences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `hosts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`kycStatus` enum('unverified','pending','verified','failed') NOT NULL DEFAULT 'unverified',
	`stripeIdentitySessionId` varchar(255),
	`stripeAccountId` varchar(255),
	`stripeAccountStatus` enum('pending','active','restricted') DEFAULT 'pending',
	`bio` text,
	`bioJa` text,
	`bioEn` text,
	`addressEncrypted` text,
	`nearestStation` varchar(255),
	`prefecture` varchar(100),
	`city` varchar(100),
	`languages` text,
	`profileImageUrl` text,
	`approvalStatus` enum('pending','interview','approved','rejected','suspended') NOT NULL DEFAULT 'pending',
	`approvedAt` timestamp,
	`approvedBy` int,
	`isActive` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `hosts_id` PRIMARY KEY(`id`),
	CONSTRAINT `hosts_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookingId` int NOT NULL,
	`senderId` int NOT NULL,
	`receiverId` int NOT NULL,
	`content` text NOT NULL,
	`isRead` boolean NOT NULL DEFAULT false,
	`isFlagged` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` varchar(100) NOT NULL,
	`titleJa` varchar(255),
	`titleEn` varchar(255),
	`bodyJa` text,
	`bodyEn` text,
	`isRead` boolean NOT NULL DEFAULT false,
	`relatedBookingId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookingId` int NOT NULL,
	`stripePaymentIntentId` varchar(255),
	`stripeChargeId` varchar(255),
	`amount` int NOT NULL,
	`currency` varchar(3) NOT NULL,
	`amountJpy` int NOT NULL,
	`status` enum('requires_payment_method','requires_confirmation','processing','succeeded','failed','refunded') NOT NULL DEFAULT 'requires_payment_method',
	`refundedAt` timestamp,
	`refundReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`),
	CONSTRAINT `payments_bookingId_unique` UNIQUE(`bookingId`),
	CONSTRAINT `payments_stripePaymentIntentId_unique` UNIQUE(`stripePaymentIntentId`)
);
--> statement-breakpoint
CREATE TABLE `payouts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookingId` int NOT NULL,
	`recipientId` int NOT NULL,
	`recipientType` enum('host','agent') NOT NULL,
	`stripeTransferId` varchar(255),
	`amountJpy` int NOT NULL,
	`status` enum('pending','processing','paid','failed') NOT NULL DEFAULT 'pending',
	`scheduledDate` timestamp,
	`paidAt` timestamp,
	`failureReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payouts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookingId` int NOT NULL,
	`authorId` int NOT NULL,
	`recipientId` int NOT NULL,
	`authorType` enum('guest','host') NOT NULL,
	`ratingOverall` int NOT NULL,
	`ratingCleanliness` int,
	`ratingAccuracy` int,
	`ratingCommunication` int,
	`commentPublic` text,
	`commentPrivate` text,
	`isBlind` boolean NOT NULL DEFAULT true,
	`isPublished` boolean NOT NULL DEFAULT false,
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `troubleReports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookingId` int,
	`reporterId` int NOT NULL,
	`reportedUserId` int,
	`category` enum('no_show','safety','fraud','quality','other') NOT NULL,
	`description` text NOT NULL,
	`status` enum('open','investigating','resolved','closed') NOT NULL DEFAULT 'open',
	`resolvedBy` int,
	`resolvedAt` timestamp,
	`resolution` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `troubleReports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `userType` enum('guest','host','agent','admin') DEFAULT 'guest' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `preferredLanguage` varchar(10) DEFAULT 'en';--> statement-breakpoint
ALTER TABLE `users` ADD `identityStatus` enum('unverified','pending','verified','failed') DEFAULT 'unverified' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `passportInfoEncrypted` text;--> statement-breakpoint
ALTER TABLE `users` ADD `emergencyContactEncrypted` text;--> statement-breakpoint
ALTER TABLE `users` ADD `mfaEnabled` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `mfaSecret` text;--> statement-breakpoint
ALTER TABLE `users` ADD `deletedAt` timestamp;
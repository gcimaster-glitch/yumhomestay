CREATE TABLE `hostAvailability` (
	`id` int AUTO_INCREMENT NOT NULL,
	`hostId` int,
	`cookingSchoolId` int,
	`date` varchar(10) NOT NULL,
	`startTime` varchar(5) NOT NULL,
	`endTime` varchar(5) NOT NULL,
	`maxGuests` int NOT NULL DEFAULT 6,
	`status` enum('available','booked','blocked') NOT NULL DEFAULT 'available',
	`bookingId` int,
	`note` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `hostAvailability_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `bookings` MODIFY COLUMN `adultsCount` int NOT NULL DEFAULT 2;--> statement-breakpoint
ALTER TABLE `bookings` MODIFY COLUMN `status` enum('pending','pending_payment','confirmed','completed','cancelled_by_guest','cancelled_by_host','cancelled_by_admin') NOT NULL DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `bookings` ADD `infantsCount` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `bookings` ADD `basePriceJpy` int DEFAULT 20000;--> statement-breakpoint
ALTER TABLE `bookings` ADD `extraAdultPriceJpy` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `bookings` ADD `extraChildPriceJpy` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `bookings` ADD `extraInfantPriceJpy` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `bookings` ADD `agentBonusFeeJpy` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `bookings` ADD `pickupStation` varchar(255);--> statement-breakpoint
ALTER TABLE `bookings` ADD `meetingTime` timestamp;--> statement-breakpoint
ALTER TABLE `bookings` ADD `reminder3HourSent` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `bookings` ADD `videoCallRequired` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `bookings` ADD `videoCallScheduledAt` timestamp;--> statement-breakpoint
ALTER TABLE `bookings` ADD `videoCallCompletedAt` timestamp;--> statement-breakpoint
ALTER TABLE `bookings` ADD `videoCallNotes` text;--> statement-breakpoint
ALTER TABLE `bookings` ADD `guestSurveyRating` int;--> statement-breakpoint
ALTER TABLE `bookings` ADD `guestSurveyComment` text;--> statement-breakpoint
ALTER TABLE `bookings` ADD `guestSurveySubmittedAt` timestamp;--> statement-breakpoint
ALTER TABLE `cookingSchools` ADD `cuisineSpecialty` varchar(100);--> statement-breakpoint
ALTER TABLE `cookingSchools` ADD `maxStudents` int DEFAULT 10;--> statement-breakpoint
ALTER TABLE `cookingSchools` ADD `pricePerPersonJpy` int;--> statement-breakpoint
ALTER TABLE `cookingSchools` ADD `averageRating` decimal(3,2);--> statement-breakpoint
ALTER TABLE `cookingSchools` ADD `imageUrls` text;--> statement-breakpoint
ALTER TABLE `hosts` ADD `familyMemberCount` int DEFAULT 2;--> statement-breakpoint
ALTER TABLE `hosts` ADD `canCookTogether` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `hosts` ADD `hasSpecialCertification` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `hosts` ADD `certificationDetails` text;--> statement-breakpoint
ALTER TABLE `hosts` ADD `hasInsurance` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `hosts` ADD `registrationFeePaid` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `hosts` ADD `trainingCompleted` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `hosts` ADD `certificationIssuedAt` timestamp;--> statement-breakpoint
ALTER TABLE `hosts` ADD `interviewScheduledAt` timestamp;--> statement-breakpoint
ALTER TABLE `hosts` ADD `interviewCompletedAt` timestamp;--> statement-breakpoint
ALTER TABLE `hosts` ADD `minSessionHours` int DEFAULT 3;--> statement-breakpoint
ALTER TABLE `hosts` ADD `maxSessionHours` int DEFAULT 5;--> statement-breakpoint
ALTER TABLE `hosts` ADD `dietaryAccommodations` text;--> statement-breakpoint
ALTER TABLE `payments` ADD `stripeSessionId` varchar(255);
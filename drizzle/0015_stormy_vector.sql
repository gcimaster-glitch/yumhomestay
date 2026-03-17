CREATE TABLE `contactInquiries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`email` varchar(320) NOT NULL,
	`inquiryType` varchar(50) NOT NULL,
	`message` text NOT NULL,
	`status` enum('new','in_progress','resolved') NOT NULL DEFAULT 'new',
	`adminNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contactInquiries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kycSubmissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`documentType` enum('passport','drivers_license','residence_card') NOT NULL,
	`documentFrontUrl` text NOT NULL,
	`documentBackUrl` text,
	`selfieUrl` text,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`reviewedBy` int,
	`reviewNote` text,
	`submittedAt` timestamp NOT NULL DEFAULT (now()),
	`reviewedAt` timestamp,
	CONSTRAINT `kycSubmissions_id` PRIMARY KEY(`id`)
);

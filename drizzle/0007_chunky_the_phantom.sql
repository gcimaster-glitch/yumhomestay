CREATE TABLE `bookingChats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`inquiryId` int,
	`bookingId` int,
	`senderId` int,
	`senderRole` enum('guest','host','admin','ai') NOT NULL,
	`content` text NOT NULL,
	`isAiGenerated` boolean NOT NULL DEFAULT false,
	`aiModel` varchar(100),
	`isReadByGuest` boolean NOT NULL DEFAULT false,
	`isReadByAdmin` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bookingChats_id` PRIMARY KEY(`id`)
);

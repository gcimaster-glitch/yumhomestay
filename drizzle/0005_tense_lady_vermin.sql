CREATE TABLE `hostRegistrationPayments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`hostId` int NOT NULL,
	`stripeSessionId` varchar(255),
	`stripePaymentIntentId` varchar(255),
	`amountJpy` int NOT NULL DEFAULT 5000,
	`status` enum('pending','succeeded','failed','expired') NOT NULL DEFAULT 'pending',
	`paidAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `hostRegistrationPayments_id` PRIMARY KEY(`id`),
	CONSTRAINT `hostRegistrationPayments_hostId_unique` UNIQUE(`hostId`),
	CONSTRAINT `hostRegistrationPayments_stripeSessionId_unique` UNIQUE(`stripeSessionId`),
	CONSTRAINT `hostRegistrationPayments_stripePaymentIntentId_unique` UNIQUE(`stripePaymentIntentId`)
);

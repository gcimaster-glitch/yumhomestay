CREATE TABLE `emailVerificationTokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`newEmail` varchar(255) NOT NULL,
	`token` varchar(128) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`usedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `emailVerificationTokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `emailVerificationTokens_token_unique` UNIQUE(`token`)
);

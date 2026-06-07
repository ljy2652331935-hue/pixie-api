CREATE TABLE `activity_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`aName` varchar(100) NOT NULL,
	`bName` varchar(100) NOT NULL,
	`sharedVibe` text,
	`vibeCategory` enum('emotional','action','mixed'),
	`searchQuery` text,
	`top3Json` text,
	`chatTopicsJson` text,
	`personAJson` text NOT NULL,
	`personBJson` text NOT NULL,
	`timeslotJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activity_plans_id` PRIMARY KEY(`id`)
);

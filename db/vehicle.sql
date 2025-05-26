-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: db
-- Generation Time: May 26, 2025 at 02:10 PM
-- Server version: 8.0.42
-- PHP Version: 8.2.27

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `vehicle`
--

-- --------------------------------------------------------

--
-- Table structure for table `Fuel_Info`
--

CREATE TABLE `Fuel_Info` (
  `fuel_id` int NOT NULL,
  `vehicle_id` int NOT NULL,
  `date` date NOT NULL,
  `liters` decimal(10,2) DEFAULT NULL,
  `cost` decimal(10,2) DEFAULT NULL,
  `odometer_reading` int DEFAULT NULL,
  `location` varchar(100) DEFAULT NULL,
  `full_tank` tinyint(1) DEFAULT '0',
  `notes` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Maintenance_Info`
--

CREATE TABLE `Maintenance_Info` (
  `maintenance_id` int NOT NULL,
  `vehicle_id` int NOT NULL,
  `date` date NOT NULL,
  `maintenance_type` varchar(100) DEFAULT NULL,
  `description` text,
  `mileage` int DEFAULT NULL,
  `cost` decimal(10,2) DEFAULT NULL,
  `location` varchar(100) DEFAULT NULL,
  `notes` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Reminders_Info`
--

CREATE TABLE `Reminders_Info` (
  `reminder_id` int NOT NULL,
  `user_id` int NOT NULL,
  `title` varchar(100) NOT NULL,
  `description` text,
  `due_date` date NOT NULL,
  `repeat_interval` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Users`
--

CREATE TABLE `Users` (
  `user_id` int NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `mileage_type` enum('kilometers','miles') DEFAULT 'kilometers',
  `dark_mode` tinyint(1) DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Vehicles_Info`
--

CREATE TABLE `Vehicles_Info` (
  `vehicle_id` int NOT NULL,
  `user_id` int NOT NULL,
  `make` varchar(50) NOT NULL,
  `model` varchar(50) NOT NULL,
  `year` year NOT NULL,
  `color` varchar(30) DEFAULT NULL,
  `license_plate` varchar(20) DEFAULT NULL,
  `vin` varchar(50) DEFAULT NULL,
  `current_mileage` int DEFAULT '0',
  `fuel_type` varchar(30) DEFAULT NULL,
  `purchase_date` date DEFAULT NULL,
  `vehicle_image_url` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `Fuel_Info`
--
ALTER TABLE `Fuel_Info`
  ADD PRIMARY KEY (`fuel_id`),
  ADD KEY `vehicle_id` (`vehicle_id`);

--
-- Indexes for table `Maintenance_Info`
--
ALTER TABLE `Maintenance_Info`
  ADD PRIMARY KEY (`maintenance_id`),
  ADD KEY `vehicle_id` (`vehicle_id`);

--
-- Indexes for table `Reminders_Info`
--
ALTER TABLE `Reminders_Info`
  ADD PRIMARY KEY (`reminder_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `Users`
--
ALTER TABLE `Users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `Vehicles_Info`
--
ALTER TABLE `Vehicles_Info`
  ADD PRIMARY KEY (`vehicle_id`),
  ADD UNIQUE KEY `license_plate` (`license_plate`),
  ADD UNIQUE KEY `vin` (`vin`),
  ADD KEY `user_id` (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `Fuel_Info`
--
ALTER TABLE `Fuel_Info`
  MODIFY `fuel_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Maintenance_Info`
--
ALTER TABLE `Maintenance_Info`
  MODIFY `maintenance_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Reminders_Info`
--
ALTER TABLE `Reminders_Info`
  MODIFY `reminder_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Users`
--
ALTER TABLE `Users`
  MODIFY `user_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Vehicles_Info`
--
ALTER TABLE `Vehicles_Info`
  MODIFY `vehicle_id` int NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `Fuel_Info`
--
ALTER TABLE `Fuel_Info`
  ADD CONSTRAINT `Fuel_Info_ibfk_1` FOREIGN KEY (`vehicle_id`) REFERENCES `Vehicles_Info` (`vehicle_id`) ON DELETE CASCADE;

--
-- Constraints for table `Maintenance_Info`
--
ALTER TABLE `Maintenance_Info`
  ADD CONSTRAINT `Maintenance_Info_ibfk_1` FOREIGN KEY (`vehicle_id`) REFERENCES `Vehicles_Info` (`vehicle_id`) ON DELETE CASCADE;

--
-- Constraints for table `Reminders_Info`
--
ALTER TABLE `Reminders_Info`
  ADD CONSTRAINT `Reminders_Info_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `Users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `Vehicles_Info`
--
ALTER TABLE `Vehicles_Info`
  ADD CONSTRAINT `Vehicles_Info_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `Users` (`user_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

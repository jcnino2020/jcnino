-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Jul 10, 2026 at 08:48 AM
-- Server version: 10.11.17-MariaDB-cll-lve
-- PHP Version: 8.4.22

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `bsit3b`
--

-- --------------------------------------------------------

--
-- Table structure for table `pasabaybcd_audit_logs`
--

CREATE TABLE `pasabaybcd_audit_logs` (
  `id` int(11) NOT NULL,
  `admin_id` int(11) DEFAULT NULL,
  `action` varchar(255) DEFAULT NULL,
  `details` text DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `user_agent` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `pasabaybcd_audit_logs`
--

INSERT INTO `pasabaybcd_audit_logs` (`id`, `admin_id`, `action`, `details`, `ip_address`, `created_at`, `user_agent`) VALUES
(1, 5, 'SETTINGS_UPDATE', 'Global settings modified', NULL, '2026-04-12 13:51:39', NULL),
(2, 5, 'SETTINGS_UPDATE', 'Global settings modified', NULL, '2026-04-12 13:51:46', NULL),
(3, 5, 'AUTH_LOGIN', 'Administrative authentication successful.', '49.145.170.5', '2026-04-12 14:44:11', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36'),
(4, 5, 'AUTH_LOGIN', 'Administrative authentication successful.', '49.145.170.5', '2026-04-12 16:46:18', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Brave/1 Mobile/15E148 Safari/604.1'),
(5, 5, 'AUTH_LOGIN', 'Administrative authentication successful.', '203.177.52.226', '2026-04-13 00:11:08', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36'),
(6, 5, 'AUTH_LOGIN', 'Administrative authentication successful.', '136.239.208.228', '2026-04-13 02:42:26', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36'),
(7, 5, 'AUTH_LOGIN', 'Administrative authentication successful.', '136.239.208.228', '2026-04-13 03:55:24', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36'),
(8, 5, 'SETTINGS_UPDATE', 'Global settings modified', '136.239.208.228', '2026-04-13 03:56:56', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36'),
(9, 5, 'AUTH_LOGIN', 'Administrative authentication successful.', '175.176.75.187', '2026-04-13 04:49:51', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36'),
(10, 5, 'AUTH_LOGIN', 'Administrative authentication successful.', '203.177.52.226', '2026-04-14 00:16:49', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36'),
(11, 5, 'AUTH_LOGIN', 'Administrative authentication successful.', '131.226.111.56', '2026-04-14 02:02:54', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36'),
(12, 5, 'AUTH_LOGIN', 'Administrative authentication successful.', '136.239.208.228', '2026-04-14 04:20:30', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36'),
(13, 5, 'AUTH_LOGIN', 'Administrative authentication successful.', '49.145.170.5', '2026-04-14 14:28:03', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36'),
(14, 5, 'AUTH_LOGIN', 'Administrative authentication successful.', '203.177.52.226', '2026-04-15 00:26:13', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36'),
(15, 5, 'AUTH_LOGIN', 'Administrative authentication successful.', '136.239.208.228', '2026-04-15 01:01:02', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36'),
(16, 5, 'AUTH_LOGIN', 'Administrative authentication successful.', '124.83.13.149', '2026-04-15 01:05:19', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36'),
(17, 5, 'AUTH_LOGIN', 'Administrative authentication successful.', '124.83.13.149', '2026-04-15 02:00:51', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36'),
(18, 5, 'AUTH_LOGIN', 'Administrative authentication successful.', '124.83.13.149', '2026-04-15 03:38:29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36'),
(19, 5, 'AUTH_LOGIN', 'Administrative authentication successful.', '203.177.52.226', '2026-04-16 00:35:25', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36'),
(20, 5, 'AUTH_LOGIN', 'Administrative authentication successful.', '136.239.208.228', '2026-04-16 03:11:06', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36'),
(21, 5, 'AUTH_LOGOUT', 'Administrative logout.', '136.239.208.228', '2026-04-16 03:15:48', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36'),
(22, 5, 'AUTH_LOGIN', 'Administrative authentication successful.', '136.239.208.228', '2026-04-16 03:15:51', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36'),
(23, 5, 'AUTH_LOGIN', 'Administrative authentication successful.', '136.239.208.228', '2026-04-16 04:16:33', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36'),
(24, 5, 'AUTH_LOGIN', 'Administrative authentication successful.', '203.177.52.226', '2026-04-16 07:13:17', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36'),
(25, 5, 'AUTH_LOGIN', 'Administrative authentication successful.', '124.83.13.149', '2026-04-20 00:57:44', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36'),
(26, 5, 'AUTH_LOGOUT', 'Administrative logout.', '124.83.13.149', '2026-04-20 02:30:54', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36'),
(27, 5, 'AUTH_LOGIN', 'Administrative authentication successful.', '124.83.13.156', '2026-04-22 06:04:00', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36'),
(28, 5, 'AUTH_LOGIN', 'Administrative authentication successful.', '175.176.72.150', '2026-04-23 07:36:20', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36'),
(29, 5, 'AUTH_LOGIN', 'Administrative authentication successful.', '49.145.170.5', '2026-04-24 04:15:36', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36'),
(30, 5, 'AUTH_LOGIN', 'Administrative authentication successful.', '49.145.131.70', '2026-05-02 23:33:06', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36'),
(31, 5, 'AUTH_LOGIN', 'Administrative authentication successful.', '112.198.112.200', '2026-05-07 08:40:39', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'),
(32, 5, 'AUTH_LOGIN', 'Administrative authentication successful.', '49.148.114.191', '2026-05-11 02:49:03', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36'),
(33, 5, 'AUTH_LOGIN', 'Administrative authentication successful.', '49.148.112.116', '2026-06-07 10:53:24', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36'),
(34, 5, 'AUTH_LOGIN', 'Administrative authentication successful.', '49.145.164.51', '2026-07-10 15:46:08', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36'),
(35, 5, 'AUTH_LOGOUT', 'Administrative logout.', '49.145.164.51', '2026-07-10 15:46:26', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36'),
(36, 5, 'AUTH_LOGIN', 'Administrative authentication successful.', '49.145.164.51', '2026-07-10 15:46:59', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36');

-- --------------------------------------------------------

--
-- Table structure for table `pasabaybcd_bookings`
--

CREATE TABLE `pasabaybcd_bookings` (
  `id` varchar(50) NOT NULL,
  `user_id` int(11) NOT NULL,
  `truck_id` int(11) NOT NULL,
  `driver_name` varchar(255) NOT NULL,
  `cargo_category` varchar(100) NOT NULL,
  `cargo_weight_kg` decimal(10,2) NOT NULL,
  `cargo_quantity` int(11) NOT NULL,
  `description` text DEFAULT NULL,
  `estimated_fee` decimal(10,2) NOT NULL,
  `cargo_photo_url` varchar(255) DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `completed_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `pasabaybcd_bookings`
--

INSERT INTO `pasabaybcd_bookings` (`id`, `user_id`, `truck_id`, `driver_name`, `cargo_category`, `cargo_weight_kg`, `cargo_quantity`, `description`, `estimated_fee`, `cargo_photo_url`, `status`, `created_at`, `completed_at`) VALUES
('BK-1773579690-2146', 1, 44, 'Ivan Lim', 'Produce', 15.00, 2, NULL, 143.00, 'http://ov3.238.mytemp.website/pasabaybcd/uploads/bookings/booking-1-1773579690.jpg', 'confirmed', '2026-03-15 13:01:30', NULL),
('BK-1773579701-8288', 1, 44, 'Ivan Lim', 'Produce', 15.00, 2, NULL, 143.00, 'http://ov3.238.mytemp.website/pasabaybcd/uploads/bookings/booking-1-1773579701.jpg', 'confirmed', '2026-03-15 13:01:41', NULL),
('BK-1773579711-7455', 1, 44, 'Ivan Lim', 'Produce', 15.00, 2, NULL, 143.00, 'http://ov3.238.mytemp.website/pasabaybcd/uploads/bookings/booking-1-1773579711.jpg', 'confirmed', '2026-03-15 13:01:51', NULL),
('BK-1773579726-5522', 1, 44, 'Ivan Lim', 'Produce', 15.00, 2, NULL, 143.00, 'http://ov3.238.mytemp.website/pasabaybcd/uploads/bookings/booking-1-1773579726.jpg', 'confirmed', '2026-03-15 13:02:06', NULL),
('BK-1773582204-6514', 1, 44, 'Ivan Lim', 'Produce', 15.00, 2, NULL, 143.00, 'http://ov3.238.mytemp.website/pasabaybcd/uploads/bookings/booking-1-1773582204.jpg', 'confirmed', '2026-03-15 13:43:24', '2026-03-15 14:35:03'),
('BK-1773889306-2902', 1, 42, 'Leo Ramos', 'Box', 10.00, 4, NULL, 104.00, 'http://ov3.238.mytemp.website/pasabaybcd/uploads/bookings/booking-1-1773889306.jpg', 'cancelled', '2026-03-19 03:01:46', '2026-03-19 03:02:31'),
('BK-1774829225-5515', 1, 43, 'Noel Yap', 'Produce', 15.00, 2, NULL, 102.00, 'http://ov3.238.mytemp.website/pasabaybcd/uploads/bookings/booking-1-1774829225.jpg', 'delivered', '2026-03-30 00:07:05', NULL),
('BK-1774830042-1648', 1, 40, 'Ramon Mendoza', 'Produce', 15.00, 2, NULL, 143.00, 'http://ov3.238.mytemp.website/pasabaybcd/uploads/bookings/booking-1-1774830042.jpg', 'in transit', '2026-03-30 00:20:42', NULL),
('BK-1774830365-4622', 1, 1, 'Manong Juan', 'Produce', 15.00, 2, NULL, 150.00, 'http://ov3.238.mytemp.website/pasabaybcd/uploads/bookings/booking-1-1774830365.jpg', 'in transit', '2026-03-30 00:26:05', NULL),
('BK-1774830708-3916', 1, 4, 'Mang Kardo', 'Produce', 15.00, 2, NULL, 90.00, 'http://ov3.238.mytemp.website/pasabaybcd/uploads/bookings/booking-1-1774830708.jpg', 'delivered', '2026-03-30 00:31:48', NULL),
('BK-1774831692-3279', 1, 46, 'Oscar Tan', 'Produce', 15.00, 2, NULL, 93.00, 'http://ov3.238.mytemp.website/pasabaybcd/uploads/bookings/booking-1-1774831692.jpg', 'cancelled', '2026-03-30 00:48:12', '2026-03-30 00:49:01'),
('BK-1775295508-9336', 1, 46, 'Oscar Tan', 'Textile', 10.00, 2, NULL, 93.00, 'http://ov3.238.mytemp.website/pasabaybcd/uploads/bookings/booking-1-1775295508.jpg', 'confirmed', '2026-04-04 09:38:28', NULL),
('BK-1775295892-8783', 1, 46, 'Oscar Tan', 'Textile', 10.00, 3, NULL, 93.00, 'http://ov3.238.mytemp.website/pasabaybcd/uploads/bookings/booking-1-1775295892.jpg', 'confirmed', '2026-04-04 09:44:52', NULL),
('BK-1775296318-3256', 1, 46, 'Oscar Tan', 'Textile', 12.00, 4, NULL, 93.00, 'http://ov3.238.mytemp.website/pasabaybcd/uploads/bookings/booking-1-1775296318.jpg', 'confirmed', '2026-04-04 09:51:58', NULL),
('BK-1775296661-1685', 1, 4, 'Mang Kardo', 'Box', 10.00, 3, NULL, 90.00, 'http://ov3.238.mytemp.website/pasabaybcd/uploads/bookings/booking-1-1775296661.jpg', 'confirmed', '2026-04-04 09:57:41', NULL),
('BK-1775297066-8871', 1, 42, 'Leo Ramos', 'Box', 10.00, 3, NULL, 104.00, 'http://ov3.238.mytemp.website/pasabaybcd/uploads/bookings/booking-1-1775297066.jpg', 'confirmed', '2026-04-04 10:04:26', NULL),
('BK-1775431431-3690', 1, 2, 'Kuya Ben', 'Box', 10.00, 2, NULL, 80.00, 'http://ov3.238.mytemp.website/pasabaybcd/uploads/bookings/booking-1-1775431431.jpg', 'confirmed', '2026-04-05 23:23:51', NULL),
('BK-1775451967-7708', 1, 33, 'Ivan Perez', 'Produce', 13.00, 4, NULL, 88.00, 'http://ov3.238.mytemp.website/pasabaybcd/uploads/bookings/booking-1-1775451967.jpg', 'delivered', '2026-04-06 05:06:07', NULL),
('BK-1775454848-8635', 1, 2, 'Kuya Ben', 'Box', 13.00, 3, NULL, 360.00, 'http://ov3.238.mytemp.website/pasabaybcd/uploads/bookings/booking-1-1775454848.jpg', 'delivered', '2026-04-06 05:54:08', '2026-04-06 05:55:54'),
('BK-1775485576-6734', 1, 17, 'Raul Yap', 'Box', 15.00, 3, NULL, 474.00, 'http://ov3.238.mytemp.website/pasabaybcd/uploads/bookings/booking-1-1775485576.jpg', 'completed', '2026-04-06 14:26:16', '2026-04-06 14:27:31'),
('BK-1775516110-7960', 1, 46, 'Oscar Tan', 'Box', 12.00, 3, NULL, 384.00, 'http://ov3.238.mytemp.website/pasabaybcd/uploads/bookings/booking-1-1775516110.jpg', 'confirmed', '2026-04-06 22:55:10', NULL),
('BK-1775788631-5636', 1, 49, 'Felipe Ramos', 'Produce', 10.00, 1, NULL, 167.00, NULL, 'completed', '2026-04-10 02:37:11', '2026-04-10 02:38:24'),
('BK-1775892687-7920', 1, 46, 'Oscar Tan', 'Produce', 11.00, 1, NULL, 123.00, NULL, 'completed', '2026-04-11 07:31:27', '2026-04-11 07:32:51'),
('BK-1775895334-7227', 1, 46, 'Oscar Tan', 'Produce', 10.00, 1, NULL, 118.00, NULL, 'confirmed', '2026-04-11 08:15:34', NULL),
('BK-1775895490-2514', 1, 46, 'Oscar Tan', 'Produce', 10.00, 1, NULL, 118.00, NULL, 'confirmed', '2026-04-11 08:18:10', NULL),
('BK-1775895788-9233', 1, 17, 'Raul Yap', 'Produce', 10.00, 1, NULL, 133.00, NULL, 'completed', '2026-04-11 08:23:08', '2026-04-11 08:26:13'),
('BK-1776128499-2637', 1, 22, 'Luis Perez', 'Box', 11.00, 3, NULL, 438.00, NULL, 'confirmed', '2026-04-14 01:01:39', NULL),
('BK-1776135941-2679', 1, 12, 'Ivan Mendoza', 'Box', 11.00, 2, NULL, 298.00, NULL, 'confirmed', '2026-04-14 03:05:41', '2026-04-14 03:11:16'),
('BK-1776316905-6284', 1, 5, 'Kuya Romy', 'Produce', 13.00, 1, NULL, 200.00, 'http://ov3.238.mytemp.website/pasabaybcd/uploads/bookings/booking-1-1776316905.jpg', 'completed', '2026-04-16 05:21:45', '2026-04-16 05:23:47'),
('BK-1776326626-3135', 1, 22, 'Luis Perez', 'Produce', 10.00, 1, NULL, 141.00, 'http://ov3.238.mytemp.website/pasabaybcd/uploads/bookings/booking-1-1776326626.jpg', 'confirmed', '2026-04-16 08:03:46', NULL),
('BK-1776326672-2849', 1, 22, 'Luis Perez', 'Box', 25.00, 1, NULL, 216.00, 'http://ov3.238.mytemp.website/pasabaybcd/uploads/bookings/booking-1-1776326672.jpg', 'completed', '2026-04-16 08:04:32', '2026-04-16 08:13:53'),
('BK-1776327544-5231', 1, 2, 'Kuya Ben', 'Produce', 10.00, 1, NULL, 105.00, NULL, 'confirmed', '2026-04-16 08:19:04', NULL),
('BK-1776327581-5604', 1, 2, 'Kuya Ben', 'Produce', 10.00, 1, NULL, 105.00, 'http://ov3.238.mytemp.website/pasabaybcd/uploads/bookings/booking-1-1776327581.jpg', 'in transit', '2026-04-16 08:19:41', '2026-04-16 08:20:53'),
('BK-1776650156-8861', 1, 48, 'Rico Santos', 'Box', 5.00, 1, '2pcs iphone 99 pro mx', 109.00, 'http://ov3.238.mytemp.website/pasabaybcd/uploads/bookings/booking-1-1776650156.jpg', 'completed', '2026-04-20 01:55:56', '2026-04-20 01:58:52'),
('BK-1776829838-7823', 1, 2, 'Kuya Ben', 'Produce', 7.00, 1, 'fruits', 90.00, 'http://ov3.238.mytemp.website/pasabaybcd/uploads/bookings/booking-1-1776829838.jpg', 'confirmed', '2026-04-22 03:50:38', NULL),
('BK-1776896002-2924', 1, 44, 'Ivan Lim', 'Produce', 10.00, 1, 'Fruits', 168.00, NULL, 'confirmed', '2026-04-22 22:13:22', NULL),
('BK-1776927706-9680', 1, 23, 'Leo Garcia', 'Textile', 3.00, 1, 'T Shirts', 144.00, 'http://ov3.238.mytemp.website/pasabaybcd/uploads/bookings/booking-1-1776927706.jpg', 'confirmed', '2026-04-23 07:01:46', NULL),
('BK-1776929479-3472', 1, 48, 'Rico Santos', 'Box', 7.00, 1, 'Field Box', 119.00, 'http://ov3.238.mytemp.website/pasabaybcd/uploads/bookings/booking-1-1776929479.jpg', 'confirmed', '2026-04-23 07:31:19', NULL),
('BK-1776929584-5625', 1, 11, 'Pedro Vargas', 'Produce', 10.00, 1, 'Food', 136.00, 'http://ov3.238.mytemp.website/pasabaybcd/uploads/bookings/booking-1-1776929584.jpg', 'completed', '2026-04-23 07:33:04', '2026-04-23 07:37:06'),
('BK-1776932632-3946', 1, 13, 'Ben Yap', 'Produce', 8.00, 1, '1 Sack of Rice', 189.00, 'http://ov3.238.mytemp.website/pasabaybcd/uploads/bookings/booking-1-1776932632.jpg', 'completed', '2026-04-23 08:23:52', '2026-04-23 08:26:07'),
('BK-1776933136-6674', 1, 5, 'Kuya Romy', 'Produce', 3.00, 1, 'Parcel', 160.00, 'http://ov3.238.mytemp.website/pasabaybcd/uploads/bookings/booking-1-1776933136.jpg', 'completed', '2026-04-23 08:32:16', '2026-04-23 08:33:25'),
('BK-1780191274-7584', 1, 45, 'Arturo Garcia', 'Produce', 5.00, 1, '', 178.00, 'http://ov3.238.mytemp.website/pasabaybcd/uploads/bookings/booking-1-1780191274.jpg', 'completed', '2026-05-31 01:34:34', '2026-05-31 01:45:22');

-- --------------------------------------------------------

--
-- Table structure for table `pasabaybcd_drivers`
--

CREATE TABLE `pasabaybcd_drivers` (
  `id` int(11) NOT NULL,
  `driver_name` varchar(255) NOT NULL,
  `rating` decimal(2,1) NOT NULL DEFAULT 5.0,
  `profile_photo_url` varchar(255) DEFAULT NULL,
  `is_vaccinated` tinyint(1) NOT NULL DEFAULT 0,
  `phone_number` varchar(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `pasabaybcd_drivers`
--

INSERT INTO `pasabaybcd_drivers` (`id`, `driver_name`, `rating`, `profile_photo_url`, `is_vaccinated`, `phone_number`, `created_at`) VALUES
(1, 'Manong Juan', 4.7, 'http://ov3.238.mytemp.website/pasabaybcd/uploads/profiles/driver_1.png', 1, NULL, '2026-03-09 11:56:30'),
(2, 'Kuya Ben', 5.0, 'https://i.pravatar.cc/150?u=pasabay_driver_2', 0, NULL, '2026-03-09 11:56:30'),
(3, 'Lolo Bert', 4.3, 'https://i.pravatar.cc/150?u=pasabay_driver_3', 1, NULL, '2026-03-09 11:56:30'),
(4, 'Mang Kardo', 4.8, 'https://i.pravatar.cc/150?u=pasabay_driver_4', 1, NULL, '2026-03-09 11:56:30'),
(5, 'Kuya Romy', 5.0, 'https://i.pravatar.cc/150?u=pasabay_driver_5', 1, NULL, '2026-03-09 11:56:30'),
(6, 'Nong Pido', 4.4, 'https://i.pravatar.cc/150?u=pasabay_driver_6', 0, NULL, '2026-03-09 11:56:30'),
(7, 'Alfredo Mendoza', 4.8, 'https://i.pravatar.cc/150?u=pasabay_driver_7', 1, NULL, '2026-03-09 12:46:40'),
(8, 'Javier Santos', 4.4, 'https://i.pravatar.cc/150?u=pasabay_driver_8', 1, NULL, '2026-03-09 12:46:40'),
(9, 'Chris Lim', 4.6, 'https://i.pravatar.cc/150?u=pasabay_driver_9', 0, NULL, '2026-03-09 12:46:40'),
(10, 'Noel Garcia', 4.3, 'https://i.pravatar.cc/150?u=pasabay_driver_10', 1, NULL, '2026-03-09 12:46:40'),
(11, 'Pedro Vargas', 4.0, 'https://i.pravatar.cc/150?u=pasabay_driver_11', 1, NULL, '2026-03-09 12:46:40'),
(12, 'Ivan Mendoza', 5.0, 'https://i.pravatar.cc/150?u=pasabay_driver_12', 0, NULL, '2026-03-09 12:46:40'),
(13, 'Ben Yap', 4.0, 'https://i.pravatar.cc/150?u=pasabay_driver_13', 1, NULL, '2026-03-09 12:46:40'),
(14, 'Alex Gomez', 4.9, 'https://i.pravatar.cc/150?u=pasabay_driver_14', 1, NULL, '2026-03-09 12:46:40'),
(15, 'Andres Lim', 4.2, 'https://i.pravatar.cc/150?u=pasabay_driver_15', 0, NULL, '2026-03-09 12:46:40'),
(16, 'Mario Cruz', 4.4, 'https://i.pravatar.cc/150?u=pasabay_driver_16', 0, NULL, '2026-03-09 12:46:40'),
(17, 'Raul Yap', 5.0, 'https://i.pravatar.cc/150?u=pasabay_driver_17', 1, NULL, '2026-03-09 12:46:40'),
(18, 'Javier Garcia', 4.8, 'https://i.pravatar.cc/150?u=pasabay_driver_18', 1, NULL, '2026-03-09 12:46:40'),
(19, 'Carlos Gomez', 4.4, 'https://i.pravatar.cc/150?u=pasabay_driver_19', 1, NULL, '2026-03-09 12:46:40'),
(20, 'Alfredo Diaz', 4.7, 'https://i.pravatar.cc/150?u=pasabay_driver_20', 0, NULL, '2026-03-09 12:46:40'),
(21, 'Rico Yap', 4.8, 'https://i.pravatar.cc/150?u=pasabay_driver_21', 1, NULL, '2026-03-09 12:46:40'),
(22, 'Luis Perez', 5.0, 'https://i.pravatar.cc/150?u=pasabay_driver_22', 0, NULL, '2026-03-09 12:46:40'),
(23, 'Leo Garcia', 4.6, 'https://i.pravatar.cc/150?u=pasabay_driver_23', 1, NULL, '2026-03-09 12:46:40'),
(24, 'Jun Mendoza', 4.8, 'https://i.pravatar.cc/150?u=pasabay_driver_24', 0, NULL, '2026-03-09 12:46:40'),
(25, 'Ivan Yap', 4.6, 'https://i.pravatar.cc/150?u=pasabay_driver_25', 1, NULL, '2026-03-09 12:46:40'),
(26, 'Chris Perez', 4.3, 'https://i.pravatar.cc/150?u=pasabay_driver_26', 0, NULL, '2026-03-09 12:46:40'),
(27, 'Noel Garcia', 4.9, 'https://i.pravatar.cc/150?u=pasabay_driver_27', 1, NULL, '2026-03-09 12:46:40'),
(28, 'Ramon Lim', 4.8, 'https://i.pravatar.cc/150?u=pasabay_driver_28', 1, NULL, '2026-03-09 12:46:40'),
(29, 'Felipe Mendoza', 4.4, 'https://i.pravatar.cc/150?u=pasabay_driver_29', 0, NULL, '2026-03-09 12:46:40'),
(30, 'Arturo Santos', 4.6, 'https://i.pravatar.cc/150?u=pasabay_driver_30', 1, NULL, '2026-03-09 12:46:40'),
(31, 'Ben Cruz', 4.5, 'https://i.pravatar.cc/150?u=pasabay_driver_31', 1, NULL, '2026-03-09 12:46:40'),
(32, 'Ivan Gomez', 4.8, 'https://i.pravatar.cc/150?u=pasabay_driver_32', 0, NULL, '2026-03-09 12:46:40'),
(33, 'Ivan Perez', 5.0, 'https://i.pravatar.cc/150?u=pasabay_driver_33', 0, NULL, '2026-03-09 12:46:40'),
(34, 'Rico Garcia', 4.3, 'https://i.pravatar.cc/150?u=pasabay_driver_34', 1, NULL, '2026-03-09 12:46:40'),
(35, 'Diego Mendoza', 4.4, 'https://i.pravatar.cc/150?u=pasabay_driver_35', 1, NULL, '2026-03-09 12:46:40'),
(36, 'Andres Tan', 4.6, 'https://i.pravatar.cc/150?u=pasabay_driver_36', 1, NULL, '2026-03-09 12:46:40'),
(37, 'Javier Mendoza', 4.8, 'https://i.pravatar.cc/150?u=pasabay_driver_37', 0, NULL, '2026-03-09 12:46:40'),
(38, 'Chris Tan', 4.6, 'https://i.pravatar.cc/150?u=pasabay_driver_38', 0, NULL, '2026-03-09 12:46:40'),
(39, 'Emilio Santos', 4.4, 'https://i.pravatar.cc/150?u=pasabay_driver_39', 1, NULL, '2026-03-09 12:46:40'),
(40, 'Ramon Mendoza', 4.2, 'https://i.pravatar.cc/150?u=pasabay_driver_40', 0, NULL, '2026-03-09 12:46:40'),
(41, 'Ben Reyes', 4.7, 'https://i.pravatar.cc/150?u=pasabay_driver_41', 1, NULL, '2026-03-09 12:46:40'),
(42, 'Leo Ramos', 4.8, 'https://i.pravatar.cc/150?u=pasabay_driver_42', 1, NULL, '2026-03-09 12:46:40'),
(43, 'Noel Yap', 4.2, 'https://i.pravatar.cc/150?u=pasabay_driver_43', 0, NULL, '2026-03-09 12:46:40'),
(44, 'Ivan Lim', 4.8, 'https://i.pravatar.cc/150?u=pasabay_driver_44', 1, NULL, '2026-03-09 12:46:40'),
(45, 'Arturo Garcia', 5.0, 'https://i.pravatar.cc/150?u=pasabay_driver_45', 1, NULL, '2026-03-09 12:46:40'),
(46, 'Oscar Tan', 5.0, 'https://i.pravatar.cc/150?u=pasabay_driver_46', 0, NULL, '2026-03-09 12:46:40'),
(47, 'Jose Tan', 4.6, 'https://i.pravatar.cc/150?u=pasabay_driver_47', 1, NULL, '2026-03-09 12:46:40'),
(48, 'Rico Santos', 4.0, 'https://i.pravatar.cc/150?u=pasabay_driver_48', 1, NULL, '2026-03-09 12:46:40'),
(49, 'Felipe Ramos', 5.0, 'https://i.pravatar.cc/150?u=pasabay_driver_49', 0, NULL, '2026-03-09 12:46:40'),
(50, 'Javier Yap', 4.5, 'https://i.pravatar.cc/150?u=pasabay_driver_50', 1, NULL, '2026-03-09 12:46:40'),
(51, 'Ramon Perez', 4.8, 'https://i.pravatar.cc/150?u=pasabay_driver_51', 0, NULL, '2026-03-09 12:46:40'),
(52, 'Alex Santos', 4.3, 'https://i.pravatar.cc/150?u=pasabay_driver_52', 1, NULL, '2026-03-09 12:46:40'),
(53, 'Luis Yap', 4.6, 'https://i.pravatar.cc/150?u=pasabay_driver_53', 0, NULL, '2026-03-09 12:46:40'),
(54, 'Ben Vargas', 4.5, 'https://i.pravatar.cc/150?u=pasabay_driver_54', 1, NULL, '2026-03-09 12:46:40'),
(55, 'Rico Lim', 4.3, 'https://i.pravatar.cc/150?u=pasabay_driver_55', 1, NULL, '2026-03-09 12:46:40'),
(56, 'Ivan Tan', 4.5, 'https://i.pravatar.cc/150?u=pasabay_driver_56', 0, NULL, '2026-03-09 12:46:40');

-- --------------------------------------------------------

--
-- Table structure for table `pasabaybcd_images`
--

CREATE TABLE `pasabaybcd_images` (
  `id` int(11) NOT NULL,
  `image_url` varchar(255) NOT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pasabaybcd_notifications`
--

CREATE TABLE `pasabaybcd_notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `type` varchar(30) NOT NULL DEFAULT 'system',
  `title` varchar(255) NOT NULL,
  `body` text NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `pasabaybcd_notifications`
--

INSERT INTO `pasabaybcd_notifications` (`id`, `user_id`, `type`, `title`, `body`, `is_read`, `created_at`) VALUES
(1, 1, 'system', 'Welcome to PasabayBCD!', 'Thank you for joining. Start by booking your first shared delivery.', 0, '2026-03-26 07:22:49'),
(2, 1, 'promo', 'Weekend Promo!', 'Get 15% off your next booking this Saturday & Sunday.', 0, '2026-03-26 07:22:49'),
(3, 1, 'wallet', 'Top-Up Successful', 'Your wallet has been topped up with ₱500 via GCash.', 0, '2026-03-26 07:22:49'),
(4, 1, 'system', 'App Update Available', 'PasabayBCD v1.1 is now available. Update for new features!', 0, '2026-03-26 10:59:08'),
(7, 0, 'system', 'Booking Time Accuracy Improved!', 'Great news! We have successfully updated our system to synchronize with Philippine Standard Time (GMT+8). All your booking records and \"Booked On\" dates will now show the correct local time. Thank you for your continued support!', 0, '2026-04-06 06:13:50'),
(8, 0, 'promo', 'Fast & Reliable Deliveries with PasabayBCD!', 'Need to move cargo across Bacolod? Check out our updated fleet and real-time tracking features. High-capacity trucks are now available for booking! Book your next delivery today.', 0, '2026-04-06 06:18:53'),
(9, 0, 'driver', 'Driver Test!', 'Hey there! Just testing hehehe', 0, '2026-04-11 07:45:08'),
(10, 0, 'booking', 'Hey!', 'Yo!', 0, '2026-04-11 07:45:50'),
(11, 0, 'booking', 'Hey!', 'Yo!', 0, '2026-04-11 08:13:28'),
(12, 0, 'booking', 'Hey!', 'Yo!', 0, '2026-04-11 08:13:31'),
(13, 0, 'booking', 'Hey!', 'Yo!', 0, '2026-04-11 08:15:14'),
(14, 0, 'system', 'Test', 'Hi', 0, '2026-04-11 09:51:22'),
(15, 0, 'system', 'Test', 'Hi', 0, '2026-04-11 09:52:59'),
(16, 0, 'system', 'Test', 'Hi', 0, '2026-04-11 09:58:30'),
(17, 0, 'system', 'Test', 'Hi', 0, '2026-04-11 09:59:17'),
(18, 0, 'driver', 'More Drivers in Your Area! 🚙', 'Good news! We\'ve onboarded 50+ new drivers today to ensure your cargo gets picked up faster than ever.', 0, '2026-04-11 10:02:47'),
(19, 0, 'promo', '📦 Packing Fragile Items?', 'Don\'t forget to double-wrap your delicate cargo! Check out our in-app guide for safe and secure packing tips.', 0, '2026-04-14 00:55:49'),
(20, 0, 'promo', 'Refer a Friend, Get ₱100! 🎁', 'Share PasabayBCD with another merchant. When they complete their first booking, you both get ₱100 in your wallet.', 0, '2026-04-14 01:00:12'),
(21, 0, 'wallet', '⚠️ Low Wallet Balance', 'Your balance is below P50. Top up now to ensure your next booking goes through smoothly.', 0, '2026-04-14 14:50:24'),
(22, 0, 'promo', '🏷️ 15% OFF Voucher!', 'Use code PASABAY15 on your next shipment to get an instant discount. Limited time only!', 0, '2026-04-14 14:51:04'),
(23, 0, 'promo', '🌙 Late Night Special', 'Shipping late? Enjoy flat rates on all deliveries booked between 10 PM and 5 AM.', 0, '2026-04-14 14:51:36'),
(24, 0, 'driver', '🆕 New Booking Nearby', 'There is a new cargo request just 2km away from your current location. Tap to view!', 0, '2026-04-14 14:52:07'),
(25, 0, 'system', '👋 Welcome to Pasabay!', 'Welcome aboard! Complete your first booking today and get your first 5km for free.', 0, '2026-04-14 14:52:33'),
(26, 0, 'system', 'Hello', 'Hi hi hi', 0, '2026-04-16 00:38:48');

-- --------------------------------------------------------

--
-- Table structure for table `pasabaybcd_password_resets`
--

CREATE TABLE `pasabaybcd_password_resets` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `token` varchar(64) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `expires_at` timestamp NOT NULL DEFAULT (current_timestamp() + interval 1 hour),
  `used` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pasabaybcd_payment`
--

CREATE TABLE `pasabaybcd_payment` (
  `transaction_id` varchar(50) NOT NULL,
  `amount` float DEFAULT NULL,
  `timestamp` datetime DEFAULT current_timestamp(),
  `booking_id` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pasabaybcd_ratings`
--

CREATE TABLE `pasabaybcd_ratings` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `driver_id` int(11) NOT NULL,
  `booking_id` varchar(50) DEFAULT NULL,
  `rating` tinyint(1) NOT NULL CHECK (`rating` between 1 and 5),
  `tags` text DEFAULT NULL,
  `review_text` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `pasabaybcd_ratings`
--

INSERT INTO `pasabaybcd_ratings` (`id`, `user_id`, `driver_id`, `booking_id`, `rating`, `tags`, `review_text`, `created_at`) VALUES
(1, 1, 46, 'BK-1774831692-3279', 5, 'Friendly,Careful Handler,On Time,Clean Vehicle,Good Communication,Fast Delivery', '', '2026-03-30 00:49:07'),
(2, 1, 33, 'BK-1775451967-7708', 5, 'Fast Delivery,Clean Vehicle,Careful Handler,Good Communication', 'nice', '2026-04-06 05:07:40'),
(3, 1, 33, 'BK-1775451967-7708', 5, 'On Time,Clean Vehicle,Good Communication,Fast Delivery,Careful Handler,Friendly', 'very good', '2026-04-06 05:42:55'),
(4, 1, 2, 'BK-1775454848-8635', 5, 'Fast Delivery,Good Communication,Clean Vehicle,Friendly,Careful Handler,On Time', 'good job 👍', '2026-04-06 05:55:54'),
(5, 1, 17, 'BK-1775485576-6734', 5, 'On Time,Clean Vehicle,Good Communication', 'okay lang 😊', '2026-04-06 14:27:31'),
(6, 1, 49, 'BK-1775788631-5636', 5, 'On Time', '', '2026-04-10 02:38:24'),
(7, 1, 46, 'BK-1775892687-7920', 5, 'Careful Handler,Fast Delivery', '', '2026-04-11 07:32:51'),
(8, 1, 17, 'BK-1775895788-9233', 5, 'On Time,Good Communication', '', '2026-04-11 08:26:13'),
(9, 1, 12, 'BK-1776135941-2679', 5, 'Careful Handler,Fast Delivery,Good Communication', '', '2026-04-14 03:11:16'),
(10, 1, 5, 'BK-1776316905-6284', 5, 'Careful Handler,Friendly', 'good', '2026-04-16 05:23:47'),
(11, 1, 22, 'BK-1776326672-2849', 5, 'On Time', '', '2026-04-16 08:13:53'),
(12, 1, 2, 'BK-1776327581-5604', 5, 'Fast Delivery', '', '2026-04-16 08:20:53'),
(13, 1, 48, 'BK-1776650156-8861', 4, 'Good Communication', 'nice', '2026-04-20 01:58:52'),
(14, 1, 11, 'BK-1776929584-5625', 4, 'On Time,Careful Handler', '', '2026-04-23 07:37:06'),
(15, 1, 13, 'BK-1776932632-3946', 4, 'Fast Delivery,Friendly,Good Communication', '', '2026-04-23 08:26:07'),
(16, 1, 5, 'BK-1776933136-6674', 5, 'Careful Handler,On Time,Friendly,Clean Vehicle', 'Very Good', '2026-04-23 08:33:25'),
(17, 1, 45, 'BK-1780191274-7584', 5, 'Careful Handler,On Time,Fast Delivery,Clean Vehicle,Good Communication,Friendly', '', '2026-05-31 01:45:22');

-- --------------------------------------------------------

--
-- Table structure for table `pasabaybcd_settings`
--

CREATE TABLE `pasabaybcd_settings` (
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `pasabaybcd_settings`
--

INSERT INTO `pasabaybcd_settings` (`setting_key`, `setting_value`, `updated_at`) VALUES
('admin_email', 'admin@pasabaybcd.ph', '2026-04-01 16:10:01'),
('app_name', 'PasabayBCD', '2026-04-01 16:10:01'),
('app_store_link', '', '2026-04-12 13:51:23'),
('auto_assign_drivers', 'on', '2026-04-12 13:51:23'),
('base_fare', '50.00', '2026-04-01 16:10:01'),
('cancellation_fee', '20.00', '2026-04-12 13:51:23'),
('currency_code', 'PHP', '2026-04-12 13:51:23'),
('currency_symbol', '?', '2026-04-12 13:51:23'),
('driver_search_radius', '10.0', '2026-04-12 13:51:23'),
('facebook_url', '', '2026-04-12 13:51:23'),
('fcm_server_key', '', '2026-04-12 13:51:23'),
('google_maps_api_key', '', '2026-04-12 13:51:23'),
('instagram_url', '', '2026-04-12 13:51:23'),
('maintenance_mode', 'off', '2026-04-01 16:10:01'),
('max_active_bookings_per_driver', '1', '2026-04-12 13:51:23'),
('max_active_bookings_per_user', '3', '2026-04-12 13:51:23'),
('min_wallet_topup', '100.00', '2026-04-12 13:51:23'),
('min_wallet_withdrawal', '500.00', '2026-04-12 13:51:23'),
('paymaya_public_key', '', '2026-04-12 13:51:23'),
('paymaya_secret_key', '', '2026-04-12 13:51:23'),
('per_km_rate', '15.00', '2026-04-01 16:10:01'),
('platform_commission_rate', '10.0', '2026-04-12 13:51:23'),
('play_store_link', '', '2026-04-12 13:51:23'),
('primary_color', '#005eff', '2026-04-12 13:51:46'),
('require_photo_upload', 'off', '2026-04-13 03:56:56'),
('secondary_color', '#1e293b', '2026-04-12 13:51:23'),
('session_timeout', '60', '2026-04-01 16:10:01'),
('stripe_public_key', '', '2026-04-12 13:51:23'),
('stripe_secret_key', '', '2026-04-12 13:51:23'),
('support_email', 'support@pasabaybcd.ph', '2026-04-12 13:51:23'),
('support_phone', '09123456789', '2026-04-12 13:51:23'),
('surge_multiplier', '1.0', '2026-04-01 16:10:01'),
('system_timezone', 'Asia/Manila', '2026-04-12 13:51:23');

-- --------------------------------------------------------

--
-- Table structure for table `pasabaybcd_transactions`
--

CREATE TABLE `pasabaybcd_transactions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `booking_id` varchar(50) DEFAULT NULL COMMENT 'Link to a booking if it is a trip payment',
  `type` enum('top_up','trip_payment','withdrawal') NOT NULL,
  `amount` decimal(10,2) NOT NULL COMMENT 'Always a positive value',
  `label` varchar(255) NOT NULL,
  `transaction_date` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `pasabaybcd_transactions`
--

INSERT INTO `pasabaybcd_transactions` (`id`, `user_id`, `booking_id`, `type`, `amount`, `label`, `transaction_date`) VALUES
(1, 1, NULL, 'trip_payment', 150.00, 'Libertad Trip', '2024-01-14 17:00:00'),
(2, 1, NULL, 'trip_payment', 80.00, 'Burgos Trip', '2024-01-12 18:00:00'),
(3, 1, NULL, 'trip_payment', 120.00, 'Central Market Trip', '2024-01-10 16:30:00'),
(4, 1, NULL, 'trip_payment', 95.00, 'Tangub Trip', '2024-01-08 21:00:00'),
(5, 1, NULL, 'top_up', 500.00, 'Top Up via GCash', '2026-03-09 12:41:25'),
(6, 1, NULL, 'top_up', 100.00, 'Top Up via Maya', '2026-03-09 14:19:50'),
(7, 1, NULL, 'top_up', 200.00, 'Top Up via GCash', '2026-03-10 03:13:05'),
(8, 3, NULL, 'top_up', 500.00, 'Top Up via GCash', '2026-03-11 01:16:47'),
(9, 1, NULL, 'top_up', 1000.00, 'Top Up via Bank Transfer', '2026-03-17 03:27:09'),
(10, 1, NULL, 'top_up', 200.00, 'Top Up via Bank Transfer', '2026-03-29 13:00:27'),
(11, 1, 'BK-1775516110-7960', '', -384.00, 'Booking: Box (BK-1775516110-7960)', '2026-04-06 22:55:10'),
(12, 1, 'BK-1775788631-5636', 'trip_payment', -167.00, 'Booking: Produce (BK-1775788631-5636)', '2026-04-10 02:37:11'),
(13, 1, 'BK-1775892687-7920', 'trip_payment', -123.00, 'Booking: Produce (BK-1775892687-7920)', '2026-04-11 07:31:27'),
(14, 1, 'BK-1775895334-7227', 'trip_payment', -118.00, 'Booking: Produce (BK-1775895334-7227)', '2026-04-11 08:15:34'),
(15, 1, 'BK-1775895490-2514', 'trip_payment', -118.00, 'Booking: Produce (BK-1775895490-2514)', '2026-04-11 08:18:10'),
(16, 1, 'BK-1775895788-9233', 'trip_payment', -133.00, 'Booking: Produce (BK-1775895788-9233)', '2026-04-11 08:23:08'),
(17, 1, 'BK-1776128499-2637', 'trip_payment', -438.00, 'Booking: Box (BK-1776128499-2637)', '2026-04-14 01:01:39'),
(18, 1, 'BK-1776135941-2679', 'trip_payment', -298.00, 'Booking: Box (BK-1776135941-2679)', '2026-04-14 03:05:41'),
(19, 1, NULL, 'top_up', 20.00, 'Top Up via GCash', '2026-04-16 04:15:49'),
(20, 1, NULL, 'top_up', 99.00, 'Top Up via Maya', '2026-04-16 05:19:48'),
(21, 1, 'BK-1776316905-6284', 'trip_payment', -200.00, 'Booking: Produce (BK-1776316905-6284)', '2026-04-16 05:21:45'),
(22, 1, 'BK-1776326626-3135', 'trip_payment', -141.00, 'Booking: Produce (BK-1776326626-3135)', '2026-04-16 08:03:46'),
(23, 1, 'BK-1776326672-2849', 'trip_payment', -216.00, 'Booking: Box (BK-1776326672-2849)', '2026-04-16 08:04:32'),
(24, 1, 'BK-1776327544-5231', 'trip_payment', -105.00, 'Booking: Produce (BK-1776327544-5231)', '2026-04-16 08:19:04'),
(25, 1, 'BK-1776327581-5604', 'trip_payment', -105.00, 'Booking: Produce (BK-1776327581-5604)', '2026-04-16 08:19:41'),
(26, 1, NULL, 'top_up', 10.00, 'Top Up via Bank', '2026-04-18 00:07:30'),
(27, 1, NULL, 'top_up', 100.00, 'Top Up via GCash', '2026-04-20 01:55:05'),
(28, 1, 'BK-1776650156-8861', 'trip_payment', -109.00, 'Booking: Box (BK-1776650156-8861)', '2026-04-20 01:55:56'),
(29, 1, NULL, 'top_up', 300.00, 'Top Up via GCash', '2026-04-20 05:44:33'),
(30, 1, 'BK-1776829838-7823', 'trip_payment', -90.00, 'Booking: Produce (BK-1776829838-7823)', '2026-04-22 03:50:38'),
(31, 1, 'BK-1776896002-2924', 'trip_payment', -168.00, 'Booking: Produce (BK-1776896002-2924)', '2026-04-22 22:13:22'),
(32, 1, NULL, 'top_up', 200.00, 'Top Up via GCash', '2026-04-22 22:13:57'),
(33, 1, 'BK-1776927706-9680', 'trip_payment', -144.00, 'Booking: Textile (BK-1776927706-9680)', '2026-04-23 07:01:46'),
(34, 1, 'BK-1776929479-3472', 'trip_payment', -119.00, 'Booking: Box (BK-1776929479-3472)', '2026-04-23 07:31:19'),
(35, 1, NULL, 'top_up', 500.00, 'Top Up via GCash', '2026-04-23 07:32:44'),
(36, 1, 'BK-1776929584-5625', 'trip_payment', -136.00, 'Booking: Produce (BK-1776929584-5625)', '2026-04-23 07:33:04'),
(37, 1, NULL, 'top_up', 100.00, 'Top Up via GCash', '2026-04-23 08:19:59'),
(38, 1, NULL, 'top_up', 100.00, 'Top Up via GCash', '2026-04-23 08:22:30'),
(39, 1, 'BK-1776932632-3946', 'trip_payment', -189.00, 'Booking: Produce (BK-1776932632-3946)', '2026-04-23 08:23:52'),
(40, 1, 'BK-1776933136-6674', 'trip_payment', -160.00, 'Booking: Produce (BK-1776933136-6674)', '2026-04-23 08:32:16'),
(41, 1, NULL, 'top_up', 99.00, 'Top Up via Maya', '2026-05-31 01:33:57'),
(42, 1, 'BK-1780191274-7584', 'trip_payment', -178.00, 'Booking: Produce (BK-1780191274-7584)', '2026-05-31 01:34:34');

-- --------------------------------------------------------

--
-- Table structure for table `pasabaybcd_trip`
--

CREATE TABLE `pasabaybcd_trip` (
  `trip_id` varchar(50) NOT NULL,
  `destination` varchar(255) DEFAULT NULL,
  `start_location` varchar(255) DEFAULT NULL,
  `route_gps` text DEFAULT NULL,
  `driver_id` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pasabaybcd_trucks`
--

CREATE TABLE `pasabaybcd_trucks` (
  `id` int(11) NOT NULL,
  `driver_id` int(11) NOT NULL,
  `type` varchar(50) NOT NULL COMMENT 'e.g., L300 VAN, MULTICAB',
  `plate_number` varchar(20) NOT NULL,
  `capacity_kg` decimal(10,2) NOT NULL,
  `capacity_cbm` decimal(10,2) NOT NULL,
  `base_price` decimal(10,2) NOT NULL,
  `current_route` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `depart_time` time DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'available' COMMENT 'available, on_trip, maintenance',
  `origin_lat` decimal(10,8) DEFAULT NULL,
  `origin_lng` decimal(11,8) DEFAULT NULL,
  `dest_lat` decimal(10,8) DEFAULT NULL,
  `dest_lng` decimal(11,8) DEFAULT NULL,
  `vehicle_photo_url` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `pasabaybcd_trucks`
--

INSERT INTO `pasabaybcd_trucks` (`id`, `driver_id`, `type`, `plate_number`, `capacity_kg`, `capacity_cbm`, `base_price`, `current_route`, `depart_time`, `status`, `origin_lat`, `origin_lng`, `dest_lat`, `dest_lng`, `vehicle_photo_url`) VALUES
(1, 1, 'L300 VAN', 'BCD-123', 200.00, 1.50, 150.00, 'Libertad -> Mansilingan', '14:30:00', 'available', 10.66750000, 122.94610000, 10.63100000, 122.97610000, 'http://ov3.238.mytemp.website/pasabaybcd/images/trucks/l300.jpg'),
(2, 2, 'MULTICAB', 'PAD-682', 100.00, 0.80, 80.00, 'Burgos -> Bata', '15:00:00', 'available', 10.67650000, 122.95340000, 10.70670000, 122.96060000, 'http://ov3.238.mytemp.website/pasabaybcd/images/trucks/multicab.jpg'),
(3, 3, 'L300 VAN', 'BCD-445', 180.00, 1.20, 120.00, 'Central Market -> Tangub', '16:00:00', 'available', 10.66330000, 122.95030000, 10.62750000, 122.93040000, 'http://ov3.238.mytemp.website/pasabaybcd/images/trucks/l300.jpg'),
(4, 4, 'MULTICAB', 'BAK-111', 120.00, 1.00, 90.00, 'Libertad -> Alijis', '14:45:00', 'available', 10.66750000, 122.94610000, 10.63520000, 122.95790000, 'http://ov3.238.mytemp.website/pasabaybcd/images/trucks/multicab.jpg'),
(5, 5, 'L300 VAN', 'CAR-555', 220.00, 1.60, 160.00, 'Burgos -> Estefania', '15:15:00', 'available', 10.67650000, 122.95340000, 10.69010000, 122.98120000, 'http://ov3.238.mytemp.website/pasabaybcd/images/trucks/l300.jpg'),
(6, 6, 'MULTICAB', 'XYZ-999', 150.00, 1.10, 110.00, 'Central Market -> Sum-ag', '16:30:00', 'available', 10.66330000, 122.95030000, 10.61210000, 122.93650000, 'http://ov3.238.mytemp.website/pasabaybcd/images/trucks/multicab.jpg'),
(7, 7, 'L300 VAN', 'TMP-001', 204.00, 1.40, 172.00, 'Central Market -> Pahanocoy', '17:30:00', 'available', 10.66330000, 122.95030000, 10.59850000, 122.93440000, 'http://ov3.238.mytemp.website/pasabaybcd/images/trucks/l300.jpg'),
(8, 8, 'L300 VAN', 'TMP-002', 202.00, 1.80, 178.00, 'Libertad Market -> Taculing', '15:30:00', 'available', 10.66750000, 122.94610000, 10.64960000, 122.94750000, 'http://ov3.238.mytemp.website/pasabaybcd/images/trucks/l300.jpg'),
(9, 9, 'MULTICAB', 'TMP-003', 138.00, 1.10, 101.00, 'Central Market -> Bata', '14:00:00', 'available', 10.66330000, 122.95030000, 10.70670000, 122.96060000, 'http://ov3.238.mytemp.website/pasabaybcd/images/trucks/multicab.jpg'),
(10, 10, 'L300 VAN', 'TMP-004', 241.00, 1.70, 158.00, 'Libertad Market -> Taculing', '15:15:00', 'available', 10.66750000, 122.94610000, 10.64960000, 122.94750000, 'http://ov3.238.mytemp.website/pasabaybcd/images/trucks/l300.jpg'),
(11, 11, 'MULTICAB', 'TMP-005', 132.00, 1.10, 111.00, 'Burgos Market -> Pahanocoy', '13:00:00', 'available', 10.67650000, 122.95340000, 10.59850000, 122.93440000, 'http://ov3.238.mytemp.website/pasabaybcd/images/trucks/multicab.jpg'),
(12, 12, 'MULTICAB', 'TMP-006', 133.00, 1.20, 119.00, 'Burgos Market -> Taculing', '17:30:00', 'available', 10.67650000, 122.95340000, 10.64960000, 122.94750000, 'http://ov3.238.mytemp.website/pasabaybcd/images/trucks/multicab.jpg'),
(13, 13, 'L300 VAN', 'TMP-007', 221.00, 1.50, 174.00, 'Burgos Market -> Sum-ag', '16:00:00', 'available', 10.67650000, 122.95340000, 10.61210000, 122.93650000, 'http://ov3.238.mytemp.website/pasabaybcd/images/trucks/l300.jpg'),
(14, 14, 'L300 VAN', 'TMP-008', 214.00, 1.30, 142.00, 'Central Market -> Pahanocoy', '13:45:00', 'available', 10.66330000, 122.95030000, 10.59850000, 122.93440000, 'http://ov3.238.mytemp.website/pasabaybcd/images/trucks/l300.jpg'),
(15, 15, 'MULTICAB', 'TMP-009', 148.00, 1.00, 111.00, 'Libertad Market -> Taculing', '13:15:00', 'available', 10.66750000, 122.94610000, 10.64960000, 122.94750000, 'http://ov3.238.mytemp.website/pasabaybcd/images/trucks/multicab.jpg'),
(16, 16, 'MULTICAB', 'TMP-010', 108.00, 0.90, 118.00, 'Central Market -> Handumanan', '16:00:00', 'available', 10.66330000, 122.95030000, 10.60310000, 122.95870000, 'http://ov3.238.mytemp.website/pasabaybcd/images/trucks/multicab.jpg'),
(17, 17, 'MULTICAB', 'TMP-011', 128.00, 1.20, 108.00, 'Libertad Market -> Villamonte', '15:30:00', 'available', 10.66750000, 122.94610000, 10.66850000, 122.96470000, 'http://ov3.238.mytemp.website/pasabaybcd/images/trucks/multicab.jpg'),
(18, 18, 'L300 VAN', 'TMP-012', 211.00, 1.40, 169.00, 'Central Market -> Granada', '14:15:00', 'available', 10.66330000, 122.95030000, 10.66810000, 123.01250000, 'http://ov3.238.mytemp.website/pasabaybcd/images/trucks/l300.jpg'),
(19, 19, 'MULTICAB', 'TMP-013', 143.00, 1.20, 106.00, 'Libertad Market -> Pahanocoy', '14:30:00', 'available', 10.66750000, 122.94610000, 10.59850000, 122.93440000, 'http://ov3.238.mytemp.website/pasabaybcd/images/trucks/multicab.jpg'),
(20, 20, 'L300 VAN', 'TMP-014', 205.00, 1.30, 150.00, 'Central Market -> Alijis', '13:45:00', 'available', 10.66330000, 122.95030000, 10.63520000, 122.95790000, 'http://ov3.238.mytemp.website/pasabaybcd/images/trucks/l300.jpg'),
(21, 21, 'L300 VAN', 'TMP-015', 241.00, 1.70, 141.00, 'Burgos Market -> Taculing', '17:45:00', 'available', 10.67650000, 122.95340000, 10.64960000, 122.94750000, 'http://ov3.238.mytemp.website/pasabaybcd/images/trucks/l300.jpg'),
(22, 22, 'MULTICAB', 'TMP-016', 110.00, 1.00, 116.00, 'Burgos Market -> Bata', '14:30:00', 'available', 10.67650000, 122.95340000, 10.70670000, 122.96060000, 'http://ov3.238.mytemp.website/pasabaybcd/images/trucks/multicab.jpg'),
(23, 23, 'L300 VAN', 'TMP-017', 223.00, 1.60, 144.00, 'Libertad Market -> Estefania', '17:00:00', 'available', 10.66750000, 122.94610000, 10.69010000, 122.98120000, 'http://ov3.238.mytemp.website/pasabaybcd/images/trucks/l300.jpg'),
(24, 24, 'L300 VAN', 'TMP-018', 203.00, 1.60, 164.00, 'Libertad Market -> Taculing', '16:00:00', 'available', 10.66750000, 122.94610000, 10.64960000, 122.94750000, 'http://ov3.238.mytemp.website/pasabaybcd/images/trucks/l300.jpg'),
(25, 25, 'MULTICAB', 'TMP-019', 120.00, 1.00, 110.00, 'Central Market -> Pahanocoy', '13:45:00', 'available', 10.66330000, 122.95030000, 10.59850000, 122.93440000, 'http://ov3.238.mytemp.website/pasabaybcd/images/trucks/multicab.jpg'),
(26, 26, 'L300 VAN', 'TMP-020', 211.00, 1.20, 168.00, 'Burgos Market -> Handumanan', '16:45:00', 'available', 10.67650000, 122.95340000, 10.60310000, 122.95870000, 'http://ov3.238.mytemp.website/pasabaybcd/images/trucks/l300.jpg'),
(27, 27, 'L300 VAN', 'TMP-021', 223.00, 1.70, 141.00, 'Libertad Market -> Pahanocoy', '15:15:00', 'available', 10.66750000, 122.94610000, 10.59850000, 122.93440000, 'http://ov3.238.mytemp.website/pasabaybcd/images/trucks/l300.jpg'),
(28, 28, 'L300 VAN', 'TMP-022', 234.00, 1.60, 162.00, 'Libertad Market -> Bata', '15:30:00', 'available', 10.66750000, 122.94610000, 10.70670000, 122.96060000, 'http://ov3.238.mytemp.website/pasabaybcd/images/trucks/l300.jpg'),
(29, 29, 'MULTICAB', 'TMP-023', 141.00, 1.10, 111.00, 'Libertad Market -> Villamonte', '17:00:00', 'available', 10.66750000, 122.94610000, 10.66850000, 122.96470000, 'http://ov3.238.mytemp.website/pasabaybcd/images/trucks/multicab.jpg'),
(30, 30, 'L300 VAN', 'TMP-024', 243.00, 1.30, 141.00, 'Libertad Market -> Singcang-Airport', '13:30:00', 'available', NULL, NULL, NULL, NULL, 'http://ov3.238.mytemp.website/pasabaybcd/images/trucks/l300.jpg'),
(31, 31, 'MULTICAB', 'TMP-025', 133.00, 1.00, 118.00, 'Central Market -> Taculing', '16:45:00', 'available', 10.66330000, 122.95030000, 10.64960000, 122.94750000, 'http://ov3.238.mytemp.website/pasabaybcd/images/trucks/multicab.jpg'),
(32, 32, 'L300 VAN', 'TMP-026', 221.00, 1.60, 163.00, 'Central Market -> Pahanocoy', '14:45:00', 'available', 10.66330000, 122.95030000, 10.59850000, 122.93440000, 'http://ov3.238.mytemp.website/pasabaybcd/images/trucks/l300.jpg'),
(33, 33, 'MULTICAB', 'TMP-027', 123.00, 1.10, 88.00, 'Burgos Market -> Pahanocoy', '13:15:00', 'available', 10.67650000, 122.95340000, 10.59850000, 122.93440000, 'http://ov3.238.mytemp.website/pasabaybcd/images/trucks/multicab.jpg'),
(34, 34, 'MULTICAB', 'TMP-028', 148.00, 1.10, 107.00, 'Central Market -> Villamonte', '13:15:00', 'available', 10.66330000, 122.95030000, 10.66850000, 122.96470000, 'http://ov3.238.mytemp.website/pasabaybcd/images/trucks/multicab.jpg'),
(35, 35, 'MULTICAB', 'TMP-029', 141.00, 1.00, 114.00, 'Central Market -> Alijis', '13:15:00', 'available', 10.66330000, 122.95030000, 10.63520000, 122.95790000, 'http://ov3.238.mytemp.website/pasabaybcd/images/trucks/multicab.jpg'),
(36, 36, 'L300 VAN', 'TMP-030', 206.00, 1.70, 178.00, 'Libertad Market -> Taculing', '17:45:00', 'available', 10.66750000, 122.94610000, 10.64960000, 122.94750000, 'http://ov3.238.mytemp.website/pasabaybcd/images/trucks/l300.jpg'),
(37, 37, 'MULTICAB', 'TMP-031', 128.00, 1.10, 111.00, 'Libertad Market -> Bata', '17:30:00', 'available', 10.66750000, 122.94610000, 10.70670000, 122.96060000, 'http://ov3.238.mytemp.website/pasabaybcd/images/trucks/multicab.jpg'),
(38, 38, 'L300 VAN', 'TMP-032', 231.00, 1.60, 148.00, 'Libertad Market -> Bata', '16:15:00', 'available', 10.66750000, 122.94610000, 10.70670000, 122.96060000, 'http://ov3.238.mytemp.website/pasabaybcd/images/trucks/l300.jpg'),
(39, 39, 'L300 VAN', 'TMP-033', 248.00, 1.40, 143.00, 'Burgos Market -> Pahanocoy', '16:00:00', 'available', 10.67650000, 122.95340000, 10.59850000, 122.93440000, 'http://ov3.238.mytemp.website/pasabaybcd/images/trucks/l300.jpg'),
(40, 40, 'L300 VAN', 'TMP-034', 215.00, 1.70, 143.00, 'Libertad Market -> Pahanocoy', '14:30:00', 'available', 10.66750000, 122.94610000, 10.59850000, 122.93440000, 'http://ov3.238.mytemp.website/pasabaybcd/images/trucks/l300.jpg'),
(41, 41, 'MULTICAB', 'TMP-035', 111.00, 1.00, 118.00, 'Libertad Market -> Mansilingan', '14:00:00', 'available', 10.66750000, 122.94610000, 10.63100000, 122.97610000, 'http://ov3.238.mytemp.website/pasabaybcd/images/trucks/multicab.jpg'),
(42, 42, 'MULTICAB', 'TMP-036', 149.00, 1.10, 104.00, 'Libertad Market -> Villamonte', '16:00:00', 'available', 10.66750000, 122.94610000, 10.66850000, 122.96470000, 'http://ov3.238.mytemp.website/pasabaybcd/images/trucks/multicab.jpg'),
(43, 43, 'MULTICAB', 'TMP-037', 121.00, 1.10, 102.00, 'Libertad Market -> Pahanocoy', '15:15:00', 'available', 10.66750000, 122.94610000, 10.59850000, 122.93440000, 'http://ov3.238.mytemp.website/pasabaybcd/images/trucks/multicab.jpg'),
(44, 44, 'L300 VAN', 'TMP-038', 218.00, 1.70, 143.00, 'Libertad Market -> Handumanan', '17:15:00', 'available', 10.66750000, 122.94610000, 10.60310000, 122.95870000, 'http://ov3.238.mytemp.website/pasabaybcd/images/trucks/l300.jpg'),
(45, 45, 'L300 VAN', 'TMP-039', 241.00, 1.30, 178.00, 'Libertad Market -> Villamonte', '15:30:00', 'available', 10.66750000, 122.94610000, 10.66850000, 122.96470000, 'http://ov3.238.mytemp.website/pasabaybcd/images/trucks/l300.jpg'),
(46, 46, 'MULTICAB', 'TMP-040', 148.00, 1.10, 93.00, 'Libertad Market -> Villamonte', '13:00:00', 'available', 10.66750000, 122.94610000, 10.66850000, 122.96470000, 'http://ov3.238.mytemp.website/pasabaybcd/images/trucks/multicab.jpg'),
(47, 47, 'MULTICAB', 'TMP-041', 121.00, 1.10, 105.00, 'Libertad Market -> Pahanocoy', '17:30:00', 'available', 10.66750000, 122.94610000, 10.59850000, 122.93440000, 'http://ov3.238.mytemp.website/pasabaybcd/images/trucks/multicab.jpg'),
(48, 48, 'MULTICAB', 'TMP-042', 125.00, 0.90, 109.00, 'Burgos Market -> Villamonte', '17:30:00', 'available', 10.67650000, 122.95340000, 10.66850000, 122.96470000, 'http://ov3.238.mytemp.website/pasabaybcd/images/trucks/multicab.jpg'),
(49, 49, 'L300 VAN', 'TMP-043', 228.00, 1.70, 142.00, 'Burgos Market -> Pahanocoy', '17:30:00', 'available', 10.67650000, 122.95340000, 10.59850000, 122.93440000, 'http://ov3.238.mytemp.website/pasabaybcd/images/trucks/l300.jpg'),
(50, 50, 'L300 VAN', 'TMP-044', 249.00, 1.30, 160.00, 'Central Market -> Bata', '14:45:00', 'available', 10.66330000, 122.95030000, 10.70670000, 122.96060000, 'http://ov3.238.mytemp.website/pasabaybcd/images/trucks/l300.jpg'),
(51, 51, 'MULTICAB', 'TMP-045', 141.00, 1.10, 119.00, 'Libertad Market -> Villamonte', '15:00:00', 'available', 10.66750000, 122.94610000, 10.66850000, 122.96470000, 'http://ov3.238.mytemp.website/pasabaybcd/images/trucks/multicab.jpg'),
(52, 52, 'L300 VAN', 'TMP-046', 241.00, 1.30, 155.00, 'Central Market -> Tangub', '15:15:00', 'available', 10.66330000, 122.95030000, 10.62750000, 122.93040000, 'http://ov3.238.mytemp.website/pasabaybcd/images/trucks/l300.jpg'),
(53, 53, 'L300 VAN', 'TMP-047', 234.00, 1.40, 161.00, 'Central Market -> Alijis', '13:00:00', 'available', 10.66330000, 122.95030000, 10.63520000, 122.95790000, 'http://ov3.238.mytemp.website/pasabaybcd/images/trucks/l300.jpg'),
(54, 54, 'MULTICAB', 'TMP-048', 101.00, 1.10, 103.00, 'Central Market -> Villamonte', '17:00:00', 'available', 10.66330000, 122.95030000, 10.66850000, 122.96470000, 'http://ov3.238.mytemp.website/pasabaybcd/images/trucks/multicab.jpg'),
(55, 55, 'L300 VAN', 'TMP-049', 248.00, 1.70, 175.00, 'Burgos Market -> Taculing', '16:45:00', 'available', 10.67650000, 122.95340000, 10.64960000, 122.94750000, 'http://ov3.238.mytemp.website/pasabaybcd/images/trucks/l300.jpg'),
(56, 56, 'L300 Van', 'TMP-050', 139.00, 1.20, 91.03, 'Central Market -> Pahanocoy', '13:30:00', 'available', 10.66330000, 122.95030000, 10.59850000, 122.93440000, 'http://ov3.238.mytemp.website/pasabaybcd/images/trucks/l300.jpg');

-- --------------------------------------------------------

--
-- Table structure for table `pasabaybcd_users`
--

CREATE TABLE `pasabaybcd_users` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL COMMENT 'Should store a hashed password',
  `full_name` varchar(255) DEFAULT NULL,
  `business_permit_number` varchar(255) DEFAULT NULL,
  `id_photo_url` varchar(255) DEFAULT NULL,
  `merchant_name` varchar(255) NOT NULL,
  `market_location` varchar(255) DEFAULT NULL,
  `profile_photo_url` varchar(255) DEFAULT NULL,
  `is_kyc_verified` tinyint(1) NOT NULL DEFAULT 0,
  `wallet_balance` decimal(10,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `role` varchar(20) NOT NULL DEFAULT 'passenger',
  `is_banned` tinyint(1) NOT NULL DEFAULT 0,
  `phone_number` varchar(20) DEFAULT NULL,
  `fcm_token` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `pasabaybcd_users`
--

INSERT INTO `pasabaybcd_users` (`id`, `email`, `password_hash`, `full_name`, `business_permit_number`, `id_photo_url`, `merchant_name`, `market_location`, `profile_photo_url`, `is_kyc_verified`, `wallet_balance`, `created_at`, `role`, `is_banned`, `phone_number`, `fcm_token`) VALUES
(1, 'aling.nena@email.com', '$2y$10$VCojEQ7hLcK/PBUHfItOHuPfURXTy8DryC4kOocvFomuyw6f5u/V6', 'Nena Juan', '928282882', 'http://ov3.238.mytemp.website/pasabaybcd/uploads/kyc/kyc-1-1773112408.jpg', 'Aling Nena\'s Stall', 'Libertad Market, Aisle 9', 'http://ov3.238.mytemp.website/pasabaybcd/uploads/profiles/user-1-1776837723.jpg', 1, 149.00, '2026-03-09 11:56:30', 'passenger', 0, NULL, NULL),
(2, 'john@email.com', '$2y$10$OoqKOu7kyozKtLTDvPUkM.iRqJxUR88NRATAZbAk3da8fR87rLE.G', 'John', NULL, NULL, '', NULL, NULL, 0, 0.00, '2026-03-11 01:13:20', 'passenger', 0, NULL, NULL),
(3, 'fish@gmail.com', '$2y$10$ndCPxMcCZKh9C72HX.zHOuqPD3tNZLflFzgCZgLTIgh0be5mRWKjW', 'Fish', NULL, NULL, '', NULL, NULL, 1, 500.00, '2026-03-11 01:13:52', 'passenger', 0, NULL, NULL),
(4, 'driver@gmail.com', '$2y$10$5PHDc0q1ILHFFhadp1UKZ.4mvq9qRW85y/sc762nTgV9Lh34bJX..', 'Kuya Driver', NULL, NULL, '', NULL, NULL, 0, 0.00, '2026-03-26 11:13:35', 'driver', 0, NULL, NULL),
(5, 'admin@pasabaybcd.ph', '$2y$10$baTahGwqxtkz9FoHbueV0.q12jazahYlvPHlwhYS1QuztcScEHryG', 'System Admin', NULL, NULL, '', NULL, NULL, 0, 0.00, '2026-04-01 15:40:23', 'admin', 0, '', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `pasabaybcd_vehicle`
--

CREATE TABLE `pasabaybcd_vehicle` (
  `plate_number` varchar(20) NOT NULL,
  `model` varchar(50) DEFAULT NULL,
  `capacity` float DEFAULT NULL,
  `owner_id` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `pasabaybcd_audit_logs`
--
ALTER TABLE `pasabaybcd_audit_logs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `pasabaybcd_bookings`
--
ALTER TABLE `pasabaybcd_bookings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `truck_id` (`truck_id`);

--
-- Indexes for table `pasabaybcd_drivers`
--
ALTER TABLE `pasabaybcd_drivers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `phone_number` (`phone_number`);

--
-- Indexes for table `pasabaybcd_images`
--
ALTER TABLE `pasabaybcd_images`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `pasabaybcd_notifications`
--
ALTER TABLE `pasabaybcd_notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `pasabaybcd_password_resets`
--
ALTER TABLE `pasabaybcd_password_resets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `email` (`email`),
  ADD KEY `token` (`token`);

--
-- Indexes for table `pasabaybcd_payment`
--
ALTER TABLE `pasabaybcd_payment`
  ADD PRIMARY KEY (`transaction_id`);

--
-- Indexes for table `pasabaybcd_ratings`
--
ALTER TABLE `pasabaybcd_ratings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `driver_id` (`driver_id`);

--
-- Indexes for table `pasabaybcd_settings`
--
ALTER TABLE `pasabaybcd_settings`
  ADD PRIMARY KEY (`setting_key`);

--
-- Indexes for table `pasabaybcd_transactions`
--
ALTER TABLE `pasabaybcd_transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `booking_id` (`booking_id`);

--
-- Indexes for table `pasabaybcd_trip`
--
ALTER TABLE `pasabaybcd_trip`
  ADD PRIMARY KEY (`trip_id`);

--
-- Indexes for table `pasabaybcd_trucks`
--
ALTER TABLE `pasabaybcd_trucks`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `plate_number` (`plate_number`),
  ADD KEY `driver_id` (`driver_id`);

--
-- Indexes for table `pasabaybcd_users`
--
ALTER TABLE `pasabaybcd_users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `pasabaybcd_vehicle`
--
ALTER TABLE `pasabaybcd_vehicle`
  ADD PRIMARY KEY (`plate_number`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `pasabaybcd_audit_logs`
--
ALTER TABLE `pasabaybcd_audit_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT for table `pasabaybcd_drivers`
--
ALTER TABLE `pasabaybcd_drivers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=57;

--
-- AUTO_INCREMENT for table `pasabaybcd_images`
--
ALTER TABLE `pasabaybcd_images`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `pasabaybcd_notifications`
--
ALTER TABLE `pasabaybcd_notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT for table `pasabaybcd_password_resets`
--
ALTER TABLE `pasabaybcd_password_resets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `pasabaybcd_ratings`
--
ALTER TABLE `pasabaybcd_ratings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `pasabaybcd_transactions`
--
ALTER TABLE `pasabaybcd_transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=43;

--
-- AUTO_INCREMENT for table `pasabaybcd_trucks`
--
ALTER TABLE `pasabaybcd_trucks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=58;

--
-- AUTO_INCREMENT for table `pasabaybcd_users`
--
ALTER TABLE `pasabaybcd_users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `pasabaybcd_bookings`
--
ALTER TABLE `pasabaybcd_bookings`
  ADD CONSTRAINT `pasabaybcd_bookings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `pasabaybcd_users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `pasabaybcd_bookings_ibfk_2` FOREIGN KEY (`truck_id`) REFERENCES `pasabaybcd_trucks` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `pasabaybcd_transactions`
--
ALTER TABLE `pasabaybcd_transactions`
  ADD CONSTRAINT `pasabaybcd_transactions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `pasabaybcd_users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `pasabaybcd_transactions_ibfk_2` FOREIGN KEY (`booking_id`) REFERENCES `pasabaybcd_bookings` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `pasabaybcd_trucks`
--
ALTER TABLE `pasabaybcd_trucks`
  ADD CONSTRAINT `pasabaybcd_trucks_ibfk_1` FOREIGN KEY (`driver_id`) REFERENCES `pasabaybcd_drivers` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

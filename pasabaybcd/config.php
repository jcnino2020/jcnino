<?php
// ============================================================
// PASABAY BCD - Database & Global Configuration
// ============================================================

date_default_timezone_set('Asia/Manila');

define('DB_HOST', 'localhost');
define('DB_NAME', 'bsit3b');
define('DB_USER', 'jac');
define('DB_PASS', '43IG_fI]mw[E');

function get_db_connection() {
    try {
        $conn = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME, DB_USER, DB_PASS);
        $conn->exec("set names utf8mb4");
        $conn->exec("SET time_zone = '+08:00'");
        $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        return $conn;
    } catch(PDOException $exception) {
        error_log("Connection error: " . $exception->getMessage());
        return null;
    }
}

// Global helper for security
function h($string) {
    return htmlspecialchars($string, ENT_QUOTES, 'UTF-8');
}
?>

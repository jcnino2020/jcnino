<?php
require_once 'config.php';
session_start();

if (isset($_SESSION['admin_user_id'])) {
    $conn = get_db_connection();
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'UNKNOWN';
    $ua = substr($_SERVER['HTTP_USER_AGENT'] ?? 'UNKNOWN', 0, 255);
    try {
        $conn->prepare("INSERT INTO pasabaybcd_audit_logs (admin_id, action, details, ip_address, user_agent) VALUES (?, 'AUTH_LOGOUT', 'Administrative logout.', ?, ?)")->execute([$_SESSION['admin_user_id'], $ip, $ua]);
    } catch(Exception $e) {}
}

session_unset();
session_destroy();
header("Location: index.php");
exit();
?>

<?php
// ============================================================
// PASABAY BCD - Session Auth Check
// ============================================================

if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

if (!isset($_SESSION['admin_user_id'])) {
    header("Location: index.php");
    exit();
}
?>

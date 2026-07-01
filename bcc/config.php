<?php
/**
 * BCC Elite Grading Portal - Configuration (Mock Data Version)
 * No Database Required for this prototype.
 */

/**
 * Secure Session Start
 */
function secure_session_start() {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
}

/**
 * Helper to escape HTML output
 */
function h($text) {
    return htmlspecialchars($text ?? '', ENT_QUOTES, 'UTF-8');
}

/**
 * Redirect Helper
 */
function redirect($url) {
    header("Location: $url");
    exit();
}

/**
 * GET MOCK USERS
 */
function get_mock_users() {
    return [
        [
            'username' => 'admin',
            'password' => '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // 'password'
            'role' => 'admin',
            'full_name' => 'System Administrator',
            'email' => 'admin@bcc.edu.ph'
        ],
        [
            'username' => 'faculty1',
            'password' => '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // 'password'
            'role' => 'faculty',
            'full_name' => 'Dr. Maria Clara',
            'email' => 'm.clara@bcc.edu.ph'
        ],
        [
            'username' => 'student1',
            'password' => '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // 'password'
            'role' => 'student',
            'full_name' => 'Juan Dela Cruz',
            'email' => 'j.delacruz@student.bcc.edu.ph'
        ]
    ];
}

/**
 * GET MOCK GRADES
 */
function get_mock_grades() {
    return [
        ['code' => 'IT311', 'title' => 'Web Development 2', 'units' => 3, 'midterm' => 1.25, 'final' => 1.50, 'remarks' => 'Passed'],
        ['code' => 'IT312', 'title' => 'Database Management Systems 2', 'units' => 3, 'midterm' => 1.75, 'final' => 1.50, 'remarks' => 'Passed'],
        ['code' => 'IT313', 'title' => 'Networking 1', 'units' => 3, 'midterm' => 2.25, 'final' => 2.00, 'remarks' => 'Passed'],
        ['code' => 'GE101', 'title' => 'Understanding the Self', 'units' => 3, 'midterm' => 1.00, 'final' => 1.25, 'remarks' => 'Passed'],
        ['code' => 'GE102', 'title' => 'Purposive Communication', 'units' => 3, 'midterm' => 1.50, 'final' => 1.50, 'remarks' => 'Passed']
    ];
}
?>

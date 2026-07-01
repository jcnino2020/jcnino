<?php
require_once 'config.php';
secure_session_start();

// Redirect if already logged in
if (isset($_SESSION['user_id'])) {
    redirect('dashboard.php');
}

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';

    if ($username && $password) {
        $users = get_mock_users();
        $user_found = false;

        foreach ($users as $user) {
            if ($user['username'] === $username && password_verify($password, $user['password'])) {
                $_SESSION['user_id'] = $user['username'];
                $_SESSION['role'] = $user['role'];
                $_SESSION['full_name'] = $user['full_name'];
                $_SESSION['email'] = $user['email'];
                $user_found = true;
                redirect('dashboard.php');
            }
        }

        if (!$user_found) {
            $error = "Invalid username or password. (Try: admin / password)";
        }
    } else {
        $error = "Please enter both username and password.";
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login | BCC Elite Grading Portal</title>
    <link rel="stylesheet" href="assets/css/style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body class="login-bg">
    <div class="login-container">
        <div class="login-card glass">
            <img src="assets/img/logo.png" alt="BCC Logo" class="login-logo">
            <div class="login-header">
                <h1>BCC ELITE</h1>
                <p>Online Grading Portal</p>
            </div>

            <?php if ($error): ?>
                <div class="error-msg" style="color: var(--error); margin-bottom: 20px; font-size: 0.9rem; font-weight: 600;">
                    <i class="fas fa-exclamation-circle"></i> <?php echo h($error); ?>
                </div>
            <?php endif; ?>

            <form action="index.php" method="POST">
                <div class="form-group">
                    <label for="username">Username / Student ID</label>
                    <input type="text" id="username" name="username" class="form-input" placeholder="Enter your username" required autofocus>
                </div>
                <div class="form-group" style="margin-bottom: 30px;">
                    <label for="password">Password</label>
                    <input type="password" id="password" name="password" class="form-input" placeholder="••••••••" required>
                </div>
                <button type="submit" class="btn-primary">
                    Sign In to Portal <i class="fas fa-arrow-right" style="margin-left: 8px;"></i>
                </button>
            </form>

            <div style="margin-top: 30px; color: var(--text-muted); font-size: 0.8rem;">
                &copy; <?php echo date('Y'); ?> Bacolod City College. All Rights Reserved.
            </div>
        </div>
    </div>
</body>
</html>

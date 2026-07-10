<?php
// ============================================================
// PasabayBCD - Admin Login
// ============================================================

require_once 'config.php';
session_start();

if (isset($_SESSION['admin_user_id'])) {
    header("Location: dashboard.php");
    exit();
}

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = $_POST['email'] ?? '';
    $password = $_POST['password'] ?? '';

    if (!empty($email) && !empty($password)) {
        $conn = get_db_connection();
        if ($conn) {
            $stmt = $conn->prepare("SELECT * FROM pasabaybcd_users WHERE email = ? AND role = 'admin' LIMIT 1");
            $stmt->execute([$email]);
            $user = $stmt->fetch();

            if ($user && password_verify($password, $user['password_hash'])) {
                session_regenerate_id(true);
                $_SESSION['admin_user_id'] = $user['id'];
                $_SESSION['admin_name'] = $user['full_name'];
                $_SESSION['admin_email'] = $user['email'];

                try {
                    $conn->exec("ALTER TABLE pasabaybcd_audit_logs ADD COLUMN user_agent VARCHAR(255) DEFAULT NULL;");
                } catch(PDOException $e) {}

                $ip = $_SERVER['REMOTE_ADDR'] ?? 'UNKNOWN';
                $ua = substr($_SERVER['HTTP_USER_AGENT'] ?? 'UNKNOWN', 0, 255);
                $conn->prepare("INSERT INTO pasabaybcd_audit_logs (admin_id, action, details, ip_address, user_agent) VALUES (?, 'AUTH_LOGIN', 'Administrative authentication successful.', ?, ?)")->execute([$user['id'], $ip, $ua]);

                header("Location: dashboard.php");
                exit();
            } else {
                $error = "Invalid email or password.";
            }
        } else {
            $error = "Database connection error.";
        }
    } else {
        $error = "Please fill in all fields.";
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Login - PasabayBCD Admin</title>
<link rel="icon" type="image/png" href="assets/app-icon.png">
<link rel="shortcut icon" href="assets/app-icon.png">
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  body { font-family: 'Inter', sans-serif; background: #f8f9ff; }
</style>
</head>
<body class="flex items-center justify-center min-h-screen p-6">
  <div class="w-full max-w-md bg-white rounded-lg shadow-xl p-8 border border-blue-50">
    <div class="text-center mb-8 flex flex-col items-center">
      <div class="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center p-3 mb-4 shadow-lg shadow-blue-200">
        <img src="assets/images/logo-white.png" alt="Logo" class="w-full h-full">
      </div>
      <h1 class="text-2xl font-bold text-gray-900">PasabayBCD</h1>
      <p class="text-sm text-gray-500 mt-1 uppercase tracking-widest font-semibold">Administration Portal</p>
    </div>

    <?php if ($error): ?>
      <div class="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-base font-bold rounded">
        <?php echo h($error); ?>
      </div>
    <?php endif; ?>

    <form method="POST" action="index.php" class="space-y-8">
      <div>
        <label class="block text-[12px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Email Address</label>
        <input type="email" name="email" required placeholder="admin@pasabaybcd.ph" class="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all text-base">
      </div>
      <div>
        <label class="block text-[12px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Password</label>
        <input type="password" name="password" required placeholder="••••••••" class="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all text-base">
      </div>
      <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded transition-all shadow-lg active:scale-[0.98]">
        Sign In to Control Panel
      </button>
    </form>
    
    <div class="mt-8 text-center">
      <p class="text-[12px] text-gray-400 italic">Authorized personnel only. Access is monitored.</p>
    </div>
  </div>
</body>
</html>

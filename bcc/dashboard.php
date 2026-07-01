<?php
require_once 'config.php';
secure_session_start();

// Redirect to login if not logged in
if (!isset($_SESSION['user_id'])) {
    redirect('index.php');
}

$role = $_SESSION['role'];
$fullName = $_SESSION['full_name'];
$userEmail = $_SESSION['email'] ?? '';

/**
 * Handle Logout
 */
if (isset($_GET['logout'])) {
    session_destroy();
    redirect('index.php');
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard | BCC Elite</title>
    <link rel="stylesheet" href="assets/css/style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body>
    <div class="dashboard-wrapper">
        <!-- Sidebar -->
        <aside class="sidebar glass">
            <div class="nav-logo">
                <img src="assets/img/logo.png" alt="Logo">
                <span>BCC ELITE</span>
            </div>

            <ul class="nav-links">
                <li class="nav-item">
                    <a href="dashboard.php" class="nav-link active">
                        <i class="fas fa-th-large"></i> Dashboard
                    </a>
                </li>
                <?php if ($role === 'student'): ?>
                    <li class="nav-item">
                        <a href="#" class="nav-link">
                            <i class="fas fa-graduation-cap"></i> My Grades
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="#" class="nav-link">
                            <i class="fas fa-calendar-alt"></i> Schedule
                        </a>
                    </li>
                <?php elseif ($role === 'faculty'): ?>
                    <li class="nav-item">
                        <a href="#" class="nav-link">
                            <i class="fas fa-edit"></i> Grade Entry
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="#" class="nav-link">
                            <i class="fas fa-users"></i> My Students
                        </a>
                    </li>
                <?php endif; ?>
                
                <li class="nav-item">
                    <a href="#" class="nav-link">
                        <i class="fas fa-user-circle"></i> Profile
                    </a>
                </li>
                <li class="nav-item" style="margin-top: auto; padding-top: 50px;">
                    <a href="dashboard.php?logout=1" class="nav-link" style="color: var(--error);">
                        <i class="fas fa-sign-out-alt"></i> Logout
                    </a>
                </li>
            </ul>
        </aside>

        <!-- Main Content -->
        <main class="main-content">
            <header style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px;">
                <div>
                    <h2 style="font-size: 1.75rem;">Welcome back, <?php echo h(explode(' ', $fullName)[0]); ?>!</h2>
                    <p style="color: var(--text-muted);"><?php echo date('l, F j, Y'); ?></p>
                </div>
                <div class="glass" style="padding: 10px 20px; display: flex; align-items: center; gap: 12px; border-radius: 30px;">
                    <div style="text-align: right;">
                        <div style="font-weight: 600; font-size: 0.9rem;"><?php echo h($fullName); ?></div>
                        <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;"><?php echo h($role); ?></div>
                    </div>
                    <div style="width: 40px; height: 40px; background: var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; color: var(--secondary);">
                        <?php echo substr($fullName, 0, 1); ?>
                    </div>
                </div>
            </header>

            <?php if ($role === 'student'): ?>
                <!-- Student Stats -->
                <div class="stats-grid">
                    <div class="stat-card glass">
                        <span class="stat-title">Current GPA</span>
                        <span class="stat-value" style="color: var(--secondary);">1.45</span>
                    </div>
                    <div class="stat-card glass">
                        <span class="stat-title">Units Earned</span>
                        <span class="stat-value">84 / 120</span>
                    </div>
                    <div class="stat-card glass">
                        <span class="stat-title">Academic Year</span>
                        <span class="stat-value" style="font-size: 1.5rem;">2025-2026</span>
                    </div>
                </div>

                <!-- Grades Table Section -->
                <div class="glass" style="margin-top: 40px; overflow: hidden;">
                    <div style="padding: 24px; border-bottom: 1px solid var(--glass-border); display: flex; justify-content: space-between; align-items: center;">
                        <h3 style="font-size: 1.25rem;">2nd Semester Grades</h3>
                        <button class="btn-primary" style="width: auto; padding: 10px 20px; font-size: 0.85rem;" onclick="window.print()">
                            <i class="fas fa-print"></i> Print Official Copy
                        </button>
                    </div>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Code</th>
                                    <th>Subject Description</th>
                                    <th>Units</th>
                                    <th>Midterm</th>
                                    <th>Final</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php
                                $grades = get_mock_grades();
                                foreach ($grades as $g):
                                ?>
                                    <tr>
                                        <td style="font-weight: 600; color: var(--secondary);"><?php echo h($g['code']); ?></td>
                                        <td><?php echo h($g['title']); ?></td>
                                        <td><?php echo h($g['units']); ?></td>
                                        <td><?php echo h($g['midterm']); ?></td>
                                        <td style="font-weight: 700; font-size: 1.1rem;"><?php echo h($g['final']); ?></td>
                                        <td>
                                            <span class="grade-pill <?php echo strtolower($g['remarks']) === 'passed' ? 'passed' : 'failed'; ?>">
                                                <?php echo h($g['remarks']); ?>
                                            </span>
                                        </td>
                                    </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                </div>
            <?php endif; ?>

            <?php if ($role === 'faculty' || $role === 'admin'): ?>
                <div class="glass" style="padding: 40px; text-align: center;">
                    <i class="fas fa-shield-alt" style="font-size: 3rem; color: var(--secondary); margin-bottom: 20px;"></i>
                    <h2><?php echo h(ucfirst($role)); ?> Control Panel</h2>
                    <p style="color: var(--text-muted); margin-top: 10px;">The system is currently running in <strong>Demo Mode (No Database)</strong>.</p>
                    <div style="margin-top: 30px; display: flex; justify-content: center; gap: 20px;">
                        <div class="glass" style="padding: 20px; width: 200px;">
                            <h4 style="color: var(--secondary);"><?php echo $role === 'admin' ? '12' : '3'; ?></h4>
                            <p style="font-size: 0.8rem; color: var(--text-muted);">Assigned Tasks</p>
                        </div>
                        <div class="glass" style="padding: 20px; width: 200px;">
                            <h4 style="color: var(--secondary);">Active</h4>
                            <p style="font-size: 0.8rem; color: var(--text-muted);">Semester Status</p>
                        </div>
                    </div>
                </div>
            <?php endif; ?>

        </main>
    </div>
</body>
</html>

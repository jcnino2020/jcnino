<?php
// ============================================================
// PASABAYBCD - Advanced System Settings
// ============================================================

require_once 'config.php';
require_once 'auth_check.php';

$conn = get_db_connection();
if (!$conn) die("Database connection failed.");

// --- SCHEMA AUTO-UPDATE (Ensures new tables exist) ---
$conn->exec("
    CREATE TABLE IF NOT EXISTS pasabaybcd_settings (
        setting_key VARCHAR(100) PRIMARY KEY,
        setting_value TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS pasabaybcd_audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        admin_id INT,
        action VARCHAR(255),
        details TEXT,
        ip_address VARCHAR(45),
        user_agent VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
");

try {
    if ($conn) {
        $conn->exec("ALTER TABLE pasabaybcd_audit_logs ADD COLUMN user_agent VARCHAR(255) DEFAULT NULL;");
    }
} catch(PDOException $e) {}

// Initialize default settings if empty
$conn->exec("
    INSERT IGNORE INTO pasabaybcd_settings (setting_key, setting_value) VALUES 
    ('app_name', 'PasabayBCD'), ('maintenance_mode', 'off'),
    ('base_fare', '50.00'), ('per_km_rate', '15.00'),
    ('surge_multiplier', '1.0'), ('admin_email', 'admin@pasabaybcd.ph'),
    ('session_timeout', '60'),
    ('support_phone', '09123456789'), ('support_email', 'support@pasabaybcd.ph'),
    ('google_maps_api_key', ''), ('fcm_server_key', ''),
    ('driver_search_radius', '10.0'), ('auto_assign_drivers', 'on'),
    ('system_timezone', 'Asia/Manila'), ('currency_code', 'PHP'), ('currency_symbol', '₱'),
    ('max_active_bookings_per_user', '3'), ('max_active_bookings_per_driver', '1'),
    ('require_photo_upload', 'on'), ('cancellation_fee', '20.00'), ('platform_commission_rate', '10.0'),
    ('min_wallet_withdrawal', '500.00'), ('min_wallet_topup', '100.00'),
    ('primary_color', '#004ac6'), ('secondary_color', '#1e293b'),
    ('play_store_link', ''), ('app_store_link', ''),
    ('facebook_url', ''), ('instagram_url', ''),
    ('stripe_public_key', ''), ('stripe_secret_key', ''),
    ('paymaya_public_key', ''), ('paymaya_secret_key', '')
");

$message = '';
$error = '';

// --- HANDLE POST ACTIONS ---
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'UNKNOWN';
    $ua = substr($_SERVER['HTTP_USER_AGENT'] ?? 'UNKNOWN', 0, 255);
    
    // 1. Password Change
    if ($action === 'change_password') {
        $current_pw = $_POST['current_pw'] ?? '';
        $new_pw = $_POST['new_pw'] ?? '';
        $confirm_pw = $_POST['confirm_pw'] ?? '';
        if ($new_pw === $confirm_pw) {
            $stmt = $conn->prepare("SELECT password_hash FROM pasabaybcd_users WHERE id = ?");
            $stmt->execute([$_SESSION['admin_user_id']]);
            $user = $stmt->fetch();
            if ($user && password_verify($current_pw, $user['password_hash'])) {
                $hashed = password_hash($new_pw, PASSWORD_DEFAULT);
                $update = $conn->prepare("UPDATE pasabaybcd_users SET password_hash = ? WHERE id = ?");
                if ($update->execute([$hashed, $_SESSION['admin_user_id']])) {
                    $message = "Password updated successfully.";
                    $conn->prepare("INSERT INTO pasabaybcd_audit_logs (admin_id, action, details, ip_address, user_agent) VALUES (?, 'PW_CHANGE', 'Password updated', ?, ?)")->execute([$_SESSION['admin_user_id'], $ip, $ua]);
                }
            } else { $error = "Current password's verification failed."; }
        } else { $error = "New passwords don't match."; }
    }

    // 2. Global Settings Update
    if ($action === 'update_settings') {
        foreach ($_POST['settings'] as $key => $value) {
            $stmt = $conn->prepare("UPDATE pasabaybcd_settings SET setting_value = ? WHERE setting_key = ?");
            $stmt->execute([$value, $key]);
        }
        $message = "System configurations updated successfully.";
        $conn->prepare("INSERT INTO pasabaybcd_audit_logs (admin_id, action, details, ip_address, user_agent) VALUES (?, 'SETTINGS_UPDATE', 'Global settings modified', ?, ?)")->execute([$_SESSION['admin_user_id'], $ip, $ua]);
    }

    // 3. Clear Audit Logs
    if ($action === 'clear_audit') {
        $conn->exec("DELETE FROM pasabaybcd_audit_logs");
        $message = "Audit trail cleared successfully.";
        $conn->prepare("INSERT INTO pasabaybcd_audit_logs (admin_id, action, details, ip_address, user_agent) VALUES (?, 'AUDIT_CLEAR', 'System audit trail was cleared by administrator', ?, ?)")->execute([$_SESSION['admin_user_id'], $ip, $ua]);
    }
}

// --- FETCH DATA ---
$settings_raw = $conn->query("SELECT * FROM pasabaybcd_settings")->fetchAll();
$s = [];
foreach($settings_raw as $row) { $s[$row['setting_key']] = $row['setting_value']; }

$logs = $conn->query("SELECT l.*, u.full_name FROM pasabaybcd_audit_logs l LEFT JOIN pasabaybcd_users u ON l.admin_id = u.id ORDER BY l.created_at DESC LIMIT 50")->fetchAll();

// --- DATABASE EXPLORER LOGIC ---
$tables_raw = $conn->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
$db_tables = [];
foreach ($tables_raw as $tbl) {
    if (strpos($tbl, 'pasabay_') === 0 || strpos($tbl, 'pasabaybcd_') === 0) {
        $count = $conn->query("SELECT COUNT(*) FROM `$tbl`")->fetchColumn();
        $db_tables[$tbl] = $count;
    }
}

$active_table = $_GET['table'] ?? '';
if ($active_table && !in_array($active_table, array_keys($db_tables))) $active_table = '';

$table_rows    = [];
$table_columns = [];
$table_count   = 0;
$search_val    = $_GET['q'] ?? '';
$page          = max(1, intval($_GET['p'] ?? 1));
$per_page      = 20;
$offset        = ($page - 1) * $per_page;

if ($active_table) {
    if (isset($_GET['export'])) {
        header('Content-Type: text/csv');
        header('Content-Disposition: attachment; filename="' . $active_table . '_export.csv"');
        $all = $conn->query("SELECT * FROM `$active_table`")->fetchAll(PDO::FETCH_ASSOC);
        if (!empty($all)) {
            echo implode(',', array_keys($all[0])) . "\n";
            foreach ($all as $row) {
                echo implode(',', array_map(fn($v) => '"' . str_replace('"', '""', $v) . '"', $row)) . "\n";
            }
        }
        exit;
    }

    $col_stmt = $conn->query("SHOW COLUMNS FROM `$active_table`");
    $table_columns = $col_stmt->fetchAll(PDO::FETCH_ASSOC);

    if ($search_val !== '') {
        $first_col = $table_columns[0]['Field'] ?? 'id';
        $q = "%$search_val%";
        $count_stmt = $conn->prepare("SELECT COUNT(*) FROM `$active_table` WHERE `$first_col` LIKE ?");
        $count_stmt->execute([$q]);
        $table_count = $count_stmt->fetchColumn();
        $data_stmt = $conn->prepare("SELECT * FROM `$active_table` WHERE `$first_col` LIKE ? LIMIT $per_page OFFSET $offset");
        $data_stmt->execute([$q]);
    } else {
        $table_count = $conn->query("SELECT COUNT(*) FROM `$active_table`")->fetchColumn();
        $data_stmt = $conn->query("SELECT * FROM `$active_table` LIMIT $per_page OFFSET $offset");
    }
    $table_rows = $data_stmt->fetchAll(PDO::FETCH_ASSOC);
}

$sql_query    = '';
$sql_executed = false;
$sql_error    = '';
$sql_affected = 0;
$sql_rows     = [];
$sql_columns  = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['sql_query'])) {
    $sql_query    = trim($_POST['sql_query']);
    $sql_executed = true;
    try {
        $stmt = $conn->prepare($sql_query);
        $stmt->execute();
        if (preg_match('/^\s*(SELECT|SHOW|DESCRIBE|EXPLAIN)/i', $sql_query)) {
            $sql_rows    = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $sql_columns = !empty($sql_rows) ? array_keys($sql_rows[0]) : [];
        } else {
            $sql_affected = $stmt->rowCount();
            $message = "Query executed successfully. $sql_affected row(s) affected.";
        }
    } catch (PDOException $e) { $sql_error = $e->getMessage(); }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['delete_row']) && $active_table) {
    $pk_col = $_POST['pk_col'] ?? '';
    $pk_val = $_POST['pk_val'] ?? '';
    if ($pk_col && $pk_val !== '') {
        $stmt = $conn->prepare("DELETE FROM `$active_table` WHERE `$pk_col` = ?");
        if ($stmt->execute([$pk_val])) $message = "Row deleted successfully.";
        else $error = "Failed to delete row.";
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['edit_row']) && $active_table) {
    $pk_col = $_POST['pk_col'] ?? '';
    $pk_val = $_POST['pk_val'] ?? '';
    if ($pk_col && $pk_val !== '') {
        $update_fields = [];
        $update_params = [];
        foreach ($_POST['row_data'] as $col_name => $col_val) {
            $update_fields[] = "`$col_name` = ?";
            $update_params[] = $col_val;
        }
        $update_params[] = $pk_val;
        if (!empty($update_fields)) {
            $sql = "UPDATE `$active_table` SET " . implode(', ', $update_fields) . " WHERE `$pk_col` = ?";
            try {
                $stmt = $conn->prepare($sql);
                if ($stmt->execute($update_params)) $message = "Row updated successfully.";
                else $error = "Failed to update row.";
            } catch (Exception $e) { $error = "Error: " . $e->getMessage(); }
        }
    }
}

$total_pages = $active_table ? ceil($table_count / $per_page) : 1;

include 'layout/header.php';
include 'layout/sidebar.php';
?>

<div class="max-w-[1600px] mx-auto space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-2xl font-bold tracking-tight text-gray-900">System Configuration</h2>
      <p class="text-base text-gray-500 mt-1">Configure PasabayBCD Core Operations</p>
    </div>
    <div class="flex items-center gap-4 text-xs font-bold text-gray-400">
      <div class="flex items-center gap-1.5 px-3 py-1 bg-white rounded border border-gray-100 uppercase tracking-tighter">
        <span class="text-blue-600">PHP</span> <?php echo PHP_VERSION; ?>
      </div>
    </div>
  </div>

  <?php if ($message): ?>
    <div class="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 text-[14px] font-bold rounded shadow-sm flex items-center gap-3">
      <span class="material-symbols-outlined text-[20px]">check_circle</span> <?php echo h($message); ?>
    </div>
  <?php endif; ?>
  <?php if ($error): ?>
    <div class="p-3 bg-red-50 border border-red-100 text-red-600 text-[14px] font-bold rounded shadow-sm flex items-center gap-3">
      <span class="material-symbols-outlined text-[20px]">error</span> <?php echo h($error); ?>
    </div>
  <?php endif; ?>

  <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
    <!-- Compact Tab Navigation -->
    <div class="lg:col-span-3 space-y-2">
      <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden p-2">
        <button onclick="switchTab('general')" class="tab-btn active w-full flex items-center gap-3 px-4 py-3 rounded-lg font-bold text-sm transition-all text-left mb-1" id="btn-general">
          <span class="material-symbols-outlined text-[20px]">settings_suggest</span> General Config
        </button>
        <button onclick="switchTab('localization')" class="tab-btn w-full flex items-center gap-3 px-4 py-3 rounded-lg font-bold text-sm transition-all text-left mb-1" id="btn-localization">
          <span class="material-symbols-outlined text-[20px]">language</span> Localization & Identity
        </button>
        <button onclick="switchTab('operations')" class="tab-btn w-full flex items-center gap-3 px-4 py-3 rounded-lg font-bold text-sm transition-all text-left mb-1" id="btn-operations">
          <span class="material-symbols-outlined text-[20px]">local_shipping</span> Operation Rules
        </button>
        <button onclick="switchTab('billing')" class="tab-btn w-full flex items-center gap-3 px-4 py-3 rounded-lg font-bold text-sm transition-all text-left mb-1" id="btn-billing">
          <span class="material-symbols-outlined text-[20px]">payments</span> Billing & Rates
        </button>
        <button onclick="switchTab('integrations')" class="tab-btn w-full flex items-center gap-3 px-4 py-3 rounded-lg font-bold text-sm transition-all text-left mb-1" id="btn-integrations">
          <span class="material-symbols-outlined text-[20px]">api</span> External APIs
        </button>
        <button onclick="switchTab('security')" class="tab-btn w-full flex items-center gap-3 px-4 py-3 rounded-lg font-bold text-sm transition-all text-left mb-1" id="btn-security">
          <span class="material-symbols-outlined text-[20px]">admin_panel_settings</span> Administrator
        </button>
        <button onclick="switchTab('database')" class="tab-btn w-full flex items-center gap-3 px-4 py-3 rounded-lg font-bold text-sm transition-all text-left mb-1 <?php echo $active_table ? 'active' : ''; ?>" id="btn-database">
          <span class="material-symbols-outlined text-[20px]">database</span> Data Explorer
        </button>
        <button onclick="switchTab('logs')" class="tab-btn w-full flex items-center gap-3 px-4 py-3 rounded-lg font-bold text-sm transition-all text-left" id="btn-logs">
          <span class="material-symbols-outlined text-[20px]">history</span> Audit Trail
        </button>
      </div>
      
      <!-- System Summary Card (Mini) -->
      <div class="bg-blue-600 rounded-xl p-5 shadow-lg shadow-blue-900/10 text-white">
        <h4 class="text-[11px] font-black uppercase tracking-widest opacity-60">Status</h4>
        <p class="text-sm font-bold mt-1">All Systems Operational</p>
        <div class="mt-4 flex items-center gap-2">
          <div class="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
          <span class="text-[10px] uppercase font-black tracking-widest opacity-80">Synced with <?php echo DB_NAME; ?></span>
        </div>
      </div>
    </div>

    <!-- Tab Contents (Compact Cards) -->
    <div class="lg:col-span-9 space-y-6">
      
      <!-- General Tab -->
      <div id="tab-general" class="tab-content">
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div class="flex items-center gap-2 mb-5 border-b border-gray-50 pb-3">
            <span class="material-symbols-outlined text-blue-600 text-[20px]">info</span>
            <h4 class="text-[13px] font-black text-gray-900 uppercase tracking-widest">General Configuration</h4>
          </div>
          <form method="POST" action="settings.php" class="space-y-4">
            <input type="hidden" name="action" value="update_settings">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Application Name</label>
                <input type="text" name="settings[app_name]" value="<?php echo h($s['app_name']); ?>" class="mt-1 w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-bold">
              </div>
              <div>
                <label class="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Maintenance Mode</label>
                <select name="settings[maintenance_mode]" class="mt-1 w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold">
                  <option value="off" <?php echo $s['maintenance_mode'] == 'off' ? 'selected' : ''; ?>>Operational</option>
                  <option value="on" <?php echo $s['maintenance_mode'] == 'on' ? 'selected' : ''; ?>>Maintenance</option>
                </select>
              </div>
              <div>
                <label class="text-[11px] font-bold text-gray-500 uppercase tracking-widest">System Timezone</label>
                <input type="text" name="settings[system_timezone]" value="<?php echo h($s['system_timezone']); ?>" class="mt-1 w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-lg text-sm font-bold">
              </div>
              <div>
                <label class="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Administrator Email</label>
                <input type="email" name="settings[admin_email]" value="<?php echo h($s['admin_email']); ?>" class="mt-1 w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-lg text-sm font-bold">
              </div>
              <div>
                <label class="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Public Support Phone</label>
                <input type="text" name="settings[support_phone]" value="<?php echo h($s['support_phone']); ?>" class="mt-1 w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-lg text-sm font-bold">
              </div>
              <div>
                <label class="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Public Support Email</label>
                <input type="email" name="settings[support_email]" value="<?php echo h($s['support_email']); ?>" class="mt-1 w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-lg text-sm font-bold">
              </div>
            </div>
            <div class="pt-2">
              <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-all shadow-md active:scale-[0.98]">Save Core Changes</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Localization Tab -->
      <div id="tab-localization" class="tab-content hidden">
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div class="flex items-center gap-2 mb-5 border-b border-gray-50 pb-3">
            <span class="material-symbols-outlined text-emerald-600 text-[20px]">language</span>
            <h4 class="text-[13px] font-black text-gray-900 uppercase tracking-widest">Localization & Branding</h4>
          </div>
          <form method="POST" action="settings.php" class="space-y-4">
            <input type="hidden" name="action" value="update_settings">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Currency Code</label>
                <input type="text" name="settings[currency_code]" value="<?php echo h($s['currency_code']); ?>" class="mt-1 w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-lg text-sm font-bold">
              </div>
              <div>
                <label class="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Currency Symbol</label>
                <input type="text" name="settings[currency_symbol]" value="<?php echo h($s['currency_symbol']); ?>" class="mt-1 w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-lg text-sm font-bold">
              </div>
              <div>
                <label class="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Brand Primary (HEX)</label>
                <div class="flex items-center gap-2 mt-1">
                  <input type="color" name="settings[primary_color]" value="<?php echo h($s['primary_color']); ?>" class="w-10 h-10 rounded cursor-pointer border-none bg-transparent">
                  <input type="text" value="<?php echo h($s['primary_color']); ?>" class="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-lg font-mono text-xs font-bold" readonly>
                </div>
              </div>
              <div>
                <label class="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Brand Secondary (HEX)</label>
                <div class="flex items-center gap-2 mt-1">
                  <input type="color" name="settings[secondary_color]" value="<?php echo h($s['secondary_color']); ?>" class="w-10 h-10 rounded cursor-pointer border-none bg-transparent">
                  <input type="text" value="<?php echo h($s['secondary_color']); ?>" class="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-lg font-mono text-xs font-bold" readonly>
                </div>
              </div>
            </div>
            <div class="pt-2">
              <button type="submit" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg shadow-md active:scale-[0.98]">Update Brand Identity</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Operations Tab -->
      <div id="tab-operations" class="tab-content hidden">
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div class="flex items-center gap-2 mb-5 border-b border-gray-50 pb-3">
            <span class="material-symbols-outlined text-purple-600 text-[20px]">local_shipping</span>
            <h4 class="text-[13px] font-black text-gray-900 uppercase tracking-widest">Operations Management</h4>
          </div>
          <form method="POST" action="settings.php" class="space-y-4">
            <input type="hidden" name="action" value="update_settings">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Search Radius (KM)</label>
                <input type="number" step="0.1" name="settings[driver_search_radius]" value="<?php echo h($s['driver_search_radius']); ?>" class="mt-1 w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-lg font-bold text-sm">
              </div>
              <div>
                <label class="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Auto-Assign Drivers</label>
                <select name="settings[auto_assign_drivers]" class="mt-1 w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-lg text-sm font-bold">
                  <option value="on" <?php echo $s['auto_assign_drivers'] == 'on' ? 'selected' : ''; ?>>Enabled</option>
                  <option value="off" <?php echo $s['auto_assign_drivers'] == 'off' ? 'selected' : ''; ?>>Disabled</option>
                </select>
              </div>
              <div>
                <label class="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Max Bookings (User)</label>
                <input type="number" name="settings[max_active_bookings_per_user]" value="<?php echo h($s['max_active_bookings_per_user']); ?>" class="mt-1 w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-lg font-bold text-sm">
              </div>
              <div>
                <label class="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Max Bookings (Driver)</label>
                <input type="number" name="settings[max_active_bookings_per_driver]" value="<?php echo h($s['max_active_bookings_per_driver']); ?>" class="mt-1 w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-lg font-bold text-sm">
              </div>
              <div class="sm:col-span-2">
                <label class="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Photo Upload Policy</label>
                <select name="settings[require_photo_upload]" class="mt-1 w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-lg text-sm font-bold">
                  <option value="on" <?php echo $s['require_photo_upload'] == 'on' ? 'selected' : ''; ?>>Mandatory (Strict)</option>
                  <option value="off" <?php echo $s['require_photo_upload'] == 'off' ? 'selected' : ''; ?>>Optional</option>
                </select>
              </div>
            </div>
            <div class="pt-2">
              <button type="submit" class="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg shadow-md active:scale-[0.98]">Save Operation Rules</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Billing Tab -->
      <div id="tab-billing" class="tab-content hidden">
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div class="flex items-center gap-2 mb-5 border-b border-gray-50 pb-3">
            <span class="material-symbols-outlined text-orange-600 text-[20px]">payments</span>
            <h4 class="text-[13px] font-black text-gray-900 uppercase tracking-widest">Billing & Platform Rates</h4>
          </div>
          <form method="POST" action="settings.php" class="space-y-4">
            <input type="hidden" name="action" value="update_settings">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Base Fare (<?php echo h($s['currency_symbol']); ?>)</label>
                <input type="number" step="0.01" name="settings[base_fare]" value="<?php echo h($s['base_fare']); ?>" class="mt-1 w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-lg font-bold text-sm">
              </div>
              <div>
                <label class="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Per KM Rate</label>
                <input type="number" step="0.01" name="settings[per_km_rate]" value="<?php echo h($s['per_km_rate']); ?>" class="mt-1 w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-lg font-bold text-sm">
              </div>
              <div>
                <label class="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Platform Commission (%)</label>
                <input type="number" step="0.1" name="settings[platform_commission_rate]" value="<?php echo h($s['platform_commission_rate']); ?>" class="mt-1 w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-lg font-bold text-sm">
              </div>
              <div>
                <label class="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Surge Multiplier</label>
                <input type="number" step="0.1" name="settings[surge_multiplier]" value="<?php echo h($s['surge_multiplier']); ?>" class="mt-1 w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-lg font-bold text-sm">
              </div>
              <div>
                 <label class="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Min Wallet Withdrawal</label>
                 <input type="number" step="0.01" name="settings[min_wallet_withdrawal]" value="<?php echo h($s['min_wallet_withdrawal']); ?>" class="mt-1 w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-lg font-bold text-sm">
              </div>
              <div>
                 <label class="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Min Wallet Top-up</label>
                 <input type="number" step="0.01" name="settings[min_wallet_topup]" value="<?php echo h($s['min_wallet_topup']); ?>" class="mt-1 w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-lg font-bold text-sm">
              </div>
            </div>
            <div class="pt-2">
              <button type="submit" class="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-lg shadow-md active:scale-[0.98]">Update Pricing Engine</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Integrations Tab -->
      <div id="tab-integrations" class="tab-content hidden">
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div class="flex items-center gap-2 mb-5 border-b border-gray-50 pb-3">
            <span class="material-symbols-outlined text-blue-900 text-[20px]">api</span>
            <h4 class="text-[13px] font-black text-gray-900 uppercase tracking-widest">External Integrations & APIs</h4>
          </div>
          <form method="POST" action="settings.php" class="space-y-4">
            <input type="hidden" name="action" value="update_settings">
            <div class="space-y-4">
              <div>
                <label class="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Google Maps API Key</label>
                <input type="text" name="settings[google_maps_api_key]" value="<?php echo h($s['google_maps_api_key']); ?>" class="mt-1 w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-lg font-mono text-[11px] tracking-widest font-bold">
              </div>
              <div>
                <label class="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Firebase Server Key</label>
                <input type="password" name="settings[fcm_server_key]" value="<?php echo h($s['fcm_server_key']); ?>" class="mt-1 w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-lg font-mono text-[11px] font-bold">
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Stripe Public</label>
                  <input type="text" name="settings[stripe_public_key]" value="<?php echo h($s['stripe_public_key']); ?>" class="mt-1 w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-[10px] font-bold">
                </div>
                <div>
                  <label class="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Stripe Secret</label>
                  <input type="password" name="settings[stripe_secret_key]" value="<?php echo h($s['stripe_secret_key']); ?>" class="mt-1 w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-[10px] font-bold">
                </div>
              </div>
            </div>
            <div class="pt-2">
              <button type="submit" class="w-full bg-blue-900 hover:bg-black text-white font-bold py-3 rounded-lg shadow-md transition-all active:scale-[0.98]">Secure Infrastructure</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Security Tab -->
      <div id="tab-security" class="tab-content hidden">
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div class="flex items-center gap-2 mb-5 border-b border-gray-50 pb-3">
            <span class="material-symbols-outlined text-red-600 text-[20px]">admin_panel_settings</span>
            <h4 class="text-[13px] font-black text-gray-900 uppercase tracking-widest">Admin Security Context</h4>
          </div>
          <div class="mb-6 p-4 bg-gray-50/50 rounded-lg border border-gray-100 flex items-center justify-between">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-black shadow-lg">A</div>
                <div>
                  <p class="text-base font-black text-gray-900"><?php echo h($_SESSION['admin_name']); ?></p>
                  <p class="text-[10px] font-bold text-blue-600 uppercase tracking-widest">ID: <?php echo h($_SESSION['admin_user_id']); ?></p>
                </div>
              </div>
              <span class="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black tracking-widest border border-emerald-100">VERIFIED SESSION</span>
          </div>
          <form method="POST" action="settings.php" class="space-y-4">
            <input type="hidden" name="action" value="change_password">
            <div>
              <label class="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Current Password</label>
              <input type="password" name="current_pw" required class="mt-1 w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm">
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="text-[11px] font-bold text-gray-500 uppercase tracking-widest">New Password</label>
                <input type="password" name="new_pw" required class="mt-1 w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm">
              </div>
              <div>
                <label class="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Verify New Password</label>
                <input type="password" name="confirm_pw" required class="mt-1 w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm">
              </div>
            </div>
            <div class="pt-2">
              <button type="submit" class="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg shadow-md active:scale-[0.98]">Apply Update</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Database Explorer Tab -->
      <div id="tab-database" class="tab-content <?php echo $active_table ? '' : 'hidden'; ?>">
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
            <div>
               <h4 class="text-[13px] font-black text-gray-900 uppercase tracking-widest">Database Explorer</h3>
               <p class="text-[10px] text-gray-400 font-bold uppercase mt-0.5">Direct Database Manipulation</h3>
            </div>
            <div class="flex items-center gap-2">
               <span class="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[9px] font-black tracking-widest border border-emerald-100 uppercase">CONNECTED</span>
            </div>
          </div>
          
          <div class="p-6">
            <div class="flex gap-6 items-start">
              <!-- Table List -->
              <div class="w-56 shrink-0 space-y-2">
                <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Tables (<?php echo count($db_tables); ?>)</p>
                <div class="max-h-[500px] overflow-y-auto pr-2 space-y-1">
                  <?php foreach ($db_tables as $tbl => $cnt): ?>
                    <a href="settings.php?table=<?php echo urlencode($tbl); ?>" 
                       class="flex items-center justify-between px-3 py-2 rounded-lg text-[12px] font-bold transition-all <?php echo $active_table === $tbl ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'; ?>">
                      <span class="truncate"><?php echo h($tbl); ?></span>
                      <span class="text-[10px] opacity-60 ml-1"><?php echo $cnt; ?></span>
                    </a>
                  <?php endforeach; ?>
                </div>
              </div>

              <!-- Content Panel -->
              <div class="flex-1 min-w-0 space-y-6">
                <!-- SQL Console -->
                <div class="bg-gray-900 rounded-xl overflow-hidden shadow-xl">
                  <div class="px-4 py-2 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
                    <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest">SQL Terminal</span>
                    <div class="flex gap-2">
                       <button onclick="insertSQL('SELECT * FROM pasabaybcd_bookings LIMIT 10')" class="text-[9px] bg-gray-700 text-gray-300 px-2 py-1 rounded hover:bg-gray-600">Quick Bookings</button>
                    </div>
                  </div>
                  <form method="POST" action="settings.php<?php echo $active_table ? '?table='.urlencode($active_table) : ''; ?>">
                    <textarea name="sql_query" id="sql-input" rows="3" class="w-full bg-transparent p-4 text-emerald-400 font-mono text-xs focus:outline-none resize-none" placeholder="Enter SQL query..."><?php echo h($sql_query); ?></textarea>
                    <div class="px-4 py-2 bg-gray-800/50 border-t border-gray-700 flex justify-between items-center">
                      <p class="text-[9px] text-red-400 font-bold uppercase tracking-widest">Irreversible Operations</p>
                      <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black px-4 py-1.5 rounded shadow-lg transition-all active:scale-95">RUN QUERY</button>
                    </div>
                  </form>
                  <?php if ($sql_executed): ?>
                    <div class="p-4 border-t border-gray-700 max-h-48 overflow-auto">
                      <?php if ($sql_error): ?>
                        <p class="text-red-400 font-mono text-[11px]"><?php echo h($sql_error); ?></p>
                      <?php elseif (!empty($sql_rows)): ?>
                        <table class="w-full text-[10px] text-gray-300 font-mono">
                          <thead><tr class="text-gray-500 border-b border-gray-700"><?php foreach ($sql_columns as $col): ?><th class="text-left py-1"><?php echo h($col); ?></th><?php endforeach; ?></tr></thead>
                          <tbody><?php foreach ($sql_rows as $row): ?><tr class="border-b border-gray-800/50"><?php foreach ($row as $val): ?><td class="py-1 truncate max-w-[100px]"><?php echo h($val ?? 'NULL'); ?></td><?php endforeach; ?></tr><?php endforeach; ?></tbody>
                        </table>
                      <?php endif; ?>
                    </div>
                  <?php endif; ?>
                </div>

                <!-- Table Browser -->
                <?php if ($active_table): ?>
                  <div class="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                    <div class="px-4 py-3 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
                      <div class="flex items-center gap-2">
                         <span class="text-sm font-black text-gray-900"><?php echo h($active_table); ?></span>
                         <span class="px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded text-[9px] font-black"><?php echo $table_count; ?> ROWS</span>
                      </div>
                      <div class="flex items-center gap-2">
                        <form method="GET" action="settings.php" class="flex gap-2">
                          <input type="hidden" name="table" value="<?php echo h($active_table); ?>">
                          <input type="text" name="q" value="<?php echo h($search_val); ?>" placeholder="Search..." class="px-3 py-1 bg-white border border-gray-200 rounded text-[11px] w-32 focus:outline-none focus:ring-1 focus:ring-blue-500">
                        </form>
                        <a href="settings.php?table=<?php echo urlencode($active_table); ?>&export=1" class="text-[10px] font-black text-emerald-600 hover:text-emerald-700">EXPORT CSV</a>
                      </div>
                    </div>
                    <div class="overflow-x-auto min-h-[300px]">
                      <table class="w-full text-[11px]">
                        <thead><tr class="bg-gray-50/30 text-gray-400 font-black uppercase tracking-tight border-b border-gray-100"><?php foreach ($table_columns as $col): ?><th class="px-4 py-2 text-left"><?php echo h($col['Field']); ?></th><?php endforeach; ?><th class="px-4 py-2 text-right">#</th></tr></thead>
                        <tbody class="divide-y divide-gray-50">
                          <?php 
                            $pk_col = ''; foreach ($table_columns as $col) { if ($col['Key'] === 'PRI') { $pk_col = $col['Field']; break; } }
                            foreach ($table_rows as $row): 
                          ?>
                            <tr class="hover:bg-gray-50/50">
                              <?php foreach ($row as $v): ?><td class="px-4 py-2 truncate max-w-[120px] text-gray-600"><?php echo h($v ?? 'NULL'); ?></td><?php endforeach; ?>
                              <td class="px-4 py-2 text-right whitespace-nowrap">
                                <?php if ($pk_col): ?>
                                  <button onclick="openDbEditModal(<?php echo htmlspecialchars(json_encode($row), ENT_QUOTES); ?>, '<?php echo h($pk_col); ?>')" class="text-blue-600 hover:text-blue-800 font-bold mr-2">EDIT</button>
                                  <form method="POST" action="settings.php?table=<?php echo urlencode($active_table); ?>" class="inline" onsubmit="return confirm('Delete row?');">
                                    <input type="hidden" name="pk_col" value="<?php echo h($pk_col); ?>"><input type="hidden" name="pk_val" value="<?php echo h($row[$pk_col]); ?>"><input type="hidden" name="delete_row" value="1">
                                    <button type="submit" class="text-red-400 hover:text-red-600 font-bold">DEL</button>
                                  </form>
                                <?php endif; ?>
                              </td>
                            </tr>
                          <?php endforeach; ?>
                        </tbody>
                      </table>
                    </div>
                    <!-- Pagination -->
                    <?php if ($total_pages > 1): ?>
                      <div class="px-4 py-2 bg-gray-50/30 border-t border-gray-100 flex justify-center gap-1">
                        <?php for ($i=1; $i<=$total_pages; $i++): ?>
                          <a href="settings.php?table=<?php echo urlencode($active_table); ?>&p=<?php echo $i; ?>&q=<?php echo urlencode($search_val); ?>" 
                             class="px-2 py-0.5 rounded text-[10px] font-black <?php echo $i == $page ? 'bg-blue-600 text-white' : 'bg-white text-gray-400 border border-gray-100'; ?>"><?php echo $i; ?></a>
                        <?php endfor; ?>
                      </div>
                    <?php endif; ?>
                  </div>
                <?php else: ?>
                  <div class="h-64 flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-xl">
                    <span class="material-symbols-outlined text-4xl text-gray-200">database</span>
                    <p class="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-2">Select a table to begin explorer</p>
                  </div>
                <?php endif; ?>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Audit Trail Tab -->
      <div id="tab-logs" class="tab-content hidden">
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
            <div>
              <h4 class="text-[13px] font-black text-gray-900 uppercase tracking-widest">System Audit Trail</h4>
              <p class="text-[10px] text-gray-400 font-bold uppercase mt-0.5">Critical Action Monitoring & Security Logs</p>
            </div>
            <form method="POST" onsubmit="return confirm('CRITICAL: This will permanently delete all audit logs. Continue?');">
              <input type="hidden" name="action" value="clear_audit">
              <button type="submit" class="text-[10px] font-black text-red-500 hover:text-red-700 bg-red-50 px-3 py-1.5 rounded uppercase tracking-widest border border-red-100 transition-all">Clear All Logs</button>
            </form>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-[11px]">
              <thead>
                <tr class="bg-gray-50/30 text-gray-400 font-black uppercase tracking-tight border-b border-gray-100">
                  <th class="px-6 py-4 text-left">Administrator</th>
                  <th class="px-6 py-4 text-left">Action</th>
                  <th class="px-6 py-4 text-left">Details</th>
                  <th class="px-6 py-4 text-left">Device Context</th>
                  <th class="px-6 py-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-50">
                <?php if (empty($logs)): ?>
                  <tr>
                    <td colspan="5" class="px-6 py-12 text-center">
                      <span class="material-symbols-outlined text-4xl text-gray-200">history_toggle_off</span>
                      <p class="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-2">No activity logs recorded yet</p>
                    </td>
                  </tr>
                <?php else: ?>
                  <?php foreach ($logs as $log): ?>
                    <tr class="hover:bg-gray-50/50 transition-colors">
                      <td class="px-6 py-4">
                        <div class="flex items-center gap-3">
                          <div class="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-black text-[10px]">
                            <?php echo substr($log['full_name'] ?? 'A', 0, 1); ?>
                          </div>
                          <div>
                            <p class="font-bold text-gray-900"><?php echo h($log['full_name'] ?? 'System'); ?></p>
                            <p class="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">ID: <?php echo h($log['admin_id'] ?? '-'); ?></p>
                          </div>
                        </div>
                      </td>
                      <td class="px-6 py-4">
                        <?php 
                          $badgeClass = "bg-gray-100 text-gray-600 border-gray-200";
                          if (strpos($log['action'], 'AUTH') !== false) $badgeClass = "bg-emerald-50 text-emerald-600 border-emerald-100";
                          if (strpos($log['action'], 'SETTINGS') !== false) $badgeClass = "bg-blue-50 text-blue-600 border-blue-100";
                          if (strpos($log['action'], 'PW_') !== false) $badgeClass = "bg-orange-50 text-orange-600 border-orange-100";
                          if (strpos($log['action'], 'CLEAR') !== false) $badgeClass = "bg-red-50 text-red-600 border-red-100";
                        ?>
                        <span class="px-2 py-0.5 rounded text-[9px] font-black tracking-widest border <?php echo $badgeClass; ?> uppercase">
                          <?php echo h($log['action']); ?>
                        </span>
                      </td>
                      <td class="px-6 py-4">
                        <p class="text-gray-600 font-medium max-w-[250px] truncate" title="<?php echo h($log['details']); ?>">
                          <?php echo h($log['details']); ?>
                        </p>
                      </td>
                      <td class="px-6 py-4">
                        <div class="space-y-0.5">
                          <div class="flex items-center gap-1.5 text-gray-500">
                            <span class="material-symbols-outlined text-[14px]">public</span>
                            <span class="font-bold"><?php echo h($log['ip_address'] ?? '0.0.0.0'); ?></span>
                          </div>
                          <p class="text-[9px] text-gray-400 truncate max-w-[150px] italic" title="<?php echo h($log['user_agent']); ?>">
                            <?php echo h($log['user_agent'] ?? 'Unknown Device'); ?>
                          </p>
                        </div>
                      </td>
                      <td class="px-6 py-4 text-right">
                        <p class="text-gray-900 font-bold"><?php echo date('M j, Y', strtotime($log['created_at'])); ?></p>
                        <p class="text-[10px] text-gray-400 font-bold uppercase tracking-tight"><?php echo date('h:i:s A', strtotime($log['created_at'])); ?></p>
                      </td>
                    </tr>
                  <?php endforeach; ?>
                <?php endif; ?>
              </tbody>
            </table>
          </div>
          <?php if (count($logs) >= 50): ?>
            <div class="px-6 py-3 bg-gray-50/50 border-t border-gray-100 text-center">
              <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Showing last 50 entries. Full history available in database.</p>
            </div>
          <?php endif; ?>
        </div>
      </div>

    </div>

  </div>
</div>

<style>
  /* Premium Compact Tab Buttons */
  .tab-btn {
    color: #64748b;
    background: transparent;
    border: 1px solid transparent;
  }
  .tab-btn:hover {
    background: #f8fafc;
    color: #0f172a;
  }
  .tab-btn.active {
    background: #ffffff;
    color: #004ac6;
    border-color: #f1f5f9;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
  }
  .tab-btn.active span {
    color: #004ac6;
  }

  /* Compact Forms Standard focus */
  input:focus, select:focus, textarea:focus { 
    background-color: #fff;
    box-shadow: 0 0 0 4px rgba(0, 74, 198, 0.08);
  }
</style>

<script>
function switchTab(tabId) {
  // Hide all contents
  document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
  // Remove active class from buttons
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  
  // Show target content
  document.getElementById('tab-' + tabId).classList.remove('hidden');
  // Add active class to target button
  document.getElementById('btn-' + tabId).classList.add('active');
}

function insertSQL(q) {
  const input = document.getElementById('sql-input');
  if (input) {
    input.value = q;
    input.focus();
  }
}

function openDbEditModal(row, pkCol) {
  document.getElementById('db-edit-pk-col').value = pkCol;
  document.getElementById('db-edit-pk-val').value = row[pkCol];
  
  const fieldsContainer = document.getElementById('db-edit-fields');
  if (!fieldsContainer) return;
  fieldsContainer.innerHTML = '';
  
  for (const [key, val] of Object.entries(row)) {
    const isPk = (key === pkCol);
    const div = document.createElement('div');
    
    const label = document.createElement('label');
    label.className = `text-[10px] font-black uppercase tracking-widest ${isPk ? 'text-blue-600' : 'text-gray-400'}`;
    label.textContent = key + (isPk ? ' (Primary Key)' : '');
    div.appendChild(label);
    
    if (isPk) {
       const inputHidden = document.createElement('input');
       inputHidden.type = 'hidden';
       inputHidden.name = `row_data[${key}]`;
       inputHidden.value = val !== null ? val : '';
       
       const inputShow = document.createElement('input');
       inputShow.type = 'text';
       inputShow.value = val !== null ? val : '';
       inputShow.disabled = true;
       inputShow.className = "mt-1 w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded text-gray-400 font-bold text-xs cursor-not-allowed";
       
       div.appendChild(inputHidden);
       div.appendChild(inputShow);
    } else {
       const input = document.createElement(val !== null && val.length > 200 ? 'textarea' : 'input');
       if (input.tagName === 'INPUT') input.type = 'text';
       if (input.tagName === 'TEXTAREA') input.rows = 3;
       input.name = `row_data[${key}]`;
       input.value = val !== null ? val : '';
       input.className = "mt-1 w-full px-4 py-2 bg-white border border-gray-200 rounded text-gray-900 font-bold text-xs focus:ring-1 focus:ring-blue-500 outline-none";
       div.appendChild(input);
    }
    
    fieldsContainer.appendChild(div);
  }
  
  document.getElementById('dbEditModal').classList.remove('hidden');
}
</script>

<!-- Database Edit Modal -->
<div id="dbEditModal" class="hidden fixed inset-0 z-[100] overflow-y-auto" role="dialog" aria-modal="true">
  <div class="flex items-center justify-center min-h-screen px-4 py-12">
    <div onclick="document.getElementById('dbEditModal').classList.add('hidden')" class="fixed inset-0 bg-black bg-opacity-60 transition-opacity backdrop-blur-sm"></div>
    <div class="relative bg-white rounded-xl shadow-2xl max-w-xl w-full z-10 flex flex-col max-h-[85vh] overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
        <h3 class="text-sm font-black text-gray-900 uppercase tracking-widest">Edit Record</h3>
        <button onclick="document.getElementById('dbEditModal').classList.add('hidden')" class="text-gray-400 hover:text-gray-900"><span class="material-symbols-outlined">close</span></button>
      </div>
      <form method="POST" action="settings.php?table=<?php echo urlencode($active_table); ?>" class="flex flex-col overflow-hidden">
        <input type="hidden" name="edit_row" value="1">
        <input type="hidden" name="pk_col" id="db-edit-pk-col">
        <input type="hidden" name="pk_val" id="db-edit-pk-val">
        <div class="px-6 py-6 space-y-4 overflow-y_auto" id="db-edit-fields"></div>
        <div class="px-6 py-4 bg-gray-50 flex justify-end gap-2 border-t border-gray-100">
          <button type="button" onclick="document.getElementById('dbEditModal').classList.add('hidden')" class="px-4 py-2 text-[11px] font-black text-gray-400 uppercase">Cancel</button>
          <button type="submit" class="px-6 py-2 bg-blue-600 text-white text-[11px] font-black rounded-lg shadow-lg uppercase transition-all active:scale-95">Save Changes</button>
        </div>
      </form>
    </div>
  </div>
</div>


<?php include 'layout/footer.php'; ?>

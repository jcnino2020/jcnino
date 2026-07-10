<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
// ============================================================
// PasabayBCD - Full User Management
// ============================================================

require_once 'config.php';
require_once 'auth_check.php';

$conn = get_db_connection();
if (!$conn) die("Database connection failed.");

$message = '';
$error   = '';

// --- SCHEMA AUTO-UPDATE (Ensures new columns exist on remote server without crashing) ---
try { $conn->exec("ALTER TABLE pasabaybcd_users ADD COLUMN is_banned TINYINT(1) NOT NULL DEFAULT 0"); } catch (Exception $e) {}
try { $conn->exec("ALTER TABLE pasabaybcd_users ADD COLUMN phone_number VARCHAR(20) DEFAULT NULL"); } catch (Exception $e) {}

// ---- Actions ----
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';

    // Toggle Ban
    if ($action === 'toggle_ban') {
        $id  = $_POST['id'] ?? '';
        $ban = $_POST['ban'] ?? 0;
        if ($id) {
            $stmt = $conn->prepare("UPDATE pasabaybcd_users SET is_banned = ? WHERE id = ?");
            if ($stmt->execute([$ban, $id])) {
                $message = "User #$id " . ($ban ? "banned" : "unbanned") . " successfully.";
            } else {
                $error = "Failed to update ban status.";
            }
        }
    }

    // Delete User
    if ($action === 'delete') {
        $id = $_POST['id'] ?? '';
        if ($id) {
            $stmt = $conn->prepare("DELETE FROM pasabaybcd_users WHERE id = ?");
            if ($stmt->execute([$id])) {
                $message = "User #$id deleted permanently.";
            } else {
                $error = "Failed to delete user.";
            }
        }
    }

    // Update User Info
    if ($action === 'edit_user') {
        $id         = $_POST['id'] ?? '';
        $full_name  = trim($_POST['full_name'] ?? '');
        $email      = trim($_POST['email'] ?? '');
        $phone      = trim($_POST['phone'] ?? '');
        if ($id && $full_name && $email) {
            $stmt = $conn->prepare("UPDATE pasabaybcd_users SET full_name = ?, email = ?, phone_number = ? WHERE id = ?");
            if ($stmt->execute([$full_name, $email, $phone, $id])) {
                $message = "User #$id updated successfully.";
            } else {
                $error = "Failed to update user.";
            }
        } else {
            $error = "Name and email are required.";
        }
    }

    // Reset Password
    if ($action === 'reset_password') {
        $id       = $_POST['id'] ?? '';
        $new_pass = $_POST['new_pass'] ?? '';
        if ($id && strlen($new_pass) >= 6) {
            $hash = password_hash($new_pass, PASSWORD_DEFAULT);
            $stmt = $conn->prepare("UPDATE pasabaybcd_users SET password_hash = ? WHERE id = ?");
            if ($stmt->execute([$hash, $id])) {
                $message = "Password reset for user #$id.";
            } else {
                $error = "Failed to reset password.";
            }
        } else {
            $error = "Password must be at least 6 characters.";
        }
    }
}

// ---- Filters ----
$search   = $_GET['s']      ?? '';
$role_f   = $_GET['role']   ?? '';
$verify_f = $_GET['verify'] ?? '';

$where = [];
$params = [];

if ($search) {
    $where[] = "(full_name LIKE ? OR email LIKE ? OR phone_number LIKE ?)";
    $q = "%$search%";
    $params = array_merge($params, [$q, $q, $q]);
}
if ($verify_f !== '') {
    $where[] = "is_kyc_verified = ?";
    $params[] = (int)$verify_f;
}

$where_str = $where ? 'WHERE ' . implode(' AND ', $where) : '';

$users = $conn->prepare("SELECT * FROM pasabaybcd_users $where_str ORDER BY created_at DESC");
$users->execute($params);
$users = $users->fetchAll();

// Stats
$total       = $conn->query("SELECT COUNT(*) FROM pasabaybcd_users")->fetchColumn();
$verified    = $conn->query("SELECT COUNT(*) FROM pasabaybcd_users WHERE is_kyc_verified = 1")->fetchColumn();
$unverified  = $total - $verified;
$banned      = 0;
try { $banned = $conn->query("SELECT COUNT(*) FROM pasabaybcd_users WHERE is_banned = 1")->fetchColumn(); } catch(Exception $e) {}
$new_today   = $conn->query("SELECT COUNT(*) FROM pasabaybcd_users WHERE DATE(created_at) = CURDATE()")->fetchColumn();

include 'layout/header.php';
include 'layout/sidebar.php';
?>

<div class="max-w-[1600px] mx-auto space-y-8">

  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-2xl font-bold tracking-tight text-gray-900">User Management</h2>
      <p class="text-base text-gray-500 mt-1">Full control over pasabaybcd_users table</p>
    </div>
  </div>

  <!-- Stats Row -->
  <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
    <div class="bg-white rounded border border-gray-100 shadow-sm p-4">
      <p class="text-[11px] font-black text-gray-400 uppercase tracking-widest">Total Users</p>
      <p class="text-2xl font-black text-gray-900 mt-1"><?php echo $total; ?></p>
    </div>
    <div class="bg-white rounded border border-gray-100 shadow-sm p-4">
      <p class="text-[11px] font-black text-emerald-500 uppercase tracking-widest">Verified</p>
      <p class="text-2xl font-black text-emerald-600 mt-1"><?php echo $verified; ?></p>
    </div>
    <div class="bg-white rounded border border-gray-100 shadow-sm p-4">
      <p class="text-[11px] font-black text-amber-500 uppercase tracking-widest">Unverified</p>
      <p class="text-2xl font-black text-amber-600 mt-1"><?php echo $unverified; ?></p>
    </div>
    <div class="bg-white rounded border border-gray-100 shadow-sm p-4">
      <p class="text-[11px] font-black text-blue-500 uppercase tracking-widest">New Today</p>
      <p class="text-2xl font-black text-blue-600 mt-1"><?php echo $new_today; ?></p>
    </div>
  </div>

  <?php if ($message): ?>
    <div class="p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm font-bold rounded shadow-sm flex items-center gap-3">
      <span class="material-symbols-outlined">check_circle</span> <?php echo h($message); ?>
    </div>
  <?php endif; ?>
  <?php if ($error): ?>
    <div class="p-4 bg-red-50 border border-red-100 text-red-600 text-sm font-bold rounded shadow-sm flex items-center gap-3">
      <span class="material-symbols-outlined">error</span> <?php echo h($error); ?>
    </div>
  <?php endif; ?>

  <!-- Filters -->
  <div class="bg-white rounded border border-gray-100 shadow-sm p-4">
    <form method="GET" action="users.php" class="flex flex-wrap items-center gap-3">
      <input type="text" name="s" value="<?php echo h($search); ?>" placeholder="Search name / email / phone..."
        class="px-5 py-3 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-72 font-bold">
      <div class="relative min-w-[160px]">
        <select name="verify" class="appearance-none w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold pr-10">
          <option value="">All Status</option>
          <option value="1" <?php echo $verify_f === '1' ? 'selected' : ''; ?>>Verified</option>
          <option value="0" <?php echo $verify_f === '0' ? 'selected' : ''; ?>>Unverified</option>
        </select>
        <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">expand_more</span>
      </div>
      <button type="submit" class="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded hover:bg-blue-700">Filter</button>
      <a href="users.php" class="px-4 py-2 bg-gray-50 text-gray-600 text-sm font-bold rounded border border-gray-100 hover:bg-gray-100">Reset</a>
      <div class="ml-auto text-[12px] font-bold text-gray-400"><?php echo count($users); ?> user(s) found</div>
    </form>
  </div>

  <!-- Users Table -->
  <div class="bg-white rounded border border-gray-100 shadow-sm overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Verified</th>
            <th>Joined</th>
            <th class="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <?php if (empty($users)): ?>
            <tr><td colspan="7" class="text-center py-12 text-gray-400">No users found.</td></tr>
          <?php else: foreach ($users as $u): ?>
            <?php $is_banned = !empty($u['is_banned']); ?>
            <tr class="<?php echo $is_banned ? 'opacity-50' : ''; ?>">
              <td class="text-[13px] font-black text-blue-600">#<?php echo h($u['id']); ?></td>
              <td>
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-black text-sm flex-shrink-0">
                    <?php echo strtoupper(substr($u['full_name'], 0, 1)); ?>
                  </div>
                  <div>
                    <p class="font-bold text-gray-900 text-sm"><?php echo h($u['full_name']); ?></p>
                    <?php if ($is_banned): ?><span class="text-[10px] font-black text-red-500 uppercase">Banned</span><?php endif; ?>
                  </div>
                </div>
              </td>
              <td class="text-sm text-gray-500"><?php echo h($u['email']); ?></td>
              <td class="text-sm text-gray-500"><?php echo h($u['phone_number'] ?? '—'); ?></td>
              <td>
                <span class="badge <?php echo $u['is_kyc_verified'] ? 'badge-verified' : 'badge-pending'; ?>">
                  <?php echo $u['is_kyc_verified'] ? 'Verified' : 'Pending'; ?>
                </span>
              </td>
              <td class="text-xs text-gray-400 font-bold"><?php echo date('M d, Y', strtotime($u['created_at'])); ?></td>
              <td class="text-right">
                <div class="flex items-center justify-end gap-1.5">
                  <!-- Edit Button -->
                  <button onclick="openEditModal(<?php echo htmlspecialchars(json_encode($u), ENT_QUOTES); ?>)"
                    class="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors border border-blue-100 text-[12px] font-bold flex items-center gap-1">
                    <span class="material-symbols-outlined text-sm">edit</span>
                  </button>
                  <!-- Reset PW Button -->
                  <button onclick="openResetModal('<?php echo h($u['id']); ?>', '<?php echo h($u['full_name']); ?>')"
                    class="p-1.5 bg-amber-50 text-amber-600 rounded hover:bg-amber-100 transition-colors border border-amber-100 flex items-center gap-1">
                    <span class="material-symbols-outlined text-sm">lock_reset</span>
                  </button>
                  <!-- Ban/Unban -->
                  <form method="POST" action="users.php" class="inline">
                    <input type="hidden" name="action" value="toggle_ban">
                    <input type="hidden" name="id" value="<?php echo h($u['id']); ?>">
                    <input type="hidden" name="ban" value="<?php echo $is_banned ? 0 : 1; ?>">
                    <button type="submit" class="p-1.5 <?php echo $is_banned ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-orange-50 text-orange-600 border-orange-100'; ?> rounded hover:opacity-80 transition-colors border flex items-center gap-1">
                      <span class="material-symbols-outlined text-sm"><?php echo $is_banned ? 'check_circle' : 'block'; ?></span>
                    </button>
                  </form>
                  <!-- Delete -->
                  <form method="POST" action="users.php" class="inline" onsubmit="return confirm('Permanently delete user <?php echo h(addslashes($u['full_name'])); ?>?');">
                    <input type="hidden" name="action" value="delete">
                    <input type="hidden" name="id" value="<?php echo h($u['id']); ?>">
                    <button type="submit" class="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors border border-red-100 flex items-center gap-1">
                      <span class="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </form>
                </div>
              </td>
            </tr>
          <?php endforeach; endif; ?>
        </tbody>
      </table>
    </div>
  </div>
</div>

<!-- Edit User Modal -->
<div id="editModal" class="hidden fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
  <div class="flex items-center justify-center min-h-screen px-4">
    <div onclick="document.getElementById('editModal').classList.add('hidden')" class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
    <div class="relative bg-white rounded-xl shadow-2xl max-w-md w-full z-10">
      <div class="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
        <h3 class="text-lg font-bold text-gray-900">Edit User</h3>
        <button onclick="document.getElementById('editModal').classList.add('hidden')" class="text-gray-400 hover:text-gray-600">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
      <form method="POST" action="users.php">
        <input type="hidden" name="action" value="edit_user">
        <input type="hidden" name="id" id="edit-id">
        <div class="px-6 py-6 space-y-4">
          <div>
            <label class="text-[12px] font-black text-gray-500 uppercase tracking-widest">Full Name</label>
            <input type="text" name="full_name" id="edit-name" required class="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold">
          </div>
          <div>
            <label class="text-[12px] font-black text-gray-500 uppercase tracking-widest">Email Address</label>
            <input type="email" name="email" id="edit-email" required class="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold">
          </div>
          <div>
            <label class="text-[12px] font-black text-gray-500 uppercase tracking-widest">Phone Number</label>
            <input type="text" name="phone" id="edit-phone" class="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold">
          </div>
        </div>
        <div class="px-6 py-4 bg-gray-50 rounded-b-xl flex justify-end gap-3">
          <button type="button" onclick="document.getElementById('editModal').classList.add('hidden')"
            class="px-5 py-2.5 bg-white border border-gray-200 text-gray-600 font-bold text-sm rounded-lg hover:bg-gray-100">Cancel</button>
          <button type="submit" class="px-8 py-4 bg-blue-600 text-white font-black text-sm rounded-lg hover:bg-blue-700 shadow-lg">Save Changes</button>
        </div>
      </form>
    </div>
  </div>
</div>

<!-- Reset Password Modal -->
<div id="resetModal" class="hidden fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
  <div class="flex items-center justify-center min-h-screen px-4">
    <div onclick="document.getElementById('resetModal').classList.add('hidden')" class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
    <div class="relative bg-white rounded-xl shadow-2xl max-w-sm w-full z-10">
      <div class="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
        <h3 class="text-lg font-bold text-gray-900">Reset Password</h3>
        <button onclick="document.getElementById('resetModal').classList.add('hidden')" class="text-gray-400 hover:text-gray-600">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
      <form method="POST" action="users.php">
        <input type="hidden" name="action" value="reset_password">
        <input type="hidden" name="id" id="reset-id">
        <div class="px-6 py-6 space-y-4">
          <p class="text-sm text-gray-500">Setting new password for: <span id="reset-name" class="font-bold text-gray-900"></span></p>
          <div>
            <label class="text-[12px] font-black text-gray-500 uppercase tracking-widest">New Password</label>
            <input type="password" name="new_pass" required minlength="6" placeholder="Min. 6 characters"
              class="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none font-bold">
          </div>
        </div>
        <div class="px-6 py-4 bg-gray-50 rounded-b-xl flex justify-end gap-3">
          <button type="button" onclick="document.getElementById('resetModal').classList.add('hidden')"
            class="px-5 py-2.5 bg-white border border-gray-200 text-gray-600 font-bold text-sm rounded-lg hover:bg-gray-100">Cancel</button>
          <button type="submit" class="px-8 py-4 bg-amber-500 text-white font-black text-sm rounded-lg hover:bg-amber-600 shadow-lg">Reset Password</button>
        </div>
      </form>
    </div>
  </div>
</div>

<script>
function openEditModal(user) {
  document.getElementById('edit-id').value    = user.id;
  document.getElementById('edit-name').value  = user.full_name;
  document.getElementById('edit-email').value = user.email;
  document.getElementById('edit-phone').value = user.phone_number || '';
  document.getElementById('editModal').classList.remove('hidden');
}

function openResetModal(id, name) {
  document.getElementById('reset-id').value  = id;
  document.getElementById('reset-name').textContent = name;
  document.getElementById('resetModal').classList.remove('hidden');
}
</script>

<?php include 'layout/footer.php'; ?>

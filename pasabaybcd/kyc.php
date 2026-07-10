<?php
// ============================================================
// PasabayBCD - User KYC Verification
// ============================================================

require_once 'config.php';
require_once 'auth_check.php';

$conn = get_db_connection();
if (!$conn) die("Database connection failed.");

$message = '';
$error = '';

// Handle KYC Update
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'update_kyc') {
    $userId = $_POST['id'] ?? '';
    $status = $_POST['status'] ?? 0;
    if ($userId != '') {
        $stmt = $conn->prepare("UPDATE pasabaybcd_users SET is_kyc_verified = ? WHERE id = ?");
        if ($stmt->execute([$status, $userId])) {
            $message = "User $userId KYC status updated to " . ($status == 1 ? "Verified" : "Unverified") . ".";
        } else {
            $error = "Failed to update KYC status.";
        }
    }
}

// Fetch All Users
$users = $conn->query("SELECT * FROM pasabaybcd_users ORDER BY created_at DESC")->fetchAll();

include 'layout/header.php';
include 'layout/sidebar.php';
?>

<div class="max-w-[1600px] mx-auto space-y-8">
  <div>
    <h2 class="text-2xl font-bold tracking-tight text-gray-900">User KYC Verification</h2>
    <p class="text-base text-gray-500 mt-1">Manage user verification status from pasabaybcd_users</p>
  </div>

  <?php if ($message): ?>
    <div class="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 text-base font-bold rounded">
      <?php echo h($message); ?>
    </div>
  <?php endif; ?>

  <div class="bg-white rounded overflow-hidden shadow-sm border border-gray-100">
    <div class="overflow-x-auto">
      <table class="w-full data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Verification Status</th>
            <th class="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <?php foreach ($users as $u): ?>
          <tr>
            <td class="text-[13px] font-bold"><?php echo h($u['id']); ?></td>
            <td class="font-bold text-gray-900"><?php echo h($u['full_name']); ?></td>
            <td class="text-base text-gray-500"><?php echo h($u['email']); ?></td>
            <td>
              <span class="badge <?php echo ($u['is_kyc_verified'] == 1) ? 'badge-verified' : 'badge-pending'; ?>">
                <?php echo ($u['is_kyc_verified'] == 1) ? 'Verified' : 'Pending'; ?>
              </span>
            </td>
            <td class="text-right">
              <form method="POST" action="kyc.php">
                <input type="hidden" name="id" value="<?php echo h($u['id']); ?>">
                <input type="hidden" name="action" value="update_kyc">
                <?php if ($u['is_kyc_verified'] == 0): ?>
                  <input type="hidden" name="status" value="1">
                  <button type="submit" class="px-3 py-1.5 bg-blue-600 text-white text-[12px] font-bold rounded hover:bg-blue-700 transition-colors">
                    APPROVE KYC
                  </button>
                <?php else: ?>
                  <input type="hidden" name="status" value="0">
                  <button type="submit" class="px-3 py-1.5 bg-red-50 text-red-600 text-[12px] font-bold rounded border border-red-100 hover:bg-red-100 transition-colors">
                    REVOKE KYC
                  </button>
                <?php endif; ?>
              </form>
            </td>
          </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </div>
  </div>
</div>

<?php include 'layout/footer.php'; ?>

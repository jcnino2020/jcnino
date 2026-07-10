<?php
// ============================================================
// PasabayBCD - Admin Notifications Manager
// ============================================================

require_once 'config.php';
require_once 'auth_check.php';

$conn = get_db_connection();

if (!$conn) {
    die("Database connection failed.");
}

// Handle Form Submission (Push Notification)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'push') {
    $title = trim($_POST['title']);
    $body = trim($_POST['body']);
    $type = trim($_POST['type']) ?: 'system';
    $user_id = ($_POST['target_type'] === 'specific') ? (int)$_POST['user_id'] : 0;
    
    $stmt = $conn->prepare("INSERT INTO pasabaybcd_notifications (user_id, type, title, body) VALUES (:user_id, :type, :title, :body)");
    $stmt->bindValue(':user_id', $user_id);
    $stmt->bindValue(':type', $type);
    $stmt->bindValue(':title', $title);
    $stmt->bindValue(':body', $body);
    
    if ($stmt->execute()) {
        $success_msg = "Broadcast notification sent successfully!";
        
        // --- NEW: Trigger Push Notification ---
        require_once '../api/send_automated_notification.php';
        
        if ($_POST['target_type'] === 'all') {
            // Send to topic /topics/all_users
            send_fcm_notification('/topics/all_users', $title, $body, ['type' => $type]);
        } else {
            // Fetch user token from pasabaybcd_users
            $user_stmt = $conn->prepare("SELECT fcm_token FROM pasabaybcd_users WHERE id = ?");
            $user_stmt->execute([$user_id]);
            $user = $user_stmt->fetch();
            
            if ($user && !empty($user['fcm_token'])) {
                send_fcm_notification($user['fcm_token'], $title, $body, [
                    'type' => $type,
                    'user_id' => (string)$user_id
                ]);
            }
        }
    } else {
        $error_msg = "Failed to send notification.";
    }
}

// Handle Delete Notification
if (isset($_GET['delete'])) {
    $id = (int)$_GET['delete'];
    $conn->query("DELETE FROM pasabaybcd_notifications WHERE id = $id");
    header("Location: notifications.php");
    exit;
}

// Fetch Notifications
$stmt = $conn->query("SELECT * FROM pasabaybcd_notifications ORDER BY created_at DESC LIMIT 50");
$notifications = $stmt->fetchAll();

include 'layout/header.php';
include 'layout/sidebar.php';
?>

<div class="max-w-[1600px] mx-auto space-y-8">
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-2xl font-bold tracking-tight text-gray-900">Push Notifications</h2>
      <p class="text-base text-gray-500 mt-1">Manage and broadcast system alerts to your users.</p>
    </div>
    <button onclick="document.getElementById('new-notification-modal').classList.remove('hidden')" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-bold text-[13px] uppercase tracking-wider flex items-center gap-2 transition-colors">
      <span class="material-symbols-outlined text-[18px]">campaign</span>
      New Broadcast
    </button>
  </div>

  <?php if (isset($success_msg)): ?>
    <div class="bg-emerald-50 text-emerald-700 border-l-4 border-emerald-500 p-4 rounded mb-6 flex items-center gap-3">
      <span class="material-symbols-outlined">check_circle</span>
      <p class="font-bold"><?php echo h($success_msg); ?></p>
    </div>
  <?php endif; ?>

  <!-- Notifications List -->
  <div class="bg-white rounded border border-gray-100 shadow-sm overflow-hidden">
    <table class="w-full data-table">
      <thead>
        <tr>
          <th class="w-16">ID</th>
          <th>Type</th>
          <th>Title</th>
          <th>Message Body</th>
          <th>Target User</th>
          <th>Sent At</th>
          <th class="text-right">Actions</th>
        </tr>
      </thead>
      <tbody>
        <?php if (empty($notifications)): ?>
          <tr><td colspan="7" class="text-center py-8 text-gray-400">No notifications found in the database.</td></tr>
        <?php else: ?>
          <?php foreach ($notifications as $n): ?>
            <tr>
              <td class="font-bold text-gray-400">#<?php echo $n['id']; ?></td>
              <td>
                <span class="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[11px] font-bold uppercase"><?php echo h($n['type']); ?></span>
              </td>
              <td class="font-bold text-gray-900"><?php echo h($n['title']); ?></td>
              <td class="text-gray-500 truncate max-w-xs" title="<?php echo h($n['body']); ?>"><?php echo h($n['body']); ?></td>
              <td><?php echo $n['user_id'] == 0 ? '<span class="text-blue-600 font-bold text-[12px]">BROADCAST EVERYONE</span>' : 'User ID ' . $n['user_id']; ?></td>
              <td class="text-gray-500 text-[13px]"><?php echo date('M d, Y h:i A', strtotime($n['created_at'])); ?></td>
              <td class="text-right">
                <a href="notifications.php?delete=<?php echo $n['id']; ?>" onclick="return confirm('Are you sure you want to delete this notification record?');" class="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded inline-block transition-colors" title="Delete">
                  <span class="material-symbols-outlined text-[18px]">delete</span>
                </a>
              </td>
            </tr>
          <?php endforeach; ?>
        <?php endif; ?>
      </tbody>
    </table>
  </div>
</div>

<!-- New Notification Modal -->
<div id="new-notification-modal" class="hidden fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
  <div class="bg-white rounded-lg shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 animate-fade-in-up">
    <div class="px-6 py-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
      <h3 class="text-lg font-bold text-gray-900 flex items-center gap-2">
        <span class="material-symbols-outlined text-blue-600">campaign</span>
        Broadcast Notification
      </h3>
      <button type="button" onclick="document.getElementById('new-notification-modal').classList.add('hidden')" class="text-gray-400 hover:text-gray-600">
        <span class="material-symbols-outlined">close</span>
      </button>
    </div>
    
    <form method="POST" action="notifications.php" class="p-6">
      <input type="hidden" name="action" value="push">
      
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-[12px] font-bold text-gray-500 uppercase tracking-widest mb-1">Target Audience</label>
            <select name="target_type" id="target_type" onchange="toggleUserIdField()" required class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-bold">
              <option value="all">Broadcast to ALL</option>
              <option value="specific">Specific User (by ID)</option>
            </select>
          </div>
          <div>
            <label class="block text-[12px] font-bold text-gray-500 uppercase tracking-widest mb-1">Notification Type</label>
            <select name="type" required class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-bold">
              <option value="system">System Notification</option>
              <option value="promo">Promo / Offer</option>
              <option value="delivery">Delivery Update</option>
              <option value="driver">Driver Alert</option>
              <option value="booking">Booking Status</option>
              <option value="wallet">Wallet & Payments</option>
            </select>
          </div>
        </div>

        <div id="user_id_field" class="hidden animate-fade-in-down">
          <label class="block text-[12px] font-bold text-gray-500 uppercase tracking-widest mb-1">Enter Target User ID</label>
          <input type="number" name="user_id" placeholder="e.g. 101" class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-bold">
          <p class="text-[11px] text-gray-400 mt-1 italic">Find individual User IDs in the Users section.</p>
        </div>
        
        <div>
          <label class="block text-[12px] font-bold text-gray-500 uppercase tracking-widest mb-1">Notification Title</label>
          <input type="text" name="title" required placeholder="e.g. System Maintenance, Promo Code!" class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-bold">
        </div>
        
        <div>
          <label class="block text-[12px] font-bold text-gray-500 uppercase tracking-widest mb-1">Message Body</label>
          <textarea name="body" required rows="4" placeholder="Enter the detailed message here..." class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"></textarea>
        </div>
      </div>
      
      <div class="mt-8 flex gap-3">
        <button type="button" onclick="document.getElementById('new-notification-modal').classList.add('hidden')" class="flex-1 px-4 py-2.5 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded font-bold transition-colors">
          Cancel
        </button>
        <button type="submit" class="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold flex flex-center gap-2 transition-colors">
          <span class="material-symbols-outlined text-[18px]">send</span>
          Send Broadcast
        </button>
      </div>
    </form>
  </div>
</div>

<script>
function toggleUserIdField() {
    const targetType = document.getElementById('target_type').value;
    const userIdField = document.getElementById('user_id_field');
    const userIdInput = userIdField.querySelector('input');
    
    if (targetType === 'specific') {
        userIdField.classList.remove('hidden');
        userIdInput.setAttribute('required', 'required');
    } else {
        userIdField.classList.add('hidden');
        userIdInput.removeAttribute('required');
    }
}
</script>

<?php include 'layout/footer.php'; ?>

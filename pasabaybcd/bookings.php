<?php
// ============================================================
// PasabayBCD - Manage Bookings (CRUD)
// ============================================================

require_once 'config.php';
require_once 'auth_check.php';

$conn = get_db_connection();
if (!$conn) die("Database connection failed.");

$message = '';
$error = '';

// Handle Status Update
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    if ($_POST['action'] === 'update_status') {
        $id = $_POST['id'] ?? '';
        $status = $_POST['status'] ?? '';
        if ($id && $status) {
            $stmt = $conn->prepare("UPDATE pasabaybcd_bookings SET status = ? WHERE id = ?");
            if ($stmt->execute([$status, $id])) {
                $message = "Booking $id updated successfully.";
            } else {
                $error = "Failed to update booking.";
            }
        }
    } elseif ($_POST['action'] === 'delete') {
        $id = $_POST['id'] ?? '';
        if ($id) {
            $stmt = $conn->prepare("DELETE FROM pasabaybcd_bookings WHERE id = ?");
            if ($stmt->execute([$id])) {
                $message = "Booking $id deleted successfully.";
            } else {
                $error = "Failed to delete booking.";
            }
        }
    }
}

// Helper for relative time
function time_ago($timestamp) {
    if (!$timestamp) return 'N/A';
    $time = strtotime($timestamp);
    $diff = time() - $time;
    if ($diff < 60) return 'Just now';
    if ($diff < 3600) return round($diff / 60) . 'm ago';
    if ($diff < 86400) return round($diff / 3600) . 'h ago';
    if ($diff < 604800) return round($diff / 86400) . 'd ago';
    return date('M d', $time);
}

// Fetch All Bookings with Filter
$search = $_GET['s'] ?? '';
$base_sql = "SELECT b.*, u.full_name as sender_name, t.current_route, t.type as truck_type 
             FROM pasabaybcd_bookings b 
             LEFT JOIN pasabaybcd_users u ON b.user_id = u.id 
             LEFT JOIN pasabaybcd_trucks t ON b.truck_id = t.id";

if (!empty($search)) {
    $sql = $base_sql . " WHERE b.id LIKE ? OR b.driver_name LIKE ? OR b.cargo_category LIKE ? OR b.status LIKE ? OR u.full_name LIKE ? OR t.current_route LIKE ?";
    $stmt = $conn->prepare($sql . " ORDER BY b.created_at DESC");
    $q = "%$search%";
    $stmt->execute([$q, $q, $q, $q, $q, $q]);
    $bookings = $stmt->fetchAll();
} else {
    $bookings = $conn->query($base_sql . " ORDER BY b.created_at DESC")->fetchAll();
}

include 'layout/header.php';
include 'layout/sidebar.php';
?>

<div class="max-w-[1600px] mx-auto space-y-8">
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-2xl font-bold tracking-tight text-gray-900">Manage Cargo Bookings</h2>
      <p class="text-base text-gray-500 mt-1">Live database from pasabaybcd_bookings</p>
    </div>
    <a href="add_booking.php" class="flex items-center px-6 py-3 bg-blue-600 text-white text-sm font-black rounded-lg shadow-lg hover:bg-blue-700 transition-all">
      <span class="material-symbols-outlined text-base mr-2">add</span>
      New Booking
    </a>
  </div>

  <?php if ($message): ?>
    <div class="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 text-base font-bold rounded">
      <?php echo h($message); ?>
    </div>
  <?php endif; ?>
  <?php if ($error): ?>
    <div class="p-3 bg-red-50 border border-red-100 text-red-600 text-base font-bold rounded">
      <?php echo h($error); ?>
    </div>
  <?php endif; ?>

  <div class="bg-white rounded overflow-hidden shadow-sm border border-gray-100">
    <div class="overflow-x-auto">
      <table class="w-full data-table">
        <thead>
          <tr>
            <th>Booking ID</th>
            <th>Date & Time</th>
            <th>Sender</th>
            <th>Driver & Vehicle</th>
            <th>Route</th>
            <th>Category</th>
            <th>Fee</th>
            <th>Status</th>
            <th class="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <?php foreach ($bookings as $b): 
            $status_class = 'badge-transit'; // Default (confirmed/in transit)
            $status_lower = strtolower($b['status']);
            if ($status_lower === 'pending') $status_class = 'badge-pending';
            else if ($status_lower === 'delivered') $status_class = 'badge-delivered';
            else if ($status_lower === 'cancelled') $status_class = 'badge-cancelled';
          ?>
          <tr>
            <td class="text-[13px] font-bold">
              <button 
                onclick="viewBooking(this)" 
                class="text-blue-600 hover:text-blue-800 hover:scale-105 transition-all focus:outline-none"
                data-id="<?php echo h($b['id']); ?>"
                data-category="<?php echo h($b['cargo_category']); ?>"
                data-weight="<?php echo h($b['cargo_weight_kg']); ?>"
                data-fee="<?php echo number_format($b['estimated_fee'], 2); ?>"
                data-status="<?php echo h($b['status']); ?>"
                data-date="<?php echo date('M d, Y h:i A', strtotime($b['created_at'])); ?>"
                data-truck="<?php echo h($b['truck_id']); ?>"
                data-driver="<?php echo h($b['driver_name']); ?>"
                data-sender="<?php echo h($b['sender_name']); ?>"
                data-route="<?php echo h($b['current_route'] ?: 'N/A'); ?>"
                data-photo="<?php echo h($b['cargo_photo_url']); ?>"
                data-description="<?php echo h($b['description'] ?: 'No description provided.'); ?>"
                title="Click for Details"
              >
                #<?php echo h($b['id']); ?>
              </button>
            </td>
            <td>
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-gray-400 text-[18px]">calendar_today</span>
                <div class="flex flex-col">
                  <span class="text-[13px] font-bold text-gray-700"><?php echo date('M d, Y', strtotime($b['created_at'])); ?></span>
                  <span class="text-[11px] text-gray-400 font-medium"><?php echo date('h:i A', strtotime($b['created_at'])); ?> • <span class="text-blue-500"><?php echo time_ago($b['created_at']); ?></span></span>
                </div>
              </div>
            </td>
            <td>
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-gray-300 text-[18px]">person</span>
                <span class="font-semibold text-gray-700"><?php echo h($b['sender_name'] ?: 'Unknown User'); ?></span>
              </div>
            </td>
            <td>
              <div class="flex flex-col">
                <div class="flex items-center gap-2">
                  <span class="material-symbols-outlined text-gray-400 text-[18px]">local_shipping</span>
                  <span class="font-bold text-gray-700"><?php echo h($b['driver_name'] ?: 'Not Assigned'); ?></span>
                </div>
                <?php if ($b['truck_type']): ?>
                  <span class="text-[11px] text-blue-500 font-bold uppercase tracking-tighter ml-6"><?php echo h($b['truck_type']); ?></span>
                <?php endif; ?>
              </div>
            </td>
            <td>
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-emerald-500 text-[18px]">route</span>
                <span class="text-[13px] font-medium text-gray-600"><?php echo h($b['current_route'] ?: 'N/A'); ?></span>
              </div>
            </td>
            <td class="text-gray-600"><?php echo h($b['cargo_category']); ?></td>
            <td class="font-bold text-gray-900">₱<?php echo number_format($b['estimated_fee'], 2); ?></td>
            <td>
              <form method="POST" action="bookings.php" class="relative inline-block group">
                <input type="hidden" name="id" value="<?php echo h($b['id']); ?>">
                <input type="hidden" name="action" value="update_status">
                <select name="status" onchange="this.form.submit()" class="badge <?php echo $status_class; ?> cursor-pointer pr-7 appearance-none border-none ring-0 focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-all">
                  <option value="pending" <?php echo $b['status'] == 'pending' ? 'selected' : ''; ?>>Pending</option>
                  <option value="confirmed" <?php echo $b['status'] == 'confirmed' ? 'selected' : ''; ?>>Confirmed</option>
                  <option value="in transit" <?php echo $b['status'] == 'in transit' ? 'selected' : ''; ?>>Transit</option>
                  <option value="delivered" <?php echo $b['status'] == 'delivered' ? 'selected' : ''; ?>>Delivered</option>
                  <option value="cancelled" <?php echo $b['status'] == 'cancelled' ? 'selected' : ''; ?>>Cancel</option>
                </select>
                <span class="material-symbols-outlined absolute right-1.5 top-1/2 -translate-y-1/2 text-[16px] pointer-events-none opacity-60">expand_more</span>
              </form>
            </td>
            <td class="text-right">
              <div class="flex items-center justify-end gap-2">
                <form method="POST" action="bookings.php" onsubmit="return confirm('Really delete this booking?');" class="inline">
                  <input type="hidden" name="id" value="<?php echo h($b['id']); ?>">
                  <input type="hidden" name="action" value="delete">
                  <button type="submit" class="p-1 px-2 text-red-500 hover:bg-red-50 rounded transition-colors" title="Delete Booking">
                    <span class="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </form>
              </div>
            </td>
          </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </div>
  </div>
</div>

<!-- Details Modal -->
<div id="bookingModal" class="hidden fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
  <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
    <div onclick="closeModal()" class="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" aria-hidden="true"></div>

    <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

    <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
      <div class="px-6 py-5 bg-white border-b border-gray-100">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-bold leading-6 text-gray-900" id="modal-title">Booking Details</h3>
          <button onclick="closeModal()" class="text-gray-400 hover:text-gray-500 transition-colors">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
      </div>
      <div class="px-6 py-6 pb-8 bg-white">
        <div class="space-y-8">
          <!-- Overview -->
          <div class="flex items-center justify-between">
            <div>
              <p class="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Booking ID</p>
              <p id="m-id" class="text-base font-black text-blue-600 font-mono"></p>
            </div>
            <div class="text-right">
              <p class="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Current Status</p>
              <span id="m-status" class="badge inline-block mt-1"></span>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-x-6 gap-y-4 pt-2 border-t border-gray-50">
            <div>
              <p class="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Sender</p>
              <p id="m-sender" class="font-semibold text-gray-900"></p>
            </div>
            <div>
              <p class="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Category</p>
              <p id="m-category" class="font-semibold text-gray-900 capitalize"></p>
            </div>
            <div>
              <p class="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Cargo Weight</p>
              <p id="m-weight" class="font-semibold text-gray-900"></p>
            </div>
            <div>
              <p class="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Assigned Driver</p>
              <p id="m-driver" class="font-semibold text-gray-900"></p>
            </div>
          </div>

          <!-- Cargo Description -->
          <div class="pt-4 border-t border-gray-50">
            <p class="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">Cargo Description</p>
            <p id="m-description" class="text-sm text-gray-600 italic bg-gray-50 p-3 rounded-lg border border-gray-100"></p>
          </div>

          <!-- Cargo Photo Viewer -->
          <div class="pt-4 border-t border-gray-50">
            <p class="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-2">Cargo Photo Preview</p>
            <div id="m-photo-container" class="rounded-lg overflow-hidden bg-gray-100 border border-gray-100 flex items-center justify-center min-h-[200px]">
              <img id="m-photo" src="" alt="Cargo Photo" class="w-full h-auto max-h-[300px] object-cover hidden">
              <div id="m-no-photo" class="text-gray-400 flex flex-col items-center gap-1 py-12">
                <span class="material-symbols-outlined text-4xl">image_not_supported</span>
                <span class="text-[11px] font-bold uppercase tracking-widest">No Photo Available</span>
              </div>
            </div>
          </div>

          <div class="pt-4 border-t border-gray-50">
            <div class="flex items-center justify-between p-4 bg-gray-50 rounded">
              <div>
                <p class="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-0.5">Estimated Payment</p>
                <p id="m-fee" class="text-2xl font-black text-gray-900">₱0.00</p>
              </div>
              <div class="text-right">
                <p class="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-0.5">Booked On</p>
                <p id="m-date" class="text-xs text-gray-500"></p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="px-6 py-4 bg-gray-50 text-right">
        <button onclick="closeModal()" type="button" class="px-6 py-2 bg-white border border-gray-200 text-gray-600 font-bold rounded hover:bg-gray-100 transition-colors shadow-sm">
          Close Window
        </button>
      </div>
    </div>
  </div>
</div>

<script>
function viewBooking(btn) {
    const data = btn.dataset;
    
    // Fill Modal
    document.getElementById('m-id').textContent = '#' + data.id;
    document.getElementById('m-category').textContent = data.category;
    document.getElementById('m-weight').textContent = data.weight + ' kg';
    document.getElementById('m-fee').textContent = '₱' + data.fee;
    document.getElementById('m-date').textContent = data.date;
    document.getElementById('m-driver').textContent = data.driver;
    document.getElementById('m-sender').textContent = data.sender;
    document.getElementById('m-description').textContent = data.description;
    
    // Photo Viewer
    const photoImg = document.getElementById('m-photo');
    const noPhoto = document.getElementById('m-no-photo');
    if (data.photo && data.photo !== 'null' && data.photo !== '') {
        photoImg.src = data.photo;
        photoImg.classList.remove('hidden');
        noPhoto.classList.add('hidden');
    } else {
        photoImg.classList.add('hidden');
        noPhoto.classList.remove('hidden');
    }
    
    // Status Badge
    const statusEl = document.getElementById('m-status');
    statusEl.textContent = data.status.toUpperCase();
    statusEl.className = 'badge'; // Reset classes
    
    const status = data.status.toLowerCase();
    if (status === 'pending') statusEl.classList.add('badge-pending');
    else if (status === 'delivered') statusEl.classList.add('badge-delivered');
    else if (status === 'confirmed') statusEl.classList.add('badge-transit'); 
    else if (status === 'in transit') statusEl.classList.add('badge-transit');
    else if (status === 'cancelled') statusEl.classList.add('badge-cancelled');
    else statusEl.classList.add('badge-transit'); // Default

    // Show Modal
    document.getElementById('bookingModal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('bookingModal').classList.add('hidden');
}
</script>

<?php include 'layout/footer.php'; ?>

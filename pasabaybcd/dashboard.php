<?php
// ============================================================
// PasabayBCD - Admin Dashboard
// ============================================================

require_once 'config.php';
require_once 'auth_check.php';

$conn = get_db_connection();

if (!$conn) {
    die("Database connection failed.");
}

// Fetch Stats
$total_users = $conn->query("SELECT COUNT(*) FROM pasabaybcd_users")->fetchColumn();
$active_trucks = $conn->query("SELECT COUNT(*) FROM pasabaybcd_trucks")->fetchColumn();
$total_bookings = $conn->query("SELECT COUNT(*) FROM pasabaybcd_bookings")->fetchColumn();
$total_revenue = $conn->query("SELECT SUM(estimated_fee) FROM pasabaybcd_bookings WHERE status = 'delivered'")->fetchColumn() ?: 0;

// Fetch Recent Bookings
$stmt = $conn->query("SELECT b.*, u.full_name as sender_name, t.current_route, t.type as truck_type
                      FROM pasabaybcd_bookings b 
                      LEFT JOIN pasabaybcd_users u ON b.user_id = u.id 
                      LEFT JOIN pasabaybcd_trucks t ON b.truck_id = t.id
                      ORDER BY b.created_at DESC LIMIT 5");
$recent_bookings = $stmt->fetchAll();

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

include 'layout/header.php';
include 'layout/sidebar.php';
?>

<div class="max-w-[1600px] mx-auto space-y-8">
  <div class="flex items-center justify-between pb-2">
    <div>
      <h2 class="text-2xl font-bold tracking-tight text-gray-900">Dashboard Overview</h2>
      <p class="text-base text-gray-500 mt-1">Operational Summary for <?php echo date('M d, Y'); ?></p>
    </div>
    <div class="text-right hidden sm:block">
      <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic text-blue-600">Administrator Access: <?php echo h($_SESSION['admin_name']); ?></p>
    </div>
  </div>

  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
    <div class="stat-card">
      <div class="flex justify-between items-start mb-4">
        <span class="text-[12px] font-bold text-gray-400 uppercase tracking-widest">Total Users</span>
        <span class="material-symbols-outlined text-blue-600">group</span>
      </div>
      <h2 class="text-3xl font-bold tracking-tighter"><?php echo $total_users; ?></h2>
      <p class="text-[12px] text-gray-400 mt-2">Registered Accounts</p>
    </div>

    <div class="stat-card">
      <div class="flex justify-between items-start mb-4">
        <span class="text-[12px] font-bold text-gray-400 uppercase tracking-widest">Active Fleet</span>
        <span class="material-symbols-outlined text-blue-600">local_shipping</span>
      </div>
      <h2 class="text-3xl font-bold tracking-tighter"><?php echo $active_trucks; ?></h2>
      <p class="text-[12px] text-gray-400 mt-2">Trucks in Service</p>
    </div>

    <div class="stat-card" style="border-bottom-color:#4f46e5;">
      <div class="flex justify-between items-start mb-4">
        <span class="text-[12px] font-bold text-indigo-600 uppercase tracking-widest">Total Bookings</span>
        <span class="material-symbols-outlined text-indigo-600">receipt_long</span>
      </div>
      <h2 class="text-3xl font-bold tracking-tighter"><?php echo $total_bookings; ?></h2>
      <p class="text-[12px] text-gray-400 mt-2">All-Time Shipments</p>
    </div>

    <div class="stat-card" style="border-bottom-color:#166534;">
      <div class="flex justify-between items-start mb-4">
        <span class="text-[12px] font-bold text-emerald-600 uppercase tracking-widest">Revenue</span>
        <span class="material-symbols-outlined text-emerald-600">account_balance_wallet</span>
      </div>
      <h2 class="text-2xl font-bold tracking-tighter text-emerald-600">₱<?php echo number_format($total_revenue, 2); ?></h2>
      <p class="text-[12px] text-gray-400 mt-2">Delivered Cargos</p>
    </div>
  </div>

  <div class="bg-white rounded overflow-hidden shadow-sm border border-gray-100">
    <div class="px-6 py-4 border-b border-gray-50 flex justify-between items-center">
      <div>
        <h3 class="text-base font-bold text-gray-900">Recent Cargo Bookings</h3>
        <p class="text-[12px] text-gray-400 uppercase mt-1">Latest activity from the field • Updated <?php echo date('h:i A'); ?></p>
      </div>
      <div class="flex items-center gap-2">
        <a href="generate_report.php" target="_blank" onclick="window.open(this.href, '_blank'); return false;" class="px-3 py-1.5 bg-red-50 text-red-600 text-[12px] font-bold rounded border border-red-100 hover:bg-red-100 transition-colors flex items-center gap-1">
          <span class="material-symbols-outlined text-[16px]">picture_as_pdf</span>
          GENERATE PDF
        </a>
        <a href="bookings.php" class="px-3 py-1.5 bg-blue-600 text-white text-[12px] font-bold rounded hover:bg-blue-700 transition-colors">
          View All →
        </a>
      </div>
    </div>
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
          </tr>
        </thead>
        <tbody>
          <?php if (empty($recent_bookings)): ?>
            <tr><td colspan="8" class="text-center py-8 text-gray-400 text-base">No bookings found.</td></tr>
          <?php else: ?>
            <?php foreach ($recent_bookings as $booking): 
              $status_class = '';
              switch(strtolower($booking['status'])) {
                case 'pending': $status_class = 'badge-pending'; break;
                case 'delivered': $status_class = 'badge-delivered'; break;
                case 'in transit': $status_class = 'badge-transit'; break;
                case 'cancelled': $status_class = 'badge-cancelled'; break;
              }
            ?>
              <tr>
                <td class="text-[13px] font-bold">
                  <button 
                    onclick="viewBooking(this)" 
                    class="text-blue-600 hover:text-blue-800 hover:scale-105 transition-all focus:outline-none"
                    data-id="<?php echo h($booking['id']); ?>"
                    data-category="<?php echo h($booking['cargo_category']); ?>"
                    data-weight="<?php echo h($booking['cargo_weight_kg']); ?>"
                    data-fee="<?php echo number_format($booking['estimated_fee'], 2); ?>"
                    data-status="<?php echo h($booking['status']); ?>"
                    data-date="<?php echo date('M d, Y h:i A', strtotime($booking['created_at'])); ?>"
                    data-truck="<?php echo h($booking['truck_id']); ?>"
                    data-driver="<?php echo h($booking['driver_name']); ?>"
                    data-sender="<?php echo h($booking['sender_name']); ?>"
                    data-route="<?php echo h($booking['current_route'] ?: 'N/A'); ?>"
                    data-description="<?php echo h($booking['description'] ?: 'No description provided.'); ?>"
                    title="Click for Details"
                  >
                    #<?php echo h($booking['id']); ?>
                  </button>
                </td>
                <td>
                  <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-gray-400 text-[18px]">calendar_today</span>
                    <div class="flex flex-col">
                      <span class="text-[13px] font-bold text-gray-700"><?php echo date('M d, Y', strtotime($booking['created_at'])); ?></span>
                      <span class="text-[11px] text-gray-400 font-medium"><?php echo date('h:i A', strtotime($booking['created_at'])); ?> • <span class="text-blue-500"><?php echo time_ago($booking['created_at']); ?></span></span>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-gray-300 text-[18px]">person</span>
                    <span class="font-semibold text-gray-700"><?php echo h($booking['sender_name'] ?: 'Unknown User'); ?></span>
                  </div>
                </td>
                <td>
                  <div class="flex flex-col">
                    <div class="flex items-center gap-2">
                      <span class="material-symbols-outlined text-gray-400 text-[18px]">local_shipping</span>
                      <span class="font-bold text-gray-700"><?php echo h($booking['driver_name'] ?: 'Not Assigned'); ?></span>
                    </div>
                    <?php if ($booking['truck_type']): ?>
                      <span class="text-[11px] text-blue-500 font-bold uppercase tracking-tighter ml-6"><?php echo h($booking['truck_type']); ?></span>
                    <?php endif; ?>
                  </div>
                </td>
                <td>
                  <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-emerald-500 text-[18px]">route</span>
                    <span class="text-[13px] font-medium text-gray-600"><?php echo h($booking['current_route'] ?: 'N/A'); ?></span>
                  </div>
                </td>
                <td class="text-gray-600"><?php echo h($booking['cargo_category']); ?></td>
                <td class="font-bold text-gray-900">₱<?php echo number_format($booking['estimated_fee'], 2); ?></td>
                <td><span class="badge <?php echo $status_class; ?>"><?php echo h($booking['status']); ?></span></td>
              </tr>
            <?php endforeach; ?>
          <?php endif; ?>
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
          <h3 class="text-lg font-bold leading-6 text-gray-900" id="modal-title">Booking Quick View</h3>
          <button onclick="closeModal()" class="text-gray-400 hover:text-gray-500 transition-colors">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
      </div>
      <div class="px-6 py-6 pb-8 bg-white">
        <div class="space-y-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Booking ID</p>
              <p id="m-id" class="text-lg font-black text-blue-600 font-mono"></p>
            </div>
            <div class="text-right">
              <p class="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Status</p>
              <span id="m-status" class="badge inline-block mt-1"></span>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-x-6 gap-y-4 pt-4 border-t border-gray-50">
            <div>
              <p class="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Sender</p>
              <p id="m-sender" class="font-semibold text-gray-800"></p>
            </div>
            <div>
              <p class="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Route</p>
              <p id="m-route" class="font-semibold text-gray-800"></p>
            </div>
            <div>
              <p class="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Driver</p>
              <p id="m-driver" class="font-semibold text-gray-800"></p>
            </div>
            <div>
              <p class="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Category</p>
              <p id="m-category" class="font-semibold text-gray-800"></p>
            </div>
          </div>

          <div class="pt-4 border-t border-gray-50">
            <p class="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">Cargo Description</p>
            <p id="m-description" class="text-sm text-gray-600 italic bg-gray-50 p-3 rounded-lg border border-gray-100"></p>
          </div>

          <div class="pt-4 border-t border-gray-50">
            <div class="p-4 bg-gray-50 rounded-lg flex items-center justify-between">
              <div>
                <p class="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Estimated Fee</p>
                <p id="m-fee" class="text-xl font-black text-gray-900"></p>
              </div>
              <div class="text-right">
                <p class="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Booked Date</p>
                <p id="m-date" class="text-xs text-gray-500 font-medium"></p>
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
    document.getElementById('m-id').textContent = '#' + data.id;
    document.getElementById('m-sender').textContent = data.sender;
    document.getElementById('m-route').textContent = data.route;
    document.getElementById('m-driver').textContent = data.driver;
    document.getElementById('m-category').textContent = data.category;
    document.getElementById('m-fee').textContent = '₱' + data.fee;
    document.getElementById('m-date').textContent = data.date;
    document.getElementById('m-description').textContent = data.description;
    
    const statusEl = document.getElementById('m-status');
    statusEl.textContent = data.status.toUpperCase();
    statusEl.className = 'badge'; 
    const status = data.status.toLowerCase();
    if (status === 'pending') statusEl.classList.add('badge-pending');
    else if (status === 'delivered') statusEl.classList.add('badge-delivered');
    else if (status === 'in transit') statusEl.classList.add('badge-transit');
    else if (status === 'cancelled') statusEl.classList.add('badge-cancelled');
    else statusEl.classList.add('badge-transit');

    document.getElementById('bookingModal').classList.remove('hidden');
}
function closeModal() {
    document.getElementById('bookingModal').classList.add('hidden');
}
</script>

<?php include 'layout/footer.php'; ?>

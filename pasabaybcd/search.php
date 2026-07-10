<?php
// ============================================================
// PasabayBCD - Global Search
// ============================================================

require_once 'config.php';
require_once 'auth_check.php';

$conn = get_db_connection();

if (!$conn) {
    die("Database connection failed.");
}

$search = $_GET['s'] ?? '';
$q = '%' . $search . '%';

$bookings = [];
$users = [];
$drivers = [];
$trucks = [];

if (!empty($search)) {
    // Search Bookings
    $stmt = $conn->prepare("SELECT * FROM pasabaybcd_bookings WHERE id LIKE ? OR driver_name LIKE ? OR cargo_category LIKE ? OR status LIKE ? ORDER BY created_at DESC LIMIT 10");
    $stmt->execute([$q, $q, $q, $q]);
    $bookings = $stmt->fetchAll();

    // Search Users
    $stmt = $conn->prepare("SELECT * FROM pasabaybcd_users WHERE id LIKE ? OR full_name LIKE ? OR email LIKE ? OR merchant_name LIKE ? ORDER BY created_at DESC LIMIT 10");
    $stmt->execute([$q, $q, $q, $q]);
    $users = $stmt->fetchAll();

    // Search Drivers
    $stmt = $conn->prepare("SELECT * FROM pasabaybcd_drivers WHERE id LIKE ? OR driver_name LIKE ? OR phone_number LIKE ? ORDER BY created_at DESC LIMIT 10");
    $stmt->execute([$q, $q, $q]);
    $drivers = $stmt->fetchAll();

    // Search Trucks
    $stmt = $conn->prepare("SELECT * FROM pasabaybcd_trucks WHERE id LIKE ? OR plate_number LIKE ? OR type LIKE ? OR status LIKE ? LIMIT 10");
    $stmt->execute([$q, $q, $q, $q]);
    $trucks = $stmt->fetchAll();
}

include 'layout/header.php';
include 'layout/sidebar.php';
?>

<div class="max-w-[1600px] mx-auto space-y-8">
  <div class="flex items-center justify-between border-b border-gray-100 pb-4">
    <div>
      <h2 class="text-2xl font-bold tracking-tight text-gray-900">Global Search Results</h2>
      <p class="text-base text-gray-500 mt-1">
        <?php if (!empty($search)): ?>
            Showing results for <span class="font-bold text-gray-900">"<?php echo h($search); ?>"</span>
        <?php else: ?>
            Please enter a search query in the top bar.
        <?php endif; ?>
      </p>
    </div>
  </div>

  <?php if (empty($search)): ?>
    <div class="text-center py-16 bg-gray-50 rounded border border-gray-100">
        <span class="material-symbols-outlined text-4xl text-gray-400 mb-2">search</span>
        <h3 class="text-lg font-bold text-gray-600">Start Searching</h3>
        <p class="text-gray-500 text-sm mt-1">Use the search bar at the top to find Bookings, Users, Drivers, or Trucks.</p>
    </div>
  <?php else: ?>
      
      <?php if (empty($bookings) && empty($users) && empty($drivers) && empty($trucks)): ?>
        <div class="text-center py-16 bg-red-50 rounded border border-red-100">
            <span class="material-symbols-outlined text-4xl text-red-400 mb-2">sentiment_dissatisfied</span>
            <h3 class="text-lg font-bold text-red-600">No results found</h3>
            <p class="text-red-500 text-sm mt-1">We couldn't find any records matching "<?php echo h($search); ?>".</p>
        </div>
      <?php endif; ?>

      <!-- Bookings Results -->
      <?php if (!empty($bookings)): ?>
      <div class="bg-white rounded overflow-hidden shadow-sm border border-gray-100">
        <div class="px-6 py-4 border-b border-gray-50 bg-blue-50/50 flex justify-between items-center">
            <h3 class="text-base font-bold text-blue-900 flex items-center gap-2">
                <span class="material-symbols-outlined text-blue-600">inventory_2</span>
                Cargo Bookings
            </h3>
            <span class="px-2 py-1 bg-blue-100 text-blue-700 rounded text-[11px] font-bold"><?php echo count($bookings); ?> Found</span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full data-table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Category</th>
                <th>Status</th>
                <th>Fee</th>
                <th class="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              <?php foreach ($bookings as $b): ?>
              <tr>
                <td class="font-bold text-gray-900"><?php echo h($b['id']); ?></td>
                <td><?php echo h($b['cargo_category']); ?></td>
                <td><span class="text-[12px] font-bold uppercase text-gray-500 tracking-wider"><?php echo h($b['status']); ?></span></td>
                <td class="font-bold">₱<?php echo number_format($b['estimated_fee'], 2); ?></td>
                <td class="text-right">
                    <a href="bookings.php?s=<?php echo urlencode($b['id']); ?>" class="text-blue-600 hover:underline text-[13px] font-bold">View</a>
                </td>
              </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
        </div>
      </div>
      <?php endif; ?>

      <!-- Users Results -->
      <?php if (!empty($users)): ?>
      <div class="bg-white rounded overflow-hidden shadow-sm border border-gray-100">
        <div class="px-6 py-4 border-b border-gray-50 bg-emerald-50/50 flex justify-between items-center">
            <h3 class="text-base font-bold text-emerald-900 flex items-center gap-2">
                <span class="material-symbols-outlined text-emerald-600">group</span>
                Users
            </h3>
            <span class="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-[11px] font-bold"><?php echo count($users); ?> Found</span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Merchant Name</th>
                <th class="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              <?php foreach ($users as $u): ?>
              <tr>
                <td class="font-bold text-gray-500">#<?php echo h($u['id']); ?></td>
                <td class="font-bold text-gray-900"><?php echo h($u['full_name'] ?: 'N/A'); ?></td>
                <td><?php echo h($u['email']); ?></td>
                <td><?php echo h($u['merchant_name'] ?: '-'); ?></td>
                <td class="text-right">
                    <a href="users.php" class="text-blue-600 hover:underline text-[13px] font-bold">Manage</a>
                </td>
              </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
        </div>
      </div>
      <?php endif; ?>

      <!-- Drivers Results -->
      <?php if (!empty($drivers)): ?>
      <div class="bg-white rounded overflow-hidden shadow-sm border border-gray-100">
        <div class="px-6 py-4 border-b border-gray-50 bg-amber-50/50 flex justify-between items-center">
            <h3 class="text-base font-bold text-amber-900 flex items-center gap-2">
                <span class="material-symbols-outlined text-amber-600">badge</span>
                Drivers
            </h3>
            <span class="px-2 py-1 bg-amber-100 text-amber-700 rounded text-[11px] font-bold"><?php echo count($drivers); ?> Found</span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Driver Name</th>
                <th>Phone</th>
                <th>Rating</th>
                <th class="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              <?php foreach ($drivers as $d): ?>
              <tr>
                <td class="font-bold text-gray-500">#<?php echo h($d['id']); ?></td>
                <td class="font-bold text-gray-900"><?php echo h($d['driver_name']); ?></td>
                <td><?php echo h($d['phone_number'] ?: '-'); ?></td>
                <td class="font-bold text-amber-500"><?php echo h($d['rating']); ?> / 5.0</td>
                <td class="text-right">
                    <a href="kyc.php" class="text-blue-600 hover:underline text-[13px] font-bold">Verify</a>
                </td>
              </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
        </div>
      </div>
      <?php endif; ?>

      <!-- Trucks Results -->
      <?php if (!empty($trucks)): ?>
      <div class="bg-white rounded overflow-hidden shadow-sm border border-gray-100">
        <div class="px-6 py-4 border-b border-gray-50 bg-purple-50/50 flex justify-between items-center">
            <h3 class="text-base font-bold text-purple-900 flex items-center gap-2">
                <span class="material-symbols-outlined text-purple-600">local_shipping</span>
                Trucks
            </h3>
            <span class="px-2 py-1 bg-purple-100 text-purple-700 rounded text-[11px] font-bold"><?php echo count($trucks); ?> Found</span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Plate Number</th>
                <th>Type</th>
                <th>Status</th>
                <th class="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              <?php foreach ($trucks as $t): ?>
              <tr>
                <td class="font-bold text-gray-500">#<?php echo h($t['id']); ?></td>
                <td class="font-bold text-gray-900"><?php echo h($t['plate_number']); ?></td>
                <td><?php echo h($t['type'] ?: '-'); ?></td>
                <td><span class="text-[12px] font-bold uppercase text-gray-500 tracking-wider"><?php echo h($t['status']); ?></span></td>
                <td class="text-right">
                    <a href="edit_truck.php?id=<?php echo h($t['id']); ?>" class="text-blue-600 hover:underline text-[13px] font-bold">Edit</a>
                </td>
              </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
        </div>
      </div>
      <?php endif; ?>

  <?php endif; ?>
</div>

<?php include 'layout/footer.php'; ?>

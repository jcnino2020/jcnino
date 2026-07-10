<?php
// ============================================================
// PasabayBCD - Truck Fleet Management
// ============================================================

require_once 'config.php';
require_once 'auth_check.php';

$conn = get_db_connection();
if (!$conn) die("Database connection failed.");

$message = '';
$error = '';

// Handle Delete (optional CRUD for fleet)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'delete') {
    $id = $_POST['id'] ?? '';
    if ($id) {
        $stmt = $conn->prepare("DELETE FROM pasabaybcd_trucks WHERE id = ?");
        if ($stmt->execute([$id])) {
            $message = "Truck $id removed from fleet.";
        } else {
            $error = "Failed to remove truck.";
        }
    }
}

// Fetch Fleet Data
$stmt = $conn->query("
    SELECT t.*, d.driver_name, d.rating, d.profile_photo_url
    FROM pasabaybcd_trucks t
    JOIN pasabaybcd_drivers d ON t.driver_id = d.id
    ORDER BY t.id DESC
");
$fleet = $stmt->fetchAll();

include 'layout/header.php';
include 'layout/sidebar.php';
?>

<div class="max-w-[1600px] mx-auto space-y-8">
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-2xl font-bold tracking-tight text-gray-900">Truck Fleet Management</h2>
      <p class="text-base text-gray-500 mt-1">Managing <?php echo count($fleet); ?> active vehicles</p>
    </div>
    <a href="add_truck.php" class="px-4 py-2 bg-blue-600 text-white text-base font-bold rounded shadow-lg">
      + Add New Truck
    </a>
  </div>

  <?php if ($message): ?>
    <div class="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 text-base font-bold rounded">
      <?php echo h($message); ?>
    </div>
  <?php endif; ?>

  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <?php foreach ($fleet as $truck): ?>
      <div class="bg-white rounded p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
        <div class="flex items-start justify-between mb-4">
          <div>
            <h4 class="text-base font-bold text-gray-900 uppercase tracking-tight"><?php echo h($truck['type']); ?></h4>
            <p class="text-[12px] font-bold text-blue-600 tracking-widest mt-1"><?php echo h($truck['plate_number']); ?></p>
          </div>
          <div class="px-2 py-1 bg-blue-50 text-blue-600 rounded flex items-center gap-1">
            <span class="material-symbols-outlined text-base">star</span>
            <span class="text-[12px] font-bold"><?php echo number_format($truck['rating'], 1); ?></span>
          </div>
        </div>

        <div class="space-y-3 mb-6">
          <div class="flex items-center gap-4 p-3 bg-gray-50 rounded-lg group hover:bg-blue-50 transition-colors">
            <div class="relative">
              <img src="<?php echo $truck['profile_photo_url'] ?: 'https://i.pravatar.cc/150?u=pasabay_'.$truck['driver_id']; ?>" class="w-14 h-14 rounded-full bg-white object-cover border-2 border-white shadow-sm ring-1 ring-gray-100" />
              <div class="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow-sm" title="Active"></div>
            </div>
            <div>
              <p class="text-base font-black text-gray-900 leading-tight"><?php echo h($truck['driver_name']); ?></p>
              <p class="text-[11px] font-bold text-blue-600 uppercase tracking-tighter mt-1">Assigned Driver</p>
            </div>
          </div>
          <div class="pt-3 border-t border-gray-50 flex justify-between text-[12px] uppercase font-bold text-gray-500">
            <span>Route</span>
            <span class="text-gray-900"><?php echo h($truck['current_route']); ?></span>
          </div>
          <div class="flex justify-between text-[12px] uppercase font-bold text-gray-500">
            <span>Depart Time</span>
            <span class="text-gray-900"><?php echo date('h:i A', strtotime($truck['depart_time'])); ?></span>
          </div>
          <div class="flex justify-between text-[12px] uppercase font-bold text-gray-500">
            <span>Base Price</span>
            <span class="text-emerald-600 font-bold">₱<?php echo number_format($truck['base_price'], 2); ?></span>
          </div>
        </div>

        <div class="flex gap-2">
          <a href="edit_truck.php?id=<?php echo h($truck['id']); ?>" class="flex-1 px-4 py-2 bg-gray-50 text-gray-600 text-base text-center font-bold rounded border border-gray-100 hover:bg-gray-100 transition-colors">Edit</a>
          <form method="POST" action="fleet.php" class="flex-shrink-0" onsubmit="return confirm('Really delete this truck?');">
            <input type="hidden" name="id" value="<?php echo h($truck['id']); ?>">
            <input type="hidden" name="action" value="delete">
            <button type="submit" class="p-2 bg-red-50 text-red-600 rounded border border-red-100 hover:bg-red-100">
                <span class="material-symbols-outlined text-base">delete</span>
            </button>
          </form>
        </div>
      </div>
    <?php endforeach; ?>
  </div>
</div>
</div>

<?php include 'layout/footer.php'; ?>

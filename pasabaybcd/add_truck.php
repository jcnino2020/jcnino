<?php
// ============================================================
// PasabayBCD - Add New Truck
// ============================================================

require_once 'config.php';
require_once 'auth_check.php';

$conn = get_db_connection();
if (!$conn) die("Database connection failed.");

$message = '';
$error = '';

// Fetch drivers
$drivers = $conn->query("SELECT id, driver_name FROM pasabaybcd_drivers ORDER BY driver_name ASC")->fetchAll();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $driver_id = $_POST['driver_id'] ?? '';
    $type = $_POST['type'] ?? '';
    $plate = $_POST['plate_number'] ?? '';
    $route = $_POST['current_route'] ?? '';
    $price = $_POST['base_price'] ?? 0;
    $capacity = $_POST['capacity_kg'] ?? 0;

    if ($driver_id && $type && $plate) {
        $stmt = $conn->prepare("INSERT INTO pasabaybcd_trucks (driver_id, type, plate_number, current_route, base_price, capacity_kg) VALUES (?, ?, ?, ?, ?, ?)");
        if ($stmt->execute([$driver_id, $type, $plate, $route, $price, $capacity])) {
            $message = "Truck $plate added successfully.";
        } else {
            $error = "Failed to add truck. Check if plate number is unique.";
        }
    } else {
        $error = "Please fill in all required fields.";
    }
}

include 'layout/header.php';
include 'layout/sidebar.php';
?>

<div class="max-w-2xl mx-auto space-y-8">
  <div class="flex items-center gap-4">
    <a href="fleet.php" class="p-2 bg-white rounded border border-gray-100 text-gray-400 hover:text-blue-600 transition-colors">
        <span class="material-symbols-outlined">arrow_back</span>
    </a>
    <div>
      <h2 class="text-2xl font-bold tracking-tight text-gray-900">Add New Truck</h2>
      <p class="text-base text-gray-500 mt-1">Fleet Expansion Portal</p>
    </div>
  </div>

  <?php if ($message): ?>
    <div class="p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 text-base font-bold rounded">
      <?php echo h($message); ?>
    </div>
  <?php endif; ?>
  <?php if ($error): ?>
    <div class="p-4 bg-red-50 border border-red-100 text-red-600 text-base font-bold rounded">
      <?php echo h($error); ?>
    </div>
  <?php endif; ?>

  <div class="bg-white rounded p-8 shadow-sm border border-gray-100">
    <form method="POST" action="add_truck.php" class="space-y-8">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div class="sm:col-span-2">
          <label class="text-[12px] font-bold text-gray-500 uppercase tracking-widest">Assign Driver</label>
          <select name="driver_id" required class="mt-1.5 w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded focus:ring-2 focus:ring-blue-500 outline-none transition-all text-base">
            <option value="">Select a driver...</option>
            <?php foreach ($drivers as $d): ?>
              <option value="<?php echo h($d['id']); ?>"><?php echo h($d['driver_name']); ?></option>
            <?php endforeach; ?>
          </select>
        </div>
        <div>
          <label class="text-[12px] font-bold text-gray-500 uppercase tracking-widest">Vehicle Type</label>
          <select name="type" required class="mt-1.5 w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded focus:ring-2 focus:ring-blue-500 outline-none transition-all text-base">
            <option value="L300 Van">L300 Van</option>
            <option value="Closed Van">Closed Van</option>
            <option value="Wing Van">Wing Van</option>
            <option value="Elf Truck">Elf Truck</option>
            <option value="Motorcycle">Motorcycle</option>
          </select>
        </div>
        <div>
          <label class="text-[12px] font-bold text-gray-500 uppercase tracking-widest">Plate Number</label>
          <input type="text" name="plate_number" required placeholder="ABC-1234" class="mt-1.5 w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded focus:ring-2 focus:ring-blue-500 outline-none transition-all text-base">
        </div>
        <div class="sm:col-span-2">
          <label class="text-[12px] font-bold text-gray-500 uppercase tracking-widest">Initial Route</label>
          <input type="text" name="current_route" placeholder="e.g. Bacolod to Iloilo" class="mt-1.5 w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded focus:ring-2 focus:ring-blue-500 outline-none transition-all text-base">
        </div>
        <div>
          <label class="text-[12px] font-bold text-gray-500 uppercase tracking-widest">Base Price (₱)</label>
          <input type="number" name="base_price" step="0.01" required placeholder="0.00" class="mt-1.5 w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded focus:ring-2 focus:ring-blue-500 outline-none transition-all text-base">
        </div>
        <div>
          <label class="text-[12px] font-bold text-gray-500 uppercase tracking-widest">Capacity (kg)</label>
          <input type="number" name="capacity_kg" step="0.01" required placeholder="0.00" class="mt-1.5 w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded focus:ring-2 focus:ring-blue-500 outline-none transition-all text-base">
        </div>
      </div>
      <div class="pt-4">
        <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded transition-all shadow-lg active:scale-[0.98]">
          Add Truck to Fleet
        </button>
      </div>
    </form>
  </div>
</div>

<?php include 'layout/footer.php'; ?>

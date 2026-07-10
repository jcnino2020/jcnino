<?php
// ============================================================
// PasabayBCD - Edit Truck Details
// ============================================================

require_once 'config.php';
require_once 'auth_check.php';

$conn = get_db_connection();
if (!$conn) die("Database connection failed.");

$id = $_GET['id'] ?? '';
if (!$id) {
    header("Location: fleet.php");
    exit();
}

$message = '';
$error = '';

// Fetch current details
$stmt = $conn->prepare("SELECT * FROM pasabaybcd_trucks WHERE id = ?");
$stmt->execute([$id]);
$truck = $stmt->fetch();

if (!$truck) {
    header("Location: fleet.php");
    exit();
}

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
        $update = $conn->prepare("UPDATE pasabaybcd_trucks SET driver_id = ?, type = ?, plate_number = ?, current_route = ?, base_price = ?, capacity_kg = ? WHERE id = ?");
        if ($update->execute([$driver_id, $type, $plate, $route, $price, $capacity, $id])) {
            $message = "Truck update saved successfully.";
            // Refresh local data
            $truck['driver_id'] = $driver_id;
            $truck['type'] = $type;
            $truck['plate_number'] = $plate;
            $truck['current_route'] = $route;
            $truck['base_price'] = $price;
            $truck['capacity_kg'] = $capacity;
        } else {
            $error = "Failed to update truck.";
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
      <h2 class="text-2xl font-bold tracking-tight text-gray-900">Edit Truck Details</h2>
      <p class="text-base text-gray-500 mt-1">Fleet Maintenance Portal</p>
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
    <form method="POST" action="edit_truck.php?id=<?php echo h($id); ?>" class="space-y-8">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div class="sm:col-span-2">
          <label class="text-[12px] font-bold text-gray-500 uppercase tracking-widest">Assign Driver</label>
          <select name="driver_id" required class="mt-1.5 w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded focus:ring-2 focus:ring-blue-500 outline-none transition-all text-base">
            <?php foreach ($drivers as $d): ?>
              <option value="<?php echo h($d['id']); ?>" <?php echo ($truck['driver_id'] == $d['id']) ? 'selected' : ''; ?>>
                <?php echo h($d['driver_name']); ?>
              </option>
            <?php endforeach; ?>
          </select>
        </div>
        <div>
          <label class="text-[12px] font-bold text-gray-500 uppercase tracking-widest">Vehicle Type</label>
          <select name="type" required class="mt-1.5 w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded focus:ring-2 focus:ring-blue-500 outline-none transition-all text-base">
            <?php 
              $types = ["L300 Van", "Closed Van", "Wing Van", "Elf Truck", "Motorcycle"];
              foreach ($types as $t):
            ?>
              <option value="<?php echo h($t); ?>" <?php echo ($truck['type'] == $t) ? 'selected' : ''; ?>><?php echo h($t); ?></option>
            <?php endforeach; ?>
          </select>
        </div>
        <div>
          <label class="text-[12px] font-bold text-gray-500 uppercase tracking-widest">Plate Number</label>
          <input type="text" name="plate_number" required value="<?php echo h($truck['plate_number']); ?>" class="mt-1.5 w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded focus:ring-2 focus:ring-blue-500 outline-none transition-all text-base">
        </div>
        <div class="sm:col-span-2">
          <label class="text-[12px] font-bold text-gray-500 uppercase tracking-widest">Current Route</label>
          <input type="text" name="current_route" value="<?php echo h($truck['current_route']); ?>" class="mt-1.5 w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded focus:ring-2 focus:ring-blue-500 outline-none transition-all text-base">
        </div>
        <div>
          <label class="text-[12px] font-bold text-gray-500 uppercase tracking-widest">Base Price (₱)</label>
          <input type="number" name="base_price" step="0.01" required value="<?php echo h($truck['base_price']); ?>" class="mt-1.5 w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded focus:ring-2 focus:ring-blue-500 outline-none transition-all text-base">
        </div>
        <div>
          <label class="text-[12px] font-bold text-gray-500 uppercase tracking-widest">Capacity (kg)</label>
          <input type="number" name="capacity_kg" step="0.01" required value="<?php echo h($truck['capacity_kg']); ?>" class="mt-1.5 w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded focus:ring-2 focus:ring-blue-500 outline-none transition-all text-base">
        </div>
      </div>
      <div class="pt-4">
        <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded transition-all shadow-lg active:scale-[0.98]">
          Save Fleet Updates
        </button>
      </div>
    </form>
  </div>
</div>

<?php include 'layout/footer.php'; ?>

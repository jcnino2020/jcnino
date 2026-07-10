<?php
// ============================================================
// PasabayBCD - Add New Booking
// ============================================================

require_once 'config.php';
require_once 'auth_check.php';

$conn = get_db_connection();
if (!$conn) die("Database connection failed.");

$message = '';
$error = '';

// Fetch active trucks for assignment
$trucks = $conn->query("
    SELECT t.id, t.type, t.plate_number, d.driver_name 
    FROM pasabaybcd_trucks t 
    JOIN pasabaybcd_drivers d ON t.driver_id = d.id 
    ORDER BY t.type ASC
")->fetchAll();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $truck_id = $_POST['truck_id'] ?? '';
    $cargo_cat = $_POST['cargo_category'] ?? '';
    $weight = $_POST['weight'] ?? 0;
    $fee = $_POST['fee'] ?? 0;
    $description = $_POST['description'] ?? '';
    
    if ($truck_id && $cargo_cat) {
        // Find driver name for this truck
        $driver_name = '';
        foreach($trucks as $t) {
            if ($t['id'] == $truck_id) {
                $driver_name = $t['driver_name'];
                break;
            }
        }

        $id = "BK-" . time() . "-" . rand(100, 999);
        $stmt = $conn->prepare("INSERT INTO pasabaybcd_bookings (id, truck_id, driver_name, cargo_category, cargo_weight_kg, estimated_fee, description, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')");
        
        if ($stmt->execute([$id, $truck_id, $driver_name, $cargo_cat, $weight, $fee, $description])) {
            $message = "Booking created successfully with ID: $id";
        } else {
            $error = "Failed to create booking.";
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
    <a href="bookings.php" class="p-2 bg-white rounded border border-gray-100 text-gray-400 hover:text-blue-600 transition-colors">
        <span class="material-symbols-outlined">arrow_back</span>
    </a>
    <div>
      <h2 class="text-2xl font-bold tracking-tight text-gray-900">Create New Shipment</h2>
      <p class="text-base text-gray-500 mt-1">Manual Entry Portal</p>
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
    <form method="POST" action="add_booking.php" class="space-y-8">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div class="sm:col-span-2">
          <label class="text-[12px] font-bold text-gray-500 uppercase tracking-widest">Assign Truck / Driver</label>
          <select name="truck_id" required class="mt-1.5 w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded focus:ring-2 focus:ring-blue-500 outline-none transition-all text-base">
            <option value="">Select an active truck...</option>
            <?php foreach ($trucks as $t): ?>
              <option value="<?php echo h($t['id']); ?>"><?php echo h($t['type']); ?> - <?php echo h($t['plate_number']); ?> (<?php echo h($t['driver_name']); ?>)</option>
            <?php endforeach; ?>
          </select>
        </div>
        <div>
          <label class="text-[12px] font-bold text-gray-500 uppercase tracking-widest">Cargo Category</label>
          <input type="text" name="cargo_category" required placeholder="e.g. Electronics, Furniture" class="mt-1.5 w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded focus:ring-2 focus:ring-blue-500 outline-none transition-all text-base">
        </div>
        <div>
          <label class="text-[12px] font-bold text-gray-500 uppercase tracking-widest">Weight (kg)</label>
          <input type="number" name="weight" step="0.01" required placeholder="0.00" class="mt-1.5 w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded focus:ring-2 focus:ring-blue-500 outline-none transition-all text-base">
        </div>
        <div>
          <label class="text-[12px] font-bold text-gray-500 uppercase tracking-widest">Estimated Fee (₱)</label>
          <input type="number" name="fee" step="0.01" required placeholder="0.00" class="mt-1.5 w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded focus:ring-2 focus:ring-blue-500 outline-none transition-all text-base">
        </div>
        <div class="sm:col-span-2">
          <label class="text-[12px] font-bold text-gray-500 uppercase tracking-widest">Cargo Description</label>
          <textarea name="description" rows="3" placeholder="Describe the cargo details (e.g. 2 sacks of rice)" class="mt-1.5 w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded focus:ring-2 focus:ring-blue-500 outline-none transition-all text-base"></textarea>
        </div>
      </div>
      <div class="pt-4">
        <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded transition-all shadow-lg active:scale-[0.98]">
          Confirm and Create Shipment
        </button>
      </div>
    </form>
  </div>
</div>

<?php include 'layout/footer.php'; ?>

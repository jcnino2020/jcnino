<?php
// ============================================================
// PasabayBCD - Admin Transactions Log
// ============================================================

require_once 'config.php';
require_once 'auth_check.php';

$conn = get_db_connection();

if (!$conn) {
    die("Database connection failed.");
}

// Fetch Transactions with User Details
$query = "
    SELECT t.*, u.full_name as user_name, u.email as user_email
    FROM pasabaybcd_transactions t
    LEFT JOIN pasabaybcd_users u ON t.user_id = u.id
    ORDER BY t.transaction_date DESC
    LIMIT 100
";
$stmt = $conn->query($query);
$transactions = $stmt->fetchAll();

// Calculate Totals
$total_topups = $conn->query("
    SELECT SUM(amount) 
    FROM pasabaybcd_transactions 
    WHERE type = 'top_up'
")->fetchColumn() ?: 0;

$total_trip_payments = $conn->query("
    SELECT SUM(ABS(amount)) 
    FROM pasabaybcd_transactions 
    WHERE type = 'trip_payment'
")->fetchColumn() ?: 0;

$total_withdrawals = $conn->query("
    SELECT SUM(ABS(amount)) 
    FROM pasabaybcd_transactions 
    WHERE type = 'withdrawal'
")->fetchColumn() ?: 0;

include 'layout/header.php';
include 'layout/sidebar.php';
?>

<div class="max-w-[1600px] mx-auto space-y-8">
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-2xl font-bold tracking-tight text-gray-900">Financial Transactions</h2>
      <p class="text-base text-gray-500 mt-1">Monitor all ledger entries, top-ups, and trip payments.</p>
    </div>
  </div>

  <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
    <div class="bg-white p-6 rounded shadow-sm border border-gray-100 border-l-4 border-l-blue-600">
      <h3 class="text-[12px] font-bold text-gray-400 uppercase tracking-widest">Total Top-Ups</h3>
      <p class="text-3xl font-bold tracking-tighter text-blue-600 mt-2">₱<?php echo number_format($total_topups, 2); ?></p>
    </div>
    <div class="bg-white p-6 rounded shadow-sm border border-gray-100 border-l-4 border-l-amber-600">
      <h3 class="text-[12px] font-bold text-gray-400 uppercase tracking-widest">Total Trip Payments</h3>
      <p class="text-3xl font-bold tracking-tighter text-amber-600 mt-2">₱<?php echo number_format($total_trip_payments, 2); ?></p>
    </div>
    <div class="bg-white p-6 rounded shadow-sm border border-gray-100 border-l-4 border-l-red-600">
      <h3 class="text-[12px] font-bold text-gray-400 uppercase tracking-widest">Total Withdrawals</h3>
      <p class="text-3xl font-bold tracking-tighter text-red-600 mt-2">₱<?php echo number_format($total_withdrawals, 2); ?></p>
    </div>
  </div>

  <!-- Transactions List -->
  <div class="bg-white rounded border border-gray-100 shadow-sm overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full data-table">
        <thead>
          <tr>
            <th class="w-24">TXN ID</th>
            <th>Type</th>
            <th>Amount</th>
            <th>User</th>
            <th>Description</th>
            <th>Related Booking</th>
            <th>Date & Time</th>
          </tr>
        </thead>
        <tbody>
          <?php if (empty($transactions)): ?>
            <tr><td colspan="7" class="text-center py-8 text-gray-400">No transactions recorded yet.</td></tr>
          <?php else: ?>
            <?php foreach ($transactions as $t): 
              $type_class = '';
              $type_label = '';
              switch(strtolower($t['type'])) {
                case 'top_up': 
                  $type_class = 'bg-blue-50 text-blue-700'; 
                  $type_label = 'Top-Up';
                  break;
                case 'trip_payment': 
                  $type_class = 'bg-amber-50 text-amber-700'; 
                  $type_label = 'Trip Payment';
                  break;
                case 'withdrawal': 
                  $type_class = 'bg-red-50 text-red-700'; 
                  $type_label = 'Withdrawal';
                  break;
                default: 
                  $type_class = 'bg-gray-50 text-gray-700'; 
                  $type_label = $t['type'];
              }
            ?>
              <tr>
                <td class="font-bold text-gray-400">#<?php echo $t['id']; ?></td>
                <td>
                  <span class="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider <?php echo $type_class; ?>"><?php echo h($type_label); ?></span>
                </td>
                <td class="font-bold <?php echo ($t['amount'] < 0) ? 'text-red-600' : 'text-emerald-600'; ?>">
    <?php 
    $is_negative = $t['amount'] < 0;
    $display_amount = abs($t['amount']);
    ?>
    <?php echo $is_negative ? '-' : '+'; ?>₱<?php echo number_format($display_amount, 2); ?>
</td>
                <td>
                  <div class="font-bold text-gray-900"><?php echo h($t['user_name'] ?: 'Unknown User'); ?></div>
                  <div class="text-[12px] text-gray-500">ID: <?php echo h($t['user_id']); ?></div>
                </td>
                <td class="text-gray-600"><?php echo h($t['label']); ?></td>
                <td>
                  <?php if (!empty($t['booking_id'])): ?>
                    <a href="bookings.php?s=<?php echo urlencode($t['booking_id']); ?>" class="text-blue-600 hover:underline font-bold text-[13px]"><?php echo h($t['booking_id']); ?></a>
                  <?php else: ?>
                    <span class="text-gray-400 text-[13px]">-</span>
                  <?php endif; ?>
                </td>
                <td class="text-gray-500 text-[13px]"><?php echo date('M d, Y h:i A', strtotime($t['transaction_date'])); ?></td>
              </tr>
            <?php endforeach; ?>
          <?php endif; ?>
        </tbody>
      </table>
    </div>
  </div>
</div>

<?php include 'layout/footer.php'; ?>

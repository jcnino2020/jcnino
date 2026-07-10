<?php
// ============================================================
// PasabayBCD - Analytics & Charts
// ============================================================

require_once 'config.php';
require_once 'auth_check.php';

$conn = get_db_connection();
if (!$conn) die("Database connection failed.");

// ---- Bookings per Day (last 14 days) ----
$bookings_by_day = $conn->query("
    SELECT DATE(created_at) as day, COUNT(*) as count, SUM(estimated_fee) as revenue
    FROM pasabaybcd_bookings
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY)
    GROUP BY DATE(created_at)
    ORDER BY day ASC
")->fetchAll();

// ---- Bookings by Status ----
$by_status = $conn->query("
    SELECT status, COUNT(*) as count
    FROM pasabaybcd_bookings
    GROUP BY status
")->fetchAll();

// ---- Bookings by Category ----
$by_category = $conn->query("
    SELECT cargo_category, COUNT(*) as count, SUM(estimated_fee) as revenue
    FROM pasabaybcd_bookings
    GROUP BY cargo_category
    ORDER BY count DESC
    LIMIT 8
")->fetchAll();

// ---- User Registrations per Day ----
$user_reg = $conn->query("
    SELECT DATE(created_at) as day, COUNT(*) as count
    FROM pasabaybcd_users
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY)
    GROUP BY DATE(created_at)
    ORDER BY day ASC
")->fetchAll();

// ---- Top KPIs ----
$total_revenue       = $conn->query("SELECT SUM(estimated_fee) FROM pasabaybcd_bookings WHERE status = 'delivered'")->fetchColumn() ?: 0;
$avg_fee             = $conn->query("SELECT AVG(estimated_fee) FROM pasabaybcd_bookings")->fetchColumn() ?: 0;
$delivered_count     = $conn->query("SELECT COUNT(*) FROM pasabaybcd_bookings WHERE status = 'delivered'")->fetchColumn();
$cancelled_count     = $conn->query("SELECT COUNT(*) FROM pasabaybcd_bookings WHERE status = 'cancelled'")->fetchColumn();
$total_bookings      = $conn->query("SELECT COUNT(*) FROM pasabaybcd_bookings")->fetchColumn();
$total_users         = $conn->query("SELECT COUNT(*) FROM pasabaybcd_users")->fetchColumn();
$revenue_this_week   = $conn->query("SELECT SUM(estimated_fee) FROM pasabaybcd_bookings WHERE status = 'delivered' AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)")->fetchColumn() ?: 0;

// Completion rate
$completion_rate = $total_bookings > 0 ? round(($delivered_count / $total_bookings) * 100, 1) : 0;

include 'layout/header.php';
include 'layout/sidebar.php';

// Prepare chart data as JSON
$labels_days       = json_encode(array_map(fn($r) => date('M d', strtotime($r['day'])), $bookings_by_day));
$data_bookings_day = json_encode(array_map(fn($r) => (int)$r['count'], $bookings_by_day));
$data_revenue_day  = json_encode(array_map(fn($r) => round((float)$r['revenue'], 2), $bookings_by_day));

$status_labels = json_encode(array_map(fn($r) => ucwords($r['status']), $by_status));
$status_data   = json_encode(array_map(fn($r) => (int)$r['count'], $by_status));

$cat_labels    = json_encode(array_map(fn($r) => ucwords($r['cargo_category']), $by_category));
$cat_data      = json_encode(array_map(fn($r) => (int)$r['count'], $by_category));
$cat_revenue   = json_encode(array_map(fn($r) => round((float)$r['revenue'], 2), $by_category));

$user_labels   = json_encode(array_map(fn($r) => date('M d', strtotime($r['day'])), $user_reg));
$user_data     = json_encode(array_map(fn($r) => (int)$r['count'], $user_reg));
?>

<div class="max-w-[1600px] mx-auto space-y-8">

  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-2xl font-bold tracking-tight text-gray-900">Analytics & Reports</h2>
      <p class="text-base text-gray-500 mt-1">Live statistics from the database</p>
    </div>
    <span class="px-3 py-1.5 bg-blue-50 text-blue-600 text-[12px] font-bold rounded border border-blue-100">
      Last updated: <?php echo date('M d, Y H:i'); ?>
    </span>
  </div>

  <!-- KPI Cards -->
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
    <div class="bg-white rounded border-b-2 border-emerald-500 shadow-sm p-5">
      <p class="text-[11px] font-black text-gray-400 uppercase tracking-widest">Total Revenue</p>
      <p class="text-2xl font-black text-emerald-600 mt-2">₱<?php echo number_format($total_revenue, 2); ?></p>
      <p class="text-[12px] text-gray-400 mt-1">From delivered bookings</p>
    </div>
    <div class="bg-white rounded border-b-2 border-blue-500 shadow-sm p-5">
      <p class="text-[11px] font-black text-gray-400 uppercase tracking-widest">This Week</p>
      <p class="text-2xl font-black text-blue-600 mt-2">₱<?php echo number_format($revenue_this_week, 2); ?></p>
      <p class="text-[12px] text-gray-400 mt-1">Revenue last 7 days</p>
    </div>
    <div class="bg-white rounded border-b-2 border-blue-600 shadow-sm p-5">
      <p class="text-[11px] font-black text-gray-400 uppercase tracking-widest">Avg. Booking Fee</p>
      <p class="text-2xl font-black text-gray-900 mt-2">₱<?php echo number_format($avg_fee, 2); ?></p>
      <p class="text-[12px] text-gray-400 mt-1">Per transaction</p>
    </div>
    <div class="bg-white rounded border-b-2 border-blue-500 shadow-sm p-5">
      <p class="text-[11px] font-black text-gray-400 uppercase tracking-widest">Completion Rate</p>
      <p class="text-2xl font-black text-gray-900 mt-2"><?php echo $completion_rate; ?>%</p>
      <div class="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div class="h-full bg-blue-500 rounded-full transition-all" style="width:<?php echo $completion_rate; ?>%"></div>
      </div>
    </div>
  </div>

  <!-- Row 1: Booking Trend + Donut Status -->
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div class="lg:col-span-2 bg-white rounded border border-gray-100 shadow-sm p-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <p class="font-bold text-gray-900">Booking Volume & Revenue</p>
          <p class="text-[12px] text-gray-400 uppercase font-bold tracking-widest mt-1">Last 14 Days</p>
        </div>
        <div class="flex gap-3 text-[12px] font-bold">
          <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-blue-500 inline-block"></span>Bookings</span>
          <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-emerald-400 inline-block"></span>Revenue (₱)</span>
        </div>
      </div>
      <canvas id="bookingTrendChart" height="120"></canvas>
    </div>

    <div class="bg-white rounded border border-gray-100 shadow-sm p-6">
      <p class="font-bold text-gray-900 mb-1">Booking Status</p>
      <p class="text-[12px] text-gray-400 uppercase font-bold tracking-widest mb-4">Distribution</p>
      <canvas id="statusDonutChart" height="200"></canvas>
      <div class="mt-4 space-y-2 text-[12px] font-bold">
        <?php
          $status_colors = ['pending'=>'#f59e0b','delivered'=>'#10b981','in transit'=>'#3b82f6','cancelled'=>'#ef4444','confirmed'=>'#8b5cf6'];
          foreach ($by_status as $s):
            $color = $status_colors[strtolower($s['status'])] ?? '#999';
        ?>
          <div class="flex items-center justify-between">
            <span class="flex items-center gap-2"><span class="w-3 h-3 rounded flex-shrink-0" style="background:<?php echo $color; ?>"></span><?php echo ucwords(h($s['status'])); ?></span>
            <span class="text-gray-900"><?php echo $s['count']; ?></span>
          </div>
        <?php endforeach; ?>
      </div>
    </div>
  </div>

  <!-- Row 2: Category Bar + User Growth -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <div class="bg-white rounded border border-gray-100 shadow-sm p-6">
      <p class="font-bold text-gray-900 mb-1">Top Cargo Categories</p>
      <p class="text-[12px] text-gray-400 uppercase font-bold tracking-widest mb-4">By Booking Count</p>
      <canvas id="categoryChart" height="220"></canvas>
    </div>

    <div class="bg-white rounded border border-gray-100 shadow-sm p-6">
      <p class="font-bold text-gray-900 mb-1">User Registrations</p>
      <p class="text-[12px] text-gray-400 uppercase font-bold tracking-widest mb-4">Last 14 Days</p>
      <canvas id="userGrowthChart" height="220"></canvas>
    </div>
  </div>

  <!-- Summary Table -->
  <div class="bg-white rounded border border-gray-100 shadow-sm overflow-hidden">
    <div class="px-6 py-4 border-b border-gray-50">
      <p class="font-bold text-gray-900">Category Revenue Breakdown</p>
    </div>
    <div class="overflow-x-auto">
      <table class="w-full data-table">
        <thead>
          <tr>
            <th>Cargo Category</th>
            <th>Total Bookings</th>
            <th>Total Revenue</th>
            <th>Avg per Booking</th>
            <th>Share</th>
          </tr>
        </thead>
        <tbody>
          <?php
          $grand_total = max(1, array_sum(array_column($by_category, 'count')));
          foreach ($by_category as $cat):
            $avg = $cat['count'] > 0 ? $cat['revenue'] / $cat['count'] : 0;
            $share = round(($cat['count'] / $grand_total) * 100, 1);
          ?>
          <tr>
            <td class="font-bold text-gray-900 capitalize"><?php echo h($cat['cargo_category']); ?></td>
            <td><?php echo number_format($cat['count']); ?></td>
            <td class="font-bold text-emerald-600">₱<?php echo number_format($cat['revenue'], 2); ?></td>
            <td>₱<?php echo number_format($avg, 2); ?></td>
            <td>
              <div class="flex items-center gap-2">
                <div class="flex-1 h-1.5 bg-gray-100 rounded-full">
                  <div class="h-full bg-blue-500 rounded-full" style="width:<?php echo $share; ?>%"></div>
                </div>
                <span class="text-[12px] font-bold text-gray-500 w-10"><?php echo $share; ?>%</span>
              </div>
            </td>
          </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </div>
  </div>

</div>

<!-- Chart.js CDN -->
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<script>
const chartDefaults = {
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { color: '#f1f5f9' }, ticks: { font: { size: 11, family: 'Inter' }, color: '#94a3b8' } },
    y: { grid: { color: '#f1f5f9' }, ticks: { font: { size: 11, family: 'Inter' }, color: '#94a3b8' } }
  }
};

// 1. Booking Trend (dual axis)
new Chart(document.getElementById('bookingTrendChart'), {
  type: 'bar',
  data: {
    labels: <?php echo $labels_days; ?>,
    datasets: [
      {
        label: 'Bookings',
        data: <?php echo $data_bookings_day; ?>,
        backgroundColor: 'rgba(59,130,246,0.15)',
        borderColor: '#3b82f6',
        borderWidth: 2,
        borderRadius: 4,
        yAxisID: 'y',
      },
      {
        label: 'Revenue',
        data: <?php echo $data_revenue_day; ?>,
        type: 'line',
        borderColor: '#10b981',
        backgroundColor: 'rgba(16,185,129,0.08)',
        borderWidth: 2.5,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#10b981',
        yAxisID: 'y1',
      }
    ]
  },
  options: {
    ...chartDefaults,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { color: '#f8fafc' }, ticks: { font: { size: 11 }, color: '#94a3b8' } },
      y:  { grid: { color: '#f8fafc' }, ticks: { font: { size: 11 }, color: '#3b82f6' }, position: 'left' },
      y1: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#10b981', callback: v => '₱' + v.toLocaleString() }, position: 'right' }
    }
  }
});

// 2. Status Donut
new Chart(document.getElementById('statusDonutChart'), {
  type: 'doughnut',
  data: {
    labels: <?php echo $status_labels; ?>,
    datasets: [{
      data: <?php echo $status_data; ?>,
      backgroundColor: ['#f59e0b','#10b981','#3b82f6','#ef4444','#8b5cf6'],
      borderWidth: 2,
      borderColor: '#fff'
    }]
  },
  options: {
    plugins: { legend: { display: false } },
    cutout: '68%'
  }
});

// 3. Category Bar
new Chart(document.getElementById('categoryChart'), {
  type: 'bar',
  data: {
    labels: <?php echo $cat_labels; ?>,
    datasets: [{
      label: 'Bookings',
      data: <?php echo $cat_data; ?>,
      backgroundColor: 'rgba(59,130,246,0.8)',
      borderRadius: 4,
    }]
  },
  options: {
    indexAxis: 'y',
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { color: '#f1f5f9' }, ticks: { font: { size: 11 }, color: '#94a3b8' } },
      y: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#64748b' } }
    }
  }
});

// 4. User Growth Line
new Chart(document.getElementById('userGrowthChart'), {
  type: 'line',
  data: {
    labels: <?php echo $user_labels; ?>,
    datasets: [{
      label: 'New Users',
      data: <?php echo $user_data; ?>,
      borderColor: '#8b5cf6',
      backgroundColor: 'rgba(139,92,246,0.1)',
      borderWidth: 2.5,
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: '#8b5cf6',
    }]
  },
  options: {
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { color: '#f1f5f9' }, ticks: { font: { size: 11 }, color: '#94a3b8' } },
      y: { grid: { color: '#f1f5f9' }, ticks: { font: { size: 11 }, color: '#94a3b8', stepSize: 1 } }
    }
  }
});
</script>

<?php include 'layout/footer.php'; ?>

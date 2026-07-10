<?php
// ============================================================
// PasabayBCD - Admin Ratings & Reviews
// ============================================================

require_once 'config.php';
require_once 'auth_check.php';

$conn = get_db_connection();

if (!$conn) {
    die("Database connection failed.");
}

// Handle Delete Review
if (isset($_GET['delete'])) {
    $id = (int)$_GET['delete'];
    $conn->query("DELETE FROM pasabaybcd_ratings WHERE id = $id");
    header("Location: ratings.php");
    exit;
}

// Fetch Ratings with User and Driver Details
$query = "
    SELECT r.*, 
           u.full_name as reviewer_name, 
           d.driver_name as driver_name 
    FROM pasabaybcd_ratings r
    LEFT JOIN pasabaybcd_users u ON r.user_id = u.id
    LEFT JOIN pasabaybcd_drivers d ON r.driver_id = d.id
    ORDER BY r.created_at DESC
    LIMIT 50
";
$stmt = $conn->query($query);
$ratings = $stmt->fetchAll();

// Get Average Rating
$avg_rating = $conn->query("SELECT AVG(rating) FROM pasabaybcd_ratings")->fetchColumn();
$avg_rating = $avg_rating ? number_format($avg_rating, 1) : "N/A";

// Get Total Reviews
$total_reviews = $conn->query("SELECT COUNT(*) FROM pasabaybcd_ratings")->fetchColumn();

include 'layout/header.php';
include 'layout/sidebar.php';
?>

<div class="max-w-[1600px] mx-auto space-y-8">
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-2xl font-bold tracking-tight text-gray-900">Ratings & Reviews</h2>
      <p class="text-base text-gray-500 mt-1">Monitor driver performance and passenger feedback.</p>
    </div>
  </div>

  <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
    <div class="bg-white p-6 rounded shadow-sm border border-gray-100 flex items-center gap-6">
      <div class="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
        <span class="material-symbols-outlined text-[32px]">star</span>
      </div>
      <div>
        <h3 class="text-[12px] font-bold text-gray-400 uppercase tracking-widest">Platform Average</h3>
        <p class="text-4xl font-bold tracking-tighter text-gray-900 mt-1"><?php echo $avg_rating; ?> <span class="text-lg text-gray-400 font-normal">/ 5.0</span></p>
      </div>
    </div>
    <div class="bg-white p-6 rounded shadow-sm border border-gray-100 flex items-center gap-6">
      <div class="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
        <span class="material-symbols-outlined text-[32px]">forum</span>
      </div>
      <div>
        <h3 class="text-[12px] font-bold text-gray-400 uppercase tracking-widest">Total Reviews</h3>
        <p class="text-4xl font-bold tracking-tighter text-gray-900 mt-1"><?php echo number_format($total_reviews); ?></p>
      </div>
    </div>
  </div>

  <!-- Ratings List -->
  <div class="bg-white rounded border border-gray-100 shadow-sm overflow-hidden">
    <table class="w-full data-table">
      <thead>
        <tr>
          <th class="w-16">ID</th>
          <th>Booking ID</th>
          <th>Reviewer</th>
          <th>Driver</th>
          <th>Rating</th>
          <th>Review Text</th>
          <th>Date</th>
          <th class="text-right">Actions</th>
        </tr>
      </thead>
      <tbody>
        <?php if (empty($ratings)): ?>
          <tr><td colspan="8" class="text-center py-8 text-gray-400">No reviews found.</td></tr>
        <?php else: ?>
          <?php foreach ($ratings as $r): ?>
            <tr>
              <td class="font-bold text-gray-400">#<?php echo $r['id']; ?></td>
              <td>
                <?php if (!empty($r['booking_id'])): ?>
                  <a href="bookings.php?s=<?php echo urlencode($r['booking_id']); ?>" class="text-blue-600 hover:underline font-bold text-[13px]"><?php echo h($r['booking_id']); ?></a>
                <?php else: ?>
                  <span class="text-gray-400">-</span>
                <?php endif; ?>
              </td>
              <td class="font-bold text-gray-900"><?php echo h($r['reviewer_name'] ?: 'User #' . $r['user_id']); ?></td>
              <td class="font-bold text-gray-900"><?php echo h($r['driver_name'] ?: 'Driver #' . $r['driver_id']); ?></td>
              <td>
                <div class="flex items-center text-amber-500">
                  <?php for($i=1; $i<=5; $i++): ?>
                    <span class="material-symbols-outlined text-[16px] <?php echo $i <= $r['rating'] ? '' : 'text-gray-200'; ?>">star</span>
                  <?php endfor; ?>
                </div>
              </td>
              <td class="text-gray-600">
                <?php if (!empty($r['tags'])): ?>
                  <div class="flex flex-wrap gap-1 mb-1.5">
                    <?php foreach(explode(',', $r['tags']) as $tag): if(trim($tag)): ?>
                      <span class="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold uppercase tracking-wider border border-blue-100"><?php echo h(trim($tag)); ?></span>
                    <?php endif; endforeach; ?>
                  </div>
                <?php endif; ?>
                <span class="line-clamp-2" title="<?php echo h($r['review_text']); ?>"><?php echo $r['review_text'] ? h($r['review_text']) : '<em class="text-gray-400">No written review</em>'; ?></span>
              </td>
              <td class="text-gray-500 text-[13px] whitespace-nowrap"><?php echo date('M d, Y', strtotime($r['created_at'])); ?></td>
              <td class="text-right">
                <a href="ratings.php?delete=<?php echo $r['id']; ?>" onclick="return confirm('Delete this review completely?');" class="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded inline-block transition-colors" title="Delete Review">
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

<?php include 'layout/footer.php'; ?>

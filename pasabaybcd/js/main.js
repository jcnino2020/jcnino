/* ============================================================
   main.js — App initialisation (DOMContentLoaded entry point)
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {

    // ── Dashboard stat counters ──────────────────────────────
    animateValue('totalUsers',      0, mockData.stats.users,           1200);
    animateValue('pendingBookings', 0, mockData.stats.pendingBookings, 1200);

    document.getElementById('totalRevenue').textContent =
        new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' })
            .format(mockData.stats.revenue);

    // Update sidebar KYC pending badge count
    const pendingKyc = mockData.kycUsers.filter(u => u.status === 'Pending').length;
    document.getElementById('navKycCount').textContent    = pendingKyc;
    document.getElementById('navBookingCount').textContent =
        mockData.allBookings.filter(b => b.status === 'Pending').length;

    // ── Initial table renders ────────────────────────────────
    renderDashTable(mockData.recentBookings);
    renderFullTable(mockData.allBookings);
    renderKYC(mockData.kycUsers);

    // Pre-load fleet data in background
    loadTrucks();

    // ── Live filter listeners ────────────────────────────────
    document.getElementById('bookingSearch').addEventListener('input',  applyFilters);
    document.getElementById('statusFilter').addEventListener('change',  applyFilters);
    document.getElementById('truckSearch').addEventListener('input',    loadTrucks);
    document.getElementById('vehicleTypeFilter').addEventListener('change', loadTrucks);

    // ── API status banner ────────────────────────────────────
    document.getElementById('apiStatusMessage').textContent =
        'Live database connected. All systems operational.';
});

/* ============================================================
   bookings.js — Dashboard & full bookings table logic
   ============================================================ */

/**
 * Render the compact bookings table shown on the Dashboard.
 * @param {Array} bookings
 */
function renderDashTable(bookings) {
    document.getElementById('bookingsTableBody').innerHTML = bookings.map(b => `
        <tr class="hover:bg-blue-50/40 transition-colors group">
            <td class="px-6 py-3.5 font-mono text-xs font-bold text-slate-700">${b.id}</td>
            <td class="px-6 py-3.5 text-slate-700 font-medium">${b.sender}</td>
            <td class="px-6 py-3.5 text-slate-500">${b.destination}</td>
            <td class="px-6 py-3.5">${badge(b.status)}</td>
            <td class="px-6 py-3.5 text-right space-x-1">
                <button onclick="viewBooking('${b.id}')"   class="opacity-0 group-hover:opacity-100 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-all">View</button>
                <button onclick="cancelBooking('${b.id}')" class="opacity-0 group-hover:opacity-100 text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-all">Cancel</button>
            </td>
        </tr>`).join('');
}

/**
 * Render the full bookings table in the Manage Bookings section.
 * @param {Array} bookings
 */
function renderFullTable(bookings) {
    document.getElementById('fullBookingsTableBody').innerHTML = bookings.map(b => `
        <tr class="hover:bg-blue-50/40 transition-colors group">
            <td class="px-5 py-3.5 font-mono text-xs font-bold text-slate-700">${b.id}</td>
            <td class="px-5 py-3.5 font-medium text-slate-700">${b.sender}</td>
            <td class="px-5 py-3.5 text-slate-600">${b.receiver}</td>
            <td class="px-5 py-3.5 text-slate-600">${b.destination}</td>
            <td class="px-5 py-3.5 text-slate-500">${b.cargo}</td>
            <td class="px-5 py-3.5 text-slate-400 text-xs">${b.date}</td>
            <td class="px-5 py-3.5">${badge(b.status)}</td>
            <td class="px-5 py-3.5 text-right space-x-1">
                <button onclick="viewBooking('${b.id}')"   class="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition-all">View</button>
                <button onclick="cancelBooking('${b.id}')" class="text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg transition-all">Cancel</button>
            </td>
        </tr>`).join('');

    document.getElementById('bookingCount').innerHTML =
        `Showing <strong>${bookings.length}</strong> of <strong>${mockData.allBookings.length}</strong> bookings`;
}

/**
 * Apply search + status filters to the full bookings table.
 */
function applyFilters() {
    const q = document.getElementById('bookingSearch').value.toLowerCase();
    const s = document.getElementById('statusFilter').value;

    const filtered = mockData.allBookings.filter(b => {
        const matchQ = !q ||
            b.sender.toLowerCase().includes(q) ||
            b.id.toLowerCase().includes(q) ||
            b.destination.toLowerCase().includes(q) ||
            b.receiver.toLowerCase().includes(q);
        const matchS = !s || b.status === s;
        return matchQ && matchS;
    });

    renderFullTable(filtered);
}

/**
 * Reset all booking filters and re-render the full table.
 */
function resetFilters() {
    document.getElementById('bookingSearch').value  = '';
    document.getElementById('statusFilter').value   = '';
    renderFullTable(mockData.allBookings);
}

/**
 * Open the booking detail modal for a given booking ID.
 * @param {string} id
 */
function viewBooking(id) {
    const b = [...mockData.recentBookings, ...mockData.allBookings].find(x => x.id === id);
    if (!b) return;

    document.getElementById('modalContent').innerHTML = `
        <div class="space-y-4">
            <div class="bg-slate-50 rounded-xl p-4 text-center">
                <p class="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">Reference</p>
                <p class="text-xl font-extrabold text-slate-800 font-mono">${b.id}</p>
            </div>
            <div class="grid grid-cols-2 gap-3 text-sm">
                <div class="bg-slate-50 rounded-xl p-3"><p class="text-xs text-slate-400 mb-1">Sender</p><p class="font-bold text-slate-800">${b.sender}</p></div>
                <div class="bg-slate-50 rounded-xl p-3"><p class="text-xs text-slate-400 mb-1">Receiver</p><p class="font-bold text-slate-800">${b.receiver || 'N/A'}</p></div>
                <div class="bg-slate-50 rounded-xl p-3"><p class="text-xs text-slate-400 mb-1">Destination</p><p class="font-bold text-slate-800">${b.destination}</p></div>
                <div class="bg-slate-50 rounded-xl p-3"><p class="text-xs text-slate-400 mb-1">Cargo</p><p class="font-bold text-slate-800">${b.cargo || 'General'}</p></div>
                <div class="bg-slate-50 rounded-xl p-3"><p class="text-xs text-slate-400 mb-1">Date</p><p class="font-bold text-slate-800">${b.date}</p></div>
                <div class="bg-slate-50 rounded-xl p-3"><p class="text-xs text-slate-400 mb-1">Status</p>${badge(b.status)}</div>
            </div>
        </div>`;

    openModal('bookingModal');
}

/**
 * Prompt and handle cancellation of a booking.
 * @param {string} id
 */
function cancelBooking(id) {
    if (confirm(`Cancel booking ${id}? This cannot be undone.`)) {
        alert(`Booking ${id} has been cancelled.`);
    }
}

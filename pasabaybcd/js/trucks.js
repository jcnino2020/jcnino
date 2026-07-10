/* ============================================================
   trucks.js — Truck Fleet API integration & rendering
   ============================================================ */

/**
 * Fetch trucks from the API with current filter/sort params,
 * then render the fleet grid and update summary stats.
 */
async function loadTrucks() {
    const grid  = document.getElementById('truckGrid');
    const errEl = document.getElementById('fleetError');
    errEl.classList.add('hidden');

    // Show skeleton placeholders while loading
    grid.innerHTML = [1, 2, 3].map(() => `
        <div class="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse space-y-3">
            <div class="h-4 bg-slate-200 rounded w-1/2"></div>
            <div class="h-3 bg-slate-100 rounded w-3/4"></div>
            <div class="h-3 bg-slate-100 rounded w-2/3"></div>
            <div class="h-3 bg-slate-100 rounded w-full"></div>
        </div>`).join('');

    // Build query string from filter UI
    const params = new URLSearchParams();
    const q    = document.getElementById('truckSearch').value.trim();
    const type = document.getElementById('vehicleTypeFilter').value;
    if (q)              params.append('q',            q);
    if (type !== 'All') params.append('vehicle_type', type);
    params.append('sort_by', fleetSort);

    try {
        const res = await fetch(`${TRUCKS_API}?${params.toString()}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const trucks = await res.json();
        if (trucks.error) throw new Error(trucks.error);

        renderTrucks(trucks);
        updateFleetStats(trucks);

        // Sync the stat card on the dashboard
        animateValue('activeTrucks', 0, trucks.length, 1000);

    } catch (err) {
        grid.innerHTML = '';
        document.getElementById('fleetErrorMsg').textContent = err.message;
        errEl.classList.remove('hidden');
        console.error('Fleet load error:', err);
    }
}

/**
 * Set the active sort mode (Rating | Price) and reload.
 * @param {string} val
 */
function setFleetSort(val) {
    fleetSort = val;

    document.getElementById('sortRatingBtn').className =
        'px-4 py-2.5 text-sm font-semibold transition-colors ' +
        (val === 'Rating' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50');

    document.getElementById('sortPriceBtn').className =
        'px-4 py-2.5 text-sm font-semibold transition-colors ' +
        (val === 'Price' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50');

    loadTrucks();
}

/**
 * Update the fleet summary stat cards (total, avg rating, avg price).
 * @param {Array} trucks
 */
function updateFleetStats(trucks) {
    document.getElementById('fleetTotal').textContent = trucks.length;

    if (trucks.length === 0) {
        document.getElementById('fleetAvgRating').textContent = '—';
        document.getElementById('fleetAvgPrice').textContent  = '—';
        return;
    }

    const avgRating = (trucks.reduce((s, t) => s + t.rating, 0) / trucks.length).toFixed(1);
    const avgPrice  =  trucks.reduce((s, t) => s + t.price,  0) / trucks.length;

    document.getElementById('fleetAvgRating').textContent = `${avgRating} ⭐`;
    document.getElementById('fleetAvgPrice').textContent  =
        new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(avgPrice);
}

/**
 * Render truck cards into the fleet grid.
 * @param {Array} trucks
 */
function renderTrucks(trucks) {
    const grid = document.getElementById('truckGrid');

    if (trucks.length === 0) {
        grid.innerHTML = `
            <div class="col-span-3 text-center py-16 text-slate-400">
                <svg class="w-12 h-12 mx-auto mb-3 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 2h1m7-12h2l3 3 1 1v4h-7V4z"/>
                </svg>
                <p class="text-sm font-semibold">No trucks found for this filter.</p>
            </div>`;
        return;
    }

    grid.innerHTML = trucks.map(t => {
        const stars          = starRating(t.rating);
        const priceFormatted = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(t.price);
        const vaccinatedBadge = t.isVaccinated
            ? `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">✅ Vaccinated</span>`
            : `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-500">Unvaccinated</span>`;

        return `
        <div class="truck-card bg-white rounded-2xl border border-slate-100 p-5 cursor-pointer shadow-sm" onclick="viewTruck(${t.id})">
            <div class="flex items-start justify-between mb-3">
                <span class="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">${t.type}</span>
                <div class="text-right">
                    <div class="text-sm leading-none">${stars}</div>
                    <p class="text-xs text-slate-400 mt-0.5">${t.rating.toFixed(1)} rating</p>
                </div>
            </div>
            <h4 class="text-base font-extrabold text-slate-800 tracking-widest mb-0.5">${t.plateNumber}</h4>
            <div class="flex items-center flex-wrap gap-2 mb-4">
                <span class="text-sm text-slate-600 font-medium">${t.driverName}</span>
                ${vaccinatedBadge}
            </div>
            <div class="space-y-1.5 mb-4">
                <div class="flex items-center text-xs text-slate-500">
                    <svg class="w-3.5 h-3.5 mr-1.5 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    <span class="truncate">${t.route || '—'}</span>
                </div>
                <div class="flex items-center text-xs text-slate-500">
                    <svg class="w-3.5 h-3.5 mr-1.5 text-purple-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    Departs ${t.departTime || '—'}
                </div>
            </div>
            <div class="flex items-center justify-between pt-3 border-t border-slate-50">
                <span class="text-sm font-extrabold text-emerald-600">${priceFormatted}</span>
                <span class="text-xs text-slate-400">${t.capacityKg} kg &bull; ${t.capacityCbm} cbm</span>
            </div>
        </div>`;
    }).join('');
}

/**
 * Open the truck detail modal by fetching full data for a given ID.
 * @param {number} id
 */
async function viewTruck(id) {
    try {
        const res    = await fetch(TRUCKS_API);
        const trucks = await res.json();
        const t      = trucks.find(x => x.id === id);
        if (!t) return;

        const priceFormatted = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(t.price);

        document.getElementById('truckModalContent').innerHTML = `
            <div class="space-y-4">
                <div class="bg-slate-50 rounded-xl p-4 text-center">
                    <p class="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">Plate Number</p>
                    <p class="text-2xl font-extrabold text-slate-800 tracking-widest">${t.plateNumber}</p>
                    <p class="text-sm text-blue-600 font-semibold mt-1">${t.type}</p>
                </div>
                <div class="grid grid-cols-2 gap-3 text-sm">
                    <div class="bg-slate-50 rounded-xl p-3"><p class="text-xs text-slate-400 mb-1">Driver</p><p class="font-bold text-slate-800">${t.driverName}</p></div>
                    <div class="bg-slate-50 rounded-xl p-3"><p class="text-xs text-slate-400 mb-1">Rating</p><p class="font-bold text-slate-800">${starRating(t.rating)} ${t.rating}</p></div>
                    <div class="bg-slate-50 rounded-xl p-3"><p class="text-xs text-slate-400 mb-1">Base Price</p><p class="font-bold text-emerald-600">${priceFormatted}</p></div>
                    <div class="bg-slate-50 rounded-xl p-3"><p class="text-xs text-slate-400 mb-1">Departs</p><p class="font-bold text-slate-800">${t.departTime || '—'}</p></div>
                    <div class="bg-slate-50 rounded-xl p-3"><p class="text-xs text-slate-400 mb-1">Capacity</p><p class="font-bold text-slate-800">${t.capacityKg} kg / ${t.capacityCbm} cbm</p></div>
                    <div class="bg-slate-50 rounded-xl p-3"><p class="text-xs text-slate-400 mb-1">Driver Health</p><p class="font-bold ${t.isVaccinated ? 'text-emerald-600' : 'text-slate-500'}">${t.isVaccinated ? '✅ Vaccinated' : 'Not vaccinated'}</p></div>
                    <div class="col-span-2 bg-slate-50 rounded-xl p-3"><p class="text-xs text-slate-400 mb-1">Current Route</p><p class="font-bold text-slate-800">${t.route || '—'}</p></div>
                </div>
            </div>`;

        openModal('truckModal');
    } catch (err) {
        alert('Could not load truck details. Please try again.');
    }
}

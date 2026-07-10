/* ============================================================
   utils.js — Shared helper functions
   ============================================================ */

/**
 * Animate a numeric counter from start to end over duration ms.
 * @param {string} id       - Element ID to update
 * @param {number} start
 * @param {number} end
 * @param {number} dur      - Duration in milliseconds
 */
function animateValue(id, start, end, dur) {
    const el = document.getElementById(id);
    if (!el) return;
    let ts = null;
    const step = t => {
        if (!ts) ts = t;
        const p = Math.min((t - ts) / dur, 1);
        el.textContent = Math.floor(p * (end - start) + start);
        if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
}

/**
 * Returns a star rating string (e.g. ⭐⭐⭐✨☆) for a 0–5 rating.
 * @param {number} rating
 * @returns {string}
 */
function starRating(rating) {
    const full  = Math.floor(rating);
    const half  = rating % 1 >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    return '⭐'.repeat(full) + (half ? '✨' : '') + '☆'.repeat(empty);
}

/**
 * Returns a colored badge HTML string for a given status.
 * @param {string} status
 * @returns {string}
 */
function badge(status) {
    const map = {
        'In Transit': 'bg-blue-100 text-blue-700',
        'Pending':    'bg-amber-100 text-amber-700',
        'Delivered':  'bg-emerald-100 text-emerald-700',
        'Cancelled':  'bg-red-100 text-red-600',
        'Verified':   'bg-emerald-100 text-emerald-700',
        'Rejected':   'bg-red-100 text-red-600'
    };
    const cls = map[status] || 'bg-slate-100 text-slate-600';
    return `<span class="px-2.5 py-1 rounded-full text-xs font-bold ${cls}">${status}</span>`;
}

/**
 * Open a modal overlay by ID.
 * @param {string} id
 */
function openModal(id) {
    document.getElementById(id)?.classList.add('open');
}

/**
 * Close a modal overlay by ID.
 * @param {string} id
 */
function closeModal(id) {
    document.getElementById(id)?.classList.remove('open');
}

/**
 * Toggle password field visibility.
 * @param {string} inputId
 * @param {HTMLElement} btn
 */
function togglePw(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.type = input.type === 'password' ? 'text' : 'password';
}

/**
 * Handle logout confirmation.
 */
function handleLogout() {
    if (confirm('Log out of Admin Panel?')) alert('Logged out. Redirecting to login...');
}

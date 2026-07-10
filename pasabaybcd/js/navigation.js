/* ============================================================
   navigation.js — Sidebar navigation & page routing
   ============================================================ */

const pageMeta = {
    dashboard: { title: 'System Overview',       sub: 'Dashboard'            },
    bookings:  { title: 'Manage Bookings',        sub: 'Bookings'             },
    fleet:     { title: 'Truck Fleet',            sub: 'Fleet Management'     },
    kyc:       { title: 'User KYC Verification',  sub: 'Identity Verification'},
    settings:  { title: 'System Settings',        sub: 'Configuration'        }
};

/**
 * Navigate to a named section, updating the sidebar active state,
 * visible page section, and header title/subtitle.
 * @param {string} name
 */
function navigateTo(name) {
    // Update sidebar link active state
    document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
    const activeLink = document.querySelector(`[data-section="${name}"]`);
    if (activeLink) activeLink.classList.add('active');

    // Show the correct section
    document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(`section-${name}`);
    if (target) target.classList.add('active');

    // Update header text
    const meta = pageMeta[name];
    if (meta) {
        document.getElementById('pageTitle').textContent    = meta.title;
        document.getElementById('pageSubtitle').textContent = `${meta.sub} \u2022 March 10, 2026`;
    }

    // Lazy-load fleet data when that section is first opened
    if (name === 'fleet') loadTrucks();
}

// ── Wire up sidebar links ──────────────────────────────────
document.querySelectorAll('.sidebar-link').forEach(link => {
    link.addEventListener('click', e => {
        e.preventDefault();
        const sec = link.getAttribute('data-section');
        if (sec) navigateTo(sec);
    });
});

// ── Sidebar collapse toggle ────────────────────────────────
document.getElementById('sidebarToggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('collapsed');
});

// ── Close any modal when clicking its backdrop ─────────────
document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
        if (e.target === overlay) overlay.classList.remove('open');
    });
});

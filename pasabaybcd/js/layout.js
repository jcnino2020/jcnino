const Layout = {
  init() {
    this.injectSidebar();
    this.injectHeader();
    this.setupClock();
    this.highlightActiveLink();
  },

  injectSidebar() {
    const adminName = localStorage.getItem('adminName') || 'Admin';
    const adminEmail = localStorage.getItem('adminEmail') || 'admin@pasabaybcd.ph';
    const initial = adminName.charAt(0).toUpperCase();

    const sidebarHTML = `
      <!-- Mobile Sidebar Overlay -->
      <div id="sidebar-overlay" class="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 hidden md:hidden transition-opacity" onclick="toggleSidebar()"></div>

      <aside id="sidebar" class="h-screen w-64 fixed left-0 top-0 flex flex-col z-[60] transform -translate-x-full md:translate-x-0 transition-transform duration-300 ease-in-out">
        <div class="p-6 border-b border-surface-container flex items-center gap-3">
          <div class="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center p-2">
            <img src="assets/images/logo-white.png" alt="Logo" class="w-full h-full" onerror="this.src='assets/app-icon.png'">
          </div>
          <div>
            <h1 class="text-base font-bold tracking-tighter text-on-surface">PasabayBCD</h1>
            <p class="text-[10px] font-bold tracking-widest text-outline uppercase mt-0.5">Admin</p>
          </div>
        </div>

        <nav class="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto" id="sidebar-nav">
          <p class="text-[12px] font-bold text-outline uppercase tracking-widest px-3 pb-2 pt-1">Main Menu</p>
          <a href="dashboard.html" class="sidebar-link" data-page="dashboard">
            <span class="sicon material-symbols-outlined text-blue-600">dashboard</span>
            <span>Dashboard</span>
          </a>
          <a href="analytics.html" class="sidebar-link" data-page="analytics">
            <span class="sicon material-symbols-outlined text-gray-500">bar_chart</span>
            <span>Analytics</span>
          </a>
          <a href="bookings.html" class="sidebar-link" data-page="bookings">
            <span class="sicon material-symbols-outlined text-gray-500">calendar_today</span>
            <span>Manage Bookings</span>
          </a>
          <a href="fleet.html" class="sidebar-link" data-page="fleet">
            <span class="sicon material-symbols-outlined text-gray-500">local_shipping</span>
            <span>Truck Fleet</span>
          </a>

          <div class="pt-2 pb-1">
            <p class="text-[11px] font-bold text-outline uppercase tracking-widest px-3 pb-1">Users</p>
          </div>
          <a href="users.html" class="sidebar-link" data-page="users">
            <span class="sicon material-symbols-outlined text-gray-500">manage_accounts</span>
            <span>User Management</span>
          </a>
          <a href="kyc.html" class="sidebar-link" data-page="kyc">
            <span class="sicon material-symbols-outlined text-gray-500">verified_user</span>
            <span>User KYC</span>
          </a>

          <div class="pt-2 pb-1">
            <p class="text-[11px] font-bold text-outline uppercase tracking-widest px-3 pb-1">Features</p>
          </div>
          <a href="notifications.html" class="sidebar-link" data-page="notifications">
            <span class="sicon material-symbols-outlined text-gray-500">notifications</span>
            <span>Notifications</span>
          </a>
          <a href="transactions.html" class="sidebar-link" data-page="transactions">
            <span class="sicon material-symbols-outlined text-gray-500">payments</span>
            <span>Transactions Log</span>
          </a>
          <a href="ratings.html" class="sidebar-link" data-page="ratings">
            <span class="sicon material-symbols-outlined text-gray-500">star_rate</span>
            <span>Ratings & Reviews</span>
          </a>

          <div class="pt-2 pb-1">
            <p class="text-[11px] font-bold text-outline uppercase tracking-widest px-3 pb-1">System</p>
          </div>
          <a href="settings.html" class="sidebar-link" data-page="settings">
            <span class="sicon material-symbols-outlined text-gray-500">settings</span>
            <span>Settings</span>
          </a>
        </nav>

        <div class="p-4 border-t border-surface-container mt-auto">
          <div class="flex items-center gap-3 px-1">
            <div class="w-9 h-9 rounded bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-base flex-shrink-0">${initial}</div>
            <div class="flex-1 min-w-0">
              <p class="text-base font-bold text-on-surface truncate">${adminName}</p>
              <p class="text-[12px] text-outline truncate">${adminEmail}</p>
            </div>
            <button onclick="logout()" title="Log out" class="text-outline hover:text-red-500 transition-colors flex-shrink-0 focus:outline-none">
              <span class="material-symbols-outlined text-lg">logout</span>
            </button>
          </div>
        </div>
      </aside>
    `;
    document.body.insertAdjacentHTML('afterbegin', sidebarHTML);
  },

  injectHeader() {
    const headerHTML = `
      <header class="fixed top-0 right-0 w-full md:w-[calc(100%-16rem)] h-16 glass-panel border-b border-surface-container z-40 flex items-center justify-between px-4 md:px-8 transition-width duration-300 bg-white/90 backdrop-blur-md">
        <div class="flex items-center md:gap-4 gap-2">
          <button onclick="toggleSidebar()" class="md:hidden p-1.5 text-gray-500 hover:bg-gray-100 rounded focus:outline-none transition-colors">
            <span class="material-symbols-outlined text-2xl">menu</span>
          </button>
          <div>
            <h2 class="text-base font-bold text-on-surface leading-tight hidden sm:block">PasabayBCD Administration</h2>
            <h2 class="text-base font-bold text-on-surface leading-tight sm:hidden">PasabayBCD</h2>
            <div class="flex items-center gap-3">
              <p id="live-clock" class="text-[12px] text-gray-500 font-bold uppercase tracking-tight"></p>
              <div class="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[9px] font-black tracking-widest border border-emerald-100 uppercase">
                <div class="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                OPERATIONAL
              </div>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-4">
          <form onsubmit="event.preventDefault(); window.location.href='search.html?s=' + this.s.value;" class="relative hidden md:block">
            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">search</span>
            <input type="text" name="s" placeholder="Global Search..." class="pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded text-base focus:ring-2 focus:ring-blue-500 outline-none w-56 transition-all">
          </form>
          
          <div class="relative group">
            <button class="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded text-[12px] uppercase font-bold hover:bg-blue-100 transition-colors">
              Quick Actions
              <span class="material-symbols-outlined text-base">expand_more</span>
            </button>
            <div class="absolute right-0 mt-2 w-52 bg-white rounded shadow-xl border border-gray-100 py-2 hidden group-hover:block z-50">
              <a href="add_booking.html" class="block px-4 py-2 text-[12px] font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-600 uppercase tracking-widest">New Shipment</a>
              <a href="add_truck.html" class="block px-4 py-2 text-[12px] font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-600 uppercase tracking-widest">Add Truck</a>
              <div class="border-t border-gray-50 my-1"></div>
              <a href="analytics.html" class="block px-4 py-2 text-[12px] font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-600 uppercase tracking-widest">Analytics</a>
              <a href="users.html" class="block px-4 py-2 text-[12px] font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-600 uppercase tracking-widest">User Management</a>
            </div>
          </div>
        </div>
      </header>
    `;
    document.body.insertAdjacentHTML('afterbegin', headerHTML);
  },

  setupClock() {
    function updateClock() {
      const now = new Date();
      const options = { 
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
      };
      const clockEl = document.getElementById('live-clock');
      if (clockEl) clockEl.textContent = now.toLocaleString('en-US', options);
    }
    setInterval(updateClock, 1000);
    updateClock();
  },

  highlightActiveLink() {
    const currentPage = window.location.pathname.split('/').pop().replace('.html', '') || 'dashboard';
    const links = document.querySelectorAll('.sidebar-link');
    links.forEach(link => {
      if (link.dataset.page === currentPage) {
        link.classList.add('active', 'bg-blue-50', 'text-blue-600', 'font-bold', 'border-l-4', 'border-blue-600');
        const icon = link.querySelector('.sicon');
        if (icon) {
            icon.classList.remove('text-gray-500');
            icon.classList.add('text-blue-600');
        }
      }
    });
  }
};

window.toggleSidebar = function() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  sidebar.classList.toggle('-translate-x-full');
  overlay.classList.toggle('hidden');
};

window.logout = function() {
  localStorage.removeItem('token');
  localStorage.removeItem('adminName');
  localStorage.removeItem('adminEmail');
  window.location.href = 'index.html';
};

// Auto-init if DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => Layout.init());
} else {
  Layout.init();
}

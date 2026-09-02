/**
 * JC Niñonuevo Portfolio - Admin Core Engine (admin-core.js)
 * Shared administrative state, authentication, persistence, GitHub cloud sync,
 * Command Palette (⌘K), collapsible sidebar, and unified UI controllers.
 * 
 * 2026 Editorial Standard — Strict No-Pills Geometry
 */

// Shared State
let localData = window.galleryData ? JSON.parse(JSON.stringify(window.galleryData)) : {};
let localSnapshots = [];
let projectDirHandle = null;
let sessionIdleTimer = null;
let lastUserActivityTime = Date.now();
let isSidebarCollapsed = localStorage.getItem('pm_sidebar_collapsed') === 'true';

// Load persistent local edits if available
try {
  const savedState = localStorage.getItem('pm_local_data_v2');
  if (savedState) {
    const parsed = JSON.parse(savedState);
    if (parsed && typeof parsed === 'object') {
      localData = Object.assign({}, localData, parsed);
    }
  }
} catch (e) {
  console.warn("Could not read local draft data:", e);
}

// Load snapshots history
try {
  const savedSnapshots = localStorage.getItem('pm_snapshots');
  if (savedSnapshots) {
    localSnapshots = JSON.parse(savedSnapshots) || [];
  }
} catch (e) {
  console.warn("Could not read local snapshots:", e);
}

// Save local state to localStorage
function persistLocalState() {
  try {
    localStorage.setItem('pm_local_data_v2', JSON.stringify(localData));
  } catch (e) {
    console.warn("Could not persist local draft data:", e);
  }
}

// ==========================================================================
// ENVIRONMENT & AUTHENTICATION
// ==========================================================================
function checkIsLocalEnvironment() {
  const host = window.location.hostname;
  return (
    !host ||
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '0.0.0.0' ||
    host === '[::1]' ||
    host.startsWith('192.168.') ||
    host.startsWith('10.') ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    window.location.protocol === 'file:'
  );
}

async function attemptLogin(onSuccess) {
  const passwordInput = document.getElementById('login-password');
  const loginCard = document.getElementById('login-card');
  const loginBtn = document.getElementById('login-btn');
  if (!passwordInput || !loginBtn) return;

  const password = passwordInput.value.trim();
  if (!password) {
    showLoginError("Password is required");
    return;
  }

  loginBtn.disabled = true;
  loginBtn.innerHTML = `
    <svg class="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation: spin 1s linear infinite;"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle><path d="M12 2a10 10 0 0 1 10 10"></path></svg>
    Verifying...
  `;

  const isLocal = checkIsLocalEnvironment();

  try {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });

    let data = {};
    try { data = await res.json(); } catch (e) {}

    if (res.ok && data.success) {
      sessionStorage.setItem('pm_auth', data.token);
      hideLoginOverlay();
      if (typeof onSuccess === 'function') onSuccess();
      showToast("Authenticated successfully. Welcome back, JC!", "success");
    } else if (isLocal) {
      sessionStorage.setItem('pm_auth', 'local_sandbox_authorized');
      hideLoginOverlay();
      if (typeof onSuccess === 'function') onSuccess();
      showToast("Local sandbox mode activated. Access granted.", "success");
    } else {
      showLoginError(data.error || "Incorrect password");
    }
  } catch (err) {
    console.error("Auth error:", err);
    if (isLocal) {
      sessionStorage.setItem('pm_auth', 'local_sandbox_authorized');
      hideLoginOverlay();
      if (typeof onSuccess === 'function') onSuccess();
      showToast("Offline local sandbox mode activated. Access granted.", "success");
    } else {
      showLoginError("Offline mode: Unable to connect to the authentication server.");
    }
  } finally {
    loginBtn.disabled = false;
    loginBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
      Verify Credentials
    `;
  }
}

function showLoginError(msg) {
  const errorText = document.getElementById('login-error');
  const loginCard = document.getElementById('login-card');
  if (errorText) {
    errorText.textContent = msg;
    errorText.classList.remove('hidden');
  }
  if (loginCard) {
    loginCard.classList.remove('shake-error');
    void loginCard.offsetWidth;
    loginCard.classList.add('shake-error');
  }
  const passInput = document.getElementById('login-password');
  if (passInput) passInput.focus();
}

function hideLoginOverlay() {
  const overlay = document.getElementById('login-overlay');
  if (overlay) {
    overlay.style.transition = 'opacity 0.25s ease';
    overlay.style.opacity = '0';
    setTimeout(() => {
      overlay.classList.add('hidden');
      overlay.style.display = 'none';
    }, 250);
  }
}

function showLoginOverlayWithError(msg) {
  sessionStorage.removeItem('pm_auth');
  const overlay = document.getElementById('login-overlay');
  if (overlay) {
    overlay.classList.remove('hidden');
    overlay.style.display = 'flex';
    overlay.style.opacity = '1';
  }
  const styleEl = document.getElementById('early-auth-style');
  if (styleEl) styleEl.remove();
  showLoginError(msg);
}

function lockSession() {
  sessionStorage.removeItem('pm_auth');
  const overlay = document.getElementById('login-overlay');
  if (overlay) {
    overlay.classList.remove('hidden');
    overlay.style.display = 'flex';
    overlay.style.opacity = '1';
    const err = document.getElementById('login-error');
    if (err) err.classList.add('hidden');
    const pwd = document.getElementById('login-password');
    if (pwd) { pwd.value = ''; pwd.focus(); }
  }
  showToast("Admin session locked.", "success");
}

async function verifySessionOnLoad(onSuccess) {
  const token = sessionStorage.getItem('pm_auth');
  if (!token) return;

  const isLocal = checkIsLocalEnvironment();
  if (isLocal && token === 'local_sandbox_authorized') {
    hideLoginOverlay();
    if (typeof onSuccess === 'function') onSuccess();
    return;
  }

  try {
    const res = await fetch('/api/logs', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.ok) {
      hideLoginOverlay();
      if (typeof onSuccess === 'function') onSuccess();
    } else {
      showLoginOverlayWithError("Session expired or invalid. Please verify credentials.");
    }
  } catch (err) {
    console.error("Session verification failed:", err);
    if (isLocal) {
      sessionStorage.setItem('pm_auth', 'local_sandbox_authorized');
      hideLoginOverlay();
      if (typeof onSuccess === 'function') onSuccess();
    } else {
      showLoginOverlayWithError("Authentication server unreachable. Please log in again.");
    }
  }
}

function initSessionTimeoutGuard() {
  const timeoutMinutes = (localData.settings && localData.settings.app && localData.settings.app.sessionTimeout) || 15;
  const timeoutMs = timeoutMinutes * 60 * 1000;

  ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'].forEach(evt => {
    window.addEventListener(evt, () => {
      lastUserActivityTime = Date.now();
    }, { passive: true });
  });

  if (sessionIdleTimer) clearInterval(sessionIdleTimer);
  sessionIdleTimer = setInterval(() => {
    if (!sessionStorage.getItem('pm_auth')) return;
    if (Date.now() - lastUserActivityTime > timeoutMs) {
      sessionStorage.removeItem('pm_auth');
      showLoginOverlayWithError(`Session expired after ${timeoutMinutes} minutes of inactivity.`);
    }
  }, 30000);
}

// ==========================================================================
// FILE SYSTEM ACCESS & DATABASE SAVING
// ==========================================================================
async function connectProjectFolder() {
  try {
    projectDirHandle = await window.showDirectoryPicker();
    const btn = document.getElementById('folder-btn');
    const text = document.getElementById('folder-btn-text');
    if (btn) {
      btn.classList.add('border-emerald-500', 'text-emerald-400');
    }
    if (text) text.textContent = "Linked";
    showToast("Project folder linked successfully! Direct disk write enabled.", "success");
  } catch (err) {
    if (err.name !== 'AbortError') {
      showToast("Failed to link project folder. Please try again.", "error");
      console.error(err);
    }
  }
}

function toggleSaveDropdown() {
  const dropdown = document.getElementById('save-dropdown');
  if (dropdown) dropdown.classList.toggle('hidden');
}

function compileDatabase() {
  return `/**
 * JC Niñonuevo Portfolio
 * Gallery & Video Database
 * Centralized file for easy photo/video management
 */
window.galleryData = ${JSON.stringify(localData, null, 2)};
`;
}

// Helper to convert Blob or File to raw Base64 string (without data: prefix)
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result.split(',')[1];
      resolve(base64data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Publish direct changes to GitHub repository via serverless /api/save endpoint
async function publishToLiveSite(extraFiles = [], customMessage = null) {
  const dropdown = document.getElementById('save-dropdown');
  if (dropdown) dropdown.classList.add('hidden');

  const token = sessionStorage.getItem('pm_auth') || '';
  const isLocal = checkIsLocalEnvironment();

  const saveBtn = document.getElementById('save-main-btn');
  const originalSaveBtnText = saveBtn ? saveBtn.innerHTML : '';
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = `
      <svg class="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation: spin 1s linear infinite;"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle><path d="M12 2a10 10 0 0 1 10 10"></path></svg>
      Publishing...
    `;
  }

  showToast("Pushing updates to GitHub repository...", "success");

  try {
    const filesToCommit = [
      {
        path: 'assets/gallery-data.js',
        content: compileDatabase(),
        encoding: 'utf-8'
      },
      ...extraFiles
    ];

    const message = customMessage || `CMS Update: Modified portfolio gallery data [skip ci]`;

    const res = await fetch('/api/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        files: filesToCommit,
        message: message
      })
    });

    const data = await res.json();

    if (res.ok && data.success) {
      window.galleryData = JSON.parse(JSON.stringify(localData));
      persistLocalState();
      takeSnapshot("Live Publish", `Committed ${filesToCommit.length} file(s) to GitHub: ${data.commitSha ? data.commitSha.substring(0, 7) : 'latest'}`);
      
      showToast("Committed to GitHub. Live deployment active (~20s).", "success");
      return true;
    } else {
      const errorMsg = data.error || "Failed to commit changes to GitHub.";
      if (data.setupGuide) {
        alert(`${errorMsg}\n\n${data.setupGuide}`);
      }
      showToast(`GitHub Publish Failed: ${errorMsg}`, "error");
      return false;
    }
  } catch (err) {
    console.error("Cloud publish error:", err);
    showToast(`Error during GitHub publish: ${err.message}`, "error");
    return false;
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = originalSaveBtnText;
    }
  }
}

async function saveChangesDirectly() {
  toggleSaveDropdown();
  
  if (projectDirHandle) {
    try {
      const content = compileDatabase();
      let assetsHandle;
      try {
        assetsHandle = await projectDirHandle.getDirectoryHandle('assets', { create: true });
      } catch (e) {
        assetsHandle = projectDirHandle;
      }
      const fileHandle = await assetsHandle.getFileHandle('gallery-data.js', { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();

      window.galleryData = JSON.parse(JSON.stringify(localData));
      persistLocalState();
      takeSnapshot("Direct Save", "Database saved directly to assets/gallery-data.js");
      showToast("Saved to assets/gallery-data.js on your computer.", "success");
      return;
    } catch (err) {
      console.warn("Local folder write failed, falling back to live publish/file picker:", err);
    }
  }

  const isCloudHost = !checkIsLocalEnvironment();
  if (isCloudHost) {
    await publishToLiveSite([], "CMS Update: Saved gallery changes via admin");
  } else {
    try {
      const content = compileDatabase();
      if ('showSaveFilePicker' in window) {
        const handle = await window.showSaveFilePicker({
          suggestedName: 'gallery-data.js',
          types: [{
            description: 'JavaScript Files',
            accept: { 'text/javascript': ['.js'] }
          }]
        });
        const writable = await handle.createWritable();
        await writable.write(content);
        await writable.close();

        window.galleryData = JSON.parse(JSON.stringify(localData));
        persistLocalState();
        takeSnapshot("Direct Save", "Database saved directly to gallery-data.js");
        showToast("Database saved directly to assets/gallery-data.js.", "success");
      } else {
        await publishToLiveSite([], "CMS Update: Saved gallery changes via admin");
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        await publishToLiveSite([], "CMS Update: Saved gallery changes via admin");
      }
    }
  }
}

function downloadDatabase() {
  toggleSaveDropdown();
  const content = compileDatabase();
  const blob = new Blob([content], { type: 'text/javascript' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = 'gallery-data.js';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  persistLocalState();
  takeSnapshot("File Download", "Exported database as downloadable JS file");
  showToast("gallery-data.js downloaded. Copy to assets/ directory.", "success");
}

function copyToClipboard() {
  toggleSaveDropdown();
  const content = compileDatabase();
  navigator.clipboard.writeText(content).then(() => {
    showToast("Source code copied to clipboard.", "success");
  }).catch(err => {
    showToast("Failed to copy source code to clipboard.", "error");
    console.error(err);
  });
}

// ==========================================================================
// SNAPSHOTS & REVISIONS
// ==========================================================================
function takeSnapshot(label = "Manual Snapshot", note = "") {
  const snapshot = {
    id: 'snap_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    timestamp: new Date().toISOString(),
    label: label,
    note: note,
    counts: {
      highlights: (localData.highlights || []).length,
      drone: (localData.drone || []).length,
      framed: (localData.framed || []).length,
      events: (localData.events || []).length,
      videos: (localData.videos || []).length,
      videos2: (localData.videos2 || []).length
    },
    data: JSON.parse(JSON.stringify(localData))
  };

  localSnapshots.unshift(snapshot);
  if (localSnapshots.length > 50) localSnapshots.pop();

  try {
    localStorage.setItem('pm_snapshots', JSON.stringify(localSnapshots));
  } catch (e) {
    console.warn("Could not save snapshot:", e);
  }

  updateBadges();
  return snapshot;
}

function restoreSnapshot(snapshotId) {
  const found = localSnapshots.find(s => s.id === snapshotId);
  if (!found) {
    showToast("Snapshot not found.", "error");
    return false;
  }

  localData = JSON.parse(JSON.stringify(found.data));
  persistLocalState();
  updateBadges();
  showToast(`Restored revision: "${found.label}"`, "success");
  return true;
}

function createManualSnapshotPrompt() {
  const label = prompt("Enter a description or label for this snapshot backup:", "Manual Reorder / Edit");
  if (label && label.trim()) {
    takeSnapshot(label.trim(), "Created manually from backup console");
    showToast(`Snapshot "${label.trim()}" registered.`, "success");
    if (typeof renderBackupsTimeline === 'function') {
      renderBackupsTimeline();
    }
  }
}

function clearAllSnapshots() {
  if (confirm("Are you sure you want to clear all historical revision snapshots?")) {
    localSnapshots = [];
    try {
      localStorage.removeItem('pm_snapshots');
    } catch (e) {}
    updateBadges();
    if (typeof renderBackupsTimeline === 'function') {
      renderBackupsTimeline();
    }
    showToast("Revision timeline cleared.", "success");
  }
}

// ==========================================================================
// TOAST NOTIFICATIONS & UTILITIES
// ==========================================================================
let toastTimer = null;
function showToast(message, type = "success") {
  const toast = document.getElementById('toast');
  const msg = document.getElementById('toast-message');
  const iconSuccess = document.getElementById('toast-icon-success');
  const iconError = document.getElementById('toast-icon-error');

  if (!toast || !msg) return;

  msg.textContent = message;

  if (type === "success") {
    if (iconSuccess) iconSuccess.classList.remove('hidden');
    if (iconError) iconError.classList.add('hidden');
  } else {
    if (iconSuccess) iconSuccess.classList.add('hidden');
    if (iconError) iconError.classList.remove('hidden');
  }

  toast.classList.remove('hidden');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.add('hidden');
  }, 4000);
}

function formatDateManila(dateVal) {
  if (!dateVal) return 'N/A';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleString('en-US', {
    timeZone: 'Asia/Manila',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function timeAgo(dateVal) {
  if (!dateVal) return 'N/A';
  const time = new Date(dateVal).getTime();
  if (isNaN(time)) return 'N/A';
  const diff = Math.max(0, Math.floor((Date.now() - time) / 1000));
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function updateBadges() {
  const cats = ['highlights', 'drone', 'framed', 'events', 'videos', 'videos2'];
  cats.forEach(c => {
    const count = (localData[c] || []).length;
    const bDesktop = document.getElementById(`badge-${c}`);
    const bMobile = document.getElementById(`mobile-badge-${c}`);
    if (bDesktop) bDesktop.textContent = count;
    if (bMobile) bMobile.textContent = count;
  });

  const bBackups = document.getElementById('badge-backups');
  if (bBackups) bBackups.textContent = localSnapshots.length;
}

function previewAccentColor(colorKey) {
  const colorMap = {
    default: "#FFFFFF",
    emerald: "#10B981",
    violet: "#A855F7",
    gold: "#F59E0B",
    rose: "#F43F5E",
    blue: "#3B82F6"
  };
  const hex = colorMap[colorKey] || "#FFFFFF";
  document.documentElement.style.setProperty('--accent', hex);
}

// ==========================================================================
// COLLAPSIBLE SIDEBAR & MOBILE DRAWER CONTROLLER
// ==========================================================================
function toggleSidebarCollapse() {
  const sidebar = document.querySelector('.admin-sidebar');
  if (!sidebar) return;
  
  isSidebarCollapsed = !isSidebarCollapsed;
  sidebar.classList.toggle('collapsed', isSidebarCollapsed);
  localStorage.setItem('pm_sidebar_collapsed', isSidebarCollapsed ? 'true' : 'false');

  const collapseIcon = document.getElementById('collapse-icon');
  if (collapseIcon) {
    collapseIcon.style.transform = isSidebarCollapsed ? 'rotate(180deg)' : 'rotate(0deg)';
  }
}

function openMobileSidebar() {
  const sidebar = document.querySelector('.admin-sidebar');
  const backdrop = document.getElementById('mobile-drawer-backdrop');
  if (sidebar) sidebar.classList.add('mobile-open');
  if (backdrop) backdrop.classList.add('active');
}

function closeMobileSidebar() {
  const sidebar = document.querySelector('.admin-sidebar');
  const backdrop = document.getElementById('mobile-drawer-backdrop');
  if (sidebar) sidebar.classList.remove('mobile-open');
  if (backdrop) backdrop.classList.remove('active');
}

// ==========================================================================
// GLOBAL COMMAND PALETTE (⌘K SPOTLIGHT SEARCH)
// ==========================================================================
let cmdResults = [];
let cmdSelectedIndex = 0;

function openCommandPalette() {
  const backdrop = document.getElementById('cmd-palette-backdrop');
  const input = document.getElementById('cmd-search-input');
  if (!backdrop || !input) return;

  backdrop.classList.add('active');
  input.value = '';
  cmdSelectedIndex = 0;
  renderCommandResults('');
  setTimeout(() => input.focus(), 50);
}

function closeCommandPalette() {
  const backdrop = document.getElementById('cmd-palette-backdrop');
  if (backdrop) backdrop.classList.remove('active');
}

function buildCommandIndex() {
  const items = [];

  // Pages & Views
  items.push({ type: 'page', title: 'Admin Overview Dashboard', subtitle: 'KPIs, real-time visitors, performance', url: '/admin/index.html?cat=overview', icon: 'grid' });
  items.push({ type: 'page', title: 'Gallery Highlights', subtitle: 'Main homepage curated highlights', url: '/admin/index.html?cat=highlights', icon: 'image' });
  items.push({ type: 'page', title: 'Drone Shots (01)', subtitle: 'Aerial perspectives and drone photography', url: '/admin/index.html?cat=drone', icon: 'camera' });
  items.push({ type: 'page', title: 'Framed Moments (02)', subtitle: 'Street, portraits, and framed editorial', url: '/admin/index.html?cat=framed', icon: 'image' });
  items.push({ type: 'page', title: 'School Events (03)', subtitle: 'Campus journalism and live coverage', url: '/admin/index.html?cat=events', icon: 'users' });
  items.push({ type: 'page', title: 'Collections Overview', subtitle: 'All curated photo/video collections', url: '/admin/index.html?cat=collections', icon: 'layers' });
  items.push({ type: 'page', title: 'Video Projects (04)', subtitle: 'Reels, montages, and documentaries', url: '/admin/index.html?cat=videos', icon: 'film' });
  items.push({ type: 'page', title: 'Negros Aerials SE Videos', subtitle: 'Special edition aerial video collection', url: '/admin/index.html?cat=videos2', icon: 'film' });
  items.push({ type: 'page', title: 'Visitor & Traffic Analytics', subtitle: 'Live stats, Geo-IP, devices, page breakdown', url: '/admin/analytics.html', icon: 'trending-up' });
  items.push({ type: 'page', title: 'Security Audit Logs', subtitle: 'Admin login feed, verification, policies', url: '/admin/security.html', icon: 'shield' });
  items.push({ type: 'page', title: 'Global Site Configuration', subtitle: 'Profile, bio, kit, SEO, accent colors', url: '/admin/settings.html', icon: 'sliders' });
  items.push({ type: 'page', title: 'Revision Backups & Snapshots', subtitle: 'Workspace timeline, rollbacks, history', url: '/admin/backups.html', icon: 'clock' });

  // Quick Actions
  items.push({ type: 'action', title: 'Add Photos to Current Gallery', subtitle: 'Upload new photographs', action: 'triggerFilePicker', icon: 'plus' });
  items.push({ type: 'action', title: 'Publish Changes to Live Site', subtitle: 'Commit to GitHub & deploy via Vercel', action: 'publishToLiveSite', icon: 'upload-cloud' });
  items.push({ type: 'action', title: 'Save Directly to Disk', subtitle: 'Write assets/gallery-data.js locally', action: 'saveChangesDirectly', icon: 'hard-drive' });
  items.push({ type: 'action', title: 'Create Manual Snapshot Backup', subtitle: 'Create an instant rollback point', action: 'createManualSnapshotPrompt', icon: 'bookmark' });
  items.push({ type: 'action', title: 'Connect Project Folder', subtitle: 'Link local folder for automatic write', action: 'connectProjectFolder', icon: 'folder' });
  items.push({ type: 'action', title: 'Lock Admin Workspace', subtitle: 'Terminate active session authorization', action: 'lockSession', icon: 'lock' });

  // Media items from localData
  const cats = ['highlights', 'drone', 'framed', 'events', 'videos', 'videos2'];
  cats.forEach(c => {
    (localData[c] || []).forEach((item, idx) => {
      const isVid = (c === 'videos' || c === 'videos2');
      const title = isVid ? item.title : item.file;
      const desc = isVid ? `YouTube: ${item.youtubeId} • ${item.duration || ''}` : (item.desc || item.alt || c);
      items.push({
        type: 'media',
        title: title || 'Untitled Media',
        subtitle: `${c} • ${desc}`,
        url: `/admin/index.html?cat=${c}&edit=${idx}`,
        category: c,
        index: idx,
        icon: isVid ? 'film' : 'image'
      });
    });
  });

  return items;
}

function renderCommandResults(query) {
  const container = document.getElementById('cmd-results-list');
  if (!container) return;

  const allItems = buildCommandIndex();
  const q = query.toLowerCase().trim();

  if (!q) {
    cmdResults = allItems.slice(0, 15);
  } else {
    cmdResults = allItems.filter(item => {
      return item.title.toLowerCase().includes(q) || item.subtitle.toLowerCase().includes(q);
    }).slice(0, 25);
  }

  if (cmdResults.length === 0) {
    container.innerHTML = `
      <div style="padding: 2rem 1rem; text-align: center; color: var(--text-muted); font-size: 13px;">
        No results found for "<strong style="color: var(--text-primary);">${escapeHtml(query)}</strong>"
      </div>
    `;
    return;
  }

  container.innerHTML = cmdResults.map((item, i) => {
    const isSelected = i === cmdSelectedIndex;
    return `
      <div class="cmd-item ${isSelected ? 'selected' : ''}" data-index="${i}" onclick="executeCommandItem(${i})">
        <div class="cmd-item-left">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--text-muted); flex-shrink: 0;">
            ${getIconSvgPath(item.icon)}
          </svg>
          <div>
            <div style="font-weight: 600; color: #FFFFFF; font-size: 13px;">${escapeHtml(item.title)}</div>
            <div style="font-size: 11.5px; color: var(--text-muted);">${escapeHtml(item.subtitle)}</div>
          </div>
        </div>
        <span class="cmd-item-category">${escapeHtml(item.type.toUpperCase())}</span>
      </div>
    `;
  }).join('');
}

function getIconSvgPath(iconName) {
  switch (iconName) {
    case 'grid': return '<rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect>';
    case 'image': return '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline>';
    case 'film': return '<rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line>';
    case 'trending-up': return '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline>';
    case 'shield': return '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>';
    case 'sliders': return '<line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line>';
    case 'clock': return '<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>';
    case 'plus': return '<line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>';
    case 'upload-cloud': return '<polyline points="16 16 12 12 8 16"></polyline><line x1="12" y1="12" x2="12" y2="21"></line><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"></path><polyline points="16 16 12 12 8 16"></polyline>';
    case 'hard-drive': return '<line x1="22" y1="12" x2="2" y2="12"></line><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path><line x1="6" y1="16" x2="6.01" y2="16"></line><line x1="10" y1="16" x2="10.01" y2="16"></line>';
    case 'lock': return '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>';
    default: return '<circle cx="12" cy="12" r="10"></circle>';
  }
}

function executeCommandItem(index) {
  const item = cmdResults[index];
  if (!item) return;

  closeCommandPalette();

  if (item.action) {
    if (typeof window[item.action] === 'function') {
      window[item.action]();
    }
  } else if (item.url) {
    const isIndexUrl = item.url.includes('index.html');
    const isIndexPage = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/admin/') || window.location.pathname.endsWith('/admin');
    if (isIndexPage && isIndexUrl) {
      const urlParams = new URL(item.url, window.location.origin).searchParams;
      const cat = urlParams.get('cat');
      const editIdx = urlParams.get('edit');
      if (typeof switchTab === 'function') {
        switchTab(cat || 'highlights');
        if (editIdx !== null && typeof openEditDrawer === 'function') {
          setTimeout(() => openEditDrawer(parseInt(editIdx)), 100);
        }
      }
    } else {
      window.location.href = item.url;
    }
  }
}

// Global Event Listeners setup
document.addEventListener('DOMContentLoaded', () => {
  // Restore sidebar collapse state
  const sidebar = document.querySelector('.admin-sidebar');
  if (sidebar && isSidebarCollapsed) {
    sidebar.classList.add('collapsed');
    const collapseIcon = document.getElementById('collapse-icon');
    if (collapseIcon) collapseIcon.style.transform = 'rotate(180deg)';
  }

  // Save dropdown outside click closer
  document.addEventListener('click', function(e) {
    const wrapper = document.getElementById('save-dropdown-wrapper');
    const dropdown = document.getElementById('save-dropdown');
    if (wrapper && dropdown && !wrapper.contains(e.target)) {
      dropdown.classList.add('hidden');
    }
  });

  // Global ⌘K / Ctrl+K keyboard shortcut
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      const backdrop = document.getElementById('cmd-palette-backdrop');
      if (backdrop && backdrop.classList.contains('active')) {
        closeCommandPalette();
      } else {
        openCommandPalette();
      }
    } else if (e.key === 'Escape') {
      closeCommandPalette();
      if (typeof closeEditDrawer === 'function') closeEditDrawer();
      if (typeof closeVideoAddModal === 'function') closeVideoAddModal();
      if (typeof closeDeleteConfirmModal === 'function') closeDeleteConfirmModal();
      closeMobileSidebar();
    }
  });

  // Command palette input listeners
  const cmdInput = document.getElementById('cmd-search-input');
  if (cmdInput) {
    cmdInput.addEventListener('input', (e) => {
      cmdSelectedIndex = 0;
      renderCommandResults(e.target.value);
    });

    cmdInput.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        cmdSelectedIndex = (cmdSelectedIndex + 1) % Math.max(1, cmdResults.length);
        renderCommandResults(cmdInput.value);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        cmdSelectedIndex = (cmdSelectedIndex - 1 + cmdResults.length) % Math.max(1, cmdResults.length);
        renderCommandResults(cmdInput.value);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        executeCommandItem(cmdSelectedIndex);
      }
    });
  }

  // Check accent color on load
  if (localData.settings && localData.settings.app && localData.settings.app.accentColor) {
    previewAccentColor(localData.settings.app.accentColor);
  }

  updateBadges();
});

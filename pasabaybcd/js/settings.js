// ============================================================
// SETTINGS.JS — Full interactive logic for Settings section
// Pasabay BCD Admin Panel
// ============================================================

// ── In-memory prefs store (synced to localStorage) ───────────────────────────
const prefs = JSON.parse(localStorage.getItem('pasabay_prefs') || '{}');

// ── Tab switching ─────────────────────────────────────────────────────────────
function switchSettingsTab(name) {
    document.querySelectorAll('.stab-btn').forEach(b => {
        const isActive = b.getAttribute('data-stab') === name;
        b.classList.toggle('active-stab', isActive);
        b.classList.toggle('text-slate-500', !isActive);
    });
    document.querySelectorAll('.stab-pane').forEach(p => {
        p.classList.toggle('open', p.id === `stab-${name}`);
    });
}

// ── Generic toggle switch ─────────────────────────────────────────────────────
function togglePref(btn) {
    btn.classList.toggle('on');
    const key = btn.getAttribute('data-pref');
    if (key) {
        prefs[key] = btn.classList.contains('on');
        localStorage.setItem('pasabay_prefs', JSON.stringify(prefs));
    }
}

// ═══════════════════════════════════════════════════════
// TAB: PROFILE
// ═══════════════════════════════════════════════════════

function previewAvatar(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        const circle = document.getElementById('avatarCircle');
        circle.style.padding = '0';
        circle.innerHTML = `<img src="${e.target.result}" class="w-full h-full object-cover rounded-full" alt="Avatar">`;
    };
    reader.readAsDataURL(file);
}

function togglePw(id, btn) {
    const input = document.getElementById(id);
    const showing = input.type === 'text';
    input.type = showing ? 'password' : 'text';
    // Eye / eye-slash SVG swap
    btn.innerHTML = showing
        ? `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                     d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                     d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7
                        -1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
           </svg>`
        : `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                     d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7
                        a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243
                        M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532
                        l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5
                        c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411
                        m0 0L21 21"/>
           </svg>`;
}

function checkPwStrength(val) {
    const bars  = [1, 2, 3, 4].map(i => document.getElementById(`pwBar${i}`));
    const label = document.getElementById('pwStrengthLabel');
    if (!bars[0]) return;

    let score = 0;
    if (val.length >= 8)          score++;
    if (/[A-Z]/.test(val))        score++;
    if (/[0-9]/.test(val))        score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;

    const barColors  = ['bg-red-400', 'bg-amber-400', 'bg-yellow-400', 'bg-emerald-500'];
    const labelTexts = ['Weak', 'Fair', 'Good', 'Strong'];
    const labelCols  = ['text-red-500', 'text-amber-500', 'text-yellow-500', 'text-emerald-600'];

    bars.forEach((b, i) => {
        b.className = `h-1 flex-1 rounded-full ${i < score ? barColors[score - 1] : 'bg-slate-200'}`;
    });

    if (!val) {
        label.textContent = '';
    } else {
        label.textContent  = labelTexts[score - 1] || 'Weak';
        label.className    = `text-xs mt-1 font-semibold ${labelCols[score - 1] || 'text-red-500'}`;
    }
    checkPwMatch();
}

function checkPwMatch() {
    const newPw  = (document.getElementById('pwNew')     || {}).value || '';
    const confPw = (document.getElementById('pwConfirm') || {}).value || '';
    const label  = document.getElementById('pwMatchLabel');
    if (!label) return;

    if (!confPw) { label.textContent = ''; return; }

    if (newPw === confPw) {
        label.textContent = '✓ Passwords match';
        label.className   = 'text-xs mt-1 font-semibold text-emerald-600';
    } else {
        label.textContent = '✗ Passwords do not match';
        label.className   = 'text-xs mt-1 font-semibold text-red-500';
    }
}

function saveProfile() {
    const firstName = (document.getElementById('profileFirstName').value || '').trim();
    const lastName  = (document.getElementById('profileLastName').value  || '').trim();
    const email     = (document.getElementById('profileEmail').value     || '').trim();
    const pwCurrent = (document.getElementById('pwCurrent').value || '');
    const pwNew     = (document.getElementById('pwNew').value     || '');
    const pwConfirm = (document.getElementById('pwConfirm').value || '');

    // Basic validation
    if (!firstName || !lastName) {
        return showToast('First and last name are required.', 'error');
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return showToast('Please enter a valid email address.', 'error');
    }

    // Password change validation (only if any pw field is filled)
    if (pwCurrent || pwNew || pwConfirm) {
        if (!pwCurrent) return showToast('Enter your current password to change it.', 'error');
        if (pwNew.length < 8) return showToast('New password must be at least 8 characters.', 'error');
        if (pwNew !== pwConfirm) return showToast('New passwords do not match.', 'error');
    }

    const fullName = `${firstName} ${lastName}`;

    // Update avatar initial if no custom image uploaded
    const avatarCircle = document.getElementById('avatarCircle');
    if (avatarCircle && !avatarCircle.querySelector('img')) {
        avatarCircle.textContent = firstName.charAt(0).toUpperCase();
    }
    const avatarName = document.getElementById('avatarName');
    if (avatarName) avatarName.textContent = fullName;

    // Persist to localStorage
    localStorage.setItem('pasabay_profile', JSON.stringify({ firstName, lastName, email }));

    // Clear password fields
    ['pwCurrent', 'pwNew', 'pwConfirm'].forEach(id => {
        document.getElementById(id).value = '';
    });
    checkPwStrength('');
    const matchLabel = document.getElementById('pwMatchLabel');
    if (matchLabel) matchLabel.textContent = '';

    const btn = document.getElementById('saveProfileBtn');
    if (btn) {
        btn.textContent = '✓ Saved!';
        btn.style.background = 'linear-gradient(135deg, #059669, #10b981)';
        setTimeout(() => {
            btn.textContent = 'Save Profile';
            btn.style.background = 'linear-gradient(135deg, #2563eb, #7c3aed)';
        }, 2000);
    }

    showToast('Profile saved successfully!', 'success');
}

// ═══════════════════════════════════════════════════════
// TAB: NOTIFICATIONS
// ═══════════════════════════════════════════════════════

function saveSettings(label) {
    localStorage.setItem('pasabay_prefs', JSON.stringify(prefs));
    showToast(`${label} saved!`, 'success');
}

// ═══════════════════════════════════════════════════════
// TAB: SECURITY
// ═══════════════════════════════════════════════════════

const _API_KEY_VALUE = 'pbcd_live_sk_a3f92bc1d4e87f6a2b1c9d0e3f45a7b8';
let _apiKeyVisible   = false;

function enable2FA() {
    // Find 2FA card components via known structure
    const badge = document.querySelector('#stab-security .bg-white span.rounded-full');
    const btn   = document.querySelector('#stab-security button[onclick="enable2FA()"]');
    if (!badge || !btn) return;

    const isEnabled = badge.textContent.trim() === 'Enabled';

    if (!isEnabled) {
        badge.textContent = 'Enabled';
        badge.className   = 'px-2.5 py-1 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-full';
        btn.textContent   = 'Disable 2FA';
        btn.className     = 'w-full py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-bold rounded-xl transition-colors';
        prefs['2fa'] = true;
        localStorage.setItem('pasabay_prefs', JSON.stringify(prefs));
        showToast('2FA enabled! Scan the QR code in your authenticator app.', 'success');
    } else {
        if (!confirm('Disable Two-Factor Authentication? This reduces your account security.')) return;
        badge.textContent = 'Disabled';
        badge.className   = 'px-2.5 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-full';
        btn.textContent   = 'Enable 2FA';
        btn.className     = 'w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors';
        prefs['2fa'] = false;
        localStorage.setItem('pasabay_prefs', JSON.stringify(prefs));
        showToast('2FA has been disabled.', 'warning');
    }
}

function revealApiKey(btn) {
    _apiKeyVisible = !_apiKeyVisible;
    document.getElementById('apiKeyDisplay').textContent = _apiKeyVisible
        ? _API_KEY_VALUE
        : 'pbcd_live_\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022';
    btn.textContent = _apiKeyVisible ? 'Hide' : 'Show';
}

function copyApiKey() {
    const key = _apiKeyVisible
        ? _API_KEY_VALUE
        : document.getElementById('apiKeyDisplay').textContent;
    if (key.includes('\u2022')) {
        showToast('Reveal the key first before copying.', 'warning');
        return;
    }
    navigator.clipboard.writeText(key)
        .then(() => showToast('API key copied to clipboard!', 'success'))
        .catch(() => showToast('Copy failed — please copy manually.', 'error'));
}

function regenerateApiKey() {
    if (!confirm('Regenerate API key? Your current key will stop working immediately and all integrations must be updated.')) return;
    const chars = 'abcdef0123456789';
    const newKey = 'pbcd_live_sk_' + Array.from({ length: 32 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    _apiKeyVisible = false;
    document.getElementById('apiKeyDisplay').textContent =
        'pbcd_live_\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022';
    // Store new key in memory (in a real app, this would hit an API)
    window._generatedKey = newKey;
    const showBtn = document.querySelector('[onclick="revealApiKey(this)"]');
    if (showBtn) showBtn.textContent = 'Show';
    showToast('New API key generated! Click Show to view it.', 'warning');
}

// ═══════════════════════════════════════════════════════
// TAB: SYSTEM
// ═══════════════════════════════════════════════════════

function toggleMaintenance(btn) {
    const willEnable = !btn.classList.contains('on');
    if (willEnable) {
        if (!confirm('Enable Maintenance Mode? All users will see a maintenance screen and cannot use the app.')) return;
    }
    togglePref(btn);
    if (btn.classList.contains('on')) {
        showToast('⚠️ Maintenance Mode is ON. Users cannot access the app.', 'warning');
    } else {
        showToast('Maintenance Mode is OFF. App is live again.', 'success');
    }
}

// ═══════════════════════════════════════════════════════
// TAB: DANGER ZONE
// ═══════════════════════════════════════════════════════

function dangerAction(action) {
    if (!confirm(`Are you sure you want to ${action}?\n\nThis cannot be undone.`)) return;

    const isDestructive = /wipe|delete/i.test(action);
    if (isDestructive) {
        const typed = prompt('This is a permanent destructive action.\nType  CONFIRM  (all caps) to proceed:');
        if (typed !== 'CONFIRM') {
            showToast('Action cancelled — confirmation text did not match.', 'error');
            return;
        }
    }

    if (/export/i.test(action)) {
        showToast('Generating export... download will start shortly.', 'info');
        setTimeout(() => {
            const csv = [
                'id,sender,receiver,destination,cargo,date,status',
                'PBC-001,Juan Dela Cruz,Maria Santos,Cebu City,Electronics,2026-03-10,Delivered',
                'PBC-002,Ana Reyes,Pedro Lim,Iloilo City,Furniture,2026-03-09,In Transit',
                'PBC-003,Leo Gomez,Nena Bautista,Dumaguete,Clothing,2026-03-08,Pending'
            ].join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url  = URL.createObjectURL(blob);
            const a    = document.createElement('a');
            a.href     = url;
            a.download = `pasabay_export_${new Date().toISOString().slice(0,10)}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast('Export downloaded!', 'success');
        }, 800);
        return;
    }

    if (/clear cancelled/i.test(action)) {
        showToast('All cancelled booking records have been cleared.', 'success');
        return;
    }
    if (/reset kyc/i.test(action)) {
        showToast('KYC queue has been reset. Verified records are intact.', 'success');
        return;
    }
    if (/wipe/i.test(action)) {
        showToast('All booking data has been wiped from the system.', 'warning');
        return;
    }
    if (/delete.*admin/i.test(action)) {
        showToast('Admin account deleted. Redirecting to login...', 'error');
        setTimeout(() => { alert('In a live app, you would be logged out and the account removed.'); }, 1500);
        return;
    }

    showToast(`Action executed: ${action}`, 'info');
}

// ═══════════════════════════════════════════════════════
// TOAST NOTIFICATION SYSTEM
// ═══════════════════════════════════════════════════════

function showToast(message, type = 'success') {
    document.querySelectorAll('.toast-notification').forEach(t => t.remove());

    const icons  = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const colors = {
        success: '#059669',
        error:   '#dc2626',
        warning: '#d97706',
        info:    '#2563eb'
    };

    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.style.cssText = `
        position: fixed; bottom: 24px; right: 24px; z-index: 9999;
        display: flex; align-items: center; gap: 10px;
        padding: 12px 20px; border-radius: 16px;
        background: ${colors[type]}; color: white;
        font-size: 0.875rem; font-weight: 600;
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        opacity: 1; transform: translateY(0);
        transition: opacity 0.3s ease, transform 0.3s ease;
        max-width: 360px;
    `;
    toast.innerHTML = `<span style="font-size:1rem;">${icons[type]}</span><span>${message}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(12px)';
        setTimeout(() => toast.remove(), 300);
    }, 3200);
}

// ═══════════════════════════════════════════════════════
// INIT — Restore saved state on page load
// ═══════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
    // Restore toggle states
    const savedPrefs = JSON.parse(localStorage.getItem('pasabay_prefs') || '{}');
    Object.assign(prefs, savedPrefs);

    document.querySelectorAll('[data-pref]').forEach(btn => {
        const key = btn.getAttribute('data-pref');
        if (key in prefs) {
            prefs[key] ? btn.classList.add('on') : btn.classList.remove('on');
        }
    });

    // Restore 2FA badge state
    if (prefs['2fa']) {
        const badge = document.querySelector('#stab-security .bg-white span.rounded-full');
        const btn   = document.querySelector('#stab-security button[onclick="enable2FA()"]');
        if (badge && btn) {
            badge.textContent = 'Enabled';
            badge.className   = 'px-2.5 py-1 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-full';
            btn.textContent   = 'Disable 2FA';
            btn.className     = 'w-full py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-bold rounded-xl transition-colors';
        }
    }

    // Restore saved profile fields
    const savedProfile = JSON.parse(localStorage.getItem('pasabay_profile') || '{}');
    if (savedProfile.firstName) {
        const fn = document.getElementById('profileFirstName');
        const ln = document.getElementById('profileLastName');
        const em = document.getElementById('profileEmail');
        if (fn) fn.value = savedProfile.firstName;
        if (ln) ln.value = savedProfile.lastName || '';
        if (em) em.value = savedProfile.email    || '';

        const fullName = `${savedProfile.firstName} ${savedProfile.lastName || ''}`.trim();
        const avatarName = document.getElementById('avatarName');
        if (avatarName) avatarName.textContent = fullName;

        const avatarCircle = document.getElementById('avatarCircle');
        if (avatarCircle && !avatarCircle.querySelector('img')) {
            avatarCircle.textContent = savedProfile.firstName.charAt(0).toUpperCase();
        }
    }
});

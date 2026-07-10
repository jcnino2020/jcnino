/* ============================================================
   kyc.js — User KYC table rendering & actions
   ============================================================ */

/**
 * Render the KYC verification table.
 * @param {Array} users
 */
function renderKYC(users) {
    document.getElementById('kycTableBody').innerHTML = users.map(u => `
        <tr class="hover:bg-blue-50/40 transition-colors">
            <td class="px-6 py-3.5">
                <div class="flex items-center space-x-3">
                    <div class="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                         style="background: linear-gradient(135deg, #667eea, #764ba2);">
                        ${u.name.charAt(0)}
                    </div>
                    <div>
                        <p class="font-semibold text-slate-800 text-sm">${u.name}</p>
                        <p class="text-xs text-slate-400">${u.email}</p>
                    </div>
                </div>
            </td>
            <td class="px-6 py-3.5 text-slate-600 text-sm">${u.docType}</td>
            <td class="px-6 py-3.5 text-slate-400 text-xs">${u.submitted}</td>
            <td class="px-6 py-3.5">${badge(u.status)}</td>
            <td class="px-6 py-3.5 text-right space-x-1">
                ${u.status === 'Pending'
                    ? `<button onclick="kycAction('${u.name}','approve')" class="text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition-all">Approve</button>
                       <button onclick="kycAction('${u.name}','reject')"  class="text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg transition-all">Reject</button>`
                    : `<span class="text-xs text-slate-300 italic">No actions</span>`}
            </td>
        </tr>`).join('');
}

/**
 * Confirm and handle a KYC approve or reject action.
 * @param {string} name    - User's full name
 * @param {string} action  - 'approve' | 'reject'
 */
function kycAction(name, action) {
    const label  = action === 'approve' ? 'Approve' : 'Reject';
    const result = action === 'approve' ? 'approved ✅' : 'rejected ❌';
    if (confirm(`${label} KYC for ${name}?`)) {
        alert(`${name}'s KYC has been ${result}.`);
    }
}

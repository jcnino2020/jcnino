const baseMeta = document.querySelector('meta[name="app-base-path"]');
const BASE_PATH = (baseMeta?.content || "").replace(/\/$/, "");

const state = {
  csrfToken: null,
  activeTab: "overview",
  contactFilter: "all",
  selectedChatUserId: null,
  contacts: [],
  overview: null,
  sse: null,
};

const $ = (id) => document.getElementById(id);

function apiUrl(path) {
  return `${BASE_PATH}${path}`;
}

async function apiFetch(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (state.csrfToken && options.method && options.method !== "GET") {
    headers.set("X-CSRF-Token", state.csrfToken);
  }
  const resp = await fetch(apiUrl(path), {
    ...options,
    headers,
    credentials: "same-origin",
  });
  if (resp.status === 401) {
    showLoginView();
    throw new Error("Session expired. Please sign in.");
  }
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(data.detail || `Request failed (${resp.status})`);
  }
  return data;
}

function showToast(message) {
  const el = $("toast");
  el.textContent = message;
  el.hidden = false;
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => {
    el.hidden = true;
  }, 3200);
}

function formatDuration(sec) {
  const s = Math.max(0, Number(sec) || 0);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${s % 60}s`;
}

function formatTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

// ----------------------------------------------------------------------
// Theme
// ----------------------------------------------------------------------
function initTheme() {
  const saved = localStorage.getItem("tg_theme");
  const initial = saved || (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
  document.documentElement.setAttribute("data-theme", initial);
  $("theme-toggle").addEventListener("click", () => {
    const cur = document.documentElement.getAttribute("data-theme");
    const next = cur === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("tg_theme", next);
  });
}

// ----------------------------------------------------------------------
// Auth Flow
// ----------------------------------------------------------------------
function showLoginView(totpRequired = false) {
  if (state.sse) {
    state.sse.close();
    state.sse = null;
  }
  $("app-shell").hidden = true;
  $("login-view").hidden = false;
  $("totp-field").hidden = !totpRequired;
}

function showAppView() {
  $("login-view").hidden = true;
  $("app-shell").hidden = false;
  connectSSE();
  refreshAll();
}

async function bootstrapAuth() {
  try {
    const status = await apiFetch("/api/auth/status");
    if (status.authenticated) {
      state.csrfToken = status.csrf_token;
      showAppView();
    } else {
      showLoginView(status.totp_required);
    }
  } catch (err) {
    showLoginView(false);
  }
}

$("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const errEl = $("login-error");
  errEl.hidden = true;
  const btn = $("login-submit");
  btn.disabled = true;
  try {
    const data = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        username: $("login-username").value.trim(),
        password: $("login-password").value,
        totp_code: $("login-totp").value.trim(),
      }),
    });
    state.csrfToken = data.csrf_token;
    $("login-password").value = "";
    $("login-totp").value = "";
    showAppView();
  } catch (err) {
    errEl.textContent = err.message;
    errEl.hidden = false;
  } finally {
    btn.disabled = false;
  }
});

$("logout-btn").addEventListener("click", async () => {
  try {
    await apiFetch("/api/auth/logout", { method: "POST" });
  } finally {
    state.csrfToken = null;
    showLoginView(false);
  }
});

// ----------------------------------------------------------------------
// Navigation Tabs
// ----------------------------------------------------------------------
function switchTab(tabName) {
  state.activeTab = tabName;
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.tab === tabName);
  });
  document.querySelectorAll(".tab-panel").forEach((panel) => {
    panel.hidden = panel.id !== `tab-${tabName}`;
  });
  if (tabName === "contacts") loadContacts();
  if (tabName === "conversations") loadConversationsTab();
  if (tabName === "ai-settings" || tabName === "system") loadSettings();
  if (tabName === "system") {
    loadBackups();
    loadLogs();
  }
}

document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => switchTab(btn.dataset.tab));
});

// ----------------------------------------------------------------------
// Overview & SSE
// ----------------------------------------------------------------------
function connectSSE() {
  if (state.sse) state.sse.close();
  const sse = new EventSource(apiUrl("/api/events"));
  state.sse = sse;
  sse.addEventListener("connected", () => {
    $("top-sse-badge").classList.add("is-live");
  });
  sse.addEventListener("update", () => {
    loadOverview();
    if (state.activeTab === "contacts") loadContacts();
    if (state.activeTab === "conversations" && state.selectedChatUserId) {
      loadMessages(state.selectedChatUserId);
    }
  });
  sse.onerror = () => {
    $("top-sse-badge").classList.remove("is-live");
  };
}

async function loadOverview() {
  const data = await apiFetch("/api/overview");
  state.overview = data;

  const { telegram, ai, quota, stats, pending_replies, system } = data;

  // Top badges & Emergency banner
  const modeBadge = $("top-mode-badge");
  if (system.emergency_stop) {
    modeBadge.textContent = "STOPPED";
    modeBadge.className = "status-badge status-danger";
  } else if (system.dry_run) {
    modeBadge.textContent = "DRY RUN";
    modeBadge.className = "status-badge status-warn";
  } else {
    modeBadge.textContent = "LIVE";
    modeBadge.className = "status-badge status-ok";
  }
  $("emergency-banner").hidden = !system.emergency_stop;
  $("emergency-btn").textContent = system.emergency_stop ? "Automation Stopped" : "Emergency Stop";
  $("emergency-btn").disabled = system.emergency_stop;

  // Telegram status
  if (telegram.connected && telegram.authorized) {
    $("ov-tg-status").textContent = "Connected";
    $("ov-tg-sub").textContent = telegram.me?.username
      ? `@${telegram.me.username} (${telegram.me.id})`
      : `ID ${telegram.me?.id || "—"}`;
  } else if (!telegram.configured) {
    $("ov-tg-status").textContent = "Unconfigured";
    $("ov-tg-sub").textContent = "Set TELEGRAM_API_ID & HASH";
  } else {
    $("ov-tg-status").textContent = "Disconnected";
    $("ov-tg-sub").textContent = telegram.last_error || "Complete onboarding in System";
  }

  // AI status
  $("ov-ai-status").textContent = ai.configured ? ai.provider.toUpperCase() : "Not configured";
  $("ov-ai-sub").textContent = ai.model;

  // Counts
  $("ov-conv-counts").textContent = `${stats.active_conversations} / ${stats.paused_conversations}`;
  $("ov-pending-approvals").textContent = String(stats.pending_approvals);
  $("ov-sent-today").textContent = String(stats.messages_sent_today);

  const chip = $("nav-pending-count");
  chip.textContent = String(stats.pending_approvals);
  chip.hidden = stats.pending_approvals === 0;

  // Quota
  $("ov-quota-date").textContent = `PT: ${quota.usage_date_pt}`;
  $("ov-req-text").textContent = `${quota.requests_used} / ${quota.requests_limit} (${quota.requests_percent}%)`;
  $("ov-tok-text").textContent = `${quota.tokens_used.toLocaleString()} / ${quota.tokens_limit.toLocaleString()} (${quota.tokens_percent}%)`;

  const reqBar = $("ov-req-bar");
  reqBar.style.width = `${Math.min(100, quota.requests_percent)}%`;
  reqBar.className = `progress-fill ${quota.exhausted ? "is-danger" : quota.warning ? "is-warn" : ""}`;

  const tokBar = $("ov-tok-bar");
  tokBar.style.width = `${Math.min(100, quota.tokens_percent)}%`;
  tokBar.className = `progress-fill ${quota.exhausted ? "is-danger" : quota.warning ? "is-warn" : ""}`;

  if (quota.exhausted) {
    $("ov-quota-note").textContent = "Daily free-tier cap reached. Auto-replies paused until midnight Pacific Time.";
  } else if (quota.warning) {
    $("ov-quota-note").textContent = "Approaching daily free-tier safety limit.";
  } else {
    $("ov-quota-note").textContent = `RPM limit: ${quota.rpm_limit}/min. Resets daily at 00:00 Pacific Time.`;
  }

  // Server health
  $("ov-uptime").textContent = `Uptime: ${formatDuration(system.uptime_seconds)}`;
  $("ov-load").textContent = String(system.load_1m);
  $("ov-disk").textContent = `${system.disk_free_mb} MB`;
  $("ov-db").textContent = `${system.db_size_kb} KB`;
  $("ov-rl-hits").textContent = String(quota.rate_limit_hits);

  // Pending timers
  const pendingWrap = $("ov-pending-list");
  pendingWrap.replaceChildren();
  if (!pending_replies.length) {
    pendingWrap.appendChild(el("p", "muted-text", "No replies currently scheduled."));
  } else {
    pending_replies.forEach((p) => {
      const row = el("div", "kv-item");
      const label = el("span", null, `${p.display_name} (${p.telegram_user_id}) — ${p.status}`);
      const right = el("div", "row-gap");
      right.appendChild(el("span", "mono-sm", formatTime(p.scheduled_for)));
      const cancelBtn = el("button", "btn btn-sm btn-secondary", "Cancel");
      cancelBtn.type = "button";
      cancelBtn.addEventListener("click", async () => {
        await apiFetch(`/api/contacts/${p.telegram_user_id}/cancel-pending`, { method: "POST" });
        showToast("Pending reply cancelled.");
        loadOverview();
      });
      right.appendChild(cancelBtn);
      row.append(label, right);
      pendingWrap.appendChild(row);
    });
  }

  renderTelegramOnboardingState(telegram);
}

// ----------------------------------------------------------------------
// Contacts
// ----------------------------------------------------------------------
document.querySelectorAll(".filter-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.contactFilter = btn.dataset.filter;
    document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    loadContacts();
  });
});

async function loadContacts() {
  const query = state.contactFilter === "all" ? "" : `?status_filter=${state.contactFilter}`;
  const data = await apiFetch(`/api/contacts${query}`);
  state.contacts = data.contacts;
  const wrap = $("contacts-list");
  wrap.replaceChildren();

  if (!data.contacts.length) {
    wrap.appendChild(el("p", "muted-text", "No contacts match this filter yet."));
    return;
  }

  data.contacts.forEach((c) => {
    const card = el("article", "contact-card");
    const top = el("div", "contact-top");

    const identity = el("div");
    identity.appendChild(el("div", "contact-name", c.display_name));
    const sub = `${c.username ? "@" + c.username + " · " : ""}ID ${c.telegram_user_id}`;
    identity.appendChild(el("div", "mono-sm", sub));

    const badges = el("div", "row-gap");
    const statusBadge = el(
      "span",
      `status-badge ${
        c.approval_status === "approved"
          ? "status-ok"
          : c.approval_status === "pending"
          ? "status-warn"
          : "status-danger"
      }`,
      c.approval_status.toUpperCase()
    );
    badges.appendChild(statusBadge);
    if (c.is_paused) {
      badges.appendChild(el("span", "status-badge status-warn", "PAUSED"));
    }
    top.append(identity, badges);

    const preview = el("p", "contact-preview", c.latest_message_preview || "No messages");
    const meta = el(
      "div",
      "mono-sm",
      `Replies: ${c.reply_count}/${c.max_replies} · First seen: ${formatTime(c.first_seen_at)} · Last: ${formatTime(c.last_seen_at)}`
    );

    const actions = el("div", "row-gap");
    if (c.approval_status !== "approved") {
      const approveBtn = el("button", "btn btn-sm btn-primary", "Approve");
      approveBtn.type = "button";
      approveBtn.addEventListener("click", () => patchContact(c.telegram_user_id, { approval_status: "approved", is_paused: false }));
      actions.appendChild(approveBtn);
    } else {
      const pauseBtn = el("button", "btn btn-sm btn-secondary", c.is_paused ? "Resume" : "Pause");
      pauseBtn.type = "button";
      pauseBtn.addEventListener("click", () => patchContact(c.telegram_user_id, { is_paused: !c.is_paused }));
      actions.appendChild(pauseBtn);

      const unapproveBtn = el("button", "btn btn-sm btn-ghost", "Remove Approval");
      unapproveBtn.type = "button";
      unapproveBtn.addEventListener("click", () => patchContact(c.telegram_user_id, { approval_status: "pending" }));
      actions.appendChild(unapproveBtn);
    }

    if (c.approval_status === "pending") {
      const rejectBtn = el("button", "btn btn-sm btn-secondary", "Reject");
      rejectBtn.type = "button";
      rejectBtn.addEventListener("click", () => patchContact(c.telegram_user_id, { approval_status: "rejected" }));
      actions.appendChild(rejectBtn);
    }

    if (c.approval_status !== "blocked") {
      const blockBtn = el("button", "btn btn-sm btn-danger", "Block");
      blockBtn.type = "button";
      blockBtn.addEventListener("click", () => patchContact(c.telegram_user_id, { approval_status: "blocked" }));
      actions.appendChild(blockBtn);
    }

    const viewBtn = el("button", "btn btn-sm btn-secondary", "View Chat");
    viewBtn.type = "button";
    viewBtn.addEventListener("click", () => {
      state.selectedChatUserId = c.telegram_user_id;
      switchTab("conversations");
    });
    actions.appendChild(viewBtn);

    const cfgBtn = el("button", "btn btn-sm btn-ghost", "Configure");
    cfgBtn.type = "button";
    cfgBtn.addEventListener("click", () => openContactDialog(c));
    actions.appendChild(cfgBtn);

    card.append(top, preview, meta, actions);
    wrap.appendChild(card);
  });
}

async function patchContact(userId, payload) {
  await apiFetch(`/api/contacts/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  showToast("Contact updated.");
  await Promise.all([loadContacts(), loadOverview()]);
}

function openContactDialog(c) {
  $("edit-contact-id").value = String(c.telegram_user_id);
  $("contact-dialog-title").textContent = `Configure ${c.display_name}`;
  $("edit-min-delay").value = String(c.min_delay_sec);
  $("edit-max-delay").value = String(c.max_delay_sec);
  $("edit-max-replies").value = String(c.max_replies);
  $("edit-lang").value = c.language_pref || "auto";
  $("edit-length").value = c.response_length || "short";
  $("edit-typing").checked = Boolean(c.typing_indicator);
  $("edit-persona").value = c.persona || "";
  $("edit-notes").value = c.notes || "";
  $("contact-dialog").showModal();
}

$("contact-dialog-close").addEventListener("click", () => $("contact-dialog").close());

$("contact-edit-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const userId = Number($("edit-contact-id").value);
  await patchContact(userId, {
    min_delay_sec: Number($("edit-min-delay").value),
    max_delay_sec: Number($("edit-max-delay").value),
    max_replies: Number($("edit-max-replies").value),
    language_pref: $("edit-lang").value,
    response_length: $("edit-length").value,
    typing_indicator: $("edit-typing").checked,
    persona: $("edit-persona").value.trim(),
    notes: $("edit-notes").value.trim(),
  });
  $("contact-dialog").close();
});

// ----------------------------------------------------------------------
// Conversations
// ----------------------------------------------------------------------
async function loadConversationsTab() {
  const data = await apiFetch("/api/contacts");
  state.contacts = data.contacts;
  const list = $("chat-thread-list");
  list.replaceChildren();

  if (!data.contacts.length) {
    list.appendChild(el("p", "muted-text", "No conversations yet."));
    return;
  }

  if (!state.selectedChatUserId) {
    state.selectedChatUserId = data.contacts[0].telegram_user_id;
  }

  data.contacts.forEach((c) => {
    const item = el("button", `thread-item ${c.telegram_user_id === state.selectedChatUserId ? "is-active" : ""}`);
    item.type = "button";
    item.appendChild(el("div", "contact-name", c.display_name));
    item.appendChild(el("div", "mono-sm", `${c.approval_status} · ${c.reply_count}/${c.max_replies}`));
    item.addEventListener("click", () => {
      state.selectedChatUserId = c.telegram_user_id;
      loadConversationsTab();
    });
    list.appendChild(item);
  });

  if (state.selectedChatUserId) {
    await loadMessages(state.selectedChatUserId);
  }
}

async function loadMessages(userId) {
  const data = await apiFetch(`/api/contacts/${userId}/messages`);
  const { contact, messages } = data;
  $("chat-contact-name").textContent = contact.display_name;
  $("chat-contact-meta").textContent = `${contact.username ? "@" + contact.username + " · " : ""}ID ${contact.telegram_user_id} · Status: ${contact.approval_status}${contact.pending_reply_at ? " · Reply scheduled: " + formatTime(contact.pending_reply_at) : ""}`;

  $("chat-controls").hidden = false;
  const pauseBtn = $("chat-pause-btn");
  pauseBtn.textContent = contact.is_paused ? "Resume" : "Pause";
  pauseBtn.onclick = async () => {
    await patchContact(contact.telegram_user_id, { is_paused: !contact.is_paused });
    loadMessages(contact.telegram_user_id);
  };

  const cancelBtn = $("chat-cancel-timer-btn");
  cancelBtn.hidden = !contact.pending_reply_at;
  cancelBtn.onclick = async () => {
    await apiFetch(`/api/contacts/${contact.telegram_user_id}/cancel-pending`, { method: "POST" });
    showToast("Scheduled reply cancelled.");
    loadMessages(contact.telegram_user_id);
  };

  const box = $("chat-messages");
  box.replaceChildren();
  if (!messages.length) {
    box.appendChild(el("p", "muted-text", "No messages recorded yet."));
    return;
  }
  messages.forEach((m) => {
    const bubble = el("div", `msg-bubble ${m.direction === "incoming" ? "msg-in" : "msg-out"}`);
    bubble.appendChild(el("div", null, m.content));
    const flags = [formatTime(m.created_at)];
    if (m.is_ai_generated) flags.push("AI");
    if (m.dry_run) flags.push("DRY-RUN");
    bubble.appendChild(el("div", "msg-meta", flags.join(" · ")));
    box.appendChild(bubble);
  });
  box.scrollTop = box.scrollHeight;
}

// ----------------------------------------------------------------------
// AI & System Settings
// ----------------------------------------------------------------------
async function loadSettings() {
  const data = await apiFetch("/api/settings");
  const s = data.settings;
  $("cfg-ai-provider").value = s.ai_provider || "gemini";
  $("cfg-ai-model").value = s.ai_model || "gemini-2.5-flash";
  $("cfg-default-language").value = s.default_language || "auto";
  $("cfg-default-length").value = s.default_response_length || "short";
  $("cfg-memory-limit").value = String(s.default_memory_limit || 16);
  $("cfg-default-persona").value = s.default_persona || "";

  $("cfg-dry-run").checked = Boolean(s.dry_run);
  $("cfg-daily-req").value = String(s.daily_request_limit || 200);
  $("cfg-daily-tok").value = String(s.daily_token_limit || 150000);
  $("cfg-rpm").value = String(s.rpm_limit || 10);
  $("cfg-warn-pct").value = String(s.quota_warn_percent || 80);
}

$("ai-settings-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  await apiFetch("/api/settings", {
    method: "PATCH",
    body: JSON.stringify({
      ai_provider: $("cfg-ai-provider").value,
      ai_model: $("cfg-ai-model").value.trim(),
      default_language: $("cfg-default-language").value,
      default_response_length: $("cfg-default-length").value,
      default_memory_limit: Number($("cfg-memory-limit").value),
      default_persona: $("cfg-default-persona").value.trim(),
    }),
  });
  showToast("AI settings saved.");
  loadOverview();
});

$("system-settings-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  await apiFetch("/api/settings", {
    method: "PATCH",
    body: JSON.stringify({
      dry_run: $("cfg-dry-run").checked,
      daily_request_limit: Number($("cfg-daily-req").value),
      daily_token_limit: Number($("cfg-daily-tok").value),
      rpm_limit: Number($("cfg-rpm").value),
      quota_warn_percent: Number($("cfg-warn-pct").value),
    }),
  });
  showToast("System and quota settings saved.");
  loadOverview();
});

$("emergency-btn").addEventListener("click", async () => {
  await apiFetch("/api/system/emergency-stop", {
    method: "POST",
    body: JSON.stringify({ active: true }),
  });
  showToast("Emergency stop activated.");
  loadOverview();
});

$("resume-all-btn").addEventListener("click", async () => {
  await apiFetch("/api/system/emergency-stop", {
    method: "POST",
    body: JSON.stringify({ active: false }),
  });
  showToast("Automation resumed.");
  loadOverview();
});

// ----------------------------------------------------------------------
// Telegram Onboarding & Session Revocation
// ----------------------------------------------------------------------
function renderTelegramOnboardingState(tg) {
  const badge = $("sys-tg-badge");
  const phoneForm = $("tg-phone-form");
  const codeForm = $("tg-code-form");
  const connectedActions = $("tg-connected-actions");
  const twoFaWrap = $("tg-2fa-wrap");

  if (tg.authorized) {
    badge.textContent = "CONNECTED";
    badge.className = "status-badge status-ok";
    $("sys-tg-info").textContent = `Signed in as ${tg.me?.first_name || "User"} (${tg.me?.username ? "@" + tg.me.username : tg.me?.id}).`;
    phoneForm.hidden = true;
    codeForm.hidden = true;
    connectedActions.hidden = false;
  } else if (tg.awaiting_code || tg.awaiting_2fa) {
    badge.textContent = tg.awaiting_2fa ? "2FA REQUIRED" : "ENTER CODE";
    badge.className = "status-badge status-warn";
    phoneForm.hidden = true;
    codeForm.hidden = false;
    twoFaWrap.hidden = !tg.awaiting_2fa;
    connectedActions.hidden = true;
  } else {
    badge.textContent = "NOT CONNECTED";
    badge.className = "status-badge status-warn";
    phoneForm.hidden = false;
    codeForm.hidden = true;
    connectedActions.hidden = true;
  }
}

$("tg-phone-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const res = await apiFetch("/api/telegram/send-code", {
      method: "POST",
      body: JSON.stringify({ phone: $("tg-phone").value.trim() }),
    });
    renderTelegramOnboardingState(res.telegram);
    showToast("Verification code sent to your Telegram app.");
  } catch (err) {
    showToast(err.message);
  }
});

$("tg-code-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const res = await apiFetch("/api/telegram/verify-code", {
      method: "POST",
      body: JSON.stringify({
        code: $("tg-code").value.trim(),
        password_2fa: $("tg-2fa").value,
      }),
    });
    renderTelegramOnboardingState(res.telegram);
    if (res.telegram.authorized) {
      showToast("Telegram account connected and encrypted.");
      loadOverview();
    } else if (res.telegram.awaiting_2fa) {
      showToast("Enter your Telegram 2FA password.");
    }
  } catch (err) {
    showToast(err.message);
  }
});

$("tg-revoke-btn").addEventListener("click", async () => {
  const res = await apiFetch("/api/telegram/revoke", { method: "POST" });
  renderTelegramOnboardingState(res.telegram);
  showToast("Telegram session revoked.");
  loadOverview();
});

// ----------------------------------------------------------------------
// Backups & Audit Logs
// ----------------------------------------------------------------------
async function loadBackups() {
  const data = await apiFetch("/api/system/backups");
  const wrap = $("backups-list");
  wrap.replaceChildren();
  if (!data.backups.length) {
    wrap.appendChild(el("p", "muted-text", "No backups created yet."));
    return;
  }
  data.backups.forEach((b) => {
    const row = el("div", "kv-item");
    row.appendChild(el("span", "mono-sm", b.name));
    row.appendChild(el("span", "mono-sm tabular", `${b.size_kb} KB`));
    wrap.appendChild(row);
  });
}

$("create-backup-btn").addEventListener("click", async () => {
  await apiFetch("/api/system/backup", { method: "POST" });
  showToast("SQLite backup created.");
  loadBackups();
});

async function loadLogs() {
  const data = await apiFetch("/api/system/logs");
  const wrap = $("audit-logs-list");
  wrap.replaceChildren();
  if (!data.logs.length) {
    wrap.appendChild(el("p", "muted-text", "No audit logs recorded."));
    return;
  }
  data.logs.forEach((l) => {
    const row = el("div", "log-row");
    row.appendChild(el("div", "mono-sm", `${formatTime(l.created_at)} · ${l.actor} · ${l.action} (${l.target})`));
    if (l.details) row.appendChild(el("div", "muted-text", l.details));
    wrap.appendChild(row);
  });
}

$("refresh-overview-btn").addEventListener("click", loadOverview);
$("refresh-logs-btn").addEventListener("click", loadLogs);

async function refreshAll() {
  await Promise.all([loadOverview(), loadSettings()]);
}

initTheme();
bootstrapAuth();

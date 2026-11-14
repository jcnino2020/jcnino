(() => {
  'use strict';

  const state = {
    server: null,
    client: null,
    ai: null,
    chatMessages: [],
    chatBusy: false,
  };

  const el = {
    probeTimestamp: document.getElementById('probe-timestamp'),
    rerunBtn: document.getElementById('rerun-probes-btn'),
    rerunIcon: document.getElementById('rerun-icon'),
    primaryIp: document.getElementById('primary-ip-value'),
    copyIpBtn: document.getElementById('copy-ip-btn'),
    copyIpIcon: document.getElementById('copy-ip-icon'),
    copyIpCheck: document.getElementById('copy-ip-check'),
    copyIpLabel: document.getElementById('copy-ip-label'),
    copyLive: document.getElementById('copy-live-region'),
    heroSubtitle: document.getElementById('hero-subtitle'),
    ipVersionBadge: document.getElementById('ip-version-badge'),
    tzStatusPill: document.getElementById('tz-status-pill'),
    aiMeta: document.getElementById('ai-summary-meta'),
    refreshAiBtn: document.getElementById('refresh-ai-btn'),
    refreshAiIcon: document.getElementById('refresh-ai-icon'),
    aiSkeleton: document.getElementById('ai-summary-skeleton'),
    aiList: document.getElementById('ai-summary-list'),
    aiError: document.getElementById('ai-summary-error'),
    chatClear: document.getElementById('ai-chat-clear'),
    chatSuggestions: document.getElementById('ai-chat-suggestions'),
    chatThread: document.getElementById('ai-chat-thread'),
    chatForm: document.getElementById('ai-chat-form'),
    chatInput: document.getElementById('ai-chat-input'),
    chatSend: document.getElementById('ai-chat-send'),
    dualStackBadge: document.getElementById('dual-stack-badge'),
    isp: document.getElementById('val-isp'),
    asn: document.getElementById('val-asn'),
    asDomain: document.getElementById('val-as-domain'),
    ptr: document.getElementById('val-ptr'),
    ipv4: document.getElementById('val-ipv4'),
    ipv6: document.getElementById('val-ipv6'),
    location: document.getElementById('val-location'),
    coords: document.getElementById('val-coords'),
    mapLinks: document.getElementById('map-links'),
    osmLink: document.getElementById('osm-link'),
    gmapsLink: document.getElementById('gmaps-link'),
    ipTz: document.getElementById('val-ip-tz'),
    deviceTz: document.getElementById('val-device-tz'),
    ssid: document.getElementById('val-ssid'),
    lanIp: document.getElementById('val-lan-ip'),
    connType: document.getElementById('val-conn-type'),
    linkMetrics: document.getElementById('val-link-metrics'),
    platform: document.getElementById('val-platform'),
    screen: document.getElementById('val-screen'),
    battery: document.getElementById('val-battery'),
    saveData: document.getElementById('val-savedata'),
    bridgeBtn: document.getElementById('bridge-info-btn'),
    bridgePopover: document.getElementById('bridge-info-popover'),
    bridgeClose: document.getElementById('bridge-info-close'),
    rawJson: document.getElementById('raw-json-output'),
    copyJsonBtn: document.getElementById('copy-json-btn'),
    copyJsonIcon: document.getElementById('copy-json-icon'),
    copyJsonCheck: document.getElementById('copy-json-check'),
    copyJsonLabel: document.getElementById('copy-json-label'),
  };

  function updateRawJson() {
    el.rawJson.textContent = JSON.stringify(
      {
        server: state.server,
        client: state.client,
        aiSummary: state.ai,
      },
      null,
      2
    );
  }

  function setStatusPill(node, tone, text) {
    const toneClasses = {
      emerald: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
      amber: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
      cyan: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300',
      neutral: 'border-zinc-700/80 bg-zinc-900 text-zinc-300',
    };
    const dotClasses = {
      emerald: 'bg-emerald-400',
      amber: 'bg-amber-400',
      cyan: 'bg-cyan-400',
      neutral: 'bg-zinc-500',
    };
    node.className = `inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${toneClasses[tone] || toneClasses.neutral}`;
    node.replaceChildren();
    const dot = document.createElement('span');
    dot.className = `h-1.5 w-1.5 rounded-full ${dotClasses[tone] || dotClasses.neutral}`;
    const label = document.createElement('span');
    label.textContent = text;
    node.append(dot, label);
  }

  async function readClientContext() {
    const params = new URLSearchParams(window.location.search);
    const ssidParam = params.get('ssid')?.trim() || null;
    const lanParam = params.get('lan')?.trim() || null;

    const deviceTimezone =
      Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unavailable';

    const navConn =
      navigator.connection ||
      navigator.mozConnection ||
      navigator.webkitConnection ||
      null;

    const connection = navConn
      ? {
          supported: true,
          effectiveType: navConn.effectiveType || null,
          type: navConn.type || null,
          downlink: typeof navConn.downlink === 'number' ? navConn.downlink : null,
          rtt: typeof navConn.rtt === 'number' ? navConn.rtt : null,
          saveData: typeof navConn.saveData === 'boolean' ? navConn.saveData : null,
        }
      : {
          supported: false,
          effectiveType: null,
          type: null,
          downlink: null,
          rtt: null,
          saveData: null,
        };

    const platform =
      navigator.userAgentData?.platform || navigator.platform || 'Unknown';
    const hardwareConcurrency =
      typeof navigator.hardwareConcurrency === 'number'
        ? navigator.hardwareConcurrency
        : null;

    const dpr = window.devicePixelRatio || 1;
    const screenInfo = `${window.screen.width} × ${window.screen.height} @ ${dpr}x`;

    let battery = { supported: false, level: null, charging: null };
    if (typeof navigator.getBattery === 'function') {
      try {
        const b = await navigator.getBattery();
        battery = {
          supported: true,
          level: typeof b.level === 'number' ? Math.round(b.level * 100) : null,
          charging: typeof b.charging === 'boolean' ? b.charging : null,
        };
      } catch {
        battery = { supported: false, level: null, charging: null };
      }
    }

    return {
      deviceTimezone,
      platform,
      hardwareConcurrency,
      screen: screenInfo,
      battery,
      connection,
      bridged: {
        ssid: ssidParam,
        lanIp: lanParam,
      },
      dualStack: {
        ipv4: null,
        ipv6: null,
        ipv4Status: 'probing',
        ipv6Status: 'probing',
      },
    };
  }

  function renderClientBasics(client) {
    el.deviceTz.textContent = client.deviceTimezone;

    if (client.bridged.ssid) {
      el.ssid.textContent = client.bridged.ssid;
      el.ssid.className = 'mt-1 font-mono text-sm text-emerald-300 break-all';
    } else {
      el.ssid.textContent = 'Sandboxed by Browser';
      el.ssid.className = 'mt-1 font-mono text-sm text-zinc-400';
    }

    if (client.bridged.lanIp) {
      el.lanIp.textContent = client.bridged.lanIp;
      el.lanIp.className = 'mt-1 font-mono text-sm text-emerald-300 tabular-nums break-all';
    } else {
      el.lanIp.textContent = 'Sandboxed by Browser';
      el.lanIp.className = 'mt-1 font-mono text-sm text-zinc-400';
    }

    if (client.connection.supported) {
      const parts = [client.connection.type, client.connection.effectiveType].filter(Boolean);
      el.connType.textContent = parts.length ? parts.join(' / ').toUpperCase() : 'Available';
      const dl = client.connection.downlink != null ? `${client.connection.downlink} Mbps` : '—';
      const rtt = client.connection.rtt != null ? `${client.connection.rtt} ms` : '—';
      el.linkMetrics.textContent = `${dl} · ${rtt}`;
      el.saveData.textContent =
        client.connection.saveData === true
          ? 'Enabled'
          : client.connection.saveData === false
            ? 'Disabled'
            : '—';
    } else {
      el.connType.textContent = 'Unsupported in Browser';
      el.connType.className = 'mt-1 font-mono text-sm text-zinc-400';
      el.linkMetrics.textContent = 'Unavailable';
      el.linkMetrics.className = 'mt-1 font-mono text-sm text-zinc-400';
      el.saveData.textContent = 'Unavailable';
      el.saveData.className = 'mt-1 font-mono text-sm text-zinc-400';
    }

    const cores =
      client.hardwareConcurrency != null ? `${client.hardwareConcurrency} cores` : 'Cores N/A';
    el.platform.textContent = `${client.platform} · ${cores}`;
    el.screen.textContent = client.screen;

    if (client.battery.supported && client.battery.level != null) {
      el.battery.textContent = `${client.battery.level}% (${client.battery.charging ? 'Charging' : 'Discharging'})`;
    } else {
      el.battery.textContent = 'Unavailable';
      el.battery.className = 'mt-1 font-mono text-sm text-zinc-400';
    }
  }

  function renderTimezoneComparison() {
    const ipTz = state.server?.geo?.timezone;
    const devTz = state.client?.deviceTimezone;
    if (!ipTz || !devTz || devTz === 'Unavailable') {
      setStatusPill(el.tzStatusPill, 'neutral', 'Timezone Unknown');
      return;
    }
    if (ipTz === devTz) {
      setStatusPill(el.tzStatusPill, 'emerald', 'Timezone Match');
    } else {
      setStatusPill(el.tzStatusPill, 'amber', `Timezone Mismatch (${ipTz} vs ${devTz})`);
    }
  }

  function renderServerTelemetry(server) {
    el.primaryIp.textContent = server.ip || 'Unavailable';
    el.copyIpBtn.disabled = !server.ip;

    const version = server.ipVersion || (server.ip?.includes(':') ? 'IPv6' : 'IPv4');
    setStatusPill(el.ipVersionBadge, version === 'IPv6' ? 'cyan' : 'emerald', version);

    const ispLabel = server.asn?.asName || 'Unknown ISP';
    const geoParts = [server.geo?.city, server.geo?.region, server.geo?.country].filter(Boolean);
    const geoLabel = geoParts.length ? geoParts.join(', ') : 'Edge geolocation unavailable';
    el.heroSubtitle.textContent = `${ispLabel} · ${geoLabel}`;

    el.isp.textContent = server.asn?.asName || 'Unavailable';
    el.asn.textContent = server.asn?.asn || '—';
    el.asDomain.textContent = server.asn?.asDomain || '—';

    if (server.ptr?.hostname) {
      el.ptr.textContent = server.ptr.hostname;
      el.ptr.className = 'mt-1 font-mono text-sm text-zinc-200 break-all';
    } else {
      el.ptr.textContent =
        server.ptr?.status === 'timeout' ? 'Lookup timed out' : 'No PTR record (NXDOMAIN)';
      el.ptr.className = 'mt-1 font-mono text-sm text-zinc-400';
    }

    el.location.textContent = geoLabel;
    el.ipTz.textContent = server.geo?.timezone || 'Unavailable';

    if (server.geo?.latitude != null && server.geo?.longitude != null) {
      const lat = server.geo.latitude.toFixed(4);
      const lon = server.geo.longitude.toFixed(4);
      el.coords.textContent = `${lat}, ${lon}`;
      el.osmLink.href = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=11/${lat}/${lon}`;
      el.gmapsLink.href = `https://www.google.com/maps?q=${lat},${lon}`;
      el.mapLinks.classList.remove('hidden');
    } else {
      el.coords.textContent = 'Unavailable';
      el.mapLinks.classList.add('hidden');
    }

    el.probeTimestamp.textContent = `Probed ${new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })}`;
    renderTimezoneComparison();
  }

  function renderDualStack(dualStack) {
    if (dualStack.ipv4) {
      el.ipv4.textContent = dualStack.ipv4;
      el.ipv4.className = 'mt-1 font-mono text-sm text-emerald-300 tabular-nums break-all';
    } else {
      el.ipv4.textContent = 'Unreachable';
      el.ipv4.className = 'mt-1 font-mono text-sm text-zinc-400';
    }

    if (dualStack.ipv6) {
      el.ipv6.textContent = dualStack.ipv6;
      el.ipv6.className = 'mt-1 font-mono text-sm text-cyan-300 tabular-nums break-all';
    } else {
      el.ipv6.textContent = 'Not Active (IPv4-only)';
      el.ipv6.className = 'mt-1 font-mono text-sm text-zinc-400';
    }

    if (dualStack.ipv4 && dualStack.ipv6) {
      el.dualStackBadge.textContent = 'Dual-Stack (v4 + v6)';
      el.dualStackBadge.className =
        'rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[11px] text-emerald-300';
    } else if (dualStack.ipv4) {
      el.dualStackBadge.textContent = 'IPv4 Only';
      el.dualStackBadge.className =
        'rounded-md border border-zinc-700 bg-zinc-950/70 px-2 py-0.5 font-mono text-[11px] text-zinc-300';
    } else if (dualStack.ipv6) {
      el.dualStackBadge.textContent = 'IPv6 Only';
      el.dualStackBadge.className =
        'rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 font-mono text-[11px] text-cyan-300';
    } else {
      el.dualStackBadge.textContent = 'Probes Failed';
      el.dualStackBadge.className =
        'rounded-md border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 font-mono text-[11px] text-rose-300';
    }
  }

  function parseBullets(text) {
    return String(text || '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.replace(/^[-*•]\s+/, '').replace(/^\d+\.\s+/, ''));
  }

  function renderAiSummary(payload) {
    const bullets = parseBullets(payload.summary);
    el.aiList.replaceChildren();

    for (const bullet of bullets) {
      const li = document.createElement('li');
      li.className = 'flex items-start gap-2.5';

      const marker = document.createElement('span');
      marker.className = 'mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400';
      marker.setAttribute('aria-hidden', 'true');

      const text = document.createElement('span');
      text.textContent = bullet;

      li.append(marker, text);
      el.aiList.appendChild(li);
    }

    el.aiSkeleton.classList.add('hidden');
    el.aiError.classList.add('hidden');
    el.aiList.classList.remove('hidden');

    const cachedTag = payload.cached ? 'cached (30m TTL)' : 'live';
    const searchTag = payload.webSearch ? ' + web search' : '';
    el.aiMeta.textContent = `DeepSeek (${payload.model || 'deepseek-flash'}${searchTag}) · ${cachedTag}`;
  }

  function renderAiError(message) {
    el.aiSkeleton.classList.add('hidden');
    el.aiList.classList.add('hidden');
    el.aiError.textContent = `AI analysis unavailable: ${message}. Raw network telemetry above remains live.`;
    el.aiError.classList.remove('hidden');
  }

  async function fetchIpify(url) {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(4500),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data.ip || null;
  }

  async function fetchAiSummary(refresh = false) {
    el.refreshAiBtn.disabled = true;
    el.refreshAiIcon.classList.add('animate-spin');
    el.aiError.classList.add('hidden');
    if (!refresh) {
      el.aiList.classList.add('hidden');
      el.aiSkeleton.classList.remove('hidden');
    }

    try {
      const response = await fetch('/api/ip-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refresh,
          clientTelemetry: state.client,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || `HTTP ${response.status}`);
      }
      state.ai = data;
      renderAiSummary(data);
      updateRawJson();
    } catch (err) {
      renderAiError(err?.message || 'Request failed');
    } finally {
      el.refreshAiBtn.disabled = false;
      el.refreshAiIcon.classList.remove('animate-spin');
    }
  }

  function renderChatThread(pendingText = null) {
    const hasMessages = state.chatMessages.length > 0 || Boolean(pendingText);
    el.chatThread.classList.toggle('hidden', !hasMessages);
    el.chatClear.classList.toggle('hidden', state.chatMessages.length === 0);
    el.chatThread.replaceChildren();

    for (const msg of state.chatMessages) {
      const wrapper = document.createElement('div');
      const isUser = msg.role === 'user';
      wrapper.className = isUser
        ? 'ml-auto max-w-[85%] rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-2.5 text-sm text-emerald-100'
        : msg.isError
          ? 'mr-auto max-w-[92%] rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-sm text-rose-200'
          : 'mr-auto max-w-[92%] rounded-xl border border-zinc-800 bg-zinc-950/80 px-3.5 py-2.5 text-sm leading-relaxed text-zinc-200 whitespace-pre-wrap';

      if (!isUser && !msg.isError && msg.meta) {
        const meta = document.createElement('div');
        meta.className = 'mb-1 font-mono text-[11px] text-zinc-400';
        meta.textContent = msg.meta;
        wrapper.appendChild(meta);
      }

      const body = document.createElement('div');
      body.textContent = msg.content;
      wrapper.appendChild(body);
      el.chatThread.appendChild(wrapper);
    }

    if (pendingText) {
      const loading = document.createElement('div');
      loading.className =
        'mr-auto inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950/80 px-3.5 py-2.5 text-xs text-zinc-400';
      loading.textContent = pendingText;
      el.chatThread.appendChild(loading);
    }

    el.chatThread.scrollTop = el.chatThread.scrollHeight;
  }

  async function sendChatMessage(rawText) {
    const text = String(rawText || '').trim();
    if (!text || state.chatBusy) return;

    state.chatBusy = true;
    el.chatInput.value = '';
    el.chatInput.disabled = true;
    el.chatSend.disabled = true;

    state.chatMessages.push({ role: 'user', content: text });
    renderChatThread('Searching & analyzing with DeepSeek…');

    const payloadMessages = state.chatMessages
      .filter((m) => !m.isError)
      .slice(-12)
      .map(({ role, content }) => ({ role, content }));

    try {
      const response = await fetch('/api/ip-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: payloadMessages,
          clientTelemetry: state.client,
          initialSummary: state.ai?.summary || null,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || `HTTP ${response.status}`);
      }

      state.chatMessages.push({
        role: 'assistant',
        content: data.reply,
        meta: `DeepSeek (${data.model || 'deepseek-flash'}${data.webSearch ? ' + web search' : ''})`,
      });
    } catch (err) {
      state.chatMessages.push({
        role: 'assistant',
        isError: true,
        content: `Could not get reply: ${err?.message || 'Request failed'}`,
      });
    } finally {
      state.chatBusy = false;
      el.chatInput.disabled = false;
      el.chatSend.disabled = false;
      renderChatThread();
      el.chatInput.focus();
    }
  }

  async function runDiagnostics() {
    el.rerunBtn.disabled = true;
    el.rerunIcon.classList.add('animate-spin');
    el.probeTimestamp.textContent = 'Running probes…';

    state.client = await readClientContext();
    renderClientBasics(state.client);
    updateRawJson();

    const [serverRes, ipv4Res, ipv6Res] = await Promise.allSettled([
      fetch('/api/ip-telemetry', { cache: 'no-store' }).then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      }),
      fetchIpify('https://api4.ipify.org?format=json'),
      fetchIpify('https://api6.ipify.org?format=json'),
    ]);

    if (serverRes.status === 'fulfilled') {
      state.server = serverRes.value;
      renderServerTelemetry(state.server);
    } else {
      el.primaryIp.textContent = 'Telemetry Error';
      el.heroSubtitle.textContent = 'Could not reach /api/ip-telemetry.';
      el.probeTimestamp.textContent = 'Edge probe failed';
    }

    state.client.dualStack = {
      ipv4: ipv4Res.status === 'fulfilled' ? ipv4Res.value : null,
      ipv6: ipv6Res.status === 'fulfilled' ? ipv6Res.value : null,
      ipv4Status: ipv4Res.status === 'fulfilled' ? 'active' : 'unreachable',
      ipv6Status: ipv6Res.status === 'fulfilled' ? 'active' : 'unreachable',
    };
    renderDualStack(state.client.dualStack);
    updateRawJson();

    el.rerunBtn.disabled = false;
    el.rerunIcon.classList.remove('animate-spin');

    await fetchAiSummary(false);
  }

  function wireCopyButton(button, iconEl, checkEl, labelEl, getText, defaultLabel, copiedLabel) {
    let resetTimer = null;
    button.addEventListener('click', async () => {
      const value = getText();
      if (!value) return;
      try {
        await navigator.clipboard.writeText(value);
        iconEl.classList.add('hidden');
        checkEl.classList.remove('hidden');
        labelEl.textContent = copiedLabel;
        el.copyLive.textContent = `${copiedLabel} to clipboard`;
        clearTimeout(resetTimer);
        resetTimer = setTimeout(() => {
          iconEl.classList.remove('hidden');
          checkEl.classList.add('hidden');
          labelEl.textContent = defaultLabel;
        }, 1800);
      } catch {
        labelEl.textContent = 'Copy Failed';
      }
    });
  }

  function wireEvents() {
    wireCopyButton(
      el.copyIpBtn,
      el.copyIpIcon,
      el.copyIpCheck,
      el.copyIpLabel,
      () => state.server?.ip || '',
      'Copy IP',
      'Copied'
    );

    wireCopyButton(
      el.copyJsonBtn,
      el.copyJsonIcon,
      el.copyJsonCheck,
      el.copyJsonLabel,
      () => el.rawJson.textContent || '',
      'Copy JSON',
      'Copied JSON'
    );

    el.refreshAiBtn.addEventListener('click', () => {
      fetchAiSummary(true);
    });

    el.chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      sendChatMessage(el.chatInput.value);
    });

    el.chatSuggestions.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-chat-prompt]');
      if (!btn || state.chatBusy) return;
      sendChatMessage(btn.dataset.chatPrompt || '');
    });

    el.chatClear.addEventListener('click', () => {
      state.chatMessages = [];
      renderChatThread();
    });

    el.rerunBtn.addEventListener('click', () => {
      runDiagnostics();
    });

    const togglePopover = (open) => {
      const isOpen = open ?? el.bridgePopover.classList.contains('hidden');
      el.bridgePopover.classList.toggle('hidden', !isOpen);
      el.bridgeBtn.setAttribute('aria-expanded', String(isOpen));
    };

    el.bridgeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      togglePopover();
    });

    el.bridgeClose.addEventListener('click', () => {
      togglePopover(false);
      el.bridgeBtn.focus();
    });

    document.addEventListener('click', (e) => {
      if (
        !el.bridgePopover.classList.contains('hidden') &&
        !el.bridgePopover.contains(e.target) &&
        !el.bridgeBtn.contains(e.target)
      ) {
        togglePopover(false);
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !el.bridgePopover.classList.contains('hidden')) {
        togglePopover(false);
        el.bridgeBtn.focus();
      }
    });
  }

  wireEvents();
  runDiagnostics();
})();

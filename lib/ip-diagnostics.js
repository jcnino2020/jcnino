import dns from 'node:dns/promises';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';
const IPINFO_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const SUMMARY_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const MANUAL_REFRESH_COOLDOWN_MS = 60 * 1000; // 60 seconds

const ipLookupCache = new Map();
const summaryCache = new Map();
const chatRateLimit = new Map();
const CHAT_RATE_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const CHAT_RATE_MAX = 20;

export function isAllowedOrigin(origin) {
  if (!origin || origin === 'null' || origin === 'file://') return true;
  const localRegex = /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\]|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|[a-zA-Z0-9-]+\.local|[a-zA-Z0-9-]+\.internal)(:\d+)?$/;
  const pagesDevRegex = /^https:\/\/([a-zA-Z0-9-]+\.)*pages\.dev$/;
  const vercelRegex = /^https:\/\/([a-zA-Z0-9-]+\.)*vercel\.app$/;
  const githubPagesRegex = /^https:\/\/([a-zA-Z0-9-]+\.)*github\.io$/;
  const customDomainRegex = /^https?:\/\/([a-zA-Z0-9-]+\.)*(jcnino\.(dev|com|me)|jcninonuevo\.com)$/;
  return (
    localRegex.test(origin) ||
    pagesDevRegex.test(origin) ||
    vercelRegex.test(origin) ||
    githubPagesRegex.test(origin) ||
    customDomainRegex.test(origin)
  );
}

export function extractClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  let rawIp = '';
  if (typeof forwarded === 'string' && forwarded.trim()) {
    rawIp = forwarded.split(',')[0].trim();
  } else if (Array.isArray(forwarded) && forwarded.length > 0) {
    rawIp = String(forwarded[0]).split(',')[0].trim();
  } else if (typeof req.headers['x-real-ip'] === 'string' && req.headers['x-real-ip'].trim()) {
    rawIp = req.headers['x-real-ip'].trim();
  } else if (req.socket?.remoteAddress) {
    rawIp = req.socket.remoteAddress;
  }

  if (!rawIp) return '127.0.0.1';
  if (rawIp.startsWith('::ffff:')) return rawIp.slice(7);
  if (rawIp === '::1') return '127.0.0.1';
  return rawIp;
}

function safeDecodeHeader(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    return decodeURIComponent(value.trim());
  } catch {
    return value.trim();
  }
}

export function extractVercelGeo(headers) {
  const latRaw = headers['x-vercel-ip-latitude'];
  const lonRaw = headers['x-vercel-ip-longitude'];
  const latitude = latRaw != null && latRaw !== '' && !Number.isNaN(Number(latRaw)) ? Number(latRaw) : null;
  const longitude = lonRaw != null && lonRaw !== '' && !Number.isNaN(Number(lonRaw)) ? Number(lonRaw) : null;

  return {
    city: safeDecodeHeader(headers['x-vercel-ip-city']),
    region: safeDecodeHeader(headers['x-vercel-ip-country-region']),
    country: safeDecodeHeader(headers['x-vercel-ip-country']),
    latitude,
    longitude,
    timezone: safeDecodeHeader(headers['x-vercel-ip-timezone']),
  };
}

function isPrivateOrLocalIp(ip) {
  if (!ip) return true;
  if (ip === '127.0.0.1' || ip === '::1' || ip === '0.0.0.0') return true;
  if (ip.startsWith('10.') || ip.startsWith('192.168.') || ip.startsWith('169.254.')) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(ip)) return true;
  if (ip.toLowerCase().startsWith('fc') || ip.toLowerCase().startsWith('fd') || ip.toLowerCase().startsWith('fe80:')) return true;
  return false;
}

async function fetchIpInfoLite(ip) {
  if (isPrivateOrLocalIp(ip)) {
    return {
      asn: null,
      asName: 'Localhost / Private Network',
      asDomain: null,
      country: null,
      continent: null,
      source: 'local-fallback',
    };
  }

  const token = process.env.IPINFO_TOKEN;
  const url = token
    ? `https://api.ipinfo.io/lite/${encodeURIComponent(ip)}?token=${encodeURIComponent(token)}`
    : `https://api.ipinfo.io/lite/${encodeURIComponent(ip)}`;

  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(3500),
    });

    if (!response.ok) {
      return {
        asn: null,
        asName: null,
        asDomain: null,
        country: null,
        continent: null,
        source: `ipinfo-http-${response.status}`,
      };
    }

    const data = await response.json();
    return {
      asn: data.asn || null,
      asName: data.as_name || data.org || null,
      asDomain: data.as_domain || null,
      country: data.country || data.country_code || null,
      continent: data.continent || null,
      source: 'ipinfo-lite',
    };
  } catch (err) {
    return {
      asn: null,
      asName: null,
      asDomain: null,
      country: null,
      continent: null,
      source: 'ipinfo-error',
      error: err?.name === 'TimeoutError' ? 'IPinfo lookup timed out' : 'IPinfo lookup failed',
    };
  }
}

async function lookupPtr(ip) {
  if (isPrivateOrLocalIp(ip)) {
    return { hostname: 'localhost', hostnames: ['localhost'], status: 'local' };
  }

  let timeoutId;
  try {
    const hostnames = await Promise.race([
      dns.reverse(ip),
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('PTR_TIMEOUT')), 1500);
      }),
    ]);
    clearTimeout(timeoutId);
    const list = Array.isArray(hostnames) ? hostnames : [];
    return {
      hostname: list[0] || null,
      hostnames: list,
      status: list.length > 0 ? 'resolved' : 'empty',
    };
  } catch (err) {
    clearTimeout(timeoutId);
    return {
      hostname: null,
      hostnames: [],
      status: err?.message === 'PTR_TIMEOUT' ? 'timeout' : 'nxdomain',
    };
  }
}

export async function getServerTelemetry(req) {
  const ip = extractClientIp(req);
  const ipVersion = ip.includes(':') ? 'IPv6' : 'IPv4';
  const geo = extractVercelGeo(req.headers);

  const now = Date.now();
  const cached = ipLookupCache.get(ip);
  let asn;
  let ptr;

  if (cached && now - cached.timestamp < IPINFO_CACHE_TTL_MS) {
    asn = cached.asn;
    ptr = cached.ptr;
  } else {
    [asn, ptr] = await Promise.all([fetchIpInfoLite(ip), lookupPtr(ip)]);
    ipLookupCache.set(ip, { asn, ptr, timestamp: now });
  }

  return {
    ip,
    ipVersion,
    geo,
    asn,
    ptr,
    timestamp: new Date().toISOString(),
  };
}

export async function handleIpTelemetry(req, res) {
  const origin = req.headers.origin;
  if (origin) {
    if (isAllowedOrigin(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      return res.status(403).json({ error: 'Origin not allowed' });
    }
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const telemetry = await getServerTelemetry(req);
  return res.status(200).json(telemetry);
}

function sanitizeString(value, maxLen = 120) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLen) : null;
}

function sanitizeNumber(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return value;
}

function sanitizeClientTelemetry(raw) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const dualStack = src.dualStack && typeof src.dualStack === 'object' ? src.dualStack : {};
  const connection = src.connection && typeof src.connection === 'object' ? src.connection : {};
  const bridged = src.bridged && typeof src.bridged === 'object' ? src.bridged : {};

  return {
    dualStack: {
      ipv4: sanitizeString(dualStack.ipv4, 64),
      ipv6: sanitizeString(dualStack.ipv6, 64),
      ipv4Status: sanitizeString(dualStack.ipv4Status, 32),
      ipv6Status: sanitizeString(dualStack.ipv6Status, 32),
    },
    deviceTimezone: sanitizeString(src.deviceTimezone, 80),
    platform: sanitizeString(src.platform, 64),
    hardwareConcurrency: sanitizeNumber(src.hardwareConcurrency),
    connection: {
      effectiveType: sanitizeString(connection.effectiveType, 24),
      type: sanitizeString(connection.type, 24),
      downlink: sanitizeNumber(connection.downlink),
      rtt: sanitizeNumber(connection.rtt),
      saveData: typeof connection.saveData === 'boolean' ? connection.saveData : null,
    },
    bridged: {
      ssid: sanitizeString(bridged.ssid, 64),
      lanIp: sanitizeString(bridged.lanIp, 64),
    },
  };
}

async function callDeepSeek(apiKey, messages, model, useWebSearch = false, stream = false) {
  const payload = {
    model,
    messages,
    temperature: 0.3,
    max_tokens: 1024,
    stream,
  };

  if (useWebSearch) {
    payload.thinking = { type: 'disabled' };
    payload.tools = [
      { type: 'deepseek_web_search', name: 'deepseek_web_search' },
      { type: 'deepseek_read_url', name: 'deepseek_read_url' },
    ];
  }

  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(useWebSearch ? 30000 : 15000),
  });

  if (stream) {
    return { response, data: null };
  }

  const data = await response.json();
  return { response, data };
}

function initSseResponse(res) {
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  if (typeof res.flushHeaders === 'function') {
    res.flushHeaders();
  }
}

function writeSseEvent(res, eventObj) {
  res.write(`data: ${JSON.stringify(eventObj)}\n\n`);
}

async function forwardDeepSeekStream(response, res) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line.startsWith('data:')) continue;
      const dataStr = line.slice(5).trim();
      if (!dataStr || dataStr === '[DONE]') continue;

      try {
        const parsed = JSON.parse(dataStr);
        const delta = parsed?.choices?.[0]?.delta?.content;
        if (typeof delta === 'string' && delta.length > 0) {
          fullText += delta;
          writeSseEvent(res, { type: 'delta', content: delta });
        }
      } catch {
        // Ignore partial or non-JSON SSE comments
      }
    }
  }

  return fullText.trim();
}

export async function handleIpSummary(req, res) {
  const origin = req.headers.origin;
  if (origin) {
    if (isAllowedOrigin(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      return res.status(403).json({ error: 'Origin not allowed' });
    }
  }

  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'DEEPSEEK_API_KEY is not configured on the server' });
  }

  const serverTelemetry = await getServerTelemetry(req);
  const clientIp = serverTelemetry.ip;
  const now = Date.now();
  const forceRefresh = req.body?.refresh === true;
  const wantsStream = req.body?.stream === true;

  const cached = summaryCache.get(clientIp);
  if (cached) {
    const age = now - cached.timestamp;
    const withinTtl = age < SUMMARY_CACHE_TTL_MS;
    const withinCooldown = age < MANUAL_REFRESH_COOLDOWN_MS;
    if (withinTtl && (!forceRefresh || withinCooldown)) {
      if (wantsStream) {
        initSseResponse(res);
        writeSseEvent(res, { type: 'delta', content: cached.summary });
        writeSseEvent(res, {
          type: 'done',
          cached: true,
          cachedAt: new Date(cached.timestamp).toISOString(),
          model: cached.model,
          webSearch: Boolean(cached.webSearch),
        });
        return res.end();
      }
      return res.status(200).json({
        summary: cached.summary,
        cached: true,
        cachedAt: new Date(cached.timestamp).toISOString(),
        model: cached.model,
        webSearch: Boolean(cached.webSearch),
      });
    }
  }

  const clientTelemetry = sanitizeClientTelemetry(req.body?.clientTelemetry || req.body);

  const systemPrompt = [
    'You are a sharp network engineer writing a live connection diagnostic.',
    'Use your web search tool when helpful to verify the ASN, IP prefix, PoP location, or ISP PTR naming conventions.',
    'Output exactly 3 to 4 concise bullet points (starting each with "- ") and nothing else—no intro, no outro, no markdown headings.',
    'Cover these four areas:',
    '1. ISP & Routing context: note whether geolocation looks like a central carrier gateway (e.g., Manila/capital POP vs actual user location/regional PoP) and call out any stale or revealing reverse DNS (PTR) hostname quirks.',
    '2. Protocol & Dual-Stack health: note IPv4-only fallback vs active dual-stack IPv6.',
    '3. Privacy & Routing integrity: compare IP timezone vs device browser timezone to flag VPNs, proxies, or CGNAT mismatches.',
    '4. Link quality summary: comment on RTT latency, downlink estimate, or bridged Wi-Fi/LAN context if present.',
    'Keep each bullet crisp (1-2 sentences max), grounded strictly in the provided telemetry and verified search findings.',
  ].join(' ');

  const userPayload = {
    server: {
      ip: serverTelemetry.ip,
      ipVersion: serverTelemetry.ipVersion,
      asn: serverTelemetry.asn?.asn || null,
      asName: serverTelemetry.asn?.asName || null,
      asDomain: serverTelemetry.asn?.asDomain || null,
      ptrHostname: serverTelemetry.ptr?.hostname || null,
      ptrStatus: serverTelemetry.ptr?.status || null,
      geo: serverTelemetry.geo,
    },
    client: clientTelemetry,
  };

  const messages = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: `Analyze this network telemetry:\n${JSON.stringify(userPayload, null, 2)}`,
    },
  ];

  try {
    let usedModel = 'deepseek-flash';
    let webSearch = true;

    if (wantsStream) {
      initSseResponse(res);
      let { response } = await callDeepSeek(apiKey, messages, usedModel, webSearch, true);
      let summary = '';

      if (response.ok && response.body) {
        summary = await forwardDeepSeekStream(response, res);
      }

      if (!response.ok || !summary) {
        usedModel = 'deepseek-chat';
        webSearch = false;
        ({ response } = await callDeepSeek(apiKey, messages, usedModel, webSearch, true));
        if (response.ok && response.body) {
          summary = await forwardDeepSeekStream(response, res);
        }
      }

      if (!summary) {
        writeSseEvent(res, { type: 'error', error: 'DeepSeek returned an empty analysis' });
        return res.end();
      }

      summaryCache.set(clientIp, { summary, timestamp: now, model: usedModel, webSearch });
      writeSseEvent(res, {
        type: 'done',
        cached: false,
        cachedAt: new Date(now).toISOString(),
        model: usedModel,
        webSearch,
      });
      return res.end();
    }

    let { response, data } = await callDeepSeek(apiKey, messages, usedModel, webSearch, false);

    let summary = data?.choices?.[0]?.message?.content?.trim() || '';
    if ((!response.ok && response.status === 400) || (response.ok && !summary)) {
      usedModel = 'deepseek-chat';
      webSearch = false;
      ({ response, data } = await callDeepSeek(apiKey, messages, usedModel, webSearch, false));
      summary = data?.choices?.[0]?.message?.content?.trim() || '';
    }

    if (!response.ok) {
      console.error('DeepSeek IP summary error:', data);
      return res.status(response.status).json({
        error: data?.error?.message || 'DeepSeek API request failed',
      });
    }

    if (!summary) {
      return res.status(502).json({ error: 'DeepSeek returned an empty analysis' });
    }

    summaryCache.set(clientIp, { summary, timestamp: now, model: usedModel, webSearch });

    return res.status(200).json({
      summary,
      cached: false,
      cachedAt: new Date(now).toISOString(),
      model: usedModel,
      webSearch,
    });
  } catch (err) {
    console.error('IP Summary Error:', err);
    if (wantsStream && res.headersSent) {
      writeSseEvent(res, { type: 'error', error: 'Failed to reach DeepSeek API' });
      return res.end();
    }
    return res.status(500).json({ error: 'Failed to reach DeepSeek API' });
  }
}

function checkChatRateLimit(ip) {
  const now = Date.now();
  const entry = chatRateLimit.get(ip);
  if (!entry || now - entry.windowStart >= CHAT_RATE_WINDOW_MS) {
    chatRateLimit.set(ip, { windowStart: now, count: 1 });
    return true;
  }
  if (entry.count >= CHAT_RATE_MAX) {
    return false;
  }
  entry.count += 1;
  return true;
}

export async function handleIpChat(req, res) {
  const origin = req.headers.origin;
  if (origin) {
    if (isAllowedOrigin(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      return res.status(403).json({ error: 'Origin not allowed' });
    }
  }

  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'DEEPSEEK_API_KEY is not configured on the server' });
  }

  const serverTelemetry = await getServerTelemetry(req);
  if (!checkChatRateLimit(serverTelemetry.ip)) {
    return res.status(429).json({ error: 'Rate limit exceeded. Please wait a few minutes before sending more messages.' });
  }

  const rawMessages = req.body?.messages;
  if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  const sanitizedMessages = rawMessages
    .slice(-12)
    .map((m) => {
      if (!m || typeof m !== 'object') return null;
      const role = m.role === 'user' || m.role === 'assistant' ? m.role : null;
      const content = typeof m.content === 'string' ? m.content.trim().slice(0, 1500) : null;
      if (!role || !content) return null;
      return { role, content };
    })
    .filter(Boolean);

  if (sanitizedMessages.length === 0 || sanitizedMessages[sanitizedMessages.length - 1].role !== 'user') {
    return res.status(400).json({ error: 'Last message must be a non-empty user prompt' });
  }

  const clientTelemetry = sanitizeClientTelemetry(req.body?.clientTelemetry);
  const initialSummary = sanitizeString(req.body?.initialSummary, 2000);

  const telemetryContext = {
    server: {
      ip: serverTelemetry.ip,
      ipVersion: serverTelemetry.ipVersion,
      asn: serverTelemetry.asn?.asn || null,
      asName: serverTelemetry.asn?.asName || null,
      asDomain: serverTelemetry.asn?.asDomain || null,
      ptrHostname: serverTelemetry.ptr?.hostname || null,
      ptrStatus: serverTelemetry.ptr?.status || null,
      geo: serverTelemetry.geo,
    },
    client: clientTelemetry,
    initialSummary,
  };

  const systemPrompt = [
    'You are a sharp network engineer assisting a user on their live /ip diagnostics dashboard.',
    'Use your web search tool whenever helpful to verify ASN peering, IP prefix ownership, CGNAT ranges, ISP policies, or PTR conventions.',
    'Answer concisely, directly, and practically in plain text or short bullets—no filler.',
    `Live session telemetry:\n${JSON.stringify(telemetryContext, null, 2)}`,
  ].join('\n\n');

  const messages = [{ role: 'system', content: systemPrompt }, ...sanitizedMessages];

  const wantsStream = req.body?.stream === true;

  try {
    let usedModel = 'deepseek-flash';
    let webSearch = true;

    if (wantsStream) {
      initSseResponse(res);
      let { response } = await callDeepSeek(apiKey, messages, usedModel, webSearch, true);
      let reply = '';

      if (response.ok && response.body) {
        reply = await forwardDeepSeekStream(response, res);
      }

      if (!response.ok || !reply) {
        usedModel = 'deepseek-chat';
        webSearch = false;
        ({ response } = await callDeepSeek(apiKey, messages, usedModel, webSearch, true));
        if (response.ok && response.body) {
          reply = await forwardDeepSeekStream(response, res);
        }
      }

      if (!reply) {
        writeSseEvent(res, { type: 'error', error: 'DeepSeek returned an empty reply' });
        return res.end();
      }

      writeSseEvent(res, {
        type: 'done',
        model: usedModel,
        webSearch,
      });
      return res.end();
    }

    let { response, data } = await callDeepSeek(apiKey, messages, usedModel, webSearch, false);

    let reply = data?.choices?.[0]?.message?.content?.trim() || '';
    if ((!response.ok && response.status === 400) || (response.ok && !reply)) {
      usedModel = 'deepseek-chat';
      webSearch = false;
      ({ response, data } = await callDeepSeek(apiKey, messages, usedModel, webSearch, false));
      reply = data?.choices?.[0]?.message?.content?.trim() || '';
    }

    if (!response.ok) {
      console.error('DeepSeek IP chat error:', data);
      return res.status(response.status).json({
        error: data?.error?.message || 'DeepSeek API request failed',
      });
    }

    if (!reply) {
      return res.status(502).json({ error: 'DeepSeek returned an empty reply' });
    }

    return res.status(200).json({
      reply,
      model: usedModel,
      webSearch,
    });
  } catch (err) {
    console.error('IP Chat Error:', err);
    if (wantsStream && res.headersSent) {
      writeSseEvent(res, { type: 'error', error: 'Failed to reach DeepSeek API' });
      return res.end();
    }
    return res.status(500).json({ error: 'Failed to reach DeepSeek API' });
  }
}

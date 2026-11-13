import { getServerTelemetry } from './ip-telemetry.js';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';
const SUMMARY_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const MANUAL_REFRESH_COOLDOWN_MS = 60 * 1000; // 60 seconds anti-abuse cooldown

const summaryCache = new Map();

function isAllowedOrigin(origin) {
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

async function callDeepSeek(apiKey, messages, model) {
  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.3,
      max_tokens: 250,
    }),
    signal: AbortSignal.timeout(12000),
  });

  const data = await response.json();
  return { response, data };
}

export default async function handler(req, res) {
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

  // Always derive the caller's real IP and server telemetry on the server — never trust an IP from req.body.
  const serverTelemetry = await getServerTelemetry(req);
  const clientIp = serverTelemetry.ip;
  const now = Date.now();
  const forceRefresh = req.body?.refresh === true;

  const cached = summaryCache.get(clientIp);
  if (cached) {
    const age = now - cached.timestamp;
    const withinTtl = age < SUMMARY_CACHE_TTL_MS;
    const withinCooldown = age < MANUAL_REFRESH_COOLDOWN_MS;
    if (withinTtl && (!forceRefresh || withinCooldown)) {
      return res.status(200).json({
        summary: cached.summary,
        cached: true,
        cachedAt: new Date(cached.timestamp).toISOString(),
        model: cached.model,
      });
    }
  }

  const clientTelemetry = sanitizeClientTelemetry(req.body?.clientTelemetry || req.body);

  const systemPrompt = [
    'You are a sharp network engineer writing a live connection diagnostic.',
    'Output exactly 3 to 4 concise bullet points (starting each with "- ") and nothing else—no intro, no outro, no markdown headings.',
    'Cover these four areas:',
    '1. ISP & Routing context: note whether geolocation looks like a central carrier gateway (e.g., Manila/capital POP vs actual user location) and call out any stale or revealing reverse DNS (PTR) hostname quirks.',
    '2. Protocol & Dual-Stack health: note IPv4-only fallback vs active dual-stack IPv6.',
    '3. Privacy & Routing integrity: compare IP timezone vs device browser timezone to flag VPNs, proxies, or CGNAT mismatches.',
    '4. Link quality summary: comment on RTT latency, downlink estimate, or bridged Wi-Fi/LAN context if present.',
    'Keep each bullet crisp (1-2 sentences max), grounded strictly in the provided telemetry.',
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
    let { response, data } = await callDeepSeek(apiKey, messages, usedModel);

    if (!response.ok && response.status === 400) {
      usedModel = 'deepseek-chat';
      ({ response, data } = await callDeepSeek(apiKey, messages, usedModel));
    }

    if (!response.ok) {
      console.error('DeepSeek IP summary error:', data);
      return res.status(response.status).json({
        error: data?.error?.message || 'DeepSeek API request failed',
      });
    }

    const summary = data?.choices?.[0]?.message?.content?.trim() || '';
    if (!summary) {
      return res.status(502).json({ error: 'DeepSeek returned an empty analysis' });
    }

    summaryCache.set(clientIp, { summary, timestamp: now, model: usedModel });

    return res.status(200).json({
      summary,
      cached: false,
      cachedAt: new Date(now).toISOString(),
      model: usedModel,
    });
  } catch (err) {
    console.error('IP Summary Error:', err);
    return res.status(500).json({ error: 'Failed to reach DeepSeek API' });
  }
}

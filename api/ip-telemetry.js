import dns from 'node:dns/promises';

const IPINFO_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const ipLookupCache = new Map();

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

export default async function handler(req, res) {
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

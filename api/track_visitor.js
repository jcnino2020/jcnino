let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env');
  }

  const { MongoClient } = await import('mongodb');
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 4000,
    connectTimeoutMS: 4000,
  });
  await client.connect();
  const db = client.db();
  cachedClient = client;
  cachedDb = db;
  return { client, db };
}

function isAllowedOrigin(origin) {
  if (!origin || origin === 'null' || origin === 'file://') return true;
  const localRegex = /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\]|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|[a-zA-Z0-9-]+\.local|[a-zA-Z0-9-]+\.internal)(:\d+)?$/;
  const pagesDevRegex = /^https:\/\/([a-zA-Z0-9-]+\.)*pages\.dev$/;
  const vercelRegex = /^https:\/\/([a-zA-Z0-9-]+\.)*vercel\.app$/;
  const githubPagesRegex = /^https:\/\/([a-zA-Z0-9-]+\.)*github\.io$/;
  const customDomainRegex = /^https?:\/\/([a-zA-Z0-9-]+\.)*(jcnino\.(dev|com|me)|jcninonuevo\.com)$/;
  return localRegex.test(origin) || pagesDevRegex.test(origin) || vercelRegex.test(origin) || githubPagesRegex.test(origin) || customDomainRegex.test(origin);
}

export function normalizeCityName(city) {
  const c = (city || '').trim();
  if (!c || c === 'Unknown') return 'Unknown';

  const clean = c.replace(/^City of\s+/i, '').replace(/\s+City$/i, '');

  const phCities = [
    'Pasig', 'Quezon', 'Cebu', 'Davao', 'Makati', 'Taguig', 'Mandaluyong',
    'Parañaque', 'Paranaque', 'Caloocan', 'Las Piñas', 'Las Pinas', 'Valenzuela',
    'Pasay', 'Muntinlupa', 'Marikina', 'Malabon', 'Navotas', 'San Juan', 'Bacolod',
    'Iloilo', 'Cagayan de Oro', 'Zamboanga', 'General Santos', 'Baguio', 'Lapu-Lapu',
    'Mandaue', 'Angeles', 'Olongapo', 'Antipolo', 'Imus', 'Bacoor', 'Dasmariñas', 'Dasmarinas'
  ];

  for (const phc of phCities) {
    if (phc.toLowerCase() === clean.toLowerCase()) {
      return phc + ' City';
    }
  }

  return c;
}

export function parseUserAgentInfo(ua) {
  let os = 'Unknown';
  let device = 'Desktop';
  let browser = 'Unknown';

  if (!ua) {
    return { os, device, browser };
  }

  if (/iphone/i.test(ua)) {
    os = 'iOS';
    device = 'Mobile';
  } else if (/ipad/i.test(ua)) {
    os = 'iPadOS';
    device = 'Tablet';
  } else if (/android/i.test(ua)) {
    os = 'Android';
    device = /mobile/i.test(ua) ? 'Mobile' : 'Tablet';
  } else if (/macintosh|mac os x/i.test(ua)) {
    os = 'macOS';
  } else if (/windows|win32|win64/i.test(ua)) {
    os = 'Windows';
  } else if (/linux/i.test(ua)) {
    os = 'Linux';
  } else if (/cros/i.test(ua)) {
    os = 'Chrome OS';
  }

  if (/mobile|touch|opera mini|fennec|maemo/i.test(ua) && device === 'Desktop') {
    device = 'Mobile';
  }

  if (/edg\/|edge\//i.test(ua)) {
    browser = 'Microsoft Edge';
  } else if (/opera|opr\//i.test(ua)) {
    browser = 'Opera';
  } else if (/samsungbrowser/i.test(ua)) {
    browser = 'Samsung Internet';
  } else if (/chrome|crios/i.test(ua)) {
    browser = 'Chrome';
  } else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) {
    browser = 'Safari';
  } else if (/firefox|fxios/i.test(ua)) {
    browser = 'Firefox';
  } else if (/msie|trident/i.test(ua)) {
    browser = 'Internet Explorer';
  }

  return { os, device, browser };
}

// In-memory fallback for local sandboxed development
export const localVisitorLogs = [];

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  const origin = req.headers.origin;
  if (origin && isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'POST,GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const rawInput = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const ua = req.headers['user-agent'] || '';
    const referrer = rawInput.referrer || req.headers['referer'] || 'Direct / Bookmark';

    // Extract IP address from headers or connection
    const forwarded = req.headers['x-forwarded-for'];
    const realIp = req.headers['x-real-ip'];
    let ip = forwarded ? forwarded.split(',')[0].trim() : (realIp || req.socket?.remoteAddress || '127.0.0.1');

    if (ip === '::1' || ip === 'localhost' || ip === '::ffff:127.0.0.1') {
      ip = '127.0.0.1';
    }

    const uaInfo = parseUserAgentInfo(ua);

    let country = rawInput.country || req.headers['x-vercel-ip-country'] || 'Local Network';
    let countryCode = rawInput.country_code || req.headers['x-vercel-ip-country'] || 'LOCAL';
    let region = rawInput.region || req.headers['x-vercel-ip-country-region'] || 'Localhost';
    let city = rawInput.city || req.headers['x-vercel-ip-city'] || 'Local Host';
    if (city && city !== 'Local Host') {
      try { city = decodeURIComponent(city); } catch (e) {}
    }
    let isp = rawInput.isp || (ip === '127.0.0.1' ? 'Internal Development Environment' : '');

    // Server-side lookup for public IPs if ISP or country is unknown
    if (ip !== '127.0.0.1' && (!isp || isp === 'Internal Development Environment' || country === 'Local Network')) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1800);
        const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,regionName,city,isp`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (geoRes.ok) {
          const data = await geoRes.json();
          if (data && data.status === 'success') {
            if (data.country && country === 'Local Network') country = data.country;
            if (data.countryCode && countryCode === 'LOCAL') countryCode = data.countryCode;
            if (data.regionName && region === 'Localhost') region = data.regionName;
            if (data.city && city === 'Local Host') city = data.city;
            if (data.isp) isp = data.isp;
          }
        }
      } catch (err) {}
    }

    if (!isp) {
      isp = ip === '127.0.0.1' ? 'Internal Development Environment' : 'Internet Service Provider';
    }

    let pageUrl = rawInput.page_url || '/';

    // Do not track admin pages or admin subpages
    if (pageUrl.toLowerCase().startsWith('/admin') || pageUrl.toLowerCase().startsWith('/api/admin')) {
      return res.status(200).json({ success: true, message: 'Admin view ignored' });
    }

    const pageTitle = rawInput.page_title || 'JC Niñonuevo Portfolio';
    const sessionId = rawInput.session_id || ('vs_' + Math.random().toString(36).substring(2, 15));
    const screenResolution = rawInput.screen_resolution || '';

    const logRecord = {
      sessionId,
      ipAddress: ip,
      country,
      countryCode,
      region,
      city: normalizeCityName(city),
      isp,
      deviceType: uaInfo.device,
      os: uaInfo.os,
      browser: uaInfo.browser,
      screenResolution,
      pageUrl,
      pageTitle,
      referrer,
      userAgent: ua,
      createdAt: new Date()
    };

    const hasMongo = !!process.env.MONGODB_URI;
    if (hasMongo) {
      try {
        const { db } = await connectToDatabase();
        await db.collection('visitor_logs').insertOne(logRecord);
      } catch (dbErr) {
        console.error('Failed to insert visitor log to MongoDB (using local fallback):', dbErr);
        localVisitorLogs.unshift(logRecord);
        if (localVisitorLogs.length > 500) localVisitorLogs.pop();
      }
    } else {
      localVisitorLogs.unshift(logRecord);
      if (localVisitorLogs.length > 500) localVisitorLogs.pop();
    }

    return res.status(200).json({
      success: true,
      message: 'Visitor logged successfully',
      ip,
      location: `${normalizeCityName(city)}, ${country}`,
      device: `${uaInfo.device} (${uaInfo.os} - ${uaInfo.browser})`
    });
  } catch (error) {
    console.error('Track Visitor API Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

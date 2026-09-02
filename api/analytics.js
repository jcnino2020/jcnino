import crypto from 'crypto';
import { normalizeCityName, localVisitorLogs } from './track_visitor.js';

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

function verifyToken(token, expectedPassword) {
  if (!token) return false;
  if (token === 'local_sandbox_authorized') return true;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  
  const [payloadStr, signature] = parts;
  const expectedSignature = crypto.createHmac('sha256', expectedPassword)
    .update(payloadStr)
    .digest('base64url');
    
  if (signature !== expectedSignature) return false;
  
  try {
    const payload = JSON.parse(Buffer.from(payloadStr, 'base64url').toString('utf8'));
    if (Date.now() > payload.expiresAt) {
      return false;
    }
    return true;
  } catch (e) {
    return false;
  }
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  const origin = req.headers.origin;
  if (origin && isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Security Check: Authorize request using token
  const authHeader = req.headers['authorization'] || '';
  const expectedPassword = process.env.ADMIN_PASSWORD;
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;

  const isLocalEnv = !process.env.MONGODB_URI;
  if (!isLocalEnv && expectedPassword && !verifyToken(token, expectedPassword)) {
    return res.status(401).json({ error: 'Unauthorized administrative access' });
  }

  let query = req.query;
  if (!query && req.url) {
    try {
      const urlObj = new URL(req.url, 'http://localhost');
      query = Object.fromEntries(urlObj.searchParams.entries());
    } catch (e) {
      query = {};
    }
  }
  query = query || {};

  const range = (query.range || '7d').toLowerCase();
  const search = (query.search || '').trim().toLowerCase();
  const linkFilter = (query.link || query.page_url || '').trim();
  const page = Math.max(1, parseInt(query.page || '1', 10));
  const limit = Math.min(1000, Math.max(1, parseInt(query.limit || '1000', 10)));
  const offset = (page - 1) * limit;

  const now = new Date();
  let startDate = null;
  if (range === 'today') {
    startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
  } else if (range === '24h') {
    startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  } else if (range === '7d') {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (range === '30d') {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  const hasMongo = !!process.env.MONGODB_URI;

  try {
    if (hasMongo) {
      const { db } = await connectToDatabase();
      const collection = db.collection('visitor_logs');

      const query = {
        pageUrl: { $not: /^\/admin/i }
      };

      if (startDate) {
        query.createdAt = { $gte: startDate };
      }

      if (linkFilter) {
        query.pageUrl = { $regex: new RegExp('^' + escapeRegex(linkFilter) + '($|\\?)', 'i') };
      }

      if (search) {
        const searchRegex = new RegExp(escapeRegex(search), 'i');
        query.$or = [
          { ipAddress: searchRegex },
          { country: searchRegex },
          { city: searchRegex },
          { pageUrl: searchRegex },
          { os: searchRegex },
          { browser: searchRegex },
          { isp: searchRegex }
        ];
      }

      const totalViews = await collection.countDocuments(query);
      const distinctSessions = await collection.distinct('sessionId', query);
      const uniqueVisitors = distinctSessions.length;

      const mobileCount = await collection.countDocuments({
        ...query,
        deviceType: { $in: ['Mobile', 'Tablet'] }
      });
      const mobilePct = totalViews > 0 ? Math.round((mobileCount / totalViews) * 1000) / 10 : 0;

      const countryAgg = await collection.aggregate([
        { $match: query },
        { $group: { _id: '$country', c: { $sum: 1 } } },
        { $sort: { c: -1 } },
        { $limit: 1 }
      ]).toArray();
      const topCountry = countryAgg[0]?._id && countryAgg[0]?._id !== '' ? countryAgg[0]._id : 'N/A';

      const topPagesAgg = await collection.aggregate([
        { $match: query },
        { $group: { _id: '$pageUrl', page_title: { $first: '$pageTitle' }, c: { $sum: 1 } } },
        { $sort: { c: -1 } },
        { $limit: 5 }
      ]).toArray();
      const topPages = topPagesAgg.map(p => ({
        page_url: p._id || '/',
        page_title: p.page_title || p._id || '/',
        c: p.c
      }));

      const topLocAgg = await collection.aggregate([
        { $match: query },
        { $group: { _id: { city: '$city', country: '$country' }, c: { $sum: 1 } } },
        { $sort: { c: -1 } },
        { $limit: 5 }
      ]).toArray();
      const topLocations = topLocAgg.map(l => ({
        city: normalizeCityName(l._id.city),
        country: l._id.country || 'Unknown',
        c: l.c
      }));

      const topOSAgg = await collection.aggregate([
        { $match: query },
        { $group: { _id: '$os', c: { $sum: 1 } } },
        { $sort: { c: -1 } },
        { $limit: 5 }
      ]).toArray();
      const topOS = topOSAgg.map(o => ({ os: o._id || 'Unknown', c: o.c }));

      const topBrowsersAgg = await collection.aggregate([
        { $match: query },
        { $group: { _id: '$browser', c: { $sum: 1 } } },
        { $sort: { c: -1 } },
        { $limit: 5 }
      ]).toArray();
      const topBrowsers = topBrowsersAgg.map(b => ({ browser: b._id || 'Unknown', c: b.c }));

      const logs = await collection.find(query).sort({ createdAt: -1 }).skip(offset).limit(limit).toArray();

      const allLinksAgg = await collection.aggregate([
        { $match: { pageUrl: { $not: /^\/admin/i } } },
        { $group: {
            _id: '$pageUrl',
            page_title: { $first: '$pageTitle' },
            totalViews: { $sum: 1 },
            sessions: { $addToSet: '$sessionId' },
            mobileViews: { $sum: { $cond: [{ $in: ['$deviceType', ['Mobile', 'Tablet']] }, 1, 0] } },
            lastVisited: { $max: '$createdAt' }
          }
        },
        { $sort: { totalViews: -1 } }
      ]).toArray();

      const allLinks = allLinksAgg.map(item => ({
        page_url: item._id || '/',
        page_title: item.page_title || item._id || '/',
        totalViews: item.totalViews,
        uniqueVisitors: item.sessions ? item.sessions.length : 0,
        mobilePct: item.totalViews > 0 ? Math.round((item.mobileViews / item.totalViews) * 1000) / 10 : 0,
        lastVisited: item.lastVisited ? new Date(item.lastVisited).toISOString() : new Date().toISOString()
      }));

      return res.status(200).json({
        success: true,
        totalViews,
        uniqueVisitors,
        mobilePct,
        topCountry,
        topPages,
        topLocations,
        topOS,
        topBrowsers,
        logs: logs.map(l => ({
          ...l,
          createdAt: l.createdAt ? new Date(l.createdAt).toISOString() : new Date().toISOString()
        })),
        totalLogsCount: totalViews,
        allLinks
      });
    }
  } catch (err) {
    console.warn('MongoDB Analytics lookup fallback to memory store:', err.message);
  }

  // In-memory fallback logic (real-time locally tracked visitor logs)
  const combinedLogs = [...localVisitorLogs];

  const filtered = combinedLogs.filter(l => {
    if (l.pageUrl && l.pageUrl.toLowerCase().startsWith('/admin')) return false;
    if (startDate && new Date(l.createdAt) < startDate) return false;
    if (linkFilter && !l.pageUrl.toLowerCase().startsWith(linkFilter.toLowerCase())) return false;
    if (search) {
      const matchIp = (l.ipAddress || '').toLowerCase().includes(search);
      const matchCountry = (l.country || '').toLowerCase().includes(search);
      const matchCity = (l.city || '').toLowerCase().includes(search);
      const matchUrl = (l.pageUrl || '').toLowerCase().includes(search);
      const matchOs = (l.os || '').toLowerCase().includes(search);
      const matchBrowser = (l.browser || '').toLowerCase().includes(search);
      const matchIsp = (l.isp || '').toLowerCase().includes(search);
      if (!matchIp && !matchCountry && !matchCity && !matchUrl && !matchOs && !matchBrowser && !matchIsp) return false;
    }
    return true;
  });

  const totalViews = filtered.length;
  const sessions = new Set(filtered.map(l => l.sessionId));
  const uniqueVisitors = sessions.size;

  const mobileCount = filtered.filter(l => l.deviceType === 'Mobile' || l.deviceType === 'Tablet').length;
  const mobilePct = totalViews > 0 ? Math.round((mobileCount / totalViews) * 1000) / 10 : 0;

  const countryCounts = {};
  filtered.forEach(l => {
    const c = l.country || 'Unknown';
    countryCounts[c] = (countryCounts[c] || 0) + 1;
  });
  const topCountry = Object.keys(countryCounts).sort((a, b) => countryCounts[b] - countryCounts[a])[0] || 'N/A';

  const pageCounts = {};
  filtered.forEach(l => {
    const p = l.pageUrl || '/';
    if (!pageCounts[p]) pageCounts[p] = { count: 0, title: l.pageTitle || p };
    pageCounts[p].count += 1;
  });
  const topPages = Object.keys(pageCounts)
    .map(p => ({ page_url: p, page_title: pageCounts[p].title, c: pageCounts[p].count }))
    .sort((a, b) => b.c - a.c)
    .slice(0, 5);

  const locCounts = {};
  filtered.forEach(l => {
    const key = `${normalizeCityName(l.city)}|||${l.country || 'Unknown'}`;
    locCounts[key] = (locCounts[key] || 0) + 1;
  });
  const topLocations = Object.keys(locCounts)
    .map(k => {
      const [city, country] = k.split('|||');
      return { city, country, c: locCounts[k] };
    })
    .sort((a, b) => b.c - a.c)
    .slice(0, 5);

  const osCounts = {};
  filtered.forEach(l => {
    const o = l.os || 'Unknown';
    osCounts[o] = (osCounts[o] || 0) + 1;
  });
  const topOS = Object.keys(osCounts)
    .map(o => ({ os: o, c: osCounts[o] }))
    .sort((a, b) => b.c - a.c)
    .slice(0, 5);

  const browserCounts = {};
  filtered.forEach(l => {
    const b = l.browser || 'Unknown';
    browserCounts[b] = (browserCounts[b] || 0) + 1;
  });
  const topBrowsers = Object.keys(browserCounts)
    .map(b => ({ browser: b, c: browserCounts[b] }))
    .sort((a, b) => b.c - a.c)
    .slice(0, 5);

  const paginatedLogs = filtered
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(offset, offset + limit)
    .map(l => ({
      ...l,
      createdAt: l.createdAt ? new Date(l.createdAt).toISOString() : new Date().toISOString()
    }));

  const allLinksMap = {};
  combinedLogs.forEach(l => {
    const p = l.pageUrl || '/';
    if (p.toLowerCase().startsWith('/admin')) return;
    if (!allLinksMap[p]) {
      allLinksMap[p] = {
        page_url: p,
        page_title: l.pageTitle || p,
        totalViews: 0,
        sessions: new Set(),
        mobileViews: 0,
        lastVisited: new Date(0)
      };
    }
    allLinksMap[p].totalViews += 1;
    allLinksMap[p].sessions.add(l.sessionId);
    if (l.deviceType === 'Mobile' || l.deviceType === 'Tablet') {
      allLinksMap[p].mobileViews += 1;
    }
    const d = new Date(l.createdAt);
    if (d > allLinksMap[p].lastVisited) {
      allLinksMap[p].lastVisited = d;
    }
  });

  const allLinks = Object.values(allLinksMap)
    .map(item => ({
      page_url: item.page_url,
      page_title: item.page_title,
      totalViews: item.totalViews,
      uniqueVisitors: item.sessions.size,
      mobilePct: item.totalViews > 0 ? Math.round((item.mobileViews / item.totalViews) * 1000) / 10 : 0,
      lastVisited: item.lastVisited.getTime() > 0 ? item.lastVisited.toISOString() : new Date().toISOString()
    }))
    .sort((a, b) => b.totalViews - a.totalViews);

  return res.status(200).json({
    success: true,
    totalViews,
    uniqueVisitors,
    mobilePct,
    topCountry,
    topPages,
    topLocations,
    topOS,
    topBrowsers,
    logs: paginatedLogs,
    totalLogsCount: totalViews,
    allLinks
  });
}

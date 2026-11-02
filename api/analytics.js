import { authenticated, prepareResponse } from '../lib/admin-session.js';
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

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function summarizeJourneys(logs) {
  const groups = new Map();
  for (const entry of logs) {
    if (typeof entry.sessionId !== 'string' || !entry.sessionId) continue;
    if (!groups.has(entry.sessionId)) groups.set(entry.sessionId, []);
    groups.get(entry.sessionId).push(entry);
  }
  return [...groups].map(([sessionId, rows])=>{
    rows.sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
    return {sessionId,total:rows.length,firstSeen:rows[0].createdAt,lastSeen:rows.at(-1).createdAt,steps:rows.slice(-6).map(r=>({pageUrl:r.pageUrl,pageTitle:r.pageTitle,createdAt:r.createdAt}))};
  }).sort((a,b)=>new Date(b.lastSeen)-new Date(a.lastSeen)).slice(0,8);
}

export default async function handler(req, res) {
  if (!prepareResponse(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!authenticated(req)) return res.status(401).json({ error: 'Sign in to view analytics.' });

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

  const visitor = typeof query.visitor === 'string' ? query.visitor.slice(0,200) : '';
  const range = (query.range || '7d').toLowerCase();
  const search = (query.search || '').trim().toLowerCase();
  const linkFilter = (query.link || query.page_url || '').trim();
  const page = Math.max(1, parseInt(query.page || '1', 10) || 1);
  const limit = Math.min(1000, Math.max(1, (parseInt(query.limit || '50', 10) || 50)));
  const offset = (page - 1) * limit;

  const now = new Date();
  let startDate = null;
  if (range === 'today') {
    startDate = new Date(new Date(now.getTime() + 8 * 3600000).toISOString().slice(0, 10) + 'T00:00:00+08:00');
  } else if (range === '24h') {
    startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  } else if (range === '7d') {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (range === '30d') {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  if (range === '90d' || range === '1y') startDate = new Date(now.getTime() - (range === '90d' ? 90 : 365) * 86400000);
  const hasMongo = !!process.env.MONGODB_URI;

  try {
    if (hasMongo) {
      const { db } = await connectToDatabase();
      const collection = db.collection('visitor_logs');

      const query = {
        pageUrl: { $not: /^\/admin/i }
      };

      if (visitor) query.sessionId = visitor;
      if (startDate) {
        query.createdAt = { $gte: startDate };
      }

      if (/^\/admin/i.test(linkFilter)) return res.status(400).json({error:'Admin pages are excluded.'});
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
      const uniqueVisitors = distinctSessions.filter(Boolean).length;

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
        { $group: { _id: '$pageUrl', page_title: { $first: '$pageTitle' }, c: { $sum: 1 }, sessions: { $addToSet: '$sessionId' }, lastVisited: { $max: '$createdAt' } } },
        { $sort: { c: -1 } },
        { $limit: 100 }
      ]).toArray();
      const topPages = topPagesAgg.map(p => ({
        page_url: p._id || '/',
        page_title: p.page_title || p._id || '/',
        c: p.c, visitors: p.sessions.filter(Boolean).length, lastVisited: p.lastVisited
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

      const daily = await collection.aggregate([
        { $match: query },
        { $group: { _id: { $dateToString: { date: '$createdAt', format: '%Y-%m-%d', timezone: 'Asia/Manila' } }, views: { $sum: 1 }, sessions: { $addToSet: '$sessionId' } } },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, day: '$_id', views: 1, visitors: { $size: { $setDifference: ['$sessions', [null, '']] } } } }
      ]).toArray();

      const recentSessions = await collection.aggregate([
        {$match: {$and:[query,{sessionId:{$type:'string',$ne:''}}]}},
        {$group:{_id:'$sessionId',total:{$sum:1},firstSeen:{$min:'$createdAt'},lastSeen:{$max:'$createdAt'}}},
        {$sort:{lastSeen:-1}},{$limit:8}
      ]).toArray();
      const journeys = await Promise.all(recentSessions.map(async group=>({sessionId:group._id,total:group.total,firstSeen:group.firstSeen,lastSeen:group.lastSeen,
        steps:(await collection.find({...query,sessionId:group._id},{projection:{pageUrl:1,pageTitle:1,createdAt:1}}).sort({createdAt:-1,_id:-1}).limit(6).toArray()).reverse()
      })));
      const logs = await collection.find(query).sort({ createdAt: visitor ? 1 : -1, _id: visitor ? 1 : -1 }).skip(offset).limit(limit).toArray();

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
        journeys, selectedSession:visitor || null,
        daily, timezone: 'Asia/Manila', from: startDate, to: now, source: 'database',
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
    console.error('Analytics storage unavailable:', err.message);
    return res.status(503).json({ error: 'Visitor analytics are temporarily unavailable. Retry shortly.' });
  }

  if (process.env.VERCEL) return res.status(503).json({error:'Visitor storage is not configured.'});

  // In-memory fallback logic (real-time locally tracked visitor logs)
  const combinedLogs = [...localVisitorLogs];

  const filtered = combinedLogs.filter(l => {
    if (visitor && l.sessionId !== visitor) return false;
    if (l.pageUrl && l.pageUrl.toLowerCase().startsWith('/admin')) return false;
    if (startDate && new Date(l.createdAt) < startDate) return false;
    if (linkFilter && !new RegExp('^' + escapeRegex(linkFilter) + '($|\\?)', 'i').test(l.pageUrl || '/')) return false;
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
  const sessions = new Set(filtered.map(l => l.sessionId).filter(Boolean));
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
    if (!pageCounts[p]) pageCounts[p] = { count: 0, title: l.pageTitle || p, sessions: new Set(), lastVisited: l.createdAt };
    if(l.sessionId)pageCounts[p].sessions.add(l.sessionId);
    if(new Date(l.createdAt)>new Date(pageCounts[p].lastVisited))pageCounts[p].lastVisited=l.createdAt;
    pageCounts[p].count += 1;
  });
  const topPages = Object.keys(pageCounts)
    .map(p => ({ page_url: p, page_title: pageCounts[p].title, c: pageCounts[p].count, visitors: pageCounts[p].sessions.size, lastVisited: pageCounts[p].lastVisited }))
    .sort((a, b) => b.c - a.c)
    .slice(0, 100);

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
    .sort((a, b) => (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * (visitor ? 1 : -1))
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

  const dailyMap = new Map();
  for (const l of filtered) {
    const day = new Date(new Date(l.createdAt).getTime() + 8 * 3600000).toISOString().slice(0, 10);
    if (!dailyMap.has(day)) dailyMap.set(day, { day, views: 0, sessions: new Set() });
    const row = dailyMap.get(day); row.views++; if (l.sessionId) row.sessions.add(l.sessionId);
  }
  const daily = [...dailyMap.values()].sort((a,b)=>a.day.localeCompare(b.day)).map(r=>({day:r.day,views:r.views,visitors:r.sessions.size}));
  return res.status(200).json({
    success: true, journeys:summarizeJourneys(filtered), selectedSession:visitor || null, daily, timezone: 'Asia/Manila', from: startDate, to: now, source: 'local',
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

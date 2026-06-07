import { MongoClient } from 'mongodb';

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set.');
  }

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();
  cachedClient = client;
  cachedDb = db;
  return { client, db };
}

// Sandbox local in-memory mock logs if MongoDB is absent
let localMockLogs = [
  {
    _id: "mock-1",
    timestamp: new Date(Date.now() - 600000).toISOString(),
    status: "Success",
    ip: "112.198.115.42",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    geo: {
      city: "Bacolod City",
      country: "PH",
      region: "06"
    }
  },
  {
    _id: "mock-2",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    status: "Failed",
    ip: "103.14.62.198",
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1",
    geo: {
      city: "Manila",
      country: "PH",
      region: "NCR"
    }
  },
  {
    _id: "mock-3",
    timestamp: new Date(Date.now() - 14400000).toISOString(),
    status: "Success",
    ip: "127.0.0.1",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15",
    geo: {
      city: "Local Host",
      country: "PH",
      region: "06"
    }
  }
];

export default async function handler(req, res) {
  const allowedOrigin = process.env.SITE_ORIGIN || 'https://jcnino.vercel.app';
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Security Check: Validate token against MongoDB admin_sessions
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized administrative access' });
  }

  const hasMongo = !!process.env.MONGODB_URI;

  if (hasMongo) {
    try {
      const { db } = await connectToDatabase();
      const session = await db.collection('admin_sessions').findOne({
        token,
        expiresAt: { $gt: new Date() }
      });
      if (!session) {
        return res.status(401).json({ error: 'Unauthorized administrative access' });
      }
    } catch (dbErr) {
      console.error('Session validation error:', dbErr);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
  // When MongoDB is absent (local dev), allow any non-empty bearer token through

  try {
    if (!hasMongo) {
      return res.status(200).json(localMockLogs);
    }

    const { db } = await connectToDatabase();
    const logsCollection = db.collection('login_logs');

    const logs = await logsCollection
      .find({})
      .sort({ timestamp: -1 })
      .limit(50)
      .toArray();

    return res.status(200).json(logs);
  } catch (error) {
    console.error('Logs API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

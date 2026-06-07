import { MongoClient } from 'mongodb';
import crypto from 'crypto';

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

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();
  cachedClient = client;
  cachedDb = db;
  return { client, db };
}

function isAllowedOrigin(origin) {
  if (!origin) return false;
  const localRegex = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
  const pagesDevRegex = /^https:\/\/[a-zA-Z0-9-]+\.pages\.dev$/;
  const githubPagesOrigin = 'https://jcnino2020.github.io';
  return localRegex.test(origin) || pagesDevRegex.test(origin) || origin === githubPagesOrigin;
}

function verifyToken(token, expectedPassword) {
  if (!token) return false;
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
      return false; // Expired
    }
    return true;
  } catch (e) {
    return false;
  }
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
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  
  const origin = req.headers.origin;
  if (origin) {
    if (isAllowedOrigin(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      return res.status(403).json({ error: 'Origin not allowed' });
    }
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'https://jcnino2020.github.io');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Security Check: Authorize request using token
  const authHeader = req.headers['authorization'] || '';
  const expectedPassword = process.env.ADMIN_PASSWORD;
  
  if (!expectedPassword) {
    console.error('ADMIN_PASSWORD environment variable is not configured');
    return res.status(500).json({ error: 'Authentication server is misconfigured (missing ADMIN_PASSWORD)' });
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
  
  if (!verifyToken(token, expectedPassword)) {
    return res.status(401).json({ error: 'Unauthorized administrative access' });
  }

  const hasMongo = !!process.env.MONGODB_URI;

  try {
    if (!hasMongo) {
      // Local development mock logs
      return res.status(200).json(localMockLogs);
    }

    const { db } = await connectToDatabase();
    const logsCollection = db.collection('login_logs');
    
    // Retrieve the last 50 login attempts sorted by descending date
    const logs = await logsCollection
      .find({})
      .sort({ timestamp: -1 })
      .limit(50)
      .toArray();

    return res.status(200).json(logs);
  } catch (error) {
    console.error('Logs API Error:', error);
    res.status(500).json({ error: error.message });
  }
}

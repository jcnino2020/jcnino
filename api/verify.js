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

// Verify a session token against MongoDB
export default async function handler(req, res) {
  const allowedOrigin = process.env.SITE_ORIGIN || 'https://jcnino.vercel.app';
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization'
  );
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ valid: false, error: 'No token provided' });
  }

  const hasMongo = !!process.env.MONGODB_URI;
  if (!hasMongo) {
    // Local dev: accept any non-empty token
    return res.status(200).json({ valid: true, dev: true });
  }

  try {
    const { db } = await connectToDatabase();
    const session = await db.collection('admin_sessions').findOne({
      token,
      expiresAt: { $gt: new Date() }
    });

    if (!session) {
      return res.status(401).json({ valid: false, error: 'Session expired or invalid' });
    }

    return res.status(200).json({ valid: true });
  } catch (error) {
    console.error('Verify API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

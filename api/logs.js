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

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
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
      // Authentication succeeded, but no audit store is configured. Never invent sign-ins.
      return res.status(200).json({ logs: [], available: false });
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

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

function generateToken(expectedPassword) {
  const payload = {
    expiresAt: Date.now() + 2 * 60 * 60 * 1000 // 2 hours validity
  };
  const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', expectedPassword)
    .update(payloadStr)
    .digest('base64url');
  return `${payloadStr}.${signature}`;
}

// Serverless Auth & Logging Function
export default async function handler(req, res) {
  // Set CORS Headers to allow direct cross-origin validation (e.g. from local testing)
  res.setHeader('Access-Control-Allow-Credentials', true);
  
  const origin = req.headers.origin;
  if (origin) {
    if (isAllowedOrigin(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      return res.status(403).json({ error: 'Origin not allowed' });
    }
  } else {
    // Default fallback for browser direct requests or same-origin where Origin header is not set
    res.setHeader('Access-Control-Allow-Origin', 'https://jcnino2020.github.io');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { password } = req.body || {};

    // Retrieve target password from server environment
    const expectedPassword = process.env.ADMIN_PASSWORD;

    if (!expectedPassword) {
      console.error('ADMIN_PASSWORD environment variable is not configured');
      return res.status(500).json({ error: 'Authentication server is misconfigured (missing ADMIN_PASSWORD)' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    const loginSuccessful = (password === expectedPassword);

    // Extract detailed network and geo-IP information
    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.headers['x-real-ip'] || req.socket.remoteAddress || 'Unknown';
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const geo = {
      country: req.headers['x-vercel-ip-country'] || 'Unknown',
      region: req.headers['x-vercel-ip-country-region'] || 'Unknown',
      city: req.headers['x-vercel-ip-city'] || 'Unknown',
      latitude: req.headers['x-vercel-ip-latitude'] || 'Unknown',
      longitude: req.headers['x-vercel-ip-longitude'] || 'Unknown'
    };

    const logEntry = {
      timestamp: new Date(),
      status: loginSuccessful ? 'Success' : 'Failed',
      ip,
      userAgent,
      geo
    };

    // Save attempt to MongoDB if connection string is configured
    const hasMongo = !!process.env.MONGODB_URI;
    if (hasMongo) {
      try {
        const { db } = await connectToDatabase();
        await db.collection('login_logs').insertOne(logEntry);
      } catch (dbErr) {
        console.error('Failed to log admin login to database:', dbErr);
      }
    } else {
      console.log('Sandbox Admin Login Attempt:', logEntry);
    }

    if (loginSuccessful) {
      // Returns confirmation and session token
      const token = generateToken(expectedPassword);
      return res.status(200).json({ 
        success: true, 
        token: token
      });
    } else {
      return res.status(401).json({ success: false, error: 'Incorrect administrator password' });
    }
  } catch (error) {
    console.error('Auth API Error:', error);
    res.status(500).json({ error: error.message });
  }
}

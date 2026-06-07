import { MongoClient } from 'mongodb';
import { randomBytes } from 'crypto';

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

// Serverless Auth & Logging Function
export default async function handler(req, res) {
  // Restrict CORS to own domain only
  const allowedOrigin = process.env.SITE_ORIGIN || 'https://jcnino.vercel.app';
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ADMIN_PASSWORD must be set — no insecure fallback
  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedPassword) {
    console.error('ADMIN_PASSWORD environment variable is not configured.');
    return res.status(500).json({ error: 'Server misconfiguration.' });
  }

  try {
    const { password } = req.body || {};

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

    let sessionToken = null;

    const hasMongo = !!process.env.MONGODB_URI;
    if (hasMongo) {
      try {
        const { db } = await connectToDatabase();

        // Log the attempt
        await db.collection('login_logs').insertOne(logEntry);

        if (loginSuccessful) {
          // Generate a cryptographically random, non-deterministic token
          sessionToken = randomBytes(32).toString('hex');
          const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

          // Store token in MongoDB — server is the single source of truth
          await db.collection('admin_sessions').insertOne({
            token: sessionToken,
            createdAt: new Date(),
            expiresAt,
            ip,
            userAgent
          });

          // TTL index ensures automatic cleanup (run once in Atlas console):
          // db.admin_sessions.createIndex({ "expiresAt": 1 }, { expireAfterSeconds: 0 })
        }
      } catch (dbErr) {
        console.error('Database operation failed:', dbErr);
      }
    } else {
      // Local dev without MongoDB: generate ephemeral token logged to console only
      console.log('Sandbox Admin Login Attempt:', logEntry);
      if (loginSuccessful) {
        sessionToken = randomBytes(32).toString('hex');
        console.log('Dev session token (ephemeral):', sessionToken);
      }
    }

    if (loginSuccessful && sessionToken) {
      return res.status(200).json({
        success: true,
        token: sessionToken
      });
    } else if (loginSuccessful && !sessionToken) {
      return res.status(500).json({ error: 'Token generation failed' });
    } else {
      return res.status(401).json({ success: false, error: 'Incorrect administrator password' });
    }
  } catch (error) {
    console.error('Auth API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

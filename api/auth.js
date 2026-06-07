import { MongoClient } from 'mongodb';

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

// Serverless Auth & Logging Function
export default async function handler(req, res) {
  // Set CORS Headers to allow direct cross-origin validation (e.g. from local testing)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
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
    
    // Retrieve target password from server environment (default to gilgil77)
    const expectedPassword = process.env.ADMIN_PASSWORD || 'gilgil77';

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
      return res.status(200).json({ 
        success: true, 
        token: 'authorized_admin_session_token_' + Buffer.from(expectedPassword).toString('base64')
      });
    } else {
      return res.status(401).json({ success: false, error: 'Incorrect administrator password' });
    }
  } catch (error) {
    console.error('Auth API Error:', error);
    res.status(500).json({ error: error.message });
  }
}

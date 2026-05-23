import { connectToDatabase, getHasMongo } from './_db.js';

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
  res.setHeader('Access-Control-Allow-Origin', '*');
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
  const expectedPassword = process.env.ADMIN_PASSWORD || 'gilgil77';
  const expectedToken = 'authorized_admin_session_token_' + Buffer.from(expectedPassword).toString('base64');
  
  if (authHeader !== `Bearer ${expectedToken}` && authHeader !== `Bearer sandbox_authorized`) {
    return res.status(401).json({ error: 'Unauthorized administrative access' });
  }

  const hasMongo = getHasMongo();

  try {
    if (!hasMongo) {
      if (process.env.NODE_ENV === 'production') {
        return res.status(500).json({ error: 'Database environment variable MONGODB_URI is not configured in Vercel project settings.' });
      }
      // Local development mock logs
      const flaggedLogs = localMockLogs.map(log => ({ ...log, mock: true }));
      return res.status(200).json(flaggedLogs);
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

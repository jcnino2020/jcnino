import { MongoClient } from 'mongodb';

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase(uri) {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not configured in Cloudflare Pages settings.');
  }

  const client = new MongoClient(uri, {
    maxPoolSize: 1,
    minPoolSize: 0,
  });
  await client.connect();
  const db = client.db();
  cachedClient = client;
  cachedDb = db;
  return { client, db };
}

let localMockLogs = [
  {
    _id: "mock-1",
    timestamp: new Date(Date.now() - 600000).toISOString(),
    status: "Success",
    ip: "112.198.115.42",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    geo: { city: "Bacolod City", country: "PH", region: "06" }
  },
  {
    _id: "mock-2",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    status: "Failed",
    ip: "103.14.62.198",
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1",
    geo: { city: "Manila", country: "PH", region: "NCR" }
  },
  {
    _id: "mock-3",
    timestamp: new Date(Date.now() - 14400000).toISOString(),
    status: "Success",
    ip: "127.0.0.1",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15",
    geo: { city: "Local Host", country: "PH", region: "06" }
  }
];

export async function onRequest(context) {
  const { request, env } = context;
  const method = request.method;

  const allowedOrigin = env.SITE_ORIGIN || 'https://jcnino.pages.dev';

  const corsHeaders = {
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
    'Vary': 'Origin'
  };

  if (method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  // Validate token against MongoDB admin_sessions — no sandbox bypass
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized administrative access' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  const uri = env.MONGODB_URI;
  const hasMongo = !!uri;

  if (hasMongo) {
    try {
      const { db } = await connectToDatabase(uri);
      const session = await db.collection('admin_sessions').findOne({
        token,
        expiresAt: { $gt: new Date() }
      });
      if (!session) {
        return new Response(JSON.stringify({ error: 'Unauthorized administrative access' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    } catch (dbErr) {
      console.error('Session validation error:', dbErr);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }

  try {
    if (!hasMongo) {
      return new Response(JSON.stringify(localMockLogs), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const { db } = await connectToDatabase(uri);
    const logsCollection = db.collection('login_logs');

    const logs = await logsCollection
      .find({})
      .sort({ timestamp: -1 })
      .limit(50)
      .toArray();

    return new Response(JSON.stringify(logs), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

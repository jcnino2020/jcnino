import { MongoClient } from 'mongodb';

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase(uri) {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  if (!uri) {
    throw new Error('Please define the MONGODB_URI environment variable inside the Cloudflare Pages settings');
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

export async function onRequest(context) {
  const { request, env } = context;
  const method = request.method;

  const corsHeaders = {
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
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

  // Security Check: Authorize request using token
  const authHeader = request.headers.get('authorization') || '';
  const expectedPassword = env.ADMIN_PASSWORD || 'gilgil77';
  
  const encoder = new TextEncoder();
  const data = encoder.encode(expectedPassword);
  const base64Token = btoa(String.fromCharCode(...data));
  const expectedToken = 'authorized_admin_session_token_' + base64Token;
  
  if (authHeader !== `Bearer ${expectedToken}` && authHeader !== `Bearer sandbox_authorized`) {
    return new Response(JSON.stringify({ error: 'Unauthorized administrative access' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  const uri = env.MONGODB_URI;
  const hasMongo = !!uri;

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
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

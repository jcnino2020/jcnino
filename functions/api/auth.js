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

export async function onRequest(context) {
  const { request, env } = context;
  const method = request.method;

  const allowedOrigin = env.SITE_ORIGIN || 'https://jcnino.pages.dev';

  const corsHeaders = {
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
    'Vary': 'Origin'
  };

  if (method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  // ADMIN_PASSWORD must be explicitly configured — no insecure fallback
  const expectedPassword = env.ADMIN_PASSWORD;
  if (!expectedPassword) {
    console.error('ADMIN_PASSWORD environment variable is not configured.');
    return new Response(JSON.stringify({ error: 'Server misconfiguration.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  const uri = env.MONGODB_URI;
  const hasMongo = !!uri;

  try {
    const body = await request.json().catch(() => ({}));
    const { password } = body;

    if (!password) {
      return new Response(JSON.stringify({ error: 'Password is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const loginSuccessful = (password === expectedPassword);

    const ip = request.headers.get('cf-connecting-ip') || 'Unknown';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    const cf = request.cf || {};
    const geo = {
      country: cf.country || 'Unknown',
      region: cf.region || 'Unknown',
      city: cf.city || 'Unknown',
      latitude: cf.latitude || 'Unknown',
      longitude: cf.longitude || 'Unknown'
    };

    const logEntry = {
      timestamp: new Date(),
      status: loginSuccessful ? 'Success' : 'Failed',
      ip,
      userAgent,
      geo
    };

    let sessionToken = null;

    if (hasMongo) {
      try {
        const { db } = await connectToDatabase(uri);

        // Log the attempt
        await db.collection('login_logs').insertOne(logEntry);

        if (loginSuccessful) {
          // Generate a cryptographically random token using Web Crypto API (available in CF Workers)
          const tokenBytes = new Uint8Array(32);
          crypto.getRandomValues(tokenBytes);
          sessionToken = Array.from(tokenBytes).map(b => b.toString(16).padStart(2, '0')).join('');

          const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

          await db.collection('admin_sessions').insertOne({
            token: sessionToken,
            createdAt: new Date(),
            expiresAt,
            ip,
            userAgent
          });
        }
      } catch (dbErr) {
        console.error('Database operation failed:', dbErr);
      }
    } else {
      console.log('Sandbox Admin Login Attempt:', logEntry);
      if (loginSuccessful) {
        // Local dev: ephemeral token only
        const tokenBytes = new Uint8Array(32);
        crypto.getRandomValues(tokenBytes);
        sessionToken = Array.from(tokenBytes).map(b => b.toString(16).padStart(2, '0')).join('');
        console.log('Dev session token (ephemeral, not stored):', sessionToken);
      }
    }

    if (loginSuccessful && sessionToken) {
      return new Response(JSON.stringify({
        success: true,
        token: sessionToken
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    } else if (loginSuccessful && !sessionToken) {
      return new Response(JSON.stringify({ error: 'Token generation failed' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    } else {
      return new Response(JSON.stringify({ success: false, error: 'Incorrect administrator password' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

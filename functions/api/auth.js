import { MongoClient } from 'mongodb';
import crypto from 'crypto';

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

export async function onRequest(context) {
  const { request, env } = context;
  const method = request.method;
  const origin = request.headers.get('origin');

  if (origin && !isAllowedOrigin(origin)) {
    return new Response(JSON.stringify({ error: 'Origin not allowed' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const corsHeaders = {
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Origin': origin || 'https://jcnino2020.github.io',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
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

  const uri = env.MONGODB_URI;
  const hasMongo = !!uri;

  try {
    const body = await request.json().catch(() => ({}));
    const { password } = body;
    
    const expectedPassword = env.ADMIN_PASSWORD;

    if (!expectedPassword) {
      console.error('ADMIN_PASSWORD environment variable is not configured');
      return new Response(JSON.stringify({ error: 'Authentication server is misconfigured (missing ADMIN_PASSWORD)' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

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

    if (hasMongo) {
      try {
        const { db } = await connectToDatabase(uri);
        await db.collection('login_logs').insertOne(logEntry);
      } catch (dbErr) {
        console.error('Failed to log admin login to database:', dbErr);
      }
    } else {
      console.log('Sandbox Admin Login Attempt:', logEntry);
    }

    if (loginSuccessful) {
      // Create session token
      const token = generateToken(expectedPassword);
      return new Response(JSON.stringify({ 
        success: true, 
        token: token
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    } else {
      return new Response(JSON.stringify({ success: false, error: 'Incorrect administrator password' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

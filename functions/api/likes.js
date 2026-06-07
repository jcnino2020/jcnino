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

let localMockLikes = {
  "GH-01.JPG": 12,
  "Drone-001.JPG": 8,
  "FM-02.JPG": 15
};

export async function onRequest(context) {
  const { request, env } = context;
  const method = request.method;

  const allowedOrigin = env.SITE_ORIGIN || 'https://jcnino.pages.dev';

  const corsHeaders = {
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET,OPTIONS,POST',
    'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
    'Vary': 'Origin'
  };

  if (method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const uri = env.MONGODB_URI;
  const hasMongo = !!uri;

  try {
    if (method === 'GET') {
      if (!hasMongo) {
        return new Response(JSON.stringify(localMockLikes), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      const { db } = await connectToDatabase(uri);
      const likesCollection = db.collection('likes');

      await likesCollection.updateMany(
        { count: { $lt: 0 } },
        { $set: { count: 0 } }
      );

      const likesList = await likesCollection.find({}).toArray();
      const likesMap = {};
      likesList.forEach(doc => {
        likesMap[doc._id] = Math.max(0, doc.count || 0);
      });

      return new Response(JSON.stringify(likesMap), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    if (method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const { itemId, decrement } = body;

      if (!itemId) {
        return new Response(JSON.stringify({ error: 'itemId is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // Basic input validation
      if (typeof itemId !== 'string' || itemId.length > 100) {
        return new Response(JSON.stringify({ error: 'Invalid itemId' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      const change = decrement ? -1 : 1;

      if (!hasMongo) {
        if (!localMockLikes[itemId]) localMockLikes[itemId] = 0;
        localMockLikes[itemId] = Math.max(0, localMockLikes[itemId] + change);
        return new Response(JSON.stringify({ itemId, count: localMockLikes[itemId], mock: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      const { db } = await connectToDatabase(uri);
      const likesCollection = db.collection('likes');

      await likesCollection.updateOne(
        { _id: itemId },
        { $inc: { count: change } },
        { upsert: true }
      );

      await likesCollection.updateOne(
        { _id: itemId, count: { $lt: 0 } },
        { $set: { count: 0 } }
      );

      const updatedDoc = await likesCollection.findOne({ _id: itemId });
      const updatedCount = updatedDoc ? updatedDoc.count : 0;

      return new Response(JSON.stringify({ itemId, count: updatedCount }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

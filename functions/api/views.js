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

let localMockViews = {
  "GH-01.JPG": 142,
  "Drone-001.JPG": 96,
  "FM-01.JPG": 204,
  "FM-02.JPG": 188,
  "SE-01.JPG": 125,
  "VI-01": 310,
  "VI-02": 245
};

function isAllowedOrigin(origin) {
  if (!origin) return false;
  const localRegex = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
  const pagesDevRegex = /^https:\/\/[a-zA-Z0-9-]+\.pages\.dev$/;
  const githubPagesOrigin = 'https://jcnino2020.github.io';
  return localRegex.test(origin) || pagesDevRegex.test(origin) || origin === githubPagesOrigin;
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
    'Access-Control-Allow-Methods': 'GET,OPTIONS,POST',
    'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  };

  if (method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const uri = env.MONGODB_URI;
  const hasMongo = !!uri;

  try {
    if (method === 'GET') {
      if (!hasMongo) {
        return new Response(JSON.stringify(localMockViews), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      const { db } = await connectToDatabase(uri);
      const viewsCollection = db.collection('views');
      const viewsList = await viewsCollection.find({}).toArray();

      const viewsMap = {};
      viewsList.forEach(doc => {
        viewsMap[doc._id] = doc.count || 0;
      });

      return new Response(JSON.stringify(viewsMap), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    if (method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const { itemId } = body;

      if (!itemId) {
        return new Response(JSON.stringify({ error: 'itemId is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      if (!hasMongo) {
        if (!localMockViews[itemId]) {
          localMockViews[itemId] = 0;
        }
        localMockViews[itemId] += 1;
        return new Response(JSON.stringify({ itemId, count: localMockViews[itemId], mock: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      const { db } = await connectToDatabase(uri);
      const viewsCollection = db.collection('views');

      await viewsCollection.updateOne(
        { _id: itemId },
        { $inc: { count: 1 } },
        { upsert: true }
      );

      const updatedDoc = await viewsCollection.findOne({ _id: itemId });
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
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

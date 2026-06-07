import { MongoClient } from 'mongodb';

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

// In-memory fallback for local development only
let localMockViews = {
  "GH-01.JPG": 142,
  "Drone-001.JPG": 96,
  "FM-01.JPG": 204,
  "FM-02.JPG": 188,
  "SE-01.JPG": 125,
  "VI-01": 310,
  "VI-02": 245
};

export default async function handler(req, res) {
  const allowedOrigin = process.env.SITE_ORIGIN || 'https://jcnino.vercel.app';
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const hasMongo = !!process.env.MONGODB_URI;

  try {
    if (req.method === 'GET') {
      if (!hasMongo) {
        return res.status(200).json(localMockViews);
      }

      const { db } = await connectToDatabase();
      const viewsCollection = db.collection('views');
      const viewsList = await viewsCollection.find({}).toArray();

      const viewsMap = {};
      viewsList.forEach(doc => {
        viewsMap[doc._id] = doc.count || 0;
      });

      return res.status(200).json(viewsMap);
    }

    if (req.method === 'POST') {
      const { itemId } = req.body || {};

      if (!itemId) {
        return res.status(400).json({ error: 'itemId is required' });
      }

      // Basic input validation
      if (typeof itemId !== 'string' || itemId.length > 100) {
        return res.status(400).json({ error: 'Invalid itemId' });
      }

      if (!hasMongo) {
        if (!localMockViews[itemId]) {
          localMockViews[itemId] = 0;
        }
        localMockViews[itemId] += 1;
        return res.status(200).json({ itemId, count: localMockViews[itemId], mock: true });
      }

      const { db } = await connectToDatabase();
      const viewsCollection = db.collection('views');

      // Update the views count securely (using upsert)
      await viewsCollection.updateOne(
        { _id: itemId },
        { $inc: { count: 1 } },
        { upsert: true }
      );

      const updatedDoc = await viewsCollection.findOne({ _id: itemId });
      const updatedCount = updatedDoc ? updatedDoc.count : 0;

      return res.status(200).json({ itemId, count: updatedCount });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Views API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

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

// In-memory fallback dictionary for local development if MONGODB_URI is missing
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
  const pagesDevRegex = /^https:\/\/([a-zA-Z0-9-]+\.)*pages\.dev$/;
  const vercelRegex = /^https:\/\/([a-zA-Z0-9-]+\.)*vercel\.app$/;
  const githubPagesOrigin = 'https://jcnino2020.github.io';
  return localRegex.test(origin) || pagesDevRegex.test(origin) || vercelRegex.test(origin) || origin === githubPagesOrigin;
}

export default async function handler(req, res) {
  // CORS Headers so the script works flawlessly even from different local origins
  res.setHeader('Access-Control-Allow-Credentials', true);
  
  const origin = req.headers.origin;
  if (origin) {
    if (isAllowedOrigin(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      return res.status(403).json({ error: 'Origin not allowed' });
    }
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'https://jcnino2020.github.io');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const hasMongo = !!process.env.MONGODB_URI;

  try {
    if (req.method === 'GET') {
      if (!hasMongo) {
        // Return mock data
        return res.status(200).json(localMockViews);
      }

      const { db } = await connectToDatabase();
      const viewsCollection = db.collection('views');
      const viewsList = await viewsCollection.find({}).toArray();
      
      // Convert list to simple key-value map: { [itemId]: count }
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

      if (!hasMongo) {
        // Handle mock view increments
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

      // Fetch the updated value to return it
      const updatedDoc = await viewsCollection.findOne({ _id: itemId });
      const updatedCount = updatedDoc ? updatedDoc.count : 0;

      return res.status(200).json({ itemId, count: updatedCount });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Views API Error:', error);
    res.status(500).json({ error: error.message });
  }
}

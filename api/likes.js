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
  // Connection string specifies the database (e.g. 'jcnino' or default)
  const db = client.db();
  cachedClient = client;
  cachedDb = db;
  return { client, db };
}

// In-memory fallback dictionary for local development if MONGODB_URI is missing
let localMockLikes = {
  "GH-01.JPG": 12,
  "Drone-001.JPG": 8,
  "FM-02.JPG": 15
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
        return res.status(200).json(localMockLikes);
      }

      const { db } = await connectToDatabase();
      const likesCollection = db.collection('likes');

      // Auto-correct any existing negative like counts in the database
      await likesCollection.updateMany(
        { count: { $lt: 0 } },
        { $set: { count: 0 } }
      );

      const likesList = await likesCollection.find({}).toArray();
      
      // Convert list to simple key-value map: { [itemId]: count }
      const likesMap = {};
      likesList.forEach(doc => {
        likesMap[doc._id] = Math.max(0, doc.count || 0);
      });

      return res.status(200).json(likesMap);
    } 
    
    if (req.method === 'POST') {
      const { itemId, decrement } = req.body || {};
      
      if (!itemId) {
        return res.status(400).json({ error: 'itemId is required' });
      }

      const change = decrement ? -1 : 1;

      if (!hasMongo) {
        // Handle mock increment/decrement
        if (!localMockLikes[itemId]) {
          localMockLikes[itemId] = 0;
        }
        localMockLikes[itemId] = Math.max(0, localMockLikes[itemId] + change);
        return res.status(200).json({ itemId, count: localMockLikes[itemId], mock: true });
      }

      const { db } = await connectToDatabase();
      const likesCollection = db.collection('likes');

      // Update the like count securely (using upsert)
      await likesCollection.updateOne(
        { _id: itemId },
        { $inc: { count: change } },
        { upsert: true }
      );

      // Ensure count is never negative in the database
      await likesCollection.updateOne(
        { _id: itemId, count: { $lt: 0 } },
        { $set: { count: 0 } }
      );

      // Fetch the updated value to return it
      const updatedDoc = await likesCollection.findOne({ _id: itemId });
      const updatedCount = updatedDoc ? updatedDoc.count : 0;

      return res.status(200).json({ itemId, count: updatedCount });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
}

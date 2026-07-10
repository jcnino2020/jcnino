const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Please define the MONGODB_URI environment variable');
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');
    const db = client.db();

    const seedDataPath = path.join(__dirname, '..', 'mongodb_seed.json');
    const seedDataRaw = fs.readFileSync(seedDataPath, 'utf8');
    const seedData = JSON.parse(seedDataRaw);

    for (const [collectionName, data] of Object.entries(seedData)) {
      if (Array.isArray(data) && data.length > 0) {
        const collection = db.collection(collectionName);
        // Clear existing
        await collection.deleteMany({});
        // Insert new
        const result = await collection.insertMany(data);
        console.log(`Inserted ${result.insertedCount} documents into ${collectionName}`);
      }
    }

    console.log('Seeding completed successfully');
  } catch (error) {
    console.error('Seeding error:', error);
  } finally {
    await client.close();
  }
}

seed();

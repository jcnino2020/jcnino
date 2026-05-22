const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  try {
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split('\n').forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          let key = match[1];
          let value = match[2] || '';
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.substring(1, value.length - 1);
          } else if (value.startsWith("'") && value.endsWith("'")) {
            value = value.substring(1, value.length - 1);
          }
          process.env[key] = value;
        }
      });
    }
  } catch (e) {
    console.error("Error parsing .env file:", e);
  }
}

async function main() {
  loadEnv();
  const uri = process.env.MONGODB_URI || "mongodb+srv://jcnino04:gilgil77@jcnino.jtt2bm4.mongodb.net/jcnino?appName=jcnino";
  console.log("Connecting to:", uri);
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log("Connected successfully to MongoDB server");
    const db = client.db();
    const collections = await db.listCollections().toArray();
    console.log("Collections:", collections.map(c => c.name));
    
    const logsCollection = db.collection('login_logs');
    const count = await logsCollection.countDocuments();
    console.log("Number of documents in login_logs:", count);
    
    if (count > 0) {
      const sample = await logsCollection.find().limit(3).toArray();
      console.log("Sample logs:", JSON.stringify(sample, null, 2));
    }
  } catch (err) {
    console.error("Database connection error:", err);
  } finally {
    await client.close();
  }
}

main();

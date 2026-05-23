import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';

let cachedClient = null;
let cachedDb = null;

// Self-contained .env parser for local development (no extra packages needed)
function loadEnv() {
  if (process.env.MONGODB_URI) return; // Already injected by Vercel/host environment
  
  try {
    const envPaths = [
      path.resolve(process.cwd(), '.env'),
      path.resolve(process.cwd(), '..', '.env'),
      path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '.env')
    ];

    for (const envPath of envPaths) {
      // Handle potential Windows drive letter prefix issue with URL paths
      let cleanPath = envPath;
      if (process.platform === 'win32' && cleanPath.startsWith('\\')) {
        cleanPath = cleanPath.substring(1);
      }
      
      if (fs.existsSync(cleanPath)) {
        const content = fs.readFileSync(cleanPath, 'utf8');
        content.split(/\r?\n/).forEach(line => {
          // Remove comments and leading/trailing whitespace
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) return;
          
          const match = trimmed.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
          if (match) {
            let key = match[1];
            let value = match[2] || '';
            // Strip surrounding quotes if present
            if (value.startsWith('"') && value.endsWith('"')) {
              value = value.substring(1, value.length - 1);
            } else if (value.startsWith("'") && value.endsWith("'")) {
              value = value.substring(1, value.length - 1);
            }
            process.env[key] = value;
          }
        });
        break; // Successfully loaded one
      }
    }
  } catch (e) {
    console.warn("Could not load local .env file automatically:", e);
  }
}

// Call loadEnv immediately on import
loadEnv();

export async function connectToDatabase() {
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

export function getHasMongo() {
  return !!process.env.MONGODB_URI;
}

import { MongoClient } from 'mongodb';
let connection;
export async function auditCollection() {
  if (!process.env.MONGODB_URI) return null;
  if (!connection) {
    const client = new MongoClient(process.env.MONGODB_URI, {serverSelectionTimeoutMS:5000, connectTimeoutMS:5000});
    connection = client.connect().then(()=>client.db().collection('login_logs')).catch(error=>{connection=null;throw error;});
  }
  return connection;
}

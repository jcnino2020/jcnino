import { MongoClient } from 'mongodb';
let connection;
export async function galleryCollection() {
  if (!process.env.MONGODB_URI) throw new Error('Connect MongoDB by setting MONGODB_URI in the Vercel project.');
  if (!connection) {
    const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    connection = client.connect().then(() => client.db().collection('portfolio_gallery')).catch(error => {
      connection = null;
      throw error;
    });
  }
  return connection;
}
export const galleryKeys = ['highlights', 'drone', 'framed', 'events', 'videos', 'videos2', 'settings'];
export function validateGallery(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  if (Object.keys(data).some(key => !galleryKeys.includes(key))) return false;
  if (!data.settings || typeof data.settings !== 'object' || Array.isArray(data.settings)) return false;
  return galleryKeys.filter(key => key !== 'settings').every(key =>
    Array.isArray(data[key]) && data[key].length <= 10000 && data[key].every(item =>
      item && typeof item === 'object' && !Array.isArray(item) &&
      (key.startsWith('videos') ? typeof item.youtubeId === 'string' :
        typeof item.file === 'string' && /^[^<>"'\\/\x00-\x1f]{1,240}$/.test(item.file) &&
        (!item.url || safePhotoURL(item.url)) &&
        (!item.variants || (typeof item.variants === 'object' && !Array.isArray(item.variants) &&
          Object.entries(item.variants).every(([width, url]) => ['800', '1200', '1600', '2048'].includes(width) && safePhotoURL(url)))))));
}
function safePhotoURL(value) {
  if (typeof value !== 'string' || /[<>"'\\\s]/.test(value)) return false;
  try { return ['http:', 'https:'].includes(new URL(value).protocol); } catch { return false; }
}

import { publicGallery } from '../lib/public-gallery.js';
import { randomUUID } from 'node:crypto';
import { authenticated, prepareResponse } from '../lib/admin-session.js';
import { galleryCollection, validateGallery } from '../lib/gallery-store.js';

export function createGalleryHandler(getCollection = galleryCollection) {
  return async function handler(req, res) {
    if (!prepareResponse(req, res)) return;
    const script = req.method === 'GET' && req.query?.format === 'js';
    if (script) res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    if (!['GET', 'POST'].includes(req.method)) return res.status(405).json({ error: 'Method not allowed.' });
    if (req.method === 'POST' && !authenticated(req)) return res.status(401).json({ error: 'Sign in again before publishing.' });
    try {
      const collection = await getCollection();
      if (req.method === 'GET') {
        const saved = await collection.findOne({ _id: 'live' });
        if (script) {
          const data = JSON.stringify(authenticated(req) ? saved?.data || null : publicGallery(saved?.data || null)).replaceAll('<', '\\u003c');
          return res.status(200).send(`${saved ? `window.galleryData = ${data};` : ''}\nwindow.galleryRevision = ${JSON.stringify(saved?.revision || null)};\nwindow.galleryLiveAvailable = true;`);
        }
        return res.status(200).json({ data: authenticated(req) ? saved?.data || null : publicGallery(saved?.data || null), revision: saved?.revision || null });
      }
      const { data, revision } = req.body || {};
      if (!validateGallery(data) || JSON.stringify(data).length > 3000000 || !(revision === null || typeof revision === 'string')) {
        return res.status(400).json({ error: 'Invalid gallery data or revision. Reload the admin and try again.' });
      }
      const nextRevision = randomUUID();
      let result;
      try {
        result = await collection.updateOne({ _id: 'live', revision }, {
          $set: { data, revision: nextRevision, updatedAt: new Date() }
        }, { upsert: revision === null });
      } catch (error) {
        if (error.code !== 11000) throw error;
      }
      if (!result || (!result.matchedCount && !result.upsertedCount)) {
        return res.status(409).json({ error: 'Another admin tab published changes. Your draft is kept locally. Reload to get the latest gallery before editing again.' });
      }
      return res.status(200).json({ success: true, revision: nextRevision });
    } catch (error) {
      console.error('Gallery storage unavailable:', error.message);
      if (script) return res.status(200).send('window.galleryLiveAvailable = false;');
      return res.status(503).json({ error: 'Gallery database unavailable. Check MONGODB_URI in Vercel; your local draft is preserved.' });
    }
  };
}
export default createGalleryHandler();

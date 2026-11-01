import { put } from '@vercel/blob';
import { authenticated, prepareResponse } from '../lib/admin-session.js';

export function createUploadHandler(store = put) {
  return async function handler(req, res) {
    if (!prepareResponse(req, res)) return;
    if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });
    if (!authenticated(req)) return res.status(401).json({ error: 'Sign in again before uploading.' });
    if (!process.env.BLOB_READ_WRITE_TOKEN && !process.env.BLOB_STORE_ID) {
      return res.status(503).json({ error: 'Connect a public Blob store to this Vercel project, then redeploy to enable uploads.' });
    }
    const { category, filename, width, base64, uploadId } = req.body || {};
    if (!['highlights', 'drone', 'framed', 'events'].includes(category) ||
        ![800, 1200, 1600, 2048].includes(width) || typeof filename !== 'string' ||
        !/^[a-zA-Z0-9-]{1,80}$/.test(uploadId || '') || typeof base64 !== 'string' ||
        base64.length > 2800000 || !/^[A-Za-z0-9+/]*={0,2}$/.test(base64)) {
      return res.status(400).json({ error: 'Invalid image upload. Use JPG, PNG, or WebP photos.' });
    }
    const bytes = Buffer.from(base64, 'base64');
    if (!bytes.length || bytes.length > 2 * 1024 * 1024 || bytes.toString('ascii', 0, 4) !== 'RIFF' || bytes.toString('ascii', 8, 12) !== 'WEBP') {
      return res.status(400).json({ error: 'Upload must be a WebP image under 2 MB.' });
    }
    const name = filename.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 100) || 'photo';
    try {
      const blob = await store(`portfolio/${category}/${uploadId}/${name}-${width}.webp`, bytes, {
        access: 'public', contentType: 'image/webp', addRandomSuffix: true,
        cacheControlMaxAge: 31536000
      });
      return res.status(200).json({ success: true, url: blob.url, width });
    } catch (error) {
      console.error('Blob upload failed:', error.message);
      return res.status(502).json({ error: 'Photo storage unavailable. Check the public Blob store connection in Vercel and retry.' });
    }
  };
}
export default createUploadHandler();

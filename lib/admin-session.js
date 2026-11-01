import crypto from 'node:crypto';

export function authenticated(req) {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) return false;
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const expected = crypto.createHmac('sha256', secret).update(parts[0]).digest('base64url');
  const signature = Buffer.from(parts[1]);
  const correct = Buffer.from(expected);
  if (signature.length !== correct.length || !crypto.timingSafeEqual(signature, correct)) return false;
  try {
    const payload = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
    return Number.isFinite(payload.expiresAt) && payload.expiresAt > Date.now();
  } catch { return false; }
}

export function prepareResponse(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Same-origin administration only. Authentication is required even in local development.
  if (req.headers.origin) {
    try {
      if (new URL(req.headers.origin).host !== req.headers.host) {
        res.status(403).json({ error: 'Use the admin on the same domain as the API.' });
        return false;
      }
    } catch {
      res.status(403).json({ error: 'Invalid origin.' });
      return false;
    }
  }
  return true;
}

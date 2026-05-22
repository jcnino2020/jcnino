// Serverless Auth Function
export default async function handler(req, res) {
  // Set CORS Headers to allow direct cross-origin validation (e.g. from local testing)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { password } = req.body || {};
    
    // Retrieve target password from server environment (default to gilgil77)
    const expectedPassword = process.env.ADMIN_PASSWORD || 'gilgil77';

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    if (password === expectedPassword) {
      // Returns confirmation and session token
      return res.status(200).json({ 
        success: true, 
        token: 'authorized_admin_session_token_' + Buffer.from(expectedPassword).toString('base64')
      });
    } else {
      return res.status(401).json({ success: false, error: 'Incorrect administrator password' });
    }
  } catch (error) {
    console.error('Auth API Error:', error);
    res.status(500).json({ error: error.message });
  }
}

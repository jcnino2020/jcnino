export default async function handler(req, res) {
  // CORS Headers so the script works flawlessly from different allowed origins
  res.setHeader('Access-Control-Allow-Credentials', true);
  
  const origin = req.headers.origin;
  const isAllowedOrigin = (origin) => {
    if (!origin || origin === 'null' || origin === 'file://') return true;
    const localRegex = /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\]|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|[a-zA-Z0-9-]+\.local|[a-zA-Z0-9-]+\.internal)(:\d+)?$/;
    const pagesDevRegex = /^https:\/\/([a-zA-Z0-9-]+\.)*pages\.dev$/;
    const vercelRegex = /^https:\/\/([a-zA-Z0-9-]+\.)*vercel\.app$/;
    const githubPagesRegex = /^https:\/\/([a-zA-Z0-9-]+\.)*github\.io$/;
    const customDomainRegex = /^https?:\/\/([a-zA-Z0-9-]+\.)*(jcnino\.(dev|com|me)|jcninonuevo\.com)$/;
    return localRegex.test(origin) || pagesDevRegex.test(origin) || vercelRegex.test(origin) || githubPagesRegex.test(origin) || customDomainRegex.test(origin);
  };

  if (origin && isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'https://jcnino2020.github.io');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  try {
    const decodedUrl = decodeURIComponent(url);
    
    // Validate URL protocol
    if (!decodedUrl.startsWith('http://') && !decodedUrl.startsWith('https://')) {
      return res.status(400).json({ error: 'Invalid URL protocol' });
    }

    const response = await fetch(decodedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      redirect: 'follow'
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `Failed to fetch: ${response.statusText}` });
    }

    const contentType = response.headers.get('content-type') || '';
    const content = await response.text();

    res.setHeader('Content-Type', contentType || 'text/plain');
    return res.status(200).send(content);
  } catch (error) {
    console.error('Convert API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}

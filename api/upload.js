import crypto from 'crypto';

function isAllowedOrigin(origin) {
  if (!origin || origin === 'null' || origin === 'file://') return true;
  const localRegex = /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\]|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|[a-zA-Z0-9-]+\.local|[a-zA-Z0-9-]+\.internal)(:\d+)?$/;
  const pagesDevRegex = /^https:\/\/([a-zA-Z0-9-]+\.)*pages\.dev$/;
  const vercelRegex = /^https:\/\/([a-zA-Z0-9-]+\.)*vercel\.app$/;
  const githubPagesRegex = /^https:\/\/([a-zA-Z0-9-]+\.)*github\.io$/;
  const customDomainRegex = /^https?:\/\/([a-zA-Z0-9-]+\.)*(jcnino\.(dev|com|me)|jcninonuevo\.com)$/;
  return localRegex.test(origin) || pagesDevRegex.test(origin) || vercelRegex.test(origin) || githubPagesRegex.test(origin) || customDomainRegex.test(origin);
}

function verifySessionToken(token, expectedPassword) {
  if (!token || !expectedPassword) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  
  const [payloadStr, signature] = parts;
  const expectedSig = crypto.createHmac('sha256', expectedPassword)
    .update(payloadStr)
    .digest('base64url');

  if (signature !== expectedSig) return false;

  try {
    const payload = JSON.parse(Buffer.from(payloadStr, 'base64url').toString('utf8'));
    if (!payload.expiresAt || payload.expiresAt < Date.now()) {
      return false;
    }
    return true;
  } catch (e) {
    return false;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  const origin = req.headers.origin;
  if (origin) {
    if (isAllowedOrigin(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      return res.status(403).json({ error: 'Origin not allowed' });
    }
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'https://jcnino2020.github.io');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const expectedPassword = process.env.ADMIN_PASSWORD;
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    const isLocal = origin && (/localhost|127\.0\.0\.1|::1/.test(origin) || origin === 'null' || origin === 'file://');
    
    if (!isLocal) {
      if (!expectedPassword) {
        return res.status(500).json({ error: 'ADMIN_PASSWORD is not configured in Vercel environment variables.' });
      }
      if (!verifySessionToken(token, expectedPassword)) {
        return res.status(401).json({ error: 'Unauthorized: invalid or expired administrator session.' });
      }
    }

    const { category, filename, rawBase64, webps } = req.body || {};
    if (!filename || !rawBase64) {
      return res.status(400).json({ error: 'Missing filename or rawBase64 in request body.' });
    }

    const githubToken = process.env.GITHUB_TOKEN;
    const githubRepo = process.env.GITHUB_REPO || 'jcnino2020/jcnino';
    const githubBranch = process.env.GITHUB_BRANCH || 'main';

    if (!githubToken) {
      return res.status(200).json({
        success: true,
        filename,
        simulated: true,
        message: 'No GITHUB_TOKEN configured; image staged in browser cache and local session.'
      });
    }

    const base = filename.replace(/\.[^/.]+$/, "");
    let subfolder = "";
    if (category === 'drone') subfolder = "Drone Shots";
    else if (category === 'framed') subfolder = "Framed Moments";
    else if (category === 'events') subfolder = "School Events";

    const cleanRaw = rawBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
    const filesToCommit = [
      {
        path: subfolder ? `images/${subfolder}/${filename}` : `images/${filename}`,
        content: cleanRaw,
        encoding: 'base64'
      }
    ];

    if (Array.isArray(webps)) {
      webps.forEach(item => {
        const w = item.width || 800;
        const cleanWebp = (item.base64 || '').replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
        const p = `images/optimized/${w}/${subfolder ? subfolder + '/' : ''}${base}-${w}.webp`;
        filesToCommit.push({
          path: p,
          content: cleanWebp,
          encoding: 'base64'
        });
      });
    }

    // Commit via GitHub API
    const [owner, repo] = githubRepo.split('/');
    const headers = {
      'Authorization': `Bearer ${githubToken}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'JC-Ninonuevo-Portfolio-CMS',
      'Content-Type': 'application/json'
    };

    const refRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${githubBranch}`, { headers });
    if (!refRes.ok) throw new Error(`Branch ref fetch failed: ${refRes.status}`);
    const refData = await refRes.json();
    const currentCommitSha = refData.object.sha;

    const commitRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits/${currentCommitSha}`, { headers });
    if (!commitRes.ok) throw new Error(`Commit fetch failed: ${commitRes.status}`);
    const commitData = await commitRes.json();
    const baseTreeSha = commitData.tree.sha;

    const treeItems = await Promise.all(filesToCommit.map(async (file) => {
      const blobRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/blobs`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ content: file.content, encoding: file.encoding || 'base64' })
      });
      if (!blobRes.ok) throw new Error(`Blob creation failed for ${file.path}`);
      const blobData = await blobRes.json();
      return { path: file.path, mode: '100644', type: 'blob', sha: blobData.sha };
    }));

    const newTreeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ base_tree: baseTreeSha, tree: treeItems })
    });
    const newTreeData = await newTreeRes.json();

    const newCommitRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message: `CMS Media Upload: Added ${filename} with ${webps?.length || 0} optimized WebP sizes [skip ci]`,
        tree: newTreeData.sha,
        parents: [currentCommitSha]
      })
    });
    const newCommitData = await newCommitRes.json();

    await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${githubBranch}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ sha: newCommitData.sha, force: false })
    });

    return res.status(200).json({
      success: true,
      filename,
      commitSha: newCommitData.sha,
      filesCount: filesToCommit.length,
      deployMessage: `Successfully committed ${filename} and ${webps?.length || 0} WebP variants to GitHub.`
    });

  } catch (err) {
    console.error('Upload API Error:', err);
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
}

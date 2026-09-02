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
    // 1. Authenticate Request
    const expectedPassword = process.env.ADMIN_PASSWORD;
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    // Allow local development without strict token if running in localhost
    const isLocal = origin && (/localhost|127\.0\.0\.1|::1/.test(origin) || origin === 'null' || origin === 'file://');
    
    if (!isLocal) {
      if (!expectedPassword) {
        return res.status(500).json({ error: 'ADMIN_PASSWORD is not configured in Vercel environment variables.' });
      }
      if (!verifySessionToken(token, expectedPassword)) {
        return res.status(401).json({ error: 'Unauthorized: invalid or expired administrator session.' });
      }
    }

    // 2. Check GitHub Environment Variables
    const githubToken = process.env.GITHUB_TOKEN;
    const githubRepo = process.env.GITHUB_REPO || 'jcnino2020/jcnino';
    const githubBranch = process.env.GITHUB_BRANCH || 'main';

    if (!githubToken) {
      return res.status(400).json({
        success: false,
        error: 'GITHUB_TOKEN is not configured.',
        setupGuide: 'Add GITHUB_TOKEN in your Vercel Project Settings > Environment Variables with repository contents write permissions.'
      });
    }

    const { files, message } = req.body || {};

    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: 'Missing or empty "files" array in request body.' });
    }

    const commitMessage = message || `CMS Update: Modified portfolio content [skip ci]`;
    const [owner, repo] = githubRepo.split('/');
    const headers = {
      'Authorization': `Bearer ${githubToken}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'JC-Ninonuevo-Portfolio-CMS',
      'Content-Type': 'application/json'
    };

    // Step 1: Get the latest commit SHA for the target branch
    const refRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${githubBranch}`, {
      headers
    });
    if (!refRes.ok) {
      const errText = await refRes.text();
      throw new Error(`Failed to get branch ref for "${githubBranch}": ${refRes.status} ${errText}`);
    }
    const refData = await refRes.json();
    const currentCommitSha = refData.object.sha;

    // Step 2: Get current commit to retrieve base tree SHA
    const commitRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits/${currentCommitSha}`, {
      headers
    });
    if (!commitRes.ok) {
      const errText = await commitRes.text();
      throw new Error(`Failed to get commit "${currentCommitSha}": ${commitRes.status} ${errText}`);
    }
    const commitData = await commitRes.json();
    const baseTreeSha = commitData.tree.sha;

    // Step 3: Create Blobs for each file in parallel
    const treeItems = await Promise.all(files.map(async (file) => {
      const blobRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/blobs`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          content: file.content,
          encoding: file.encoding || 'utf-8'
        })
      });

      if (!blobRes.ok) {
        const errText = await blobRes.text();
        throw new Error(`Failed to create blob for "${file.path}": ${blobRes.status} ${errText}`);
      }
      const blobData = await blobRes.json();

      return {
        path: file.path.replace(/^\//, ''), // remove leading slash
        mode: '100644',
        type: 'blob',
        sha: blobData.sha
      };
    }));

    // Step 4: Create a new Git Tree
    const newTreeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        base_tree: baseTreeSha,
        tree: treeItems
      })
    });
    if (!newTreeRes.ok) {
      const errText = await newTreeRes.text();
      throw new Error(`Failed to create git tree: ${newTreeRes.status} ${errText}`);
    }
    const newTreeData = await newTreeRes.json();
    const newTreeSha = newTreeData.sha;

    // Step 5: Create a new Commit pointing to the new tree
    const newCommitRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message: commitMessage,
        tree: newTreeSha,
        parents: [currentCommitSha]
      })
    });
    if (!newCommitRes.ok) {
      const errText = await newCommitRes.text();
      throw new Error(`Failed to create commit: ${newCommitRes.status} ${errText}`);
    }
    const newCommitData = await newCommitRes.json();
    const newCommitSha = newCommitData.sha;

    // Step 6: Update the Git Ref (push commit to branch)
    const updateRefRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${githubBranch}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        sha: newCommitSha,
        force: false
      })
    });
    if (!updateRefRes.ok) {
      const errText = await updateRefRes.text();
      throw new Error(`Failed to update branch ref: ${updateRefRes.status} ${errText}`);
    }

    // Step 7: Return success with commit details
    return res.status(200).json({
      success: true,
      commitSha: newCommitSha,
      commitUrl: `https://github.com/${owner}/${repo}/commit/${newCommitSha}`,
      filesCommitted: treeItems.map(t => t.path),
      deployMessage: `Successfully committed ${treeItems.length} file(s) to GitHub (${githubBranch}). Vercel is now deploying your changes live in ~25s.`
    });

  } catch (err) {
    console.error('Save API Error:', err);
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
}

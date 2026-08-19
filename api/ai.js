/**
 * AI Chat API Proxy — DeepSeek V4 Flash
 * 
 * Secure serverless proxy that keeps the DeepSeek API key server-side.
 * The browser never sees the API key — it only talks to this endpoint.
 * 
 * Model: deepseek-v4-flash (OpenAI-compatible /chat/completions)
 * Base URL: https://api.deepseek.com
 */
const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

function isAllowedOrigin(origin) {
    if (!origin || origin === 'null' || origin === 'file://') return true;
    const localRegex = /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\]|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|[a-zA-Z0-9-]+\.local|[a-zA-Z0-9-]+\.internal)(:\d+)?$/;
    const pagesDevRegex = /^https:\/\/([a-zA-Z0-9-]+\.)*pages\.dev$/;
    const vercelRegex = /^https:\/\/([a-zA-Z0-9-]+\.)*vercel\.app$/;
    const githubPagesRegex = /^https:\/\/([a-zA-Z0-9-]+\.)*github\.io$/;
    const customDomainRegex = /^https?:\/\/([a-zA-Z0-9-]+\.)*(jcnino\.(dev|com|me)|jcninonuevo\.com)$/;
    return localRegex.test(origin) || pagesDevRegex.test(origin) || vercelRegex.test(origin) || githubPagesRegex.test(origin) || customDomainRegex.test(origin);
}

export default async function handler(req, res) {
    // CORS Headers — mirror the existing API patterns
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

    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'DEEPSEEK_API_KEY is not configured on the server' });
    }

    const { messages } = req.body || {};

    // Validate messages array
    if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'messages array is required' });
    }

    // Validate each message role/content to prevent abuse
    const validated = messages.slice(-20).map(m => {
        if (!m || typeof m !== 'object') return null;
        const role = ['system', 'user', 'assistant'].includes(m.role) ? m.role : null;
        const content = typeof m.content === 'string' ? m.content.slice(0, 4000) : null;
        if (!role || !content) return null;
        return { role, content };
    }).filter(Boolean);

    if (validated.length === 0) {
        return res.status(400).json({ error: 'Invalid message format' });
    }

    try {
        const response = await fetch(DEEPSEEK_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'deepseek-v4-flash',
                messages: validated,
                max_tokens: 1024,
                temperature: 0.7
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('DeepSeek API error:', data);
            return res.status(response.status).json({ error: data.error?.message || 'DeepSeek API request failed' });
        }

        const content = data.choices?.[0]?.message?.content || '';
        return res.status(200).json({ content });
    } catch (error) {
        console.error('AI Proxy Error:', error);
        return res.status(500).json({ error: 'Failed to reach DeepSeek API' });
    }
}
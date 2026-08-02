/**
 * AI Chat API Proxy — DeepSeek V4 Flash (Cloudflare Pages)
 *
 * Secure proxy that keeps the DeepSeek API key server-side.
 * The browser never sees the API key — it only talks to this endpoint.
 *
 * Model: deepseek-v4-flash (OpenAI-compatible /chat/completions)
 * Base URL: https://api.deepseek.com
 */
const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

function isAllowedOrigin(origin) {
    if (!origin) return false;
    const localRegex = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
    const pagesDevRegex = /^https:\/\/([a-zA-Z0-9-]+\.)*pages\.dev$/;
    const vercelRegex = /^https:\/\/([a-zA-Z0-9-]+\.)*vercel\.app$/;
    const githubPagesOrigin = 'https://jcnino2020.github.io';
    return localRegex.test(origin) || pagesDevRegex.test(origin) || vercelRegex.test(origin) || origin === githubPagesOrigin;
}

function corsHeaders(origin) {
    return {
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Origin': origin || 'https://jcnino2020.github.io',
        'Access-Control-Allow-Methods': 'GET,OPTIONS,POST',
        'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
    };
}

export async function onRequest(context) {
    const { request, env } = context;
    const method = request.method;
    const origin = request.headers.get('origin');

    if (origin && !isAllowedOrigin(origin)) {
        return new Response(JSON.stringify({ error: 'Origin not allowed' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const cors = corsHeaders(origin);

    if (method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: cors });
    }

    if (method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json', ...cors }
        });
    }

    const apiKey = env.DEEPSEEK_API_KEY;
    if (!apiKey) {
        return new Response(JSON.stringify({ error: 'DEEPSEEK_API_KEY is not configured on the server' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...cors }
        });
    }

    const body = await request.json().catch(() => ({}));
    const { messages } = body;

    // Validate messages array
    if (!Array.isArray(messages) || messages.length === 0) {
        return new Response(JSON.stringify({ error: 'messages array is required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...cors }
        });
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
        return new Response(JSON.stringify({ error: 'Invalid message format' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...cors }
        });
    }

    try {
        const response = await fetch(DEEPSEEK_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: validated,
                max_tokens: 1024,
                temperature: 0.7
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('DeepSeek API error:', data);
            return new Response(JSON.stringify({ error: data.error?.message || 'DeepSeek API request failed' }), {
                status: response.status,
                headers: { 'Content-Type': 'application/json', ...cors }
            });
        }

        const content = data.choices?.[0]?.message?.content || '';
        return new Response(JSON.stringify({ content }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...cors }
        });
    } catch (error) {
        console.error('AI Proxy Error:', error);
        return new Response(JSON.stringify({ error: 'Failed to reach DeepSeek API' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...cors }
        });
    }
}
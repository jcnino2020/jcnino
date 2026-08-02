/**
 * Generate AI text descriptions for main-site portfolio photos (highlights).
 *
 * Reads assets/gallery-data.js, extracts only the `highlights` array,
 * and uses the DeepSeek API (same model as api/ai.js) to create a
 * poetic 1–2 sentence description for each photo based on its `alt` text.
 *
 * Usage:
 *   node --env-file=.env scripts/generate_descriptions.mjs
 *
 * The script is resumable — photos that already have a `desc` are skipped.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = join(__dirname, '..', 'assets', 'gallery-data.js');

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';
const API_KEY = process.env.DEEPSEEK_API_KEY;

if (!API_KEY) {
    console.error('❌ DEEPSEEK_API_KEY is not set. Run with: node --env-file=.env scripts/generate_descriptions.mjs');
    process.exit(1);
}

// ---------------------------------------------------------------
// 1. Read gallery-data.js
// ---------------------------------------------------------------
let source = readFileSync(DATA_FILE, 'utf8');

// Extract the raw window.galleryData object literal via a sandboxed eval
// (the file only assigns window.galleryData — safe to capture).
const galleryData = await import('data:text/javascript,' + encodeURIComponent(
    source.replace('window.galleryData =', 'export default')
)).then(m => m.default);

// Collect photos from all main categories (highlights, drone, framed, events)
const categories = ['highlights', 'drone', 'framed', 'events'];
const allPhotos = [];

for (const cat of categories) {
    if (Array.isArray(galleryData[cat])) {
        allPhotos.push(...galleryData[cat]);
    }
}

const missing = allPhotos.filter(p => !p.desc);
const total = allPhotos.length;

console.log(`📊 Found ${total} main-site photos across ${categories.join(', ')}; ${missing.length} missing descriptions.`);

if (missing.length === 0) {
    console.log('✅ All photos already have descriptions. Nothing to do.');
    process.exit(0);
}

// ---------------------------------------------------------------
// 2. Ask DeepSeek for descriptions in batches
// ---------------------------------------------------------------
const SYSTEM_PROMPT = `You are an expert photographer's assistant writing elegant short captions for a portfolio website. Each photo has an alt-text describing what it shows. Write ONE poetic, evocative description of 1–2 sentences (max 180 characters) that makes the viewer feel the scene. Match the tone of a professional photography portfolio. Do not use quotes, do not prefix with dashes or numbering. Return ONLY the description text, plain.`;

function buildUserPrompt(batch) {
    const items = batch.map(p => `- ${p.file}: ${p.alt}`).join('\n');
    return `Write a short, poetic description for EACH of these photos (maintain the same order, one per line, starting with the filename then a colon then the description):\n\n${items}`;
}

const BATCH_SIZE = 4;
const DELAY_MS = 2000;
const results = {}; // file -> desc

async function callDeepSeek(prompt) {
    const res = await fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
            model: 'deepseek-v4-flash',
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: prompt }
            ],
            max_tokens: 2048,
            temperature: 0.8
        })
    });
    const data = await res.json();
    if (!res.ok) {
        throw new Error(`DeepSeek API error ${res.status}: ${data.error?.message || JSON.stringify(data)}`);
    }
    return data.choices?.[0]?.message?.content || '';
}

// Batch and process sequentially (with retry up to 3x per batch)
for (let i = 0; i < missing.length; i += BATCH_SIZE) {
    const batch = missing.slice(i, i + BATCH_SIZE);
    const files = batch.map(p => p.file);
    let attempts = 0;
    let ok = false;

    while (!ok && attempts < 3) {
        attempts++;
        try {
            const raw = await callDeepSeek(buildUserPrompt(batch));
            const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
            for (const line of lines) {
                const colonIdx = line.indexOf(':');
                if (colonIdx === -1) continue;
                const file = line.slice(0, colonIdx).trim();
                const desc = line.slice(colonIdx + 1).trim();
                if (files.includes(file) && desc) {
                    results[file] = desc;
                }
            }
            ok = true;
            console.log(`✅ Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(missing.length / BATCH_SIZE)} — got ${Object.keys(results).length} so far`);
        } catch (err) {
            console.warn(`⚠️  Batch failed (attempt ${attempts}/3): ${err.message}`);
            await new Promise(r => setTimeout(r, 3000 * attempts));
        }
    }

    if (!ok) {
        console.error(`❌ Could not process batch starting at index ${i} after 3 attempts. Skipping.`);
    }

    await new Promise(r => setTimeout(r, DELAY_MS));
}

// ---------------------------------------------------------------
// 3. Write descriptions back into gallery-data.js
// ---------------------------------------------------------------
const withDesc = allPhotos.map(p => {
    if (p.desc) return p;
    const desc = results[p.file];
    return desc ? { ...p, desc } : p;
});

if (Object.keys(results).length === 0) {
    console.error('❌ No descriptions were generated. Aborting write.');
    process.exit(1);
}

let updated = source;
for (const p of withDesc) {
    if (!p.desc) continue;
    const originalObj = allPhotos.find(h => h.file === p.file);
    if (!originalObj) continue;
    const origLineText = `{ file: "${originalObj.file}", alt: "${originalObj.alt}" }`;
    const escaped = origLineText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(escaped);
    if (re.test(updated)) {
        updated = updated.replace(re, `{ file: "${p.file}", alt: "${p.alt}", desc: ${JSON.stringify(p.desc)} }`);
    }
}

writeFileSync(DATA_FILE, updated, 'utf8');
console.log(`\n💾 Saved ${Object.keys(results).length} new descriptions to assets/gallery-data.js`);

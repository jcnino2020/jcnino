/**
 * Generate AI Photo Descriptions using Gemini 2.5 Flash (non-lite).
 * Limited to 20 requests per day (free tier) – the rest resume tomorrow via cron.
 *
 * Usage:
 *   node --env-file=.env scripts/generate_descriptions_gemini.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = join(__dirname, '..', 'assets', 'gallery-data.js');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
if (!GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY not set in .env');
    process.exit(1);
}

// ──────────── Config ────────────
const MODEL = 'gemini-2.5-flash';       // non‑lite model
const DAILY_LIMIT = 20;                // free‑tier RPD
const DELAY_BETWEEN_MS = 14_000;       // ~4.3 RPM (safe under 5 RPM)
const REQUEST_TIMEOUT_MS = 60_000;     // wait between daily runs (not needed here)

// ──────────── Load gallery data ────────────
let source = readFileSync(DATA_FILE, 'utf8');
const galleryData = await import('data:text/javascript,' + encodeURIComponent(
    source.replace('window.galleryData =', 'export default')
)).then(m => m.default);

const categories = ['highlights', 'drone', 'framed', 'events'];
const allPhotos = [];
for (const cat of categories) {
    if (Array.isArray(galleryData[cat])) {
        galleryData[cat].forEach(p => allPhotos.push({ ...p, category: cat }));
    }
}

const missing = allPhotos.filter(p => !p.desc);
console.log(`📊 Total photos: ${allPhotos.length}, missing descriptions: ${missing.length}`);
if (missing.length === 0) {
    console.log('✅ All done.');
    process.exit(0);
}

// ──────────── Helpers ────────────
function findImagePath(photo) {
    const base = photo.file.replace(/\.[^/.]+$/, '');
    const paths = [
        join(__dirname, '..', 'images', 'optimized', '800', `${base}-800.webp`),
        join(__dirname, '..', 'images', 'optimized', '800', 'Drone Shots', `${base}-800.webp`),
        join(__dirname, '..', 'images', 'optimized', '800', 'Framed Moments', `${base}-800.webp`),
        join(__dirname, '..', 'images', 'optimized', '800', 'School Events', `${base}-800.webp`),
        join(__dirname, '..', 'images', photo.file)
    ];
    for (const p of paths) if (existsSync(p)) return p;
    return null;
}

// Rate limiter for RPM
const requestTimestamps = [];
async function waitForRateLimitSlot() {
    if (requestTimestamps.length > 0) {
        const last = requestTimestamps[requestTimestamps.length - 1];
        const elapsed = Date.now() - last;
        if (elapsed < DELAY_BETWEEN_MS) {
            await new Promise(r => setTimeout(r, DELAY_BETWEEN_MS - elapsed));
        }
    }
    requestTimestamps.push(Date.now());
}

// ──────────── Gemini call ────────────
async function describeImage(imagePath, altText) {
    const fileBuf = readFileSync(imagePath);
    const base64Data = fileBuf.toString('base64');
    const mimeType = imagePath.endsWith('.webp') ? 'image/webp' : 'image/jpeg';

    const payload = {
        contents: [{
            parts: [
                { inlineData: { mimeType, data: base64Data } },
                { text: `You are a professional curator for an award-winning photography portfolio. Look closely at this image. Identify where the photo was taken (e.g., landmark, city, island, campus, or region in Negros Occidental/Philippines) using visual cues and context: "${altText}". Write ONE elegant, evocative description of 1 to 2 sentences (max 180 characters) incorporating the location, lighting, atmosphere, and mood. Do not use quotes or prefixes.` }
            ]
        }]
    };

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;
    const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(`API ${res.status}: ${data.error?.message || 'unknown'}`);
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    return text.replace(/^["']|["']$/g, '');
}

// ──────────── Main loop with daily cap ────────────
console.log(`🤖 Model: ${MODEL} | Daily limit: ${DAILY_LIMIT} requests\n`);

let processedToday = 0;
for (let i = 0; i < missing.length; i++) {
    if (processedToday >= DAILY_LIMIT) {
        console.log(`⏹️ Reached daily limit (${DAILY_LIMIT}). Remaining for tomorrow: ${missing.length - i}`);
        break;
    }

    const photo = missing[i];
    const imgPath = findImagePath(photo);
    if (!imgPath) {
        console.warn(`⚠️  Skipping ${photo.file} (file not found)`);
        continue;
    }

    await waitForRateLimitSlot();

    let attempts = 0;
    let success = false;
    while (!success && attempts < 3) {
        attempts++;
        try {
            console.log(`[${processedToday + 1}/${DAILY_LIMIT} today] ${photo.file}`);
            const desc = await describeImage(imgPath, photo.alt || '');
            console.log(`   → ${desc}`);

            // Update in-memory source and write to disk
            const photoObj = allPhotos.find(p => p.file === photo.file);
            if (photoObj) {
                const origLineText = `{ file: "${photoObj.file}", alt: "${photoObj.alt}" }`;
                const escaped = origLineText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const re = new RegExp(escaped);
                if (re.test(source)) {
                    source = source.replace(re, `{ file: "${photoObj.file}", alt: "${photoObj.alt}", desc: ${JSON.stringify(desc)} }`);
                    writeFileSync(DATA_FILE, source, 'utf8');
                }
            }
            success = true;
            processedToday++;
        } catch (err) {
            if (err.message.includes('429') || err.message.includes('Quota')) {
                console.warn(`⏳ Rate limited, waiting 60s...`);
                await new Promise(r => setTimeout(r, 60_000));
            } else {
                console.error(`❌ Error: ${err.message}`);
                break; // skip this photo on non‑429 errors
            }
        }
    }
}

console.log(`\n✅ Done for today. Processed ${processedToday} photos.`);
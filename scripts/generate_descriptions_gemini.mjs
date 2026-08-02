/**
 * Generate AI Photo Descriptions using Google Vision (Gemini Vision API).
 *
 * Reads actual photo images from disk (images/optimized/800/...), converts them to base64,
 * and sends them directly to Google's Vision AI API to generate visual descriptions.
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
    console.error('❌ GEMINI_API_KEY or GOOGLE_API_KEY is not set in .env.');
    console.error('   Please add GEMINI_API_KEY="AIzaSy..." to your .env file.');
    process.exit(1);
}

// ---------------------------------------------------------------
// 1. Read gallery-data.js
// ---------------------------------------------------------------
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
console.log(`📊 Found ${allPhotos.length} total photos; ${missing.length} missing descriptions.`);

if (missing.length === 0) {
    console.log('✅ All photos already have descriptions. To re-generate, clear `desc` fields in assets/gallery-data.js.');
    process.exit(0);
}

// Helper to find image file on disk
function findImagePath(photo) {
    const base = photo.file.replace(/\.[^/.]+$/, "");
    const candidatePaths = [
        join(__dirname, '..', 'images', 'optimized', '800', `${base}-800.webp`),
        join(__dirname, '..', 'images', 'optimized', '800', 'Drone Shots', `${base}-800.webp`),
        join(__dirname, '..', 'images', 'optimized', '800', 'Framed Moments', `${base}-800.webp`),
        join(__dirname, '..', 'images', 'optimized', '800', 'School Events', `${base}-800.webp`),
        join(__dirname, '..', 'images', photo.file)
    ];

    for (const p of candidatePaths) {
        if (existsSync(p)) return p;
    }
    return null;
}

// ---------------------------------------------------------------
// 2. Call Google Vision (Gemini Vision API) per image
// ---------------------------------------------------------------
// Auto-detect working Gemini vision model for the API key
async function getWorkingModelName() {
    try {
        const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`);
        const listData = await listRes.json();
        if (listRes.ok && Array.isArray(listData.models)) {
            const visionModel = listData.models.find(m => 
                m.supportedGenerationMethods?.includes('generateContent') &&
                (m.name.includes('flash') || m.name.includes('vision') || m.name.includes('pro'))
            );
            if (visionModel) {
                const cleanName = visionModel.name.replace(/^models\//, '');
                console.log(`🤖 Auto-detected active Google Vision model: ${cleanName}`);
                return cleanName;
            }
        }
    } catch (e) {
        // Ignore listing failure and fallback to candidates
    }

    const candidates = [
        'gemini-3.6-flash',
        'gemini-3.5-flash',
        'gemini-3.5-flash-lite',
        'gemini-3.1-flash-lite',
        'gemini-3.1-pro',
        'gemini-3-flash',
        'gemini-2.5-flash',
        'gemini-2.0-flash',
        'gemini-1.5-flash-latest'
    ];
    return candidates[0];
}

const ACTIVE_MODEL = await getWorkingModelName();
const results = {};

async function describeImageWithGoogleVision(imagePath, altText, modelName = ACTIVE_MODEL) {
    const fileBuf = readFileSync(imagePath);
    const base64Data = fileBuf.toString('base64');
    const mimeType = imagePath.endsWith('.webp') ? 'image/webp' : 'image/jpeg';

    const payload = {
        contents: [
            {
                parts: [
                    { inlineData: { mimeType, data: base64Data } },
                    {
                        text: `You are a professional curator for an award-winning photography portfolio. Look closely at this image. Identify where the photo was taken (e.g., landmark, city, island, campus, or region in Negros Occidental/Philippines) using visual cues and context: "${altText}". Write ONE elegant, evocative description of 1 to 2 sentences (max 180 characters) incorporating the location, lighting, atmosphere, and mood. Do not use quotes or prefixes.`
                    }
                ]
            }
        ]
    };

    const modelsToTry = [
        modelName,
        'gemini-3.6-flash',
        'gemini-3.5-flash',
        'gemini-3.5-flash-lite',
        'gemini-3.1-flash-lite',
        'gemini-3.1-pro',
        'gemini-3-flash',
        'gemini-2.5-flash',
        'gemini-2.0-flash',
        'gemini-1.5-flash-latest'
    ];
    let lastErr = null;

    for (const m of modelsToTry) {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${GEMINI_API_KEY}`;
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (res.ok) {
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
            return text.replace(/^["']|["']$/g, '');
        }

        if (res.status === 429) {
            const err = new Error(`429 Rate Limit`);
            err.status = 429;
            throw err;
        }

        if (res.status === 404) {
            lastErr = new Error(`Google Vision API error ${res.status}: ${data.error?.message || JSON.stringify(data)}`);
            continue;
        }

        throw new Error(`Google Vision API error ${res.status}: ${data.error?.message || JSON.stringify(data)}`);
    }

    throw lastErr || new Error('No compatible Google Gemini Vision model found for this key');
}

console.log(`\n👁️ Analyzing images with Google Vision AI (Free Tier rate-limit protection enabled)...`);

const DELAY_MS = 12500;

for (let i = 0; i < missing.length; i++) {
    const photo = missing[i];
    const imgPath = findImagePath(photo);

    if (!imgPath) {
        console.warn(`⚠️  Could not find image on disk for ${photo.file}`);
        continue;
    }

    let attempts = 0;
    let success = false;

    while (!success && attempts < 5) {
        attempts++;
        try {
            console.log(`[${i + 1}/${missing.length}] Analyzing ${photo.file} (${photo.category})...`);
            const desc = await describeImageWithGoogleVision(imgPath, photo.alt || '');
            if (desc) {
                results[photo.file] = desc;
                console.log(`   └─ "${desc}"`);

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
            }
            success = true;
        } catch (err) {
            if (err.status === 429 || err.message.includes('429') || err.message.includes('Quota exceeded')) {
                console.warn(`⏳ Rate limit reached (5 RPM limit). Waiting 60s before retry (attempt ${attempts}/5)...`);
                await new Promise(r => setTimeout(r, 61000));
            } else {
                console.error(`❌ Error on ${photo.file}: ${err.message}`);
                break;
            }
        }
    }

    if (success && i < missing.length - 1) {
        await new Promise(r => setTimeout(r, DELAY_MS));
    }
}

console.log(`\n💾 Completed! All generated descriptions have been saved to assets/gallery-data.js`);

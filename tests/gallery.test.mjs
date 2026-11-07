import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import vm from 'node:vm';
import { createGalleryHandler } from '../api/gallery.js';
import { createUploadHandler } from '../api/upload.js';

process.env.ADMIN_PASSWORD = 'test-password-only';
const payload = Buffer.from(JSON.stringify({ expiresAt: Date.now() + 60000 })).toString('base64url');
const token = `${payload}.${crypto.createHmac('sha256', process.env.ADMIN_PASSWORD).update(payload).digest('base64url')}`;
const headers = { host: 'portfolio.test', origin: 'https://portfolio.test', authorization: `Bearer ${token}` };
function response() {
  return { code: 200, headers: {}, setHeader(k,v) { this.headers[k] = v; }, status(n) { this.code = n; return this; }, json(value) { this.body = value; return this; }, send(value) { this.body = value; return this; } };
}
const context = {window: {}};
vm.runInNewContext(fs.readFileSync(new URL('../assets/gallery-data.js', import.meta.url), 'utf8'), context);
const baseline = JSON.parse(JSON.stringify(context.window.galleryData));
function storage() {
  let saved = null;
  return {
    async findOne() { return saved; },
    async updateOne(filter, change, options) {
      if (saved?.revision === filter.revision) { saved = { _id: 'live', ...change.$set }; return { matchedCount: 1 }; }
      if (!saved && options.upsert) { saved = { _id: 'live', ...change.$set }; return { upsertedCount: 1 }; }
      if (saved && options.upsert) throw Object.assign(new Error('duplicate'), {code:11000});
      return { matchedCount: 0 };
    }
  };
}
test('publishing, reordering and deleting survive reload; stale tabs cannot overwrite', async () => {
  const db = storage(); const handler = createGalleryHandler(async () => db);
  const uploaded = { file:'new.webp', url:'https://example.public.blob.vercel-storage.com/new.webp', variants:{800:'https://example.public.blob.vercel-storage.com/new-800.webp'}, desc:'Caption <script>test</script>' };
  const data = structuredClone(baseline); data.highlights.unshift(uploaded);
  let res = response(); await handler({method:'POST',headers,body:{data,revision:null}},res);
  assert.equal(res.code,200); const revision = res.body.revision;
  res = response(); await handler({method:'GET',headers:{host:'portfolio.test'},query:{format:'js'}},res);
  assert.ok(!res.body.includes('<script>')); const page = {window:{}}; vm.runInNewContext(res.body,page);
  assert.equal(page.window.galleryData.highlights[0].url, uploaded.url);
  assert.equal(page.window.galleryData.highlights[0].desc, uploaded.desc);
  const stale = response(); await handler({method:'POST',headers,body:{data:baseline,revision:null}},stale); assert.equal(stale.code,409);
  const reordered = structuredClone(data); reordered.highlights.reverse(); reordered.drone.splice(0,1);
  res = response(); await handler({method:'POST',headers,body:{data:reordered,revision}},res); assert.equal(res.code,200);
  res = response(); await handler({method:'GET',headers:{},query:{}},res); assert.deepEqual(res.body.data,reordered);
});
test('missing database preserves static fallback and refuses publishing', async () => {
  const handler = createGalleryHandler(async () => { throw new Error('offline'); });
  const res = response(); await handler({method:'GET',headers:{},query:{format:'js'}},res);
  const page = {window:{galleryData:baseline}}; vm.runInNewContext(res.body,page);
  assert.equal(page.window.galleryData,baseline); assert.equal(page.window.galleryLiveAvailable,false);
  const post = response(); await handler({method:'POST',headers,body:{data:baseline,revision:null}},post); assert.equal(post.code,503);
});
test('Framed publishes up to 200 photos and refuses 201 without changing the live gallery', async () => {
  const db = storage(); const handler = createGalleryHandler(async () => db);
  const data = structuredClone(baseline);
  data.framed = Array.from({length:200}, (_, i) => ({file:`framed-${i}.jpg`}));
  const published = response();
  await handler({method:'POST',headers,body:{data,revision:null}},published);
  assert.equal(published.code,200);
  const overflow = structuredClone(data);
  overflow.framed.push({file:'overflow.jpg'});
  const rejected = response();
  await handler({method:'POST',headers,body:{data:overflow,revision:published.body.revision}},rejected);
  assert.equal(rejected.code,400);
  assert.match(rejected.body.error,/200 photos/);
  const live = response(); await handler({method:'GET',headers:{},query:{}},live);
  assert.equal(live.body.data.framed.length,200);
});
test('uploads and publishing require authentication, including localhost origins', async () => {
  for (const handler of [createGalleryHandler(), createUploadHandler()]) {
    const res = response(); await handler({method:'POST',headers:{host:'localhost',origin:'http://localhost'},body:{}},res); assert.equal(res.code,401);
    const cross = response(); await handler({method:'POST',headers:{...headers,origin:'https://attacker.test'},body:{}},cross); assert.equal(cross.code,403);
  }
});
test('upload validates content and sends bounded WebP bytes to public Blob storage', async () => {
  process.env.BLOB_READ_WRITE_TOKEN='test-only'; let stored;
  const handler = createUploadHandler(async (...args) => { stored=args; return {url:'https://example.public.blob.vercel-storage.com/image.webp'}; });
  const body = {category:'framed',filename:'photo.jpg',width:800,uploadId:'test-id',base64:Buffer.from('RIFF1234WEBPtest-image').toString('base64')};
  const res = response(); await handler({method:'POST',headers,body},res);
  assert.equal(res.code,200); assert.equal(res.body.success,true); assert.equal(stored[2].access,'public'); assert.ok(Buffer.isBuffer(stored[1]));
  for (const change of [{base64:Buffer.from('<svg />').toString('base64')},{category:'../../bad'},{width:999},{base64:'x'.repeat(2800001)}]) {
    const bad = response(); await handler({method:'POST',headers,body:{...body,...change}},bad); assert.equal(bad.code,400);
  }
});
test('public and admin scripts parse and Blob URL resolver preserves legacy paths', () => {
  for(const file of ['index.html','drone-shots.html','framed-moments.html','school-events.html','video-projects.html','admin/index.html']) {
    const html=fs.readFileSync(new URL(`../${file}`,import.meta.url),'utf8');
    for(const match of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) if(match[2].trim() && !match[1].includes('application/ld+json')) new vm.Script(match[2],{filename:file});
  }
  const page={}; vm.runInNewContext(fs.readFileSync(new URL('../assets/gallery-media.js',import.meta.url),'utf8'),page);
  assert.equal(page.galleryMediaURL({file:'old.jpg'},800,'legacy.webp'),'legacy.webp');
  assert.equal(page.galleryMediaURL({url:'large.webp',variants:{800:'small.webp'}},800,'legacy.webp'),'small.webp');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const script = fs.readFileSync(new URL('../assets/gallery-order.js', import.meta.url), 'utf8');
const photos = count => Array.from({ length: count }, (_, i) => ({ id: i, media: { file: `photo-${i}.jpg` } }));
const ids = list => Array.from(list, photo => photo.id);
function page(storage = new Map(), random = Math.random) {
  const context = vm.createContext({
    Math: Object.assign(Object.create(Math), { random }),
    sessionStorage: { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value) }
  });
  vm.runInContext(script, context);
  return context.shuffleGalleryPhotos;
}
const framed = { sessionKey: 'framed', maxPhotos: 200, limit: 72 };

test('Framed selects 72 unique photos from at most 200 without mutating the source', () => {
  const source = photos(210);
  const result = page(new Map(), () => 0)(source, 0, framed);
  assert.equal(result.length, 72);
  assert.equal(new Set(result).size, 72);
  assert.ok(result.every(photo => photo.id < 200));
  assert.deepEqual(ids(source), Array.from({ length: 210 }, (_, i) => i));
});

test('refresh and returning to Framed preserve selection; a fresh session shuffles again', () => {
  const storage = new Map();
  const source = photos(200);
  const first = page(storage, () => 0)(source, 0, framed);
  const refreshed = page(storage, () => 0.99)(source, 0, framed);
  assert.deepEqual(ids(refreshed), ids(first));
  const fresh = page(new Map(), () => 0.99)(source, 0, framed);
  assert.notDeepEqual(ids(fresh), ids(first));
});

test('Home preserves its first ten and gallery sessions stay independent', () => {
  const storage = new Map();
  const source = photos(40);
  const first = page(storage, () => 0)(source, 10, { sessionKey: 'highlights' });
  assert.deepEqual(ids(first.slice(0, 10)), ids(source.slice(0, 10)));
  page(storage)(source, 0, { sessionKey: 'drone' });
  assert.deepEqual(ids(page(storage)(source, 10, { sessionKey: 'highlights' })), ids(first));
});

test('published metadata changes use fresh records; removals and additions keep surviving order', () => {
  const storage = new Map();
  const source = photos(100);
  const first = page(storage)(source, 0, framed);
  const updated = source.filter(photo => photo.id !== first[0].id).map(photo => ({ ...photo, desc: 'Updated' }));
  updated.push({ id: 100, media: { file: 'new.jpg' }, desc: 'Updated' });
  const result = page(storage)(updated, 0, framed);
  assert.deepEqual(ids(result.slice(0, 71)), ids(first.slice(1)));
  assert.ok(result.every(photo => photo.desc === 'Updated'));
});

test('small collections, duplicate filenames, corrupt and unavailable storage keep photos usable', () => {
  for (const size of [0, 1, 10, 71, 72]) assert.equal(page()(photos(size), 0, framed).length, size);
  const source = photos(3).map(photo => ({ ...photo, media: { file: 'same.jpg' } }));
  const storage = new Map([['jcnino.gallery-order.v2.framed', '{invalid']]);
  const first = page(storage)(source, 0, framed);
  assert.equal(new Set(first).size, 3);
  assert.deepEqual(ids(page(storage)(source, 0, framed)), ids(first));
  const context = vm.createContext({ Math });
  vm.runInContext(script, context);
  assert.equal(context.shuffleGalleryPhotos(photos(100), 0, framed).length, 72);
});

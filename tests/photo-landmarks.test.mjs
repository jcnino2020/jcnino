import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createPhotoPlaceHandler, landmarkName, nearbyLandmark } from '../api/photo-place.js';

const temple = { name: 'Temple of Leah', category: 'tourism', place_rank: 30, lat: '10.3688795', lon: '123.8733158' };
test('GPS reverse lookup accepts close landmarks, rejects streets and distant features', () => {
  assert.equal(landmarkName(temple, 10.3688795, 123.8733158), 'Temple of Leah');
  assert.equal(landmarkName({ ...temple, category: 'highway' }, 10.3688795, 123.8733158), '');
  assert.equal(landmarkName({ ...temple, category: 'boundary', place_rank: 16 }, 10.3688795, 123.8733158), '');
  assert.equal(landmarkName(temple, 10, 123), '');
  assert.equal(landmarkName({}, 10, 123), '');
});

function response() {
  return { headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
}
test('endpoint validates GPS and shares/caches a concurrent reverse lookup', async () => {
  let calls = 0;
  const handler = createPhotoPlaceHandler(async (url, options) => {
    calls++;
    const query = options.body;
    assert.match(query.get('data'), /around:200,10\.36888,123\.87332/);
    return { ok: true, json: async () => ({ elements: [{ tags: { name: temple.name, tourism: 'theme_park' }, center: { lat: Number(temple.lat), lon: Number(temple.lon) } }] }) };
  });
  for (const query of [{}, { lat: '100', lon: '120' }, { lat: '', lon: '120' }]) {
    const res = response(); await handler({ method: 'GET', query }, res); assert.equal(res.code, 400);
  }
  const req = { method: 'GET', query: { lat: '10.3688795', lon: '123.8733158' } };
  const a = response(), b = response();
  await Promise.all([handler(req, a), handler(req, b)]);
  assert.equal(calls, 1); assert.equal(a.body.name, 'Temple of Leah'); assert.equal(b.body.name, a.body.name);
  assert.match(a.headers['Cache-Control'], /s-maxage/);
});

const source = fs.readFileSync('assets/portfolio.js', 'utf8');
const helpers = source.slice(source.indexOf('const photoLandmarkRequests'), source.indexOf('function compactPhotoPlace'));
test('landmarks populate safely and stay separate from the city; empty results stay hidden', async () => {
  const storage = new Map(); let calls = 0;
  const context = { Map, AbortSignal, sessionStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) }, fetch: async () => { calls++; return { ok: true, json: async () => ({ name: '<Temple of Leah>' }) }; } };
  vm.createContext(context); vm.runInContext(helpers, context);
  const landmark = { hidden: true, textContent: '' };
  const section = { querySelector: selector => selector === '.photo-location-map' ? { dataset: { lat: '10.3688795', lon: '123.8733158' } } : landmark };
  context.enrichPhotoLocations({ querySelectorAll: selector => { assert.equal(selector, '.photo-location[data-source="gps"]'); return [section]; } });
  await context.lookupPhotoLandmark('10.3688795', '123.8733158');
  await Promise.resolve();
  assert.equal(landmark.textContent, '<Temple of Leah>'); assert.equal(landmark.hidden, false);
  await context.lookupPhotoLandmark('10.3688795', '123.8733158'); assert.equal(calls, 1);
  context.fetch = async () => ({ ok: true, json: async () => ({ name: '' }) });
  assert.equal(await context.lookupPhotoLandmark('0', '0'), '');
});

test('hidden and approximate locations never opt into landmark lookup', () => {
  const context = {}; vm.createContext(context);
  vm.runInContext(fs.readFileSync('assets/gallery-media.js', 'utf8'), context);
  const photo = { gps: { latitude: 10.3688795, longitude: 123.8733158 } };
  assert.match(context.photoLocationDetails(photo), /data-source="gps"/);
  assert.equal(context.photoLocationDetails({ ...photo, locationVisibility: 'hidden' }), '');
  assert.doesNotMatch(context.photoLocationDetails({ ...photo, locationVisibility: 'approximate' }), /data-source="gps"/);
});

test('named landmark grounds take priority over a cafe inside them', () => {
  const point = { lat: 10.36888, lon: 123.87332 };
  const elements = [
    { ...point, tags: { name: 'Cafe', amenity: 'cafe' } },
    { center: point, bounds: { minlat: 10.3684, maxlat: 10.3693, minlon: 123.8729, maxlon: 123.8737 }, tags: { name: 'Temple of Leah', tourism: 'theme_park' } },
    { ...point, tags: { name: 'Roosevelt Drive', highway: 'residential' } }
  ];
  assert.equal(nearbyLandmark(elements, point.lat, point.lon), 'Temple of Leah');
  assert.equal(nearbyLandmark([], point.lat, point.lon), '');
});

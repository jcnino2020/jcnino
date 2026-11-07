import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync('assets/portfolio.js', 'utf8');
const helpers = source.slice(source.indexOf('function updatePhotoLocationSubtitle'), source.indexOf('function photoCameraDetails'));
const tick = () => new Promise(resolve => setImmediate(resolve));
function setup() {
  const requests = [];
  const storage = new Map();
  const context = { Map, AbortSignal, sessionStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) }, fetch: url => new Promise(resolve => requests.push({ url, reply: body => resolve({ ok: true, json: async () => body }) })) };
  vm.createContext(context); vm.runInContext(helpers, context);
  const subtitle = { textContent: 'Cebu City, Cebu', dataset: {}, classList: { add() {}, remove() {} }, setAttribute() {}, removeAttribute() {} };
  return { context, subtitle, requests, storage };
}
for (const landmarkFirst of [true, false]) test(`header retains GPS place and city when ${landmarkFirst ? 'landmark' : 'city'} finishes first`, async () => {
  const { context, subtitle, requests } = setup();
  context.updatePhotoLocationSubtitle(subtitle, { gps: { latitude: 10, longitude: 123 } });
  const landmark = requests.find(r => r.url.startsWith('/api/'));
  const city = requests.find(r => !r.url.startsWith('/api/'));
  const replies = [() => landmark.reply({ name: 'The CUBE' }), () => city.reply({ city: 'Cebu City', principalSubdivision: 'Central Visayas' })];
  if (!landmarkFirst) replies.reverse();
  replies[0](); await tick(); replies[1](); await tick();
  assert.equal(subtitle.textContent, 'The CUBE · Cebu City, Cebu');
});
test('cached city still gets a landmark and late replies cannot overwrite the next photo', async () => {
  const { context, subtitle, requests, storage } = setup();
  storage.set('photo-place:10.00000,123.00000', 'Cebu City, Cebu');
  context.updatePhotoLocationSubtitle(subtitle, { gps: { latitude: 10, longitude: 123 } });
  assert.equal(requests.length, 1);
  subtitle.textContent = 'Bacolod City, Negros Occidental';
  context.updatePhotoLocationSubtitle(subtitle, { locationVisibility: 'hidden' });
  requests[0].reply({ name: 'The CUBE' }); await tick();
  assert.equal(subtitle.textContent, '');
});
test('approximate privacy uses rounded coordinates and skips the landmark', () => {
  const { context, subtitle, requests } = setup();
  context.photoLocation = () => ({ lat: 10.37, lon: 123.87 });
  context.updatePhotoLocationSubtitle(subtitle, { locationVisibility: 'approximate', gps: { latitude: 10.3688795, longitude: 123.8733158 } });
  assert.equal(requests.length, 1);
  assert.match(requests[0].url, /latitude=10.37&longitude=123.87&/);
});

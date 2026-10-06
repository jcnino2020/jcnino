const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = name => fs.readFileSync(path.join(__dirname, '..', name), 'utf8');
const core = source('core.js');
const app = source('app.js');
const context = vm.createContext({});
vm.runInContext(core, context);
const h = context.Hydro;
assert.equal(h.snapshot('minoyan', 1).level, 3.8);
assert.equal(h.snapshot('mandalagan', 2).severity, 'rising');
assert.equal(h.snapshot('banago', 3).severity, 'high');
assert.equal(h.snapshot('dsb', 0).severity, 'routine');
assert.throws(() => h.snapshot('unknown', 0));
assert.throws(() => h.snapshot('minoyan', 4));
assert.throws(() => h.trace([1, NaN]));
assert.throws(() => h.trace([1, 6]));
assert.ok(h.trace([0, 5]).includes('620.0,48.0'));
assert.equal(h.report({ station: 'minoyan', type: 'Normal flow', level: '1.25' }, null, 123).createdAt, 123);
assert.equal(h.report({ station: 'minoyan', type: 'Normal flow', level: '' }).level, null);
for (const level of ['-1', '21', '1.234', 'NaN']) assert.throws(() => h.report({ station: 'minoyan', type: 'Normal flow', level }));
assert.throws(() => h.report({ station: 'minoyan', type: 'Normal flow', note: 'x'.repeat(501) }));
assert.throws(() => h.report({ station: 'minoyan', type: 'Normal flow', location: { latitude: 95, longitude: 1 } }));
assert.throws(() => h.report({ station: 'minoyan', type: 'Normal flow' }, { type: 'image/svg+xml', size: 100 }));
assert.throws(() => h.report({ station: 'minoyan', type: 'Normal flow' }, { type: 'image/jpeg', size: 6 * 1024 * 1024 }));

// DOM doubles validate behavior without browser access or rendered claims.
class Element {
  constructor() { this.dataset = {}; this.attributes = {}; this.listeners = {}; this.children = []; this.targets = {}; this.value = ''; this.checked = false; this.hidden = false; this.disabled = false; this.files = []; }
  set textContent(value) { this.text = String(value); }
  get textContent() { return this.text || ''; }
  setAttribute(key, value) { this.attributes[key] = value; }
  getAttribute(key) { return this.attributes[key]; }
  removeAttribute(key) { delete this.attributes[key]; }
  addEventListener(type, fn) { this.listeners[type] = fn; }
  fire(type, event = { preventDefault() {} }) { return this.listeners[type]?.(event); }
  append(...nodes) { this.children.push(...nodes); }
  appendChild(node) { this.children.push(node); }
  replaceChildren(...nodes) { this.children = nodes; }
  querySelector(selector) { return this.targets[selector] || null; }
  closest() { return this.dialog; }
  showModal() { this.open = true; }
  close() { this.open = false; this.fire('close'); }
  click() { this.fire('click'); }
  remove() {}
}
function setup(view, store) {
  const targets = {}, lists = {};
  const add = selector => targets[selector] = new Element();
  add('[data-device-time]');
  const document = { body: new Element(), hidden: false, listeners: {},
    querySelector: selector => targets[selector] || null,
    querySelectorAll: selector => lists[selector] || [],
    createElement: () => new Element(),
    addEventListener(type, fn) { this.listeners[type] = fn; } };
  document.body.dataset.view = view;
  const timers = new Map(), urls = new Map();
  let timerId = 0, urlId = 0, clock = Date.UTC(2026, 9, 6, 12);
  class DeviceDate extends Date { constructor(...args) { super(...(args.length ? args : [clock])); } static now() { return clock; } }
  const geo = {};
  const sandbox = vm.createContext({ document, Date: DeviceDate, Blob,
    HydroStore: store, localStorage: { getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); } },
    navigator: { geolocation: { getCurrentPosition(ok, error) { geo.ok = ok; geo.error = error; } } },
    crypto: { randomUUID: () => 'report-' + ++urlId },
    URL: { createObjectURL(blob) { const url = 'blob:' + ++urlId; urls.set(url, blob); return url; }, revokeObjectURL(url) { urls.delete(url); } },
    setInterval(fn) { timers.set(++timerId, fn); return timerId; }, clearInterval(id) { timers.delete(id); }, setTimeout() {} });
  vm.runInContext(core, sandbox);
  return { targets, lists, add, document, timers, urls, geo, boot: () => vm.runInContext(app, sandbox),
    advance: () => { clock += 1000; }, get: selector => targets[selector] };
}
function testScenario(view) {
  const s = setup(view);
  for (const key of ['scenario-announcement', 'selected-name', 'selected-place', 'selected-level', 'selected-rain']) s.add('[data-' + key + ']');
  s.lists['input[name="scenario"]'] = [0, 1, 2, 3].map(value => { const e = new Element(); e.value = String(value); return e; });
  s.lists['[data-node]'] = ['minoyan', 'mandalagan', 'banago'].map(id => { const e = new Element(); e.dataset.node = id; return e; });
  if (view === 'monitor') {
    for (const key of ['run', 'reset', 'run-state', 'events', 'selected-status', 'trace', 'area', 'trace-dot']) s.add('[data-' + key + ']');
    s.add('#chart-description');
    s.lists['[data-station]'] = ['minoyan', 'mandalagan', 'banago', 'dsb'].map(id => {
      const e = new Element(); e.dataset.station = id;
      e.targets['[data-level]'] = new Element(); e.targets['[data-status]'] = new Element(); return e;
    });
  } else {
    for (const key of ['advisory', 'advisory-status', 'advisory-title', 'advisory-text', 'community-level', 'station-table', 'check-progress']) s.add('[data-' + key + ']');
    s.lists['[data-check]'] = Array.from({ length: 6 }, () => new Element());
  }
  s.boot();
  const clockText = s.get('[data-device-time]').textContent;
  s.advance(); Array.from(s.timers.values())[0]();
  assert.notEqual(s.get('[data-device-time]').textContent, clockText);
  if (view === 'monitor') {
    const run = s.get('[data-run]');
    run.fire('click');
    const tick = Array.from(s.timers.values()).at(-1);
    tick(); tick(); tick();
    assert.equal(run.attributes['aria-pressed'], 'false');
    assert.equal(s.get('[data-run-state]').textContent, 'Complete');
    assert.equal(s.get('[data-events]').children.length, 4);
    s.lists['[data-station]'][1].fire('click');
    assert.equal(s.get('[data-selected-level]').textContent, '2.9 m');
    assert.equal(s.get('[data-selected-status]').dataset.severity, 'high');
    run.fire('click');
    assert.equal(s.get('[data-events]').children.length, 1);
    s.document.hidden = true; s.document.listeners.visibilitychange();
    assert.equal(s.get('[data-run-state]').textContent, 'Paused');
    s.get('[data-reset]').fire('click');
    assert.equal(s.get('[data-selected-level]').textContent, '0.8 m');
    s.lists['input[name="scenario"]'][2].fire('change');
    assert.equal(s.get('[data-selected-level]').textContent, '1.8 m');
  } else {
    s.lists['input[name="scenario"]'][3].fire('change');
    assert.ok(s.get('[data-advisory-text]').textContent.includes('not an evacuation order'));
    assert.equal(s.get('[data-community-level]').textContent, '2.9 m');
    assert.equal(s.get('[data-station-table]').children.length, 4);
    s.lists['[data-check]'][0].checked = true; s.lists['[data-check]'][0].fire('change');
    assert.equal(s.get('[data-check-progress]').textContent, '1 / 6 packed');
  }
}
const flush = () => new Promise(resolve => setImmediate(resolve));
async function testReports() {
  let saved = [], failSave = false, failClear = false, holdSave = null;
  const store = { list: async () => saved, save: async record => { if (failSave) throw Error('Storage failed'); if (holdSave) await holdSave; saved.push(record); }, clear: async () => { if (failClear) throw Error('Storage failed'); saved = []; } };
  const s = setup('field', store);
  for (const key of ['report-form', 'save', 'form-status', 'confirm-dialog', 'detail-dialog', 'clear-dialog', 'detail-title', 'detail-id', 'detail-fields', 'detail-note', 'detail-photo', 'reports', 'filter', 'export', 'clear', 'storage-state', 'photo-preview', 'location', 'clear-location', 'location-status', 'confirm-save', 'clear-check', 'confirm-clear']) s.add('[data-' + key + ']');
  const photo = s.add('#photo');
  const form = s.get('[data-report-form]');
  form.elements = Object.fromEntries(['station', 'type', 'level', 'note'].map(key => [key, new Element()]));
  form.elements.station.value = 'minoyan'; form.elements.type.value = 'Normal flow';
  form.reset = () => { form.elements.type.value = 'Normal flow'; form.elements.level.value = ''; form.elements.note.value = ''; photo.files = []; };
  s.get('[data-filter]').value = 'all';
  s.boot(); await flush();
  assert.equal(s.get('[data-save]').disabled, false);
  assert.ok(s.get('[data-reports]').children[0].textContent.includes('No local'));
  form.elements.note.value = '<img src=x onerror=alert(1)>';
  photo.files = [new Blob(['photo'], { type: 'image/jpeg' })];
  photo.fire('change');
  assert.equal(s.get('[data-photo-preview]').hidden, false);
  s.get('[data-location]').fire('click');
  s.geo.error({ code: 1 });
  assert.ok(s.get('[data-location-status]').textContent.includes('permission denied'));
  s.get('[data-location]').fire('click'); s.geo.ok({ coords: { latitude: 10.6, longitude: 123.0 } });
  form.fire('submit'); await flush();
  assert.equal(saved.length, 1);
  assert.equal(saved[0].location.latitude, 10.6);
  assert.ok(saved[0].photo instanceof Blob);
  assert.ok(s.get('[data-form-status]').textContent.includes('Not sent'));
  s.get('[data-reports]').children[0].children[1].fire('click');
  assert.equal(s.get('[data-detail-note]').textContent, '<img src=x onerror=alert(1)>');
  assert.equal(s.get('[data-detail-note]').children.length, 0);
  s.get('[data-detail-dialog]').close();
  form.elements.type.value = 'High water'; form.fire('submit'); await flush();
  assert.equal(saved.length, 1);
  assert.equal(s.get('[data-confirm-dialog]').open, true);
  s.get('[data-confirm-save]').fire('click'); await flush();
  assert.equal(saved.length, 2);
  failSave = true; form.elements.note.value = 'Keep this note'; form.fire('submit'); await flush();
  assert.equal(form.elements.note.value, 'Keep this note');
  assert.equal(s.get('[data-form-status]').dataset.error, 'true');
  failSave = false;
  let release;
  holdSave = new Promise(resolve => { release = resolve; });
  form.fire('submit'); form.fire('submit');
  release(); await flush(); holdSave = null;
  assert.equal(saved.length, 3);
  s.get('[data-export]').fire('click');
  const exportBlob = Array.from(s.urls.values()).at(-1);
  const exported = JSON.parse(await exportBlob.text());
  assert.equal(exported.prototype, true);
  assert.equal(exported.reports.length, 3);
  assert.equal(exported.reports[2].photoAttached, true);
  assert.equal(exported.reports[0].photo, undefined);
  s.get('[data-clear]').fire('click');
  assert.equal(s.get('[data-confirm-clear]').disabled, true);
  s.get('[data-clear-check]').checked = true; s.get('[data-clear-check]').fire('change');
  failClear = true; await s.get('[data-confirm-clear]').fire('click');
  assert.equal(saved.length, 3);
  failClear = false; s.get('[data-clear]').fire('click');
  s.get('[data-clear-check]').checked = true; s.get('[data-clear-check]').fire('change');
  await s.get('[data-confirm-clear]').fire('click');
  assert.equal(saved.length, 0);
  assert.equal(s.get('[data-export]').disabled, true);
}
async function testStorage() {
  let openRequest, transaction, operation, opens = 0;
  const database = { objectStoreNames: { contains: () => true }, close() {},
    transaction() { transaction = { objectStore() { return { getAll() { operation = {}; return operation; }, put() { operation = {}; return operation; }, clear() { operation = {}; return operation; } }; } }; return transaction; } };
  const sandbox = vm.createContext({ indexedDB: { open() { opens++; openRequest = {}; return openRequest; } } });
  vm.runInContext(source('storage.js'), sandbox);
  const list = sandbox.HydroStore.list();
  openRequest.result = database; openRequest.onsuccess();
  await Promise.resolve(); await Promise.resolve();
  operation.result = []; operation.onsuccess(); transaction.oncomplete();
  assert.equal((await list).length, 0);
  let completed = false;
  const save = sandbox.HydroStore.save({ id: 'a' }).then(() => { completed = true; });
  await Promise.resolve(); await Promise.resolve();
  operation.result = 'a'; operation.onsuccess();
  await Promise.resolve(); assert.equal(completed, false);
  transaction.oncomplete(); await save; assert.equal(completed, true);
  const clear = sandbox.HydroStore.clear();
  await Promise.resolve(); await Promise.resolve();
  transaction.onabort(); await assert.rejects(clear);
  assert.equal(opens, 1);
  const unavailable = vm.createContext({});
  vm.runInContext(source('storage.js'), unavailable);
  await assert.rejects(unavailable.HydroStore.list());
}
(async () => {
  testScenario('monitor'); testScenario('community');
  await testReports(); await testStorage();
  console.log('Passed: synthetic scenario, replay/reset, station traces, checklist, local reports/photos, GPS errors, duplicate-save guard, export, clear, and storage commit/errors.');
})().catch(error => { console.error(error); process.exitCode = 1; });

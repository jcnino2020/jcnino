const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const core = fs.readFileSync(path.join(__dirname, '../core.js'), 'utf8');
const app = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');
const context = vm.createContext({});
vm.runInContext(core, context);
const t = context.TimeLab;
assert.equal(t.inspect('2147483647').interpreted, '2038-01-19 03:14:07 UTC');
const overflow = t.inspect('2147483648');
assert.equal(overflow.interpreted, '1901-12-13 20:45:52 UTC');
assert.equal(overflow.intended, '2038-01-19 03:14:08 UTC');
assert.equal(overflow.signed, -2147483648n);
assert.equal(overflow.bits, '1' + '0'.repeat(31));
assert.equal(t.flip(0n, 31), -2147483648n);
assert.equal(t.flip(-2147483648n, 31), 0n);
assert.equal(t.inspect(-1n).hex, '0xFFFFFFFF');
assert.equal(t.inspect(-2147483649n).signed, 2147483647n);
assert.equal(t.inspect(t.MAX64).raw, 9223372036854775807n);
assert.equal(t.inspect(t.MAX64).intended, null);
assert.equal(t.inspect(t.MIN64).signed, 0n);
assert.equal(t.inspect(4294967296n).signed, 0n);
assert.equal(t.utc(0n), '1970-01-01 00:00:00 UTC');
assert.equal(t.countdown(Number(t.BOUNDARY) * 1000 - 1), 1);
assert.equal(t.countdown(Number(t.BOUNDARY) * 1000), 0);
for (const value of ['', '1.5', 'NaN', '1e9', '9223372036854775808', '-9223372036854775809', '1,000']) {
  assert.throws(() => t.parse(value));
}
assert.throws(() => t.flip(0n, 32));

// A small DOM double exercises state transitions without browser access.
class Element {
  constructor() { this.dataset = {}; this.attributes = {}; this.listeners = {}; this.children = []; this.textContent = ''; }
  addEventListener(type, fn) { this.listeners[type] = fn; }
  setAttribute(key, value) { this.attributes[key] = value; }
  getAttribute(key) { return this.attributes[key]; }
  removeAttribute(key) { delete this.attributes[key]; }
  append(...elements) { this.children.push(...elements); }
  appendChild(element) { this.children.push(element); }
  get firstElementChild() { return this.children[0]; }
  querySelector(selector) { return this.elements[selector]; }
  querySelectorAll() { return this.actions; }
  fire(type) { this.listeners[type](); }
}
function runUI(full) {
  const theme = new Element();
  theme.elements = { i: new Element() };
  const lab = new Element();
  const selectors = ['timestamp', 'error', 'signed', 'state', 'bits', 'announcement', 'intended', 'interpreted', 'hex', 'wide', 'explanation'];
  if (full) selectors.push('range', 'range-note');
  lab.elements = Object.fromEntries(selectors.map(key => ['[data-' + key + ']', new Element()]));
  lab.actions = ['now', 'epoch', 'last', 'overflow', 'back', 'forward', ...(full ? ['play'] : [])].map(action => {
    const button = new Element(); button.dataset.action = action; return button;
  });
  const play = lab.actions.find(button => button.dataset.action === 'play');
  lab.elements['[data-action="play"]'] = play || null;
  const remaining = new Element();
  const document = { documentElement: new Element(), hidden: false, listeners: {},
    querySelector: selector => ({ '[data-theme-toggle]': theme, '[data-countdown]': remaining, '[data-lab]': lab })[selector],
    createElement: () => new Element(), addEventListener(type, fn) { this.listeners[type] = fn; } };
  const timers = new Map();
  let id = 0;
  const sandbox = vm.createContext({ document, localStorage: { getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); } },
    setInterval(fn) { timers.set(++id, fn); return id; }, clearInterval(key) { timers.delete(key); } });
  vm.runInContext(core, sandbox);
  vm.runInContext(app, sandbox);
  const get = key => lab.elements['[data-' + key + ']'];
  const action = name => lab.actions.find(button => button.dataset.action === name).fire('click');
  const enter = value => { get('timestamp').value = value; get('timestamp').fire('input'); };
  assert.equal(get('bits').children.length, 32);
  assert.equal(get('signed').textContent, '2,147,483,647');
  action('forward');
  assert.equal(get('signed').textContent, '-2,147,483,648');
  assert.equal(lab.dataset.overflow, 'true');
  assert.ok(get('announcement').textContent.includes('1901'));
  action('back');
  assert.equal(lab.dataset.overflow, 'false');
  enter('-1');
  assert.equal(get('hex').textContent, '0xFFFFFFFF');
  get('bits').children[0].fire('click');
  assert.equal(get('timestamp').value, '2147483647');
  enter('not a number');
  assert.equal(get('timestamp').attributes['aria-invalid'], 'true');
  assert.ok(get('error').textContent);
  action('epoch');
  assert.equal(get('timestamp').value, '0');
  assert.equal(get('error').textContent, '');
  enter('9223372036854775807');
  assert.equal(get('wide').textContent, '9,223,372,036,854,775,807');
  assert.ok(get('intended').textContent.includes('calendar range'));
  if (full) {
    assert.equal(get('range').disabled, true);
    action('last');
    assert.equal(get('range').disabled, false);
    get('range').value = '-2147483648';
    get('range').fire('input');
    assert.equal(lab.dataset.overflow, 'false');
    action('play');
    assert.equal(play.attributes['aria-pressed'], 'true');
    const playback = Array.from(timers.values()).at(-1);
    for (let i = 0; i < 7; i++) playback();
    assert.equal(play.attributes['aria-pressed'], 'false');
    assert.equal(get('timestamp').value, '2147483651');
    action('play');
    document.hidden = true;
    document.listeners.visibilitychange();
    assert.equal(play.attributes['aria-pressed'], 'false');
  }
  theme.fire('click');
  assert.equal(document.documentElement.dataset.theme, 'dark');
}
runUI(false);
runUI(true);
console.log('Passed: domain boundaries, exact integers, bits, presets, range, validation, playback, and blocked theme storage.');

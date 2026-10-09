const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const pages = ['index', 'analytics', 'backups', 'security', 'settings'];
const stylesheet = fs.readFileSync(path.join(root, 'workspace.css'), 'utf8');

for (const page of pages) {
  const source = fs.readFileSync(path.join(root, `${page}.html`), 'utf8');
  assert.match(source, /href="\/admin\/workspace\.css"/, `${page}: shared redesign`);
  assert.match(source, /class="admin-header"/, `${page}: header`);
  assert.match(source, /class="admin-sidebar"/, `${page}: sidebar`);
  assert.match(source, /class="admin-main"/, `${page}: workspace`);
  assert.match(source, /<div class="sidebar-section-title">Library<\/div>/, `${page}: library navigation`);
  assert.match(source, /<div class="sidebar-section-title">Insights<\/div>/, `${page}: insights navigation`);
  assert.match(source, /<div class="sidebar-section-title">Site<\/div>/, `${page}: site navigation`);

  for (const match of source.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)) {
    if (match[1].trim()) new vm.Script(match[1], { filename: `${page}.html` });
  }
}

assert.match(stylesheet, /@media \(max-width: 640px\)/, 'mobile adaptation');
assert.match(stylesheet, /prefers-reduced-motion/, 'reduced motion');
assert.match(stylesheet, /:focus-visible/, 'keyboard focus');

const overview = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
assert.doesNotMatch(overview, /2840|1420|4800|18\.4%|12\.8%|24\.1%|8\.6%|\b195\b/, 'no fabricated analytics values');
assert.match(overview, /No active locations in the last 15 minutes/, 'honest live empty state');
assert.match(overview, /No revisions yet/, 'honest activity empty state');
console.log(`${pages.length} admin pages passed workspace checks`);

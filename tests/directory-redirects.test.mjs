import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const config = JSON.parse(readFileSync(join(root, 'vercel.json'), 'utf8'));
const redirects = new Map(config.redirects.map(({ source, destination, permanent }) => {
  assert.equal(permanent, true, `${source} should be permanent`);
  return [source.replace(/\\\+/g, '+'), destination];
}));

function checkDirectories(directory, route = '') {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    const childRoute = `${route}/${entry.name}`;
    const childDirectory = join(directory, entry.name);
    if (existsSync(join(childDirectory, 'index.html'))) {
      assert.equal(redirects.get(childRoute), `${childRoute}/`, `${childRoute} needs its canonical slash redirect`);
    }
    checkDirectories(childDirectory, childRoute);
  }
}

checkDirectories(root);
assert.equal(redirects.size, config.redirects.length, 'redirect sources must be unique');
for (const source of redirects.keys()) {
  assert.ok(existsSync(join(root, source.slice(1), 'index.html')), `${source} must serve an index.html`);
}
console.log(`Checked ${redirects.size} directory homepage redirects`);

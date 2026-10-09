const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const pages = ['index.html', 'academics.html', 'admissions.html', 'research.html', 'campus-life.html', 'article.html'];

for (const page of pages) {
  const source = fs.readFileSync(path.join(root, page), 'utf8');
  assert.match(source, /<main id="main">/, `${page}: main landmark`);
  assert.match(source, /id="site-header"/, `${page}: shared header`);
  assert.match(source, /id="site-footer"/, `${page}: shared footer`);
  assert.match(source, /<title>[^<]+<\/title>/, `${page}: title`);
  assert.doesNotMatch(source, /Newsreader|fonts\.googleapis\.com|fonts\.gstatic\.com/, `${page}: local sans-serif typography`);
  assert.doesNotMatch(source, /href="#"/, `${page}: dead link`);
  assert.doesNotMatch(source, /gnet\.ph\/auth|2025 admission/i, `${page}: stale application content`);

  for (const match of source.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const url = match[1];
    if (/^(https?:|mailto:|#)/.test(url)) continue;
    assert.ok(fs.existsSync(path.resolve(root, decodeURIComponent(url))), `${page}: missing ${url}`);
  }
  for (const match of source.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) {
    assert.match(match[0], /rel="noopener noreferrer"/, `${page}: secure external link`);
  }
}

const script = fs.readFileSync(path.join(root, 'site.js'), 'utf8');
const stylesheet = fs.readFileSync(path.join(root, 'style.css'), 'utf8');
assert.doesNotMatch(stylesheet, /Newsreader|Georgia|(?<!sans-)serif\b/, 'USLS uses sans-serif typography throughout');
assert.match(script, /aria-expanded/, 'mobile menu accessibility');
assert.match(script, /aria-selected/, 'tab accessibility');
assert.match(script, /Independent website redesign concept/, 'concept disclosure');
console.log(`${pages.length} USLS pages passed static checks`);

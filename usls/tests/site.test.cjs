const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const pages = [
  'index.html', 'about.html', 'academics.html', 'programs.html',
  'basic-education.html', 'graduate-studies.html', 'admissions.html',
  'scholarships.html', 'campus-life.html', 'student-services.html',
  'mission.html', 'research.html', 'news.html', 'article.html', 'contact.html'
];

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
    if (/^(https?:|mailto:|tel:)/.test(url)) continue;
    const [pathname, fragment] = decodeURIComponent(url).split('#');
    const target = pathname ? path.resolve(root, pathname) : path.join(root, page);
    assert.ok(fs.existsSync(target), `${page}: missing ${url}`);
    if (fragment && target.endsWith('.html')) {
      const destination = fs.readFileSync(target, 'utf8');
      assert.ok(destination.includes(`id="${fragment}"`), `${page}: missing anchor ${url}`);
    }
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

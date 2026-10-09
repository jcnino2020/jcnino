const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const html = fs.readFileSync(path.join(root, 'projects/index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'projects/style.css'), 'utf8');
const accents = new Map([...css.matchAll(/\.project-card\[href="([^"]+)"\]\s*\{\s*--project-accent:\s*(#[0-9a-f]{6});\s*\}/gi)].map(match => [match[1], match[2]]));
const theme = fs.readFileSync(path.join(root, 'assets/portfolio.css'), 'utf8');
const token = name => theme.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, 'i'))[1];
const rgb = hex => hex.slice(1).match(/../g).map(value => parseInt(value, 16) / 255);
const mix = (accent, amount, base) => accent.map((channel, i) => channel * amount + base[i] * (1 - amount));
const luminance = color => color.map(channel => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4).reduce((sum, channel, i) => sum + channel * [0.2126, 0.7152, 0.0722][i], 0);
const contrast = (a, b) => (Math.max(luminance(a), luminance(b)) + 0.05) / (Math.min(luminance(a), luminance(b)) + 0.05);
for (const [href, hex] of accents) {
    const accent = rgb(hex);
    for (const amount of [0.05, 0.1]) {
        const surface = mix(accent, amount, rgb(token('surface')));
        assert.ok(contrast(rgb(token('text-muted')), surface) >= 4.5, `Body contrast: ${href}`);
        assert.ok(contrast(accent, mix(accent, 0.12, surface)) >= 3, `Icon contrast: ${href}`);
    }
}
const cards = [...html.matchAll(/<a href="([^"]+)" class="project-card group"([^>]*)>/g)];
const links = cards.map(match => match[1]);
for (const [tag, href] of cards) {
    assert.match(tag, /target="_blank"/, `Must open in a new tab: ${href}`);
    assert.match(tag, /rel="noopener noreferrer"/, `Missing new-tab protection: ${href}`);
}
assert.equal(new Set(links).size, links.length, 'Project links must be unique');

// Support directories and saved third-party resources are not standalone sites.
const excluded = new Set(['assets', 'images', 'api', 'functions', 'packages', 'scripts', 'projects', 'gnet/files']);
const sites = [];
function discover(relative = '') {
    for (const entry of fs.readdirSync(path.join(root, relative), { withFileTypes: true })) {
        if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
        const folder = relative ? `${relative}/${entry.name}` : entry.name;
        if (excluded.has(folder)) continue;
        if (fs.existsSync(path.join(root, folder, 'index.html'))) sites.push(folder);
        discover(folder);
    }
}
discover();
for (const folder of sites) {
    assert.ok(links.includes(`../${folder}/`), `Missing project: ${folder}`);
    const accent = accents.get(`../${folder}/`);
    assert.ok(accent && accent.toLowerCase() !== '#ffffff', `Missing colored accent: ${folder}`);
}
for (const href of links) {
    assert.ok(fs.existsSync(path.resolve(root, 'projects', href, 'index.html')), `Missing entry page: ${href}`);
}
assert.ok(links.includes('../'), 'Main portfolio link must be preserved');
console.log(`Passed: ${sites.length} colored standalone subfolder sites and the main portfolio are linked, with no duplicates or missing entry pages.`);

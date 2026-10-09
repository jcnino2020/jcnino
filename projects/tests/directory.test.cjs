const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const html = fs.readFileSync(path.join(root, 'projects/index.html'), 'utf8');
const links = [...html.matchAll(/<a href="([^"]+)" class="project-card group">/g)].map(match => match[1]);
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
}
for (const href of links) {
    assert.ok(fs.existsSync(path.resolve(root, 'projects', href, 'index.html')), `Missing entry page: ${href}`);
}
assert.ok(links.includes('../'), 'Main portfolio link must be preserved');
console.log(`Passed: ${sites.length} standalone subfolder sites and the main portfolio are linked, with no duplicates or missing entry pages.`);

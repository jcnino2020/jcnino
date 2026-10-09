const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const core = fs.readFileSync(path.join(root, 'core.js'), 'utf8');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');

function artwork(id, title, imageId = `image-${id}`) {
  return {
    id, title, image_id: imageId,
    thumbnail: { alt_text: `${title} artwork` },
    artist_display: `Artist ${id}\nChicago`, date_display: '1901',
    artwork_type_title: 'Painting', credit_line: 'Museum collection'
  };
}

function response(data, page = 1, totalPages = 1) {
  return { ok: true, json: async () => ({ data, pagination: { current_page: page, total_pages: totalPages }, config: { iiif_url: 'https://www.artic.edu/iiif/2' } }) };
}

function setup(fetcher) {
  const dom = new JSDOM(html, { url: 'http://localhost:8765/jsonfeed/', runScripts: 'outside-only' });
  const { window } = dom;
  const dialog = window.document.getElementById('art-dialog');
  dialog.showModal = function () { this.open = true; };
  dialog.close = function () { this.open = false; this.dispatchEvent(new window.Event('close')); };
  window.fetch = fetcher;
  window.eval(core);
  window.eval(app);
  return window;
}

const tick = () => new Promise(resolve => setTimeout(resolve, 0));

(async () => {
  const calls = [];
  const window = setup(async url => {
    calls.push(new URL(url));
    const page = Number(new URL(url).searchParams.get('page'));
    return page === 1 ? response([artwork(1, 'Cat with a <script>tag</script>'), artwork(2, 'Quiet Cat')], 1, 2) : response([artwork(3, 'Third Cat', '')], 2, 2);
  });
  const doc = window.document;
  await tick();
  assert.equal(doc.querySelectorAll('.work-card').length, 2);
  assert.equal(doc.querySelector('script:not([src])'), null, 'API text is not parsed as markup');
  assert.match(doc.querySelector('.work-title').textContent, /<script>tag<\/script>/);
  assert.equal(calls[0].searchParams.get('q'), 'cats');
  assert.equal(calls[0].searchParams.get('query[term][is_public_domain]'), 'true');
  assert.equal(doc.getElementById('gallery').getAttribute('aria-busy'), 'false');

  doc.querySelector('.work-open').click();
  assert.equal(doc.getElementById('art-dialog').open, true);
  assert.match(doc.getElementById('dialog-source').href, /artworks\/1$/);
  doc.getElementById('dialog-next').click();
  assert.equal(doc.getElementById('dialog-title').textContent, 'Quiet Cat');
  doc.getElementById('dialog-save').click();
  assert.equal(doc.getElementById('saved-count').textContent, '1');
  assert.equal(JSON.parse(window.localStorage.getItem('feline-archive-saved-v1'))[0].id, 2);
  doc.getElementById('dialog-close').click();
  assert.equal(doc.activeElement.dataset.workId, '1', 'dialog returns focus to its triggering tile after save');
  doc.getElementById('saved-tab').click();
  assert.equal(doc.querySelectorAll('.work-card').length, 1);

  doc.getElementById('search-input').value = 'no match';
  doc.getElementById('search-form').dispatchEvent(new window.Event('submit', { cancelable: true }));
  assert.match(doc.querySelector('.gallery-message h3').textContent, /No saved matches/);
  doc.getElementById('all-tab').click();
  await tick();
  assert.equal(calls[1].searchParams.get('q'), 'cats no match', 'switching to All fetches the saved-view query');

  doc.getElementById('search-input').value = '';
  doc.getElementById('search-form').dispatchEvent(new window.Event('submit', { cancelable: true }));
  await tick();
  doc.getElementById('load-more').click();
  await tick();
  assert.equal(doc.querySelectorAll('.work-card').length, 3);
  assert.equal(doc.getElementById('load-more').hidden, true);
  doc.querySelectorAll('.work-open')[2].click();
  assert.match(doc.getElementById('dialog-image-wrap').textContent, /Image unavailable/);
  window.close();

  let shouldFail = true;
  const failureWindow = setup(async () => {
    if (shouldFail) throw new Error('Network down');
    return response([artwork(4, 'Recovered Cat')]);
  });
  await tick();
  assert.match(failureWindow.document.querySelector('.gallery-message h3').textContent, /did not load/);
  shouldFail = false;
  failureWindow.document.querySelector('.gallery-message button').click();
  await tick();
  assert.equal(failureWindow.document.querySelectorAll('.work-card').length, 1);
  failureWindow.close();

  const raceCalls = [];
  let finishFirstFetch;
  const firstFetch = new Promise(resolve => { finishFirstFetch = resolve; });
  const raceWindow = setup(url => {
    raceCalls.push(new URL(url));
    return raceCalls.length === 1 ? firstFetch : Promise.resolve(response([artwork(6, 'Japanese Cat')]));
  });
  const raceDoc = raceWindow.document;
  raceDoc.getElementById('saved-tab').click();
  raceDoc.getElementById('search-input').value = 'Japan';
  raceDoc.getElementById('search-form').dispatchEvent(new raceWindow.Event('submit', { cancelable: true }));
  finishFirstFetch(response([artwork(5, 'Old Cat')]));
  await tick();
  raceDoc.getElementById('all-tab').click();
  await tick();
  assert.equal(raceCalls[1].searchParams.get('q'), 'cats Japan', 'All refetches after an in-flight Saved search');
  assert.equal(raceDoc.querySelector('.work-title').textContent, 'Japanese Cat');
  raceWindow.close();

  console.log('Passed: live search, safe artwork text, pagination, detail navigation, local saves, saved search, focus return, query race, missing images, and retry.');
})().catch(error => { console.error(error); process.exitCode = 1; });

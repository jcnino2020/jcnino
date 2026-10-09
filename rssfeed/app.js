(function () {
  'use strict';
  const R = window.VoxReader;
  const $ = id => document.getElementById(id);
  const create = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  };
  const icon = name => { const node = create('i', name); node.setAttribute('aria-hidden', 'true'); return node; };
  const KEY = 'vox-reader-saved-v1';
  let saved = [], latest = [], current = null, view = 'latest', loading = false, failed = false, toastTimer;
  function requestedLink() {
    try { return decodeURIComponent(location.hash.replace(/^#story=/, '')); } catch { return ''; }
  }
  function notify(message) {
    $('notice').textContent = message; $('notice').hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { $('notice').hidden = true; }, 7000);
  }
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) || '[]');
    if (!Array.isArray(stored)) throw new Error('Invalid saved collection');
    saved = stored.slice(0, 60).map(R.story).filter(Boolean);
    saved = [...new Map(saved.map(item => [item.link, item])).values()];
  } catch { notify('Saved stories could not be loaded. Browser storage may be unavailable.'); }
  try {
    const size = localStorage.getItem('vox-reader-size');
    if (['16', '18', '20'].includes(size)) { $('text-size').value = size; document.documentElement.style.setProperty('--reading-size', size + 'px'); }
  } catch {}
  const isSaved = item => saved.some(story => story.link === item.link);
  function bookmark(button, item) {
    const active = isSaved(item);
    button.replaceChildren(icon(active ? 'ri-bookmark-fill' : 'ri-bookmark-line'));
    button.setAttribute('aria-pressed', String(active));
    button.setAttribute('aria-label', (active ? 'Remove saved story: ' : 'Save story: ') + item.title);
    button.title = active ? 'Remove saved story' : 'Save story';
  }
  function toggleSave(item, focusLink) {
    const active = isSaved(item);
    if (!active && saved.length >= 60) { notify('Your collection has 60 stories. Remove one before saving another.'); return; }
    const next = active ? saved.filter(story => story.link !== item.link) : [item, ...saved];
    try { localStorage.setItem(KEY, JSON.stringify(next)); }
    catch { notify('Could not save changes. Browser storage may be full or blocked. Your collection is unchanged.'); return; }
    saved = next;
    render();
    if (current) bookmark($('save'), current);
    if (focusLink) {
      const row = Array.from($('stories').children).find(node => node.dataset.link === focusLink);
      (row?.querySelector('.icon-button') || $(view)).focus();
    }
    notify(active ? 'Removed from saved stories.' : 'Story saved in this browser. Images still require an internet connection.');
  }
  function progress() {
    const scroll = $('reading-scroll');
    const total = scroll.scrollHeight - scroll.clientHeight;
    $('reading-progress').firstElementChild.style.width = (total > 0 ? Math.min(100, scroll.scrollTop / total * 100) : 100) + '%';
  }
  function open(item, reveal = true, writeHash = true) {
    current = item;
    $('article-title').textContent = item.title;
    $('article-meta').textContent = item.categories.slice(0, 2).join(' / ') || 'Vox / RSS edition';
    $('article-byline').textContent = item.author + ' · ' + R.date(item.published);
    $('article-content').innerHTML = R.clean(item.content, item.link);
    if (!$('article-content').textContent.trim() && !$('article-content').querySelector('img')) {
      $('article-content').append(create('p', '', 'This feed entry does not include article text. Read the original on Vox.'));
    }
    $('article-content').querySelectorAll('img').forEach(image => {
      image.addEventListener('load', progress);
      image.addEventListener('error', () => { image.replaceWith(create('p', 'image-unavailable', 'Publisher image unavailable.')); progress(); }, { once: true });
    });
    for (const id of ['source', 'article-original']) { $(id).href = item.link; $(id).hidden = false; }
    $('feed-note').hidden = false;
    $('save').disabled = false; bookmark($('save'), item);
    $('reading-scroll').scrollTop = 0;
    if (reveal) {
      document.body.classList.add('reader-open');
      $('article-title').focus({ preventScroll: true });
      if (!matchMedia('(prefers-reduced-motion: reduce)').matches && $('article').animate) {
        $('article').animate([{ opacity: .6, transform: 'translateY(6px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 220, easing: 'cubic-bezier(.16,1,.3,1)' });
      }
    }
    if (writeHash) history.replaceState(null, '', '#story=' + encodeURIComponent(item.link));
    render(); progress();
  }
  function empty(title, message, retry = false) {
    const node = create('div', 'empty-state');
    node.append(icon(view === 'saved' ? 'ri-bookmark-line' : 'ri-rss-line'), create('h2', '', title), create('p', '', message));
    if (retry) { const button = create('button', '', 'Try again'); button.addEventListener('click', load); node.append(button); }
    $('stories').append(node);
  }
  function render() {
    $('latest-count').textContent = latest.length;
    $('saved-count').textContent = saved.length;
    $('latest').setAttribute('aria-pressed', String(view === 'latest'));
    $('saved').setAttribute('aria-pressed', String(view === 'saved'));
    const items = R.select(view === 'latest' ? latest : saved, $('search').value, $('sort').value);
    $('result-count').textContent = items.length + (items.length === 1 ? ' story' : ' stories');
    $('stories').replaceChildren();
    if (!items.length) {
      if (loading && view === 'latest' && !latest.length) empty('Loading stories', 'Connecting to the publisher feed...');
      else if ($('search').value.trim()) empty('No matching stories', 'Try a different title, author, or topic.');
      else if (view === 'saved') empty('Keep a story for later', 'Use a bookmark beside a story to save its feed text in this browser.');
      else if (failed) empty('The feed is unavailable', 'Try again, or open Saved for stories already in this browser.', true);
      else empty('No stories in this feed', 'Check again later for new publisher entries.', true);
      return;
    }
    items.forEach(item => {
      const row = create('div', 'story-row' + (current?.link === item.link ? ' selected' : ''));
      row.dataset.link = item.link;
      const button = create('button', 'story-open');
      button.type = 'button';
      if (current?.link === item.link) button.setAttribute('aria-current', 'true');
      if (item.categories[0]) button.append(create('span', 'story-category', item.categories[0]));
      button.append(create('h2', '', item.title), create('p', '', R.date(item.published) + ' · ' + item.author));
      button.addEventListener('click', () => open(item));
      const save = create('button', 'icon-button'); save.type = 'button'; bookmark(save, item);
      save.addEventListener('click', () => toggleSave(item, item.link));
      row.append(button, save); $('stories').append(row);
    });
  }
  async function fetchStories() {
    const targets = ['/api/convert?url=' + encodeURIComponent(R.FEED), 'https://corsproxy.io/?' + encodeURIComponent(R.FEED), 'https://api.allorigins.win/get?url=' + encodeURIComponent(R.FEED)];
    for (const target of targets) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      try {
        const response = await fetch(target, { signal: controller.signal, credentials: 'omit' });
        if (!response.ok) throw new Error('Feed request failed');
        let text = await response.text();
        if (text.length > 2500000) throw new Error('Feed is too large');
        if (target.includes('allorigins')) text = JSON.parse(text).contents;
        if (typeof text !== 'string') throw new Error('Invalid feed response');
        return R.parse(text);
      } catch {} finally { clearTimeout(timeout); }
    }
    throw new Error('Feed unavailable');
  }
  async function load() {
    if (loading) return;
    loading = true;
    $('refresh').disabled = true;
    $('stories').setAttribute('aria-busy', 'true');
    $('feed-status').textContent = 'Refreshing the Vox feed...';
    $('feed-status').dataset.error = 'false'; render();
    try {
      latest = await fetchStories(); failed = false;
      $('feed-status').textContent = 'Retrieved ' + new Date().toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) + ' · Publisher RSS';
      if (!current) {
        const requested = requestedLink();
        const first = latest.find(item => item.link === requested) || saved.find(item => item.link === requested) || R.select(latest, '', 'newest')[0];
        if (first) open(first, Boolean(requested), Boolean(requested));
      }
    } catch {
      failed = true;
      $('feed-status').dataset.error = 'true';
      $('feed-status').textContent = latest.length ? 'Refresh failed. Showing the previously retrieved stories.' : 'Could not reach the feed. Saved stories remain available.';
      if (!current && saved.length) {
        const requested = requestedLink();
        view = 'saved'; open(saved.find(item => item.link === requested) || saved[0], Boolean(requested), false);
      }
    } finally {
      loading = false; $('refresh').disabled = false; $('stories').setAttribute('aria-busy', 'false'); render();
    }
  }
  $('latest').addEventListener('click', () => { view = 'latest'; render(); });
  $('saved').addEventListener('click', () => { view = 'saved'; render(); });
  $('search').addEventListener('input', render);
  $('sort').addEventListener('change', render);
  $('save').addEventListener('click', () => { if (current) toggleSave(current); });
  $('refresh').addEventListener('click', load);
  $('back').addEventListener('click', () => {
    document.body.classList.remove('reader-open');
    const row = Array.from($('stories').children).find(node => node.dataset.link === current?.link);
    (row?.querySelector('.story-open') || $('search')).focus();
  });
  $('text-size').addEventListener('change', () => {
    const size = $('text-size').value;
    document.documentElement.style.setProperty('--reading-size', size + 'px');
    try { localStorage.setItem('vox-reader-size', size); } catch { notify('Text size changed for this visit. Browser storage is unavailable.'); }
    progress();
  });
  $('reading-scroll').addEventListener('scroll', progress, { passive: true });
  window.addEventListener('resize', progress);
  document.querySelector('.skip').addEventListener('click', () => { document.body.classList.add('reader-open'); });
  window.addEventListener('hashchange', () => {
    let link = ''; try { link = decodeURIComponent(location.hash.replace(/^#story=/, '')); } catch {}
    const item = [...latest, ...saved].find(story => story.link === link);
    if (item) open(item, true, false);
  });
  render(); load();
})();

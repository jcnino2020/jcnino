(function () {
  'use strict';

  const core = window.FelineCore;
  const $ = id => document.getElementById(id);
  const gallery = $('gallery');
  const dialog = $('art-dialog');
  const searchInput = $('search-input');
  const state = {
    view: 'all', query: '', fetchedQuery: null, works: [], saved: [], page: 0,
    hasMore: false, fetching: false, error: '', request: 0,
    controller: null, active: null, opener: null, toastTimer: null
  };

  try { state.saved = core.readSaved(window.localStorage); } catch (_) { state.saved = []; }

  function node(tag, className, content) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (content != null) element.textContent = content;
    return element;
  }

  function icon(name) {
    const element = node('i', `ri-${name}`, '');
    element.setAttribute('aria-hidden', 'true');
    return element;
  }

  function firstArtist(work) {
    return work.artist.split('\n')[0];
  }

  function shownWorks() {
    if (state.view === 'all') return state.works;
    const term = state.query.toLocaleLowerCase();
    return state.saved.filter(work => !term || [work.title, work.artist, work.type, work.date].some(value => value.toLocaleLowerCase().includes(term)));
  }

  function isSaved(work) {
    return state.saved.some(item => item.id === work.id);
  }

  function toast(message) {
    const element = $('toast');
    element.textContent = message;
    element.hidden = false;
    window.clearTimeout(state.toastTimer);
    state.toastTimer = window.setTimeout(() => { element.hidden = true; }, 3200);
  }

  function updateTabs() {
    $('all-tab').setAttribute('aria-pressed', String(state.view === 'all'));
    $('saved-tab').setAttribute('aria-pressed', String(state.view === 'saved'));
    $('all-count').textContent = String(state.works.length);
    $('saved-count').textContent = String(state.saved.length);
    $('load-more').hidden = state.view !== 'all' || !state.hasMore;
    $('load-more').disabled = state.fetching;
    $('load-more').textContent = state.fetching && state.page > 0 ? 'Loading artworks...' : state.error ? 'Retry loading more' : 'Load more artworks';
    if (!state.fetching || state.page === 0) $('load-more').append(icon(state.error ? 'refresh-line' : 'arrow-down-line'));
    document.querySelector('.search label').textContent = state.view === 'saved' ? 'Search saved works' : 'Search within cat art';
    searchInput.placeholder = state.view === 'saved' ? 'Title, artist, or type' : 'Try portrait, Japan, or sculpture';
  }

  function message(title, description, action, callback, loading = false) {
    const wrap = node('div', `gallery-message${loading ? ' loading-message' : ''}`);
    if (loading) {
      const bars = node('div', 'loading-bars');
      bars.setAttribute('aria-hidden', 'true');
      for (let index = 0; index < 3; index++) bars.append(node('span'));
      wrap.append(bars);
    }
    wrap.append(node('h3', '', title), node('p', '', description));
    if (action) {
      const button = node('button', '', action);
      button.type = 'button';
      button.addEventListener('click', callback);
      wrap.append(button);
    }
    gallery.replaceChildren(wrap);
  }

  function missingMedia() {
    return node('span', 'image-missing', 'Image unavailable');
  }

  function artImage(work, width) {
    const url = core.imageUrl(work, width);
    if (!url) return missingMedia();
    const image = node('img', 'work-image');
    image.src = url;
    image.alt = work.alt || `Artwork: ${work.title}`;
    image.loading = width > 1000 ? 'eager' : 'lazy';
    image.decoding = 'async';
    image.addEventListener('error', () => image.replaceWith(missingMedia()), { once: true });
    return image;
  }

  function workCard(work, index) {
    const card = node('article', `work-card${index === 0 && state.view === 'all' ? ' lead' : ''}`);
    const open = node('button', 'work-open');
    open.type = 'button';
    open.dataset.workId = String(work.id);
    open.setAttribute('aria-label', `View ${work.title} by ${firstArtist(work)}`);
    const media = node('span', 'work-media');
    media.append(artImage(work, index === 0 ? 1200 : 800));
    const label = node('span', 'work-label');
    const number = node('span', 'work-number', String(index + 1).padStart(2, '0'));
    const copy = node('span', 'work-copy');
    copy.append(node('span', 'work-title', work.title), node('span', 'work-meta', `${firstArtist(work)} · ${work.date}`));
    label.append(number, copy);
    open.append(media, label);
    open.addEventListener('click', () => openArtwork(work, open));
    const save = node('button', 'work-save');
    save.type = 'button';
    save.append(icon(isSaved(work) ? 'bookmark-fill' : 'bookmark-line'));
    save.setAttribute('aria-label', `${isSaved(work) ? 'Remove' : 'Save'} ${work.title}${isSaved(work) ? ' from saved works' : ''}`);
    save.setAttribute('title', isSaved(work) ? 'Remove saved work' : 'Save work');
    save.setAttribute('aria-pressed', String(isSaved(work)));
    save.dataset.workId = String(work.id);
    save.addEventListener('click', () => toggleSaved(work, true));
    card.append(open, save);
    return card;
  }

  function renderGallery() {
    const works = shownWorks();
    updateTabs();
    gallery.setAttribute('aria-busy', String(state.fetching && !state.works.length && state.view === 'all'));
    const status = $('result-status');
    if (state.view === 'saved') {
      status.textContent = `${works.length} saved ${works.length === 1 ? 'work' : 'works'}${state.query ? ` matching “${state.query}”` : ''} · stored in this browser`;
    } else if (state.fetching && !state.works.length) {
      status.textContent = 'Finding artworks...';
    } else if (state.error && !state.works.length) {
      status.textContent = 'Collection temporarily unavailable';
    } else {
      status.textContent = `${works.length} ${works.length === 1 ? 'work' : 'works'} shown${state.query ? ` for “${state.query}”` : ''} · live museum results`;
    }
    if (state.view === 'saved' && !works.length) {
      message(state.query ? 'No saved matches' : 'Your collection starts here', state.query ? 'Try another word, or return to all works.' : 'Use the bookmark beside an artwork to keep it here on this browser.', state.query ? 'Clear search' : 'Browse artworks', () => {
        if (state.query) { state.query = ''; searchInput.value = ''; renderGallery(); }
        else setView('all');
      });
      return;
    }
    if (state.fetching && !state.works.length && state.view === 'all') {
      message('Opening the collection', 'Looking for cat-related works in the museum catalogue.', null, null, true);
      return;
    }
    if (state.error && !state.works.length && state.view === 'all') {
      message('The collection did not load', 'The museum feed may be temporarily unavailable. Retry the search, or view works you saved earlier.', 'Try again', () => fetchPage(true));
      return;
    }
    if (!works.length) {
      message('No works found', 'Try a broader search within the cat-art collection.', 'Clear search', () => { state.query = ''; searchInput.value = ''; fetchPage(true); });
      return;
    }
    const fragment = document.createDocumentFragment();
    works.forEach((work, index) => fragment.append(workCard(work, index)));
    gallery.replaceChildren(fragment);
    if (dialog.open && state.opener) {
      state.opener = gallery.querySelector(`.work-open[data-work-id="${state.opener.dataset.workId}"]`);
    }
  }

  async function fetchPage(reset) {
    if (reset) {
      if (state.controller) state.controller.abort();
      state.works = [];
      state.page = 0;
      state.hasMore = false;
      state.error = '';
    }
    if (state.fetching && !reset) return;
    const request = ++state.request;
    const query = state.query;
    const controller = new AbortController();
    state.controller = controller;
    state.fetching = true;
    renderGallery();
    try {
      const response = await fetch(core.searchUrl(query, state.page + 1), { signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      if (!Array.isArray(payload.data)) throw new Error('Invalid collection response');
      if (request !== state.request) return;
      const base = payload.config && payload.config.iiif_url;
      const incoming = payload.data.map(item => core.normalizeArtwork(item, base)).filter(Boolean);
      const seen = new Set(state.works.map(item => item.id));
      state.works.push(...incoming.filter(item => !seen.has(item.id) && seen.add(item.id)));
      state.page += 1;
      state.fetchedQuery = query;
      state.hasMore = !!(payload.pagination && state.page < payload.pagination.total_pages && incoming.length);
      state.error = '';
    } catch (error) {
      if (error.name === 'AbortError') return;
      if (request !== state.request) return;
      state.error = error.message || 'Could not fetch artworks';
      state.hasMore = state.works.length > 0;
      if (state.works.length) toast('More works could not load. Please try again.');
    } finally {
      if (request === state.request) {
        state.fetching = false;
        state.controller = null;
        renderGallery();
      }
    }
  }

  function setView(view) {
    state.view = view;
    if (view === 'all' && state.query !== state.fetchedQuery) fetchPage(true);
    else renderGallery();
  }

  function toggleSaved(work, restoreFocus = false) {
    const wasSaved = isSaved(work);
    const next = wasSaved ? state.saved.filter(item => item.id !== work.id) : [work, ...state.saved].slice(0, 100);
    let storage;
    try { storage = window.localStorage; } catch (_) { storage = null; }
    if (!storage || !core.writeSaved(storage, next)) {
      toast('Could not save in this browser. Check storage permissions.');
      return;
    }
    state.saved = next;
    toast(wasSaved ? 'Removed from saved works' : 'Saved in this browser');
    renderGallery();
    if (restoreFocus) {
      const replacement = gallery.querySelector(`[data-work-id="${work.id}"]`);
      (replacement || $('saved-tab')).focus();
    }
    if (dialog.open && state.active && state.active.id === work.id) renderDialog();
  }

  function openArtwork(work, opener) {
    state.active = work;
    state.opener = opener;
    renderDialog();
    if (!dialog.open) dialog.showModal();
  }

  function renderDialog() {
    const work = state.active;
    if (!work) return;
    const list = shownWorks();
    const index = list.findIndex(item => item.id === work.id);
    $('dialog-index').textContent = index >= 0 ? `Collection record ${String(index + 1).padStart(2, '0')} / ${String(list.length).padStart(2, '0')}` : 'Collection record';
    $('dialog-title').textContent = work.title;
    $('dialog-kind').textContent = work.type;
    $('dialog-artist').textContent = work.artist;
    $('dialog-date').textContent = work.date;
    $('dialog-type').textContent = work.type;
    $('dialog-credit').textContent = work.credit;
    $('dialog-source').href = core.sourceUrl(work);
    $('dialog-image-wrap').replaceChildren(artImage(work, 1600));
    const saved = isSaved(work);
    $('dialog-save').setAttribute('aria-pressed', String(saved));
    $('dialog-save').replaceChildren(icon(saved ? 'bookmark-fill' : 'bookmark-line'), node('span', '', saved ? 'Saved work' : 'Save work'));
    $('dialog-prev').disabled = index <= 0;
    $('dialog-next').disabled = index < 0 || index >= list.length - 1;
  }

  function stepArtwork(delta) {
    const list = shownWorks();
    const index = list.findIndex(item => state.active && item.id === state.active.id);
    const next = list[index + delta];
    if (!next) return;
    state.active = next;
    renderDialog();
  }

  $('search-form').addEventListener('submit', event => {
    event.preventDefault();
    const query = searchInput.value.trim().slice(0, 80);
    if (query === state.query) return;
    state.query = query;
    if (state.view === 'saved') renderGallery();
    else fetchPage(true);
  });
  $('all-tab').addEventListener('click', () => setView('all'));
  $('saved-tab').addEventListener('click', () => setView('saved'));
  $('load-more').addEventListener('click', () => fetchPage(false));
  $('dialog-close').addEventListener('click', () => dialog.close());
  $('dialog-prev').addEventListener('click', () => stepArtwork(-1));
  $('dialog-next').addEventListener('click', () => stepArtwork(1));
  $('dialog-save').addEventListener('click', () => state.active && toggleSaved(state.active));
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => {
    if (state.opener && state.opener.isConnected) state.opener.focus();
    else (state.view === 'saved' ? $('saved-tab') : $('all-tab')).focus();
    state.active = null;
  });
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); stepArtwork(-1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); stepArtwork(1); }
  });

  renderGallery();
  fetchPage(true);
})();

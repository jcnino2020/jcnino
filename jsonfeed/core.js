(function (global) {
  'use strict';

  const API = 'https://api.artic.edu/api/v1/artworks/search';
  const FIELDS = 'id,title,image_id,thumbnail,artist_display,date_display,artwork_type_title,credit_line,is_public_domain';
  const STORAGE_KEY = 'feline-archive-saved-v1';
  const DEFAULT_IIIF = 'https://www.artic.edu/iiif/2';

  function cleanText(value, fallback = '') {
    return typeof value === 'string' && value.trim() ? value.trim() : fallback;
  }

  function normalizeArtwork(raw, iiifBase = DEFAULT_IIIF) {
    if (!raw || !Number.isSafeInteger(Number(raw.id)) || Number(raw.id) <= 0) return null;
    const id = Number(raw.id);
    const imageId = /^[a-z0-9-]+$/i.test(raw.image_id || '') ? raw.image_id : '';
    const base = /^https:\/\/www\.artic\.edu\/iiif\/2\/?$/.test(iiifBase) ? iiifBase.replace(/\/$/, '') : DEFAULT_IIIF;
    return {
      id,
      title: cleanText(raw.title, 'Untitled work'),
      imageId,
      iiifBase: base,
      artist: cleanText(raw.artist_display || raw.artist, 'Artist unknown'),
      date: cleanText(raw.date_display || raw.date, 'Date unknown'),
      type: cleanText(raw.artwork_type_title || raw.type, 'Artwork'),
      credit: cleanText(raw.credit_line || raw.credit, 'Art Institute of Chicago'),
      alt: cleanText(raw.thumbnail && raw.thumbnail.alt_text || raw.alt, '')
    };
  }

  function imageUrl(work, width) {
    if (!work || !work.imageId) return '';
    const size = Math.max(200, Math.min(1800, Math.round(Number(width) || 800)));
    return `${work.iiifBase}/${work.imageId}/full/${size},/0/default.jpg`;
  }

  function searchUrl(query = '', page = 1) {
    const url = new URL(API);
    const term = cleanText(query).slice(0, 80);
    url.searchParams.set('q', term ? `cats ${term}` : 'cats');
    url.searchParams.set('fields', FIELDS);
    url.searchParams.set('query[term][is_public_domain]', 'true');
    url.searchParams.set('limit', '18');
    url.searchParams.set('page', String(Math.max(1, Math.floor(Number(page) || 1))));
    return url.toString();
  }

  function sourceUrl(work) {
    return `https://www.artic.edu/artworks/${work.id}`;
  }

  function readSaved(storage) {
    try {
      const parsed = JSON.parse(storage.getItem(STORAGE_KEY) || '[]');
      if (!Array.isArray(parsed)) return [];
      const seen = new Set();
      return parsed.map(item => normalizeArtwork(item, item && item.iiifBase)).filter(item => {
        if (!item || seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      }).slice(0, 100);
    } catch (_) {
      return [];
    }
  }

  function writeSaved(storage, works) {
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(works.slice(0, 100)));
      return true;
    } catch (_) {
      return false;
    }
  }

  global.FelineCore = { normalizeArtwork, imageUrl, searchUrl, sourceUrl, readSaved, writeSaved, STORAGE_KEY };
})(window);

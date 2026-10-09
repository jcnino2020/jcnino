(function (global) {
  'use strict';
  const FEED = 'https://www.vox.com/rss/index.xml';
  function url(value, base = FEED) {
    if (typeof value !== 'string' || !value.trim()) return '';
    try {
      const parsed = new URL(value, base);
      return ['https:', 'http:'].includes(parsed.protocol) && !parsed.username && !parsed.password ? parsed.href : '';
    } catch { return ''; }
  }
  function sourceUrl(value) {
    const safe = url(value);
    if (!safe) return '';
    const host = new URL(safe).hostname;
    return host === 'vox.com' || host.endsWith('.vox.com') ? safe : '';
  }
  function plain(html) {
    const safe = global.DOMPurify.sanitize(String(html || ''), { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
    return new DOMParser().parseFromString(safe, 'text/html').body.textContent.trim();
  }
  function clean(html, base) {
    const fragment = global.DOMPurify.sanitize(String(html || ''), {
      RETURN_DOM_FRAGMENT: true,
      ALLOWED_TAGS: ['p', 'div', 'span', 'br', 'hr', 'h2', 'h3', 'h4', 'strong', 'b', 'em', 'i', 'u', 's', 'a', 'img', 'figure', 'figcaption', 'blockquote', 'ul', 'ol', 'li', 'pre', 'code', 'table', 'thead', 'tbody', 'tr', 'td', 'th'],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'colspan', 'rowspan'],
      ALLOW_DATA_ATTR: false
    });
    fragment.querySelectorAll('a').forEach(anchor => {
      const safe = url(anchor.getAttribute('href'), base);
      if (safe) {
        anchor.href = safe; anchor.target = '_blank'; anchor.rel = 'noopener noreferrer';
      } else anchor.removeAttribute('href');
    });
    fragment.querySelectorAll('img').forEach(image => {
      const safe = url(image.getAttribute('src'), base);
      if (!safe) { image.remove(); return; }
      image.src = safe; image.loading = 'lazy'; image.decoding = 'async'; image.referrerPolicy = 'no-referrer';
      if (!image.hasAttribute('alt')) image.alt = '';
    });
    const wrapper = document.createElement('div');
    wrapper.append(fragment);
    return wrapper.innerHTML;
  }
  const child = (node, name) => Array.from(node.children).find(element => element.localName === name);
  const value = (node, name) => child(node, name)?.textContent || '';
  function story(raw) {
    const link = sourceUrl(raw.link);
    if (!link || typeof raw.title !== 'string' || typeof raw.content !== 'string') return null;
    const content = clean(raw.content.slice(0, 200000), link);
    const title = plain(raw.title).slice(0, 500) || 'Untitled story';
    const timestamp = Date.parse(raw.published);
    return { link, title, content, summary: plain(content).slice(0, 3000), author: plain(raw.author || 'Vox staff').slice(0, 200), published: Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : '', categories: Array.isArray(raw.categories) ? raw.categories.slice(0, 6).map(item => plain(item).slice(0, 80)).filter(Boolean) : [] };
  }
  function parse(xml) {
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    if (doc.querySelector('parsererror') || !['feed', 'rss', 'RDF'].includes(doc.documentElement.localName)) throw new Error('The response is not a valid RSS or Atom feed.');
    const atom = doc.documentElement.localName === 'feed';
    const nodes = Array.from(doc.getElementsByTagNameNS('*', atom ? 'entry' : 'item'));
    const seen = new Set();
    return nodes.slice(0, 100).map(node => {
      const linkNode = Array.from(node.children).find(el => el.localName === 'link' && (!atom || !el.getAttribute('rel') || el.getAttribute('rel') === 'alternate'));
      const raw = {
        link: atom ? linkNode?.getAttribute('href') : linkNode?.textContent,
        title: value(node, 'title'),
        content: value(node, atom ? 'content' : 'encoded') || value(node, atom ? 'summary' : 'description'),
        author: atom ? value(child(node, 'author') || node, 'name') : value(node, 'creator') || value(node, 'author'),
        published: value(node, atom ? 'published' : 'pubDate') || value(node, 'updated'),
        categories: Array.from(node.children).filter(el => el.localName === 'category').map(el => atom ? el.getAttribute('term') || el.textContent : el.textContent)
      };
      const result = story(raw);
      if (!result || seen.has(result.link)) return null;
      seen.add(result.link); return result;
    }).filter(Boolean);
  }
  function select(items, query, order) {
    const terms = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
    return items.filter(item => terms.every(term => [item.title, item.author, item.summary, ...item.categories].join(' ').toLocaleLowerCase().includes(term))).sort((a, b) => {
      const difference = (Date.parse(b.published) || 0) - (Date.parse(a.published) || 0);
      return order === 'oldest' ? -difference : difference;
    });
  }
  function date(value) {
    return value ? new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Date unavailable';
  }
  global.VoxReader = { FEED, url, sourceUrl, plain, clean, story, parse, select, date };
})(window);

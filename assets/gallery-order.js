// Session storage keeps refreshes and return visits in this tab consistent.
// Save photo keys, never records, so updated captions/media stay current.
function shuffleGalleryPhotos(photos, fixedCount = 0, { sessionKey, limit = Infinity, maxPhotos = Infinity } = {}) {
  const pool = photos.slice(0, maxPhotos);
  const opening = pool.slice(0, fixedCount);
  const occurrences = new Map();
  const entries = pool.slice(fixedCount).map(photo => {
    const file = photo.media?.file || photo.file || photo.src || String(photo.id);
    const occurrence = occurrences.get(file) || 0;
    occurrences.set(file, occurrence + 1);
    return { key: JSON.stringify([file, occurrence]), photo };
  });
  const storageKey = sessionKey && 'jcnino.gallery-order.v2.' + sessionKey;
  let saved = [];
  try {
    const value = storageKey && JSON.parse(sessionStorage.getItem(storageKey));
    if (Array.isArray(value)) saved = value;
  } catch { /* Storage may be unavailable; the gallery still works. */ }
  const remaining = new Map(entries.map(entry => [entry.key, entry]));
  const ordered = [];
  for (const key of saved) {
    if (!remaining.has(key)) continue;
    ordered.push(remaining.get(key));
    remaining.delete(key);
  }
  const added = [...remaining.values()];
  for (let i = added.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [added[i], added[j]] = [added[j], added[i]];
  }
  ordered.push(...added);
  try {
    if (storageKey) sessionStorage.setItem(storageKey, JSON.stringify(ordered.map(entry => entry.key)));
  } catch { /* Ignore storage failures rather than hiding photos. */ }
  return opening.concat(ordered.map(entry => entry.photo)).slice(0, limit);
}

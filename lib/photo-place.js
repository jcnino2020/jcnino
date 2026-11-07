// Reverse lookup only: names come from the photo coordinates, never its caption.
export function landmarkName(result, lat, lon) {
  const name = result?.namedetails?.['name:en'] || result?.name;
  if (!name || ['highway', 'boundary', 'place'].includes(result.category || result.class) || Number(result.place_rank) < 28) return '';
  const pointLat = Number(result.lat), pointLon = Number(result.lon);
  if (!Number.isFinite(pointLat) || !Number.isFinite(pointLon)) return '';
  const radians = Math.PI / 180;
  const a = Math.sin((pointLat - lat) * radians / 2) ** 2 + Math.cos(lat * radians) * Math.cos(pointLat * radians) * Math.sin((pointLon - lon) * radians / 2) ** 2;
  const distance = 6371000 * 2 * Math.asin(Math.min(1, Math.sqrt(a)));
  // A reverse geocoder may return a distant feature when the area is unmapped.
  return distance <= 200 ? String(name).trim() : '';
}

export function nearbyLandmark(elements, lat, lon) {
  const nodes = new Map((elements || []).filter(element => element.type === 'node').map(element => [element.id, element]));
  return (elements || []).map(element => {
    const tags = element.tags || {};
    const category = ['tourism', 'historic', 'amenity', 'leisure', 'shop', 'building'].find(key => tags[key]);
    const vertices = (element.nodes || []).map(id => nodes.get(id)).filter(Boolean);
    const bounds = element.bounds || (vertices.length ? {
      minlat: Math.min(...vertices.map(p => p.lat)), maxlat: Math.max(...vertices.map(p => p.lat)),
      minlon: Math.min(...vertices.map(p => p.lon)), maxlon: Math.max(...vertices.map(p => p.lon))
    } : null);
    const point = element.center || (bounds ? { lat: (bounds.minlat + bounds.maxlat) / 2, lon: (bounds.minlon + bounds.maxlon) / 2 } : element);
    const name = landmarkName({ name: tags['name:en'] || tags.name, category, place_rank: 30, lat: point.lat, lon: point.lon }, lat, lon);
    let contains = bounds && lat >= bounds.minlat && lat <= bounds.maxlat && lon >= bounds.minlon && lon <= bounds.maxlon;
    if (vertices.length > 3 && element.nodes[0] === element.nodes.at(-1)) {
      contains = false;
      for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
        const a = vertices[i], b = vertices[j];
        if ((a.lat > lat) !== (b.lat > lat) && lon < (b.lon - a.lon) * (lat - a.lat) / (b.lat - a.lat) + a.lon) contains = !contains;
      }
    }
    const distance = Math.hypot(Number(point.lat) - lat, (Number(point.lon) - lon) * Math.cos(lat * Math.PI / 180));
    return { name: category ? name : '', score: (contains ? 0 : 2) + (['tourism', 'historic'].includes(category) ? 0 : 1), distance };
  }).filter(place => place.name).sort((a, b) => a.score - b.score || a.distance - b.distance)[0]?.name || '';
}

export function createPhotoPlaceHandler(fetchPlace = fetch) {
  const cache = new Map();
  let queue = Promise.resolve();
  let nextRequest = 0;
  return async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed.' });
    const { lat: rawLat, lon: rawLon } = req.query || {};
    const lat = Number(rawLat), lon = Number(rawLon);
    if (typeof rawLat !== 'string' || !rawLat.trim() || typeof rawLon !== 'string' || !rawLon.trim() || !Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
      return res.status(400).json({ error: 'Valid photo coordinates are required.' });
    }
    const key = lat.toFixed(5) + ',' + lon.toFixed(5);
    try {
      let lookup = cache.get(key);
      if (!lookup) {
        lookup = queue.then(async () => {
          await new Promise(resolve => setTimeout(resolve, Math.max(0, nextRequest - Date.now())));
          nextRequest = Date.now() + 1100;
          // Fetch one small map area; this includes named grounds around unnamed features.
          const deltaLat = 200 / 111320;
          const deltaLon = deltaLat / Math.max(0.1, Math.cos(lat * Math.PI / 180));
          const bbox = [Math.max(-180, lon - deltaLon), Math.max(-90, lat - deltaLat), Math.min(180, lon + deltaLon), Math.min(90, lat + deltaLat)].map(value => value.toFixed(6)).join(',');
          const endpoint = process.env.PHOTO_PLACE_API_URL || 'https://api.openstreetmap.org/api/0.6/map.json';
          const response = await fetchPlace(endpoint + '?' + new URLSearchParams({ bbox }), {
            headers: { 'User-Agent': 'JC-Ninonuevo-Portfolio/1.0 (https://www.jcnino.dev)', Accept: 'application/json' },
            signal: AbortSignal.timeout(10000)
          });
          if (!response.ok) throw new Error('Place lookup unavailable');
          return { name: nearbyLandmark((await response.json()).elements, lat, lon) };
        });
        queue = lookup.catch(() => {});
        if (cache.size >= 1000) cache.delete(cache.keys().next().value);
        cache.set(key, lookup);
      }
      const result = await lookup;
      res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800');
      return res.status(200).json(result);
    } catch {
      cache.delete(key);
      return res.status(503).json({ error: 'Place lookup unavailable.' });
    }
  };
}

export default createPhotoPlaceHandler();

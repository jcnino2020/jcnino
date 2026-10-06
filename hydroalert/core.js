(function (root) {
  'use strict';
  const stations = [
    { id: 'minoyan', name: 'Minoyan', place: 'Murcia', role: 'Upstream', levels: [1.2, 3.8, 3.8, 3.4], rain: [0, 45, 40, 25] },
    { id: 'mandalagan', name: 'Mandalagan Bridge', place: 'Bacolod', role: 'Midstream', levels: [0.8, 0.9, 1.8, 2.9], rain: [0, 12, 18, 18] },
    { id: 'banago', name: 'Banago', place: 'Bacolod', role: 'Downstream', levels: [0.5, 0.5, 1.1, 2.4], rain: [0, 8, 12, 12] },
    { id: 'dsb', name: 'Don Salvador', place: 'Reference station', role: 'Reference', levels: [0.8, 1.4, 1.6, 1.3], rain: [0, 18, 15, 8] }
  ];
  const phases = ['Baseline', 'Upstream rainfall', 'Downstream rise', 'High water'];
  function snapshot(id, phase) {
    const station = stations.find(item => item.id === id);
    if (!station || !Number.isInteger(phase) || phase < 0 || phase > 3) throw new Error('Unknown station or scenario stage.');
    const level = station.levels[phase];
    const severity = level >= 2.4 ? 'high' : level >= 1.5 ? 'rising' : 'routine';
    const label = severity === 'high' ? 'High water' : severity === 'rising' ? 'Rising' : 'Routine';
    const baseline = station.levels[0];
    const samples = [baseline * .9, baseline, baseline * .95, baseline, (baseline + level) / 2, level];
    return { ...station, level, rainfall: station.rain[phase], severity, label, samples };
  }
  function trace(samples) {
    if (!Array.isArray(samples) || samples.length < 2 || samples.some(v => !Number.isFinite(v) || v < 0 || v > 5)) throw new Error('Invalid trace.');
    return samples.map((value, i) => (i ? 'L' : 'M') + (60 + i * 560 / (samples.length - 1)).toFixed(1) + ',' + (248 - value / 5 * 200).toFixed(1)).join(' ');
  }
  const observations = ['Normal flow', 'Rising water', 'High water', 'Light rain', 'Heavy rain'];
  function report(values, photo, now = Date.now()) {
    if (!stations.some(s => s.id === values.station) || !observations.includes(values.type)) throw new Error('Choose a station and an observation.');
    const note = String(values.note || '').trim();
    if (note.length > 500) throw new Error('Keep the note within 500 characters.');
    const level = String(values.level ?? '').trim();
    if (level !== '' && (!/^\d+(\.\d{1,2})?$/.test(level) || Number(level) > 20)) throw new Error('Water level must be between 0 and 20 metres, with at most two decimal places.');
    if (photo && (!['image/jpeg', 'image/png', 'image/webp'].includes(photo.type) || photo.size > 5 * 1024 * 1024)) throw new Error('Choose a JPEG, PNG or WebP photo up to 5 MB.');
    let location = null;
    if (values.location) {
      const { latitude, longitude } = values.location;
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) throw new Error('Invalid location.');
      location = { latitude, longitude };
    }
    return { station: values.station, type: values.type, note, level: level === '' ? null : Number(level), location, createdAt: now, photo: photo || null };
  }
  root.Hydro = Object.freeze({ stations, phases, snapshot, trace, report });
}(globalThis));

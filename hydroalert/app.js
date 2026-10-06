(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const all = selector => Array.from(document.querySelectorAll(selector));
  const text = (selector, value) => { const element = $(selector); if (element) element.textContent = value; };
  const element = (tag, value, className) => {
    const node = document.createElement(tag);
    if (value !== undefined) node.textContent = value;
    if (className) node.className = className;
    return node;
  };
  function clock() {
    const time = $('[data-device-time]');
    if (time) {
      const now = new Date();
      time.dateTime = now.toISOString();
      time.textContent = now.toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short' });
    }
  }
  clock();
  setInterval(clock, 1000);
  const view = document.body.dataset.view;
  if (view !== 'field') {
    let phase = 0, selected = 'minoyan', timer = null, events = [];
    const run = $('[data-run]');
    const eventCopy = [
      ['Baseline scenario', 'All example stations return to their initial synthetic levels.'],
      ['Upstream rainfall example', 'Minoyan rises to 3.8 m with synthetic rainfall of 45 mm/h.'],
      ['Downstream rise example', 'Mandalagan rises to 1.8 m. This is a demonstration, not a prediction.'],
      ['High-water example', 'Mandalagan reaches 2.9 m in the scenario. No warning is issued.']
    ];
    function stop() {
      if (timer) clearInterval(timer);
      timer = null;
      if (run) {
        run.innerHTML = '<i class="fa-solid fa-play" aria-hidden="true"></i>' + (phase === 3 ? 'Replay scenario' : 'Run scenario');
        run.setAttribute('aria-pressed', 'false');
      }
    }
    function render() {
      const data = Hydro.snapshot(selected, phase);
      all('[data-station]').forEach(button => {
        const item = Hydro.snapshot(button.dataset.station, phase);
        button.setAttribute('aria-pressed', String(item.id === selected));
        button.querySelector('[data-level]').textContent = item.level.toFixed(1) + ' m';
        const status = button.querySelector('[data-status]');
        status.textContent = item.label;
        status.dataset.severity = item.severity;
      });
      text('[data-selected-name]', data.name);
      text('[data-selected-place]', data.place + ' / ' + data.role);
      text('[data-selected-level]', data.level.toFixed(1) + ' m');
      text('[data-selected-rain]', data.rainfall);
      const status = $('[data-selected-status]');
      if (status) { status.textContent = data.label; status.dataset.severity = data.severity; }
      const trace = $('[data-trace]');
      if (trace) {
        const path = Hydro.trace(data.samples);
        trace.setAttribute('d', path);
        $('[data-area]').setAttribute('d', path + ' L620,248 L60,248 Z');
        $('[data-trace-dot]').setAttribute('cy', String(248 - data.level / 5 * 200));
        text('#chart-description', 'Six synthetic readings for ' + data.name + '. Current example level ' + data.level.toFixed(1) + ' metres. Demonstration thresholds at 1.5 and 2.4 metres.');
      }
      all('[data-node]').forEach(node => { node.dataset.severity = Hydro.snapshot(node.dataset.node, phase).severity; });
      all('input[name="scenario"]').forEach(input => { input.checked = Number(input.value) === phase; });
      const list = $('[data-events]');
      if (list) {
        list.replaceChildren();
        events.slice().reverse().forEach(event => {
          const row = element('li');
          const time = element('time', new Date(event.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
          time.dateTime = new Date(event.createdAt).toISOString();
          const copy = element('div');
          copy.append(element('strong', eventCopy[event.phase][0]), element('small', eventCopy[event.phase][1]));
          row.append(time, copy);
          list.appendChild(row);
        });
      }
      const table = $('[data-station-table]');
      if (table) {
        table.replaceChildren();
        Hydro.stations.forEach(station => {
          const item = Hydro.snapshot(station.id, phase);
          const row = element('tr');
          const name = element('td');
          name.append(element('span', station.name), element('small', station.place));
          const label = element('span', item.label, 'status');
          label.dataset.severity = item.severity;
          const state = element('td'); state.appendChild(label);
          row.append(name, element('td', item.level.toFixed(1) + ' m', 'numeric'), element('td', item.rainfall + ' mm/h', 'numeric'), state);
          table.appendChild(row);
        });
      }
      const advisory = $('[data-advisory]');
      if (advisory) {
        const downstream = Hydro.snapshot('mandalagan', phase);
        advisory.dataset.severity = downstream.severity;
        const titles = ['Routine conditions in this scenario.', 'Upstream rainfall in this scenario.', 'Downstream water is rising in this scenario.', 'High water in this scenario.'];
        const descriptions = [
          'The synthetic river levels are at baseline. This is not a statement about current flood risk.',
          'The example upstream station has risen. No current weather or flood prediction is available here.',
          'The synthetic downstream level has increased. For actual warnings, consult official sources and local authorities.',
          'This demonstrates an escalated advisory state. It is not an evacuation order or an actual warning.'
        ];
        const label = $('[data-advisory-status]');
        label.dataset.severity = downstream.severity;
        label.textContent = Hydro.phases[phase] + ' example';
        text('[data-advisory-title]', titles[phase]);
        text('[data-advisory-text]', descriptions[phase]);
        text('[data-community-level]', downstream.level.toFixed(1) + ' m');
      }
    }
    function setPhase(next, announce = true) {
      phase = next;
      events.push({ phase, createdAt: Date.now() });
      events = events.slice(-12);
      render();
      if (announce) text('[data-scenario-announcement]', 'Demo stage: ' + Hydro.phases[phase] + '. ' + eventCopy[phase][1]);
    }
    all('[data-station]').forEach(button => button.addEventListener('click', () => { selected = button.dataset.station; render(); }));
    all('input[name="scenario"]').forEach(input => input.addEventListener('change', () => {
      stop(); setPhase(Number(input.value)); text('[data-run-state]', 'Manual stage');
    }));
    if (run) run.addEventListener('click', () => {
      if (timer) { stop(); text('[data-run-state]', 'Paused'); return; }
      if (phase === 3) { events = []; setPhase(0); }
      run.innerHTML = '<i class="fa-solid fa-pause" aria-hidden="true"></i>Pause scenario';
      run.setAttribute('aria-pressed', 'true');
      text('[data-run-state]', 'Running / accelerated demo');
      timer = setInterval(() => {
        setPhase(phase + 1);
        if (phase === 3) { stop(); text('[data-run-state]', 'Complete'); }
      }, 3000);
    });
    const reset = $('[data-reset]');
    if (reset) reset.addEventListener('click', () => { stop(); events = []; setPhase(0); text('[data-run-state]', 'Ready'); });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && timer) { stop(); text('[data-run-state]', 'Paused'); }
    });
    setPhase(0, false);
    const checks = all('[data-check]');
    if (checks.length) {
      let saved = [];
      try { const value = JSON.parse(localStorage.getItem('hydroalert-checklist') || '[]'); if (Array.isArray(value)) saved = value; } catch (_) {}
      checks.forEach((input, i) => { input.checked = saved[i] === true; });
      function updateChecklist() { text('[data-check-progress]', checks.filter(input => input.checked).length + ' / ' + checks.length + ' packed'); }
      checks.forEach(input => input.addEventListener('change', () => {
        updateChecklist();
        try { localStorage.setItem('hydroalert-checklist', JSON.stringify(checks.map(item => item.checked))); } catch (_) {}
      }));
      updateChecklist();
    }
    return;
  }

  const form = $('[data-report-form]');
  const saveButton = $('[data-save]');
  const status = $('[data-form-status]');
  const photoInput = $('#photo');
  const confirmDialog = $('[data-confirm-dialog]');
  const detailDialog = $('[data-detail-dialog]');
  const clearDialog = $('[data-clear-dialog]');
  let reports = [], location = null, pending = null, busy = false, previewURL = null, detailURL = null;
  function message(value, error = false) { status.textContent = value; status.dataset.error = String(error); }
  all('[data-close-dialog]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
  detailDialog.addEventListener('close', () => { if (detailURL) URL.revokeObjectURL(detailURL); detailURL = null; });
  confirmDialog.addEventListener('close', () => { pending = null; });
  function reportDetails(record) {
    text('[data-detail-title]', record.type);
    text('[data-detail-id]', record.id);
    text('[data-detail-note]', record.note || 'No additional note.');
    const fields = $('[data-detail-fields]');
    fields.replaceChildren();
    const station = Hydro.stations.find(item => item.id === record.station);
    for (const [label, value] of [
      ['Station', station.name + ' / ' + station.place],
      ['Recorded on this device', new Date(record.createdAt).toLocaleString()],
      ['Water level', record.level === null ? 'Not recorded' : record.level + ' m'],
      ['Location', record.location ? record.location.latitude.toFixed(5) + ', ' + record.location.longitude.toFixed(5) : 'Not attached'],
      ['Delivery', 'Not sent / local browser record']
    ]) {
      const pair = element('div'); pair.append(element('dt', label), element('dd', value)); fields.appendChild(pair);
    }
    const photo = $('[data-detail-photo]');
    if (detailURL) URL.revokeObjectURL(detailURL);
    detailURL = record.photo ? URL.createObjectURL(record.photo) : null;
    photo.hidden = !detailURL;
    if (detailURL) photo.src = detailURL; else photo.removeAttribute('src');
    detailDialog.showModal();
  }
  function renderReports() {
    const container = $('[data-reports]');
    const filter = $('[data-filter]').value;
    const filtered = reports.filter(record => filter === 'all' || (filter === 'rain' ? record.type.includes('rain') : !record.type.includes('rain')));
    container.replaceChildren();
    if (!filtered.length) container.appendChild(element('p', reports.length ? 'No observations match this filter.' : 'No local observations yet.', 'empty-state'));
    filtered.forEach(record => {
      const row = element('article', undefined, 'report-item');
      const copy = element('div');
      copy.append(element('strong', record.type), element('small', Hydro.stations.find(item => item.id === record.station).name + ' / ' + new Date(record.createdAt).toLocaleString()), element('small', 'Local only' + (record.photo ? ' / Photo attached' : '')));
      const open = element('button', 'View', 'btn');
      open.type = 'button';
      open.setAttribute('aria-label', 'View ' + record.type + ' recorded ' + new Date(record.createdAt).toLocaleString());
      open.addEventListener('click', () => reportDetails(record));
      row.append(copy, open); container.appendChild(row);
    });
    $('[data-export]').disabled = reports.length === 0;
    $('[data-clear]').disabled = reports.length === 0 || busy;
  }
  async function loadReports() {
    try {
      const records = await HydroStore.list();
      reports = records.filter(record => {
        try { Hydro.report(record, record.photo, record.createdAt); return typeof record.id === 'string' && Number.isFinite(record.createdAt); }
        catch (_) { return false; }
      }).sort((a, b) => b.createdAt - a.createdAt);
      text('[data-storage-state]', 'Local browser storage / ' + reports.length + ' observations. Not synchronized.');
      renderReports();
    } catch (error) {
      text('[data-storage-state]', 'Storage unavailable. Saving will report an error; nothing is sent remotely.');
      renderReports();
      message(error.message, true);
    } finally { saveButton.disabled = false; }
  }
  function clearAttachment() {
    if (previewURL) URL.revokeObjectURL(previewURL);
    previewURL = null;
    const preview = $('[data-photo-preview]');
    preview.hidden = true; preview.removeAttribute('src');
    photoInput.value = '';
  }
  photoInput.addEventListener('change', () => {
    if (previewURL) URL.revokeObjectURL(previewURL);
    previewURL = null;
    const preview = $('[data-photo-preview]');
    preview.hidden = true; preview.removeAttribute('src');
    const photo = photoInput.files[0];
    if (!photo) return;
    try {
      Hydro.report({ station: form.elements.station.value, type: form.elements.type.value }, photo);
      previewURL = URL.createObjectURL(photo); preview.src = previewURL; preview.hidden = false;
      message('Photo selected. It will be stored with your local observation.');
    } catch (error) { photoInput.value = ''; message(error.message, true); }
  });
  const locationButton = $('[data-location]');
  const removeLocation = $('[data-clear-location]');
  let locationRequest = 0;
  locationButton.addEventListener('click', () => {
    if (!navigator.geolocation) { text('[data-location-status]', 'Device location is unavailable. You can save without it.'); return; }
    const request = ++locationRequest;
    location = null; removeLocation.hidden = true;
    locationButton.disabled = true;
    text('[data-location-status]', 'Requesting device location...');
    navigator.geolocation.getCurrentPosition(position => {
      if (request !== locationRequest) return;
      location = { latitude: position.coords.latitude, longitude: position.coords.longitude };
      text('[data-location-status]', location.latitude.toFixed(5) + ', ' + location.longitude.toFixed(5) + ' / device location, not station verification.');
      locationButton.disabled = false; removeLocation.hidden = false;
    }, error => {
      if (request !== locationRequest) return;
      locationButton.disabled = false;
      text('[data-location-status]', error.code === 1 ? 'Location permission denied. You can save without it.' : 'Location could not be obtained. Retry or save without it.');
    }, { timeout: 10000, maximumAge: 0, enableHighAccuracy: false });
  });
  removeLocation.addEventListener('click', () => { location = null; removeLocation.hidden = true; text('[data-location-status]', 'No location attached.'); });
  function readReport() {
    return Hydro.report({ station: form.elements.station.value, type: form.elements.type.value, level: form.elements.level.value, note: form.elements.note.value, location }, photoInput.files[0]);
  }
  async function save(record) {
    if (busy) return;
    busy = true; saveButton.disabled = true; $('[data-clear]').disabled = true;
    message('Saving in this browser...');
    try {
      const id = globalThis.crypto && crypto.randomUUID ? crypto.randomUUID() : 'local-' + Date.now() + '-' + Math.random().toString(36).slice(2);
      await HydroStore.save({ ...record, id });
      reports = [{ ...record, id }, ...reports];
      renderReports();
      text('[data-storage-state]', 'Local browser storage / ' + reports.length + ' observations. Not synchronized.');
      form.reset(); clearAttachment(); location = null; locationRequest++;
      locationButton.disabled = false; removeLocation.hidden = true; text('[data-location-status]', 'No location attached.');
      message('Observation saved locally. Not sent to any authority.');
    } catch (error) { message(error.message + ' Your form has been kept so you can retry.', true); }
    finally { busy = false; saveButton.disabled = false; $('[data-clear]').disabled = reports.length === 0; }
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (busy) return;
    try {
      const record = readReport();
      if (record.type === 'High water') { pending = record; confirmDialog.showModal(); }
      else save(record);
    } catch (error) { message(error.message, true); }
  });
  $('[data-confirm-save]').addEventListener('click', () => {
    const record = pending;
    pending = null; confirmDialog.close();
    if (record) save(record);
  });
  $('[data-filter]').addEventListener('change', renderReports);
  $('[data-export]').addEventListener('click', () => {
    const metadata = reports.map(({ photo, ...record }) => ({ ...record, photoAttached: Boolean(photo), delivery: 'local-only' }));
    const blob = new Blob([JSON.stringify({ prototype: true, exportedAt: new Date().toISOString(), reports: metadata }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = element('a'); link.href = url; link.download = 'hydroalert-local-reports.json';
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    message('Exported report metadata. Photos are not included.');
  });
  const clearCheck = $('[data-clear-check]');
  const clearConfirm = $('[data-confirm-clear]');
  $('[data-clear]').addEventListener('click', () => { clearCheck.checked = false; clearConfirm.disabled = true; clearDialog.showModal(); });
  clearCheck.addEventListener('change', () => { clearConfirm.disabled = !clearCheck.checked; });
  clearConfirm.addEventListener('click', async () => {
    if (!clearCheck.checked || busy) return;
    busy = true; clearConfirm.disabled = true; saveButton.disabled = true;
    try {
      await HydroStore.clear(); reports = []; renderReports(); clearDialog.close();
      text('[data-storage-state]', 'Local browser storage / 0 observations. Not synchronized.');
      message('Local observations and attached photos cleared.');
    } catch (error) { clearDialog.close(); message(error.message, true); }
    finally { busy = false; saveButton.disabled = false; $('[data-clear]').disabled = reports.length === 0; }
  });
  loadReports();
})();

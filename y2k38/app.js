(() => {
  'use strict';
  const theme = document.querySelector('[data-theme-toggle]');
  let saved;
  try { saved = localStorage.getItem('y2k38-theme'); } catch (_) {}
  if (saved === 'dark') document.documentElement.dataset.theme = 'dark';
  function syncTheme() {
    const dark = document.documentElement.dataset.theme === 'dark';
    theme.setAttribute('aria-pressed', String(dark));
    theme.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
    theme.title = theme.getAttribute('aria-label');
    theme.querySelector('i').className = dark ? 'ri-sun-line' : 'ri-moon-line';
  }
  theme.addEventListener('click', () => {
    document.documentElement.dataset.theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('y2k38-theme', document.documentElement.dataset.theme); } catch (_) {}
    syncTheme();
  });
  syncTheme();
  const remaining = document.querySelector('[data-countdown]');
  function tickCountdown() {
    if (!remaining) return;
    const seconds = TimeLab.countdown(Date.now());
    remaining.textContent = seconds ? Math.floor(seconds / 86400).toLocaleString() + ' days  ' +
      String(Math.floor(seconds % 86400 / 3600)).padStart(2, '0') + ':' +
      String(Math.floor(seconds % 3600 / 60)).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0') :
      'The signed 32-bit boundary has passed';
  }
  tickCountdown();
  if (remaining) setInterval(tickCountdown, 1000);
  const lab = document.querySelector('[data-lab]');
  if (!lab) return;
  const input = lab.querySelector('[data-timestamp]');
  const range = lab.querySelector('[data-range]');
  const error = lab.querySelector('[data-error]');
  const readout = lab.querySelector('[data-signed]');
  const state = lab.querySelector('[data-state]');
  const bits = lab.querySelector('[data-bits]');
  const announcement = lab.querySelector('[data-announcement]');
  const play = lab.querySelector('[data-action="play"]');
  const nowButton = lab.querySelector('[data-action="now"]');
  let value = TimeLab.MAX32, timer = null, previousOverflow = null, followingNow = false;
  const buttons = [];
  for (let index = 31; index >= 0; index--) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'bit' + (index === 31 ? ' sign-bit' : '');
    button.title = index === 31 ? 'Toggle sign bit (bit 31)' : 'Toggle bit ' + index + ' (2^' + index + ')';
    button.setAttribute('aria-label', button.title);
    const digit = document.createElement('span');
    const label = document.createElement('small');
    label.textContent = index;
    button.append(digit, label);
    button.addEventListener('click', () => { stop(); render(TimeLab.flip(value, index), true); });
    buttons.push(button);
    bits.appendChild(button);
  }
  function stop() {
    followingNow = false;
    if (nowButton) nowButton.setAttribute('aria-pressed', 'false');
    if (timer) clearInterval(timer);
    timer = null;
    if (play) {
      play.innerHTML = '<i class="ri-play-line" aria-hidden="true"></i> Run rollover';
      play.setAttribute('aria-pressed', 'false');
    }
  }
  function render(next, announce = false, preserveInput = false) {
    const data = TimeLab.inspect(next);
    value = data.raw;
    if (!preserveInput) input.value = value.toString();
    error.textContent = '';
    input.removeAttribute('aria-invalid');
    readout.textContent = data.signed.toLocaleString('en-US');
    lab.querySelector('[data-intended]').textContent = data.intended || 'Outside this viewer\'s calendar range';
    lab.querySelector('[data-interpreted]').textContent = data.interpreted;
    lab.querySelector('[data-hex]').textContent = data.hex;
    lab.querySelector('[data-wide]').textContent = data.raw.toLocaleString('en-US');
    lab.dataset.overflow = String(data.overflow);
    state.textContent = data.overflow ? 'Outside signed 32-bit range' : 'Within signed 32-bit range';
    lab.querySelector('[data-explanation]').textContent = data.overflow ?
      'The same low 32 bits represent a different signed value. A 64-bit integer still preserves the requested seconds.' :
      'Both representations preserve these seconds. The leading bit determines the sign of the 32-bit value.';
    buttons.forEach((button, i) => {
      button.firstElementChild.textContent = data.bits[i];
      button.dataset.on = data.bits[i];
      button.setAttribute('aria-pressed', String(data.bits[i] === '1'));
    });
    if (range) {
      const outside = value < TimeLab.MIN32 || value > TimeLab.BOUNDARY;
      range.value = (value < TimeLab.MIN32 ? TimeLab.MIN32 : value > TimeLab.BOUNDARY ? TimeLab.BOUNDARY : value).toString();
      range.disabled = outside;
      lab.querySelector('[data-range-note]').textContent = outside ? 'Timestamp is outside this timeline. Choose a preset to return.' : '';
      range.setAttribute('aria-valuetext', data.intended || value.toString() + ' seconds');
    }
    if (announce || (previousOverflow !== null && data.overflow !== previousOverflow)) {
      announcement.textContent = state.textContent + '. Signed value ' + data.signed + '. ' + data.interpreted;
    }
    previousOverflow = data.overflow;
  }
  function deviceSeconds() { return BigInt(Math.floor(Date.now() / 1000)); }
  function followNow(announce = false) {
    stop();
    followingNow = true;
    if (nowButton) nowButton.setAttribute('aria-pressed', 'true');
    render(deviceSeconds(), announce);
  }
  input.addEventListener('focus', stop);
  if (range) range.addEventListener('focus', stop);
  input.addEventListener('input', () => {
    stop();
    try { render(TimeLab.parse(input.value), false, true); }
    catch (e) { error.textContent = e.message; input.setAttribute('aria-invalid', 'true'); }
  });
  if (range) range.addEventListener('input', () => { stop(); render(range.value); });
  lab.querySelectorAll('[data-action]').forEach(button => button.addEventListener('click', () => {
    const action = button.dataset.action;
    if (action === 'play') {
      if (timer) { stop(); return; }
      stop();
      render(TimeLab.MAX32 - 3n, true);
      button.innerHTML = '<i class="ri-pause-line" aria-hidden="true"></i> Pause';
      button.setAttribute('aria-pressed', 'true');
      let ticks = 0;
      timer = setInterval(() => { render(value + 1n); if (++ticks >= 7) stop(); }, 850);
      return;
    }
    if (action === 'now') { followNow(true); return; }
    stop();
    const next = action === 'epoch' ? 0n : action === 'last' ? TimeLab.MAX32 :
      action === 'overflow' ? TimeLab.BOUNDARY : value + (action === 'back' ? -1n : 1n);
    try { render(next, true); } catch (e) { error.textContent = e.message; }
  }));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { if (timer) stop(); }
    else if (followingNow) render(deviceSeconds());
  });
  followNow();
  setInterval(() => {
    if (followingNow && !document.hidden) render(deviceSeconds());
  }, 1000);
})();

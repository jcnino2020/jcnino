import { classicThrust, fixedClock, stateMachine, STEP } from './game/core.js'
import { CLASSIC_PARCEL_SIZE, releaseClassic, stepClassicPackage } from './game/physics.js'
import { attachInput, bindings as defaultBindings } from './game/input.js'

// Game constants and settings
let W = 1280;
let H = 720;
const ROAD_H = 96;
const SIDE_H = 26;
let STAND_Y = H - ROAD_H - SIDE_H;
const CAM_SPEED = 150;
const GOAL_SCORE = 2500;
const MAX_LIVES = 3;
const HIT_R = 22;
const DROP_COOLDOWN = 0.45;
const DELIVER_RADIUS = 88;

// Drone speed and scroll speed for each level (5 levels)
const LEVELS = [
  null,
  { accel: 1500, maxSpeed: 330, camSpeed: 150, name: 'MORNING SHIFT', color: '#38BDF8' },
  { accel: 1750, maxSpeed: 370, camSpeed: 175, name: 'MIDDAY RUSH', color: '#2DD4BF' },
  { accel: 1950, maxSpeed: 405, camSpeed: 200, name: 'SUNSET SHIFT', color: '#F59E0B' },
  { accel: 2100, maxSpeed: 435, camSpeed: 225, name: 'TWILIGHT STORM', color: '#C084FC' },
  { accel: 2250, maxSpeed: 465, camSpeed: 250, name: 'MIDNIGHT EXPRESS', color: '#FDE047' }
];

// Color palettes for city buildings and props
const PALETTE = [
  { c: '#D98A6C', roof: '#A3583E' },
  { c: '#E3B873', roof: '#A87C38' },
  { c: '#7FA89B', roof: '#4B7367' },
  { c: '#7B9BB8', roof: '#4B6985' },
  { c: '#B8ABA0', roof: '#7D7066' },
  { c: '#D49B6A', roof: '#9E6A3E' },
  { c: '#E6DFD3', roof: '#9E9589' }
];
const MIDPAL = ['#94A3B8', '#8395AD', '#A5B4C7', '#7889A0'];
const FARPAL = ['#CBD5E1', '#BCC8D8', '#D8E0EB'];
const AWCOLS = ['#C84517', '#0F766E', '#D97706', '#2563EB', '#475569'];
const NEON = ['#F59E0B', '#38BDF8', '#2DD4BF', '#FB7185'];
const SIGNS = ['CARGO', 'DISPATCH', 'DEPOT', '24H', 'TRANSIT', 'HANGAR', 'PARCEL', 'EXPRESS', 'FREIGHT', 'HUB'];
const ADS = ['SKYWARD DISPATCH', 'SE-01 FREIGHT', 'URBAN AIRWAY', 'EXPRESS COURIER', 'APEX LOGISTICS', 'TERMINAL 4'];
const CONF = ['#C84517', '#F59E0B', '#0F766E', '#38BDF8', '#141B29', '#94A3B8'];

// Game state variables
let mode = 'menu';
const lifecycle = stateMachine('menu', {
  menu: ['play'], play: ['pause', 'over', 'win', 'menu'],
  pause: ['play', 'menu'], over: ['play', 'menu'], win: ['play', 'menu'],
});
const clock = fixedClock();

function changeMode(next) {
  if (mode === next) return true;
  if (!lifecycle.move(next)) return false;
  mode = lifecycle.state;
  clock.reset();
  keys.clear();
  return true;
}
let cam = 0;
let tGlobal = 0;
let playTime = 0;
let score = 0;
let dispScore = 0;
let lives = MAX_LIVES;
let level = 1;
let deliveries = 0;
let crashes = 0;
let bullseyes = 0;
let streak = 0;
let bestStreak = 0;
let invulnUntil = 0;
let dropCd = 0;
let genX = 0;
let midX = 0;
let farX = 0;
let chunkN = 0;
let sinceCustomer = 0;
let lastPole = null;
let cleanT = 0;
let muted = false;
let shielded = false;
let endless = false;
let wonShift = false;
let winAt = 0;
let misses = 0;
let traveled = 0;
let previousReport = { time: 0, deliveries: 0, attempts: 0, perfect: 0, hits: 0, distance: 0 };
let legendTimer = 0;
let birdTimer = 2.5;
let carTimer = 1.2;
let boost = 100;

const STORE_SCORE = 'skyward_best_score';
const STORE_TIME = 'skyward_best_time';

function loadBest(key) {
  try {
    const val = localStorage.getItem(key);
    return val !== null ? Number(val) : null;
  } catch (err) {
    return null;
  }
}

function saveBest(key, val) {
  try {
    localStorage.setItem(key, String(val));
  } catch (err) {
    // ignore storage errors
  }
}

const platforms = [];
const obstacles = [];
const customers = [];
const packages = [];
const pickups = [];
const hazards = [];
const cars = [];
const parts = [];
const statics = [];
const midStatics = [];
const farStatics = [];

const player = { x: 300, y: 280, vx: 0, vy: 0, tilt: 0 };

// DOM elements
const stage = document.getElementById('stage');
const camEl = document.getElementById('cam');
const skyEl = document.getElementById('sky');
const farEl = document.getElementById('farLayer');
const midEl = document.getElementById('midLayer');
const worldEl = document.getElementById('world');
const actorsEl = document.getElementById('actors');
const pkgsEl = document.getElementById('pkgs');
const fxEl = document.getElementById('fx');
const fxScrEl = document.getElementById('fxScreen');
const roadEl = document.getElementById('road');
const walkEl = document.getElementById('walk');
const droneEl = document.getElementById('drone');
const shadowEl = document.getElementById('dshadow');
const aimEl = document.getElementById('aimGuide');
const aimLine = document.getElementById('aimLine');
const aimOutline = document.getElementById('aimOutline');
const aimPoint = document.getElementById('aimPoint');
let aimedCustomer = null;
const legendEl = document.getElementById('legend');
const scoreEl = document.getElementById('scoreVal');
const heartsEl = document.getElementById('hearts');
const levelEl = document.getElementById('levelVal');
const streakEl = document.getElementById('streakVal');
const streakChipEl = document.getElementById('streakChip');
const boostFillEl = document.getElementById('boostFill');
const carsEl = document.getElementById('cars');
const starsEl = document.getElementById('stars');
const stormRainEl = document.getElementById('stormRain');
const toastEl = document.getElementById('toast');
const flashEl = document.getElementById('flash');

// Helper functions
function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

function randomInt(min, max) {
  return Math.floor(randomRange(min, max + 1));
}

function randomChoice(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function clampVal(val, min, max) {
  if (val < min) return min;
  if (val > max) return max;
  return val;
}

function createBox(tag, className, parent) {
  const el = document.createElement(tag);
  if (className) {
    el.className = className;
  }
  (parent || worldEl).appendChild(el);
  return el;
}

function setPos(el, x, y) {
  el.style.left = x + 'px';
  el.style.top = y + 'px';
}

function addStatic(el, x, w) {
  statics.push({ el: el, x: x, w: w });
}

function surfaceTopY(wx, fromY) {
  let best = STAND_Y;
  for (let i = 0; i < platforms.length; i++) {
    const p = platforms[i];
    if (wx >= p.x0 && wx <= p.x1 && p.topY >= fromY && p.topY < best) {
      best = p.topY;
    }
  }
  return best;
}

// Web Audio sound effects
let AC = null;
let humOsc = null;
let humGain = null;
let audioSettings = { master: 80, effects: 80, music: 28, ambience: 50, mute: false };
let musicTime = 0;
let musicStep = 0;
let inputBindings;
let flightSettings = {};

function configureAudio(settings, getBindings) {
  flightSettings = settings;
  audioSettings = settings;
  inputBindings = getBindings ?? inputBindings;
  setMuted(settings.mute);
}

function setMuted(value) {
  muted = value;
  const control = document.getElementById('btnSound');
  control.classList.toggle('muted', muted);
  control.setAttribute('aria-pressed', String(muted));
  if (muted) setHum(0);
}

function music(dt, variation = 0) {
  if (!AC || muted || !audioSettings.music) return;
  musicTime -= dt;
  if (musicTime > 0) return;
  musicTime = 0.62 - 0.035 * Math.min(5, variation);
  const notes = [130.81, 164.81, 196, 261.63, 196, 164.81, 146.83, 174.61];
  const pitch = notes[(musicStep++ + variation * 2) % notes.length];
  playTone(pitch, { type: 'sine', channel: 'music', dur: 0.64, vol: 0.07 });
  if (musicStep % 4 === 1) playTone(pitch / 2, { type: 'triangle', channel: 'music', dur: 0.74, vol: 0.03 });
}

function initAudio() {
  if (!AC) {
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return null;
    AC = new Context();
  }
  if (AC.state === 'suspended') {
    AC.resume().catch(() => {});
  }
  return AC;
}

function playTone(freq, options) {
  if (muted || !AC) return;
  const opts = options || {};
  const dur = opts.dur !== undefined ? opts.dur : 0.15;
  const type = opts.type || 'sine';
  const volume = (opts.vol ?? 0.2) * audioSettings.master * audioSettings[opts.channel ?? 'effects'] / 10000;
  if (volume <= 0) return;
  const vol = Math.max(0.0001, volume);
  const slide = opts.slide || 0;
  const delay = opts.delay || 0;

  const startTime = AC.currentTime + delay;
  const osc = AC.createOscillator();
  const gain = AC.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);
  if (slide) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), startTime + dur);
  }

  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(vol, startTime + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + dur);

  osc.connect(gain);
  gain.connect(AC.destination);
  osc.start(startTime);
  osc.stop(startTime + dur + 0.05);
}

const SFX = {
  click: function () {
    playTone(700, { type: 'triangle', dur: 0.08, vol: 0.15 });
  },
  drop: function () {
    playTone(520, { type: 'sawtooth', dur: 0.2, vol: 0.12, slide: -340 });
  },
  thud: function () {
    playTone(130, { type: 'triangle', dur: 0.12, vol: 0.2, slide: -40 });
  },
  deliver: function () {
    const notes = [660, 880, 1174];
    for (let i = 0; i < notes.length; i++) {
      playTone(notes[i], { type: 'triangle', dur: 0.14, vol: 0.18, delay: i * 0.07 });
    }
  },
  upgrade: function () {
    const notes = [523, 659, 784, 1046];
    for (let i = 0; i < notes.length; i++) {
      playTone(notes[i], { type: 'square', dur: 0.12, vol: 0.11, delay: i * 0.09 });
    }
  },
  hurt: function () {
    playTone(210, { type: 'square', dur: 0.28, vol: 0.22, slide: -130 });
    playTone(90, { type: 'sawtooth', dur: 0.25, vol: 0.14, delay: 0.02 });
  },
  over: function () {
    const notes = [392, 330, 262, 196];
    for (let i = 0; i < notes.length; i++) {
      playTone(notes[i], { type: 'triangle', dur: 0.3, vol: 0.18, delay: i * 0.22 });
    }
  },
  win: function () {
    const notes = [523, 659, 784, 1046, 784, 1046];
    for (let i = 0; i < notes.length; i++) {
      playTone(notes[i], { type: 'triangle', dur: 0.16, vol: 0.2, delay: i * 0.11 });
    }
  }
};

function startHum() {
  if (humOsc || !AC) return;
  humOsc = AC.createOscillator();
  humOsc.type = 'sawtooth';
  humOsc.frequency.value = 68;

  const filter = AC.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 220;

  humGain = AC.createGain();
  humGain.gain.value = 0;

  humOsc.connect(filter);
  filter.connect(humGain);
  humGain.connect(AC.destination);
  humOsc.start();
}

function setHum(target) {
  if (humGain && AC) {
    humGain.gain.setTargetAtTime(muted ? 0 : target * audioSettings.master * audioSettings.ambience / 10000, AC.currentTime, 0.1);
  }
}

// Keyboard and touch input
let classicInputEnabled = true;
const keys = attachInput({
  active: () => classicInputEnabled && (mode === 'play' || mode === 'pause'),
  getBindings: () => inputBindings?.() ?? defaultBindings,
  controls: stage.querySelectorAll('#touchControls [data-action]'),
  onBlur: () => { if (mode === 'play') togglePause(); },
  onAction(action) {
    if (action === 'pause') togglePause();
    else if (action === 'restart' && mode === 'pause') startGame(endless);
    else if (action === 'mute') toggleSound();
    else if (action === 'drop' && mode === 'play') dropPackage();
    else return false;
  },
});
document.addEventListener('visibilitychange', () => clock.reset());

// Procedural city generation
function makeChunk(x) {
  chunkN++;
  const w = randomRange(560, 780);
  let bInfo = null;
  const r = Math.random();

  if (chunkN > 2 && r < 0.13) {
    makePlaza(x, w);
  } else if (chunkN > 2 && r < 0.25) {
    bInfo = makeDepot(x, w);
  } else {
    bInfo = makeBlock(x, w);
  }

  if (r >= 0.13 || Math.random() < 0.3) {
    streetProps(x, w);
  }

  const craneEvery = level >= 2 ? 6 : 9;
  const craneRem = level >= 2 ? 3 : 5;
  if (chunkN % craneEvery === craneRem && Math.random() < (level >= 2 ? 0.9 : 0.8)) {
    addCrane(x + randomRange(180, w - 180));
  }

  sinceCustomer++;
  if (chunkN > 1 && (Math.random() < 0.55 || sinceCustomer >= 3)) {
    if (trySpawnCustomer(x, w, bInfo)) {
      sinceCustomer = 0;
    }
  }

  if (chunkN > 2 && Math.random() < 0.28) {
    const py = bInfo ? bInfo.y - randomRange(70, 130) : STAND_Y - randomRange(240, 380);
    spawnPickup(x + randomRange(100, w - 100), py, Math.random() < 0.55 ? 'shield' : 'heart');
  }

  return w;
}

function makeBlock(x, w) {
  const bw = w - randomRange(70, 120);
  const bx = x + randomRange(10, Math.max(11, w - bw - 10));
  const bh = randomRange(180, 430);
  const pal = randomChoice(PALETTE);

  const el = createBox('div', 'bld');
  el.style.width = bw + 'px';
  el.style.height = bh + 'px';
  setPos(el, bx, STAND_Y - bh);
  el.style.setProperty('--c', pal.c);
  el.style.setProperty('--roof', pal.roof);
  el.style.setProperty('--glass', Math.random() < 0.22 ? 'rgba(255,229,150,0.85)' : 'rgba(31,58,92,0.38)');

  createBox('div', 'win', el);
  createBox('div', 'door', el);

  if (Math.random() < 0.72) {
    const aw = createBox('div', 'awning', el);
    aw.style.setProperty('--aw', randomChoice(AWCOLS));
  }
  if (Math.random() < 0.38) {
    const sideClass = Math.random() < 0.5 ? 's-l' : 's-r';
    const s = createBox('div', 'sign ' + sideClass, el);
    s.textContent = randomChoice(SIGNS);
    s.style.setProperty('--sc', randomChoice(NEON));
    s.style.top = randomRange(18, 45) + '%';
  }
  addStatic(el, bx, bw);

  const topY = STAND_Y - bh;
  platforms.push({ x0: bx + 8, x1: bx + bw - 8, topY: topY });
  roofProps({ x: bx, w: bw, y: topY });
  return { x: bx, y: topY, w: bw, h: bh };
}

function makeDepot(x, w) {
  const bw = w - randomRange(60, 90);
  const bx = x + randomRange(8, Math.max(9, w - bw - 8));
  const bh = randomRange(120, 160);
  const pal = randomChoice(PALETTE);

  const el = createBox('div', 'bld depot');
  el.style.width = bw + 'px';
  el.style.height = bh + 'px';
  setPos(el, bx, STAND_Y - bh);
  el.style.setProperty('--c', pal.c);
  el.style.setProperty('--roof', pal.roof);
  createBox('div', 'roll', el);

  const ds = createBox('div', 'docksign', el);
  ds.textContent = 'DEPOT';
  addStatic(el, bx, bw);

  const crateCount = randomInt(1, 2);
  for (let i = 0; i < crateCount; i++) {
    const cr = createBox('div', 'crate');
    const cx = bx + bw + 8 + i * 34;
    setPos(cr, cx, STAND_Y - 30);
    addStatic(cr, cx, 30);
  }

  const topY = STAND_Y - bh;
  platforms.push({ x0: bx + 8, x1: bx + bw - 8, topY: topY });
  return { x: bx, y: topY, w: bw, h: bh };
}

function makePlaza(x, w) {
  const count = randomInt(2, 3);
  for (let i = 0; i < count; i++) {
    addTree(x + randomRange(60, w - 60));
  }
  if (Math.random() < 0.5) {
    const b = createBox('div', 'bench');
    const bx = x + randomRange(70, w - 120);
    setPos(b, bx, STAND_Y - 18);
    addStatic(b, bx, 56);
  }
  if (Math.random() < 0.5) {
    const h = createBox('div', 'hydrant');
    const hx = x + randomRange(60, w - 80);
    setPos(h, hx, STAND_Y - 30);
    addStatic(h, hx, 20);
  }
}

function streetProps(x, w) {
  const boost = level >= 2 ? 0.15 : 0;
  if (Math.random() < 0.5 + boost) addPole(x + randomRange(50, w - 50));
  if (Math.random() < 0.4 + boost) addTree(x + randomRange(60, w - 60));
  if (Math.random() < 0.2 + boost) addTLight(x + randomRange(70, w - 70));
  if (Math.random() < 0.22 + boost) addBarrier(x + randomRange(60, w - 60));
}

function addPole(px) {
  const POLE_H = 300;
  const wy = STAND_Y - POLE_H + 26;
  const el = createBox('div', 'pole');
  el.style.width = '10px';
  el.style.height = POLE_H + 'px';
  setPos(el, px - 5, STAND_Y - POLE_H);
  obstacles.push({ x: px - 6, y: STAND_Y - POLE_H, w: 12, h: POLE_H });
  addStatic(el, px - 5, 10);

  if (lastPole && px - lastPole.x > 180 && px - lastPole.x < 620) {
    const x0 = lastPole.x;
    const d = px - x0;
    const wel = createBox('div', 'wire');
    wel.style.width = d + 'px';
    setPos(wel, x0, lastPole.wy);
    obstacles.push({ x: x0 + 10, y: lastPole.wy + 10, w: d - 20, h: 8 });
    addStatic(wel, x0, d);
  }
  lastPole = { x: px, wy: wy };
}

function addTree(tx) {
  const el = createBox('div', 'tree');
  el.innerHTML = '<div class="canopy"></div><div class="trunk"></div>';
  setPos(el, tx - 37, STAND_Y - 178);
  obstacles.push({ x: tx - 30, y: STAND_Y - 172, w: 60, h: 100 });
  addStatic(el, tx - 37, 74);
}

function addTLight(tx) {
  const el = createBox('div', 'tl');
  el.style.height = '190px';
  el.innerHTML = '<div class="head"><i></i><i></i><i></i></div>';
  setPos(el, tx - 8, STAND_Y - 190);
  obstacles.push({ x: tx - 15, y: STAND_Y - 190, w: 30, h: 56 });
  addStatic(el, tx - 15, 30);
}

function addBarrier(bx) {
  const el = createBox('div', 'barrier');
  setPos(el, bx - 24, STAND_Y - 26);
  obstacles.push({ x: bx - 24, y: STAND_Y - 26, w: 48, h: 26 });
  addStatic(el, bx - 24, 48);
}

function addCrane(cx) {
  const craneH = 460;
  const ty = STAND_Y - craneH;
  const jy = ty - 14;
  const tower = createBox('div', 'craneT');
  tower.style.height = craneH + 'px';
  tower.innerHTML = '<div class="beacon"></div>';
  setPos(tower, cx - 10, ty);

  const jib = createBox('div', 'craneJ');
  jib.style.width = '320px';
  jib.innerHTML = '<div class="cable"></div><div class="loadbox"></div>';
  setPos(jib, cx - 60, jy);

  obstacles.push({ x: cx - 60, y: jy - 4, w: 320, h: 18 });
  obstacles.push({ x: cx - 10, y: ty, w: 20, h: craneH });
  addStatic(tower, cx - 10, 20);
  addStatic(jib, cx - 60, 320);
}

function roofProps(b) {
  const zones = [];
  const count = randomInt(level >= 2 ? 1 : 0, level >= 2 ? 3 : 2);
  const widths = { ac: 38, tank: 58, ant: 14, dish: 32, board: 132 };
  const types = ['ac', 'tank', 'ant', 'dish', 'board'];

  for (let i = 0; i < count; i++) {
    const t = randomChoice(types);
    const wd = widths[t];
    let px = null;

    for (let a = 0; a < 6; a++) {
      const cand = randomRange(b.x + 12, Math.max(b.x + 13, b.x + b.w - 12 - wd));
      let overlaps = false;
      for (let z = 0; z < zones.length; z++) {
        if (cand < zones[z][1] + 18 && cand + wd > zones[z][0] - 18) {
          overlaps = true;
          break;
        }
      }
      if (!overlaps) {
        px = cand;
        break;
      }
    }
    if (px === null) continue;
    zones.push([px, px + wd]);
    addRoofProp(t, px, b.y);
  }
}

function addRoofProp(t, px, ry) {
  let el;
  if (t === 'ac') {
    el = createBox('div', 'ac');
    el.innerHTML = '<i></i>';
    setPos(el, px, ry - 26);
    obstacles.push({ x: px + 2, y: ry - 26, w: 34, h: 26 });
    addStatic(el, px, 38);
  } else if (t === 'tank') {
    el = createBox('div', 'tank');
    el.innerHTML = '<div class="t-top"></div><div class="t-body"></div>';
    setPos(el, px, ry - 84);
    obstacles.push({ x: px + 6, y: ry - 80, w: 46, h: 80 });
    addStatic(el, px, 58);
  } else if (t === 'ant') {
    el = createBox('div', 'ant');
    el.innerHTML = '<i></i>';
    el.style.height = '88px';
    setPos(el, px, ry - 88);
    obstacles.push({ x: px + 4, y: ry - 88, w: 6, h: 88 });
    addStatic(el, px, 14);
  } else if (t === 'dish') {
    el = createBox('div', 'dish');
    setPos(el, px, ry - 28);
    obstacles.push({ x: px + 2, y: ry - 26, w: 28, h: 26 });
    addStatic(el, px, 32);
  } else {
    el = createBox('div', 'rboard');
    el.innerHTML = '<div class="panel">' + randomChoice(ADS) + '</div>';
    setPos(el, px, ry - 92);
    obstacles.push({ x: px + 4, y: ry - 92, w: 124, h: 58 });
    addStatic(el, px, 132);
  }
}

function addBalcony(x0, y, w2) {
  const el = createBox('div', 'balcony');
  el.style.width = w2 + 'px';
  setPos(el, x0, y);
  platforms.push({ x0: x0 + 6, x1: x0 + w2 - 6, topY: y });
  addStatic(el, x0, w2);
}

// Parallax background layers
function makeMid(x) {
  const w = randomRange(300, 520);
  const h = randomRange(120, 300);
  const el = createBox('div', 'mbld', midEl);
  el.style.width = w + 'px';
  el.style.height = h + 'px';
  el.style.backgroundColor = randomChoice(MIDPAL);
  setPos(el, x, H - 70 - h);
  midStatics.push({ el: el, x: x, w: w });
  return w + randomRange(40, 150);
}

function makeFar(x) {
  const w = randomRange(380, 640);
  const h = randomRange(70, 180);
  const el = createBox('div', 'fbld', farEl);
  el.style.width = w + 'px';
  el.style.height = h + 'px';
  el.style.background = randomChoice(FARPAL);
  setPos(el, x, H - 150 - h);
  farStatics.push({ el: el, x: x, w: w });
  return w + randomRange(60, 200);
}

function ensureWorld() {
  while (genX < cam + W * 1.9) {
    genX += makeChunk(genX);
  }
  while (midX < cam * 0.45 + W * 1.6) {
    midX += makeMid(midX);
  }
  while (farX < cam * 0.18 + W * 1.6) {
    farX += makeFar(farX);
  }
}

// Customers, pickups, and package drops
function trySpawnCustomer(x, w, b) {
  const spots = [];

  const sx = x + randomRange(80, w - 80);
  const sidewalkBlocked = obstacles.some(function (o) {
    return o.y > STAND_Y - 130 && Math.abs(o.x + o.w / 2 - sx) < 55;
  });
  if (!sidewalkBlocked) {
    spots.push({ x: sx, y: STAND_Y });
  }

  if (b) {
    for (let i = 0; i < 2; i++) {
      const rx = randomRange(b.x + 46, Math.max(b.x + 47, b.x + b.w - 46));
      const roofBlocked = obstacles.some(function (o) {
        return o.y > b.y - 140 && o.y < b.y + 40 && Math.abs(o.x + o.w / 2 - rx) < 70;
      });
      if (!roofBlocked) {
        spots.push({ x: rx, y: b.y });
        break;
      }
    }
    if (b.h > 270 && Math.random() < 0.55) {
      const bw2 = 92;
      const bx0 = b.x + b.w * randomRange(0.15, 0.55);
      const by = b.y + b.h * randomRange(0.3, 0.55);
      addBalcony(bx0, by, bw2);
      spots.push({ x: bx0 + bw2 / 2, y: by });
    }
  }

  if (spots.length === 0) return false;
  const chosen = randomChoice(spots);
  spawnCustomer(chosen.x, chosen.y);
  return true;
}

const BOX_SVG =
  '<svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true">' +
  '<rect x="2" y="3" width="16" height="14" rx="2" fill="#D49A6A" stroke="#141B29" stroke-width="1.8"/>' +
  '<rect x="8.5" y="3" width="3" height="14" fill="#F5E6D3"/>' +
  '<line x1="2" y1="8" x2="18" y2="8" stroke="#141B29" stroke-width="1.4"/>' +
  '</svg>';
const VIP_BOX_SVG =
  '<svg viewBox="0 0 28 20" width="22" height="15" aria-hidden="true">' +
  '<path d="M6 2L1 11h4l-1 7 6-9H6l2-7z" fill="#D97706" stroke="#141B29" stroke-width="1.2" stroke-linejoin="round"/>' +
  '<rect x="12" y="3" width="14" height="14" rx="2" fill="#D49A6A" stroke="#141B29" stroke-width="1.8"/>' +
  '<rect x="17.5" y="3" width="3" height="14" fill="#F5E6D3"/>' +
  '</svg>';

function spawnCustomer(fx, fy) {
  const vip = chunkN > 2 && Math.random() < 0.28;
  const el = createBox('div', 'customer c' + randomInt(1, 5) + (vip ? ' vip' : ''), actorsEl);
  setPos(el, fx - 16, fy - 48);
  el.innerHTML =
    '<div class="ring"></div>' +
    (vip ? '<div class="vip-bar"><i></i></div>' : '') +
    '<div class="bubble">' + (vip ? VIP_BOX_SVG : BOX_SVG) + '</div>' +
    '<div class="cwrap"><div class="c-head"></div><div class="c-arm"></div><div class="c-torso"></div></div>';

  customers.push({
    x: fx,
    feetY: fy,
    state: 'idle',
    vip: vip,
    vipTimer: 9,
    vipMax: 9,
    el: el
  });
}

function spawnPickup(wx, wy, type) {
  const el = createBox('div', 'pickup ' + type, actorsEl);
  if (type === 'heart') {
    el.innerHTML =
      '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">' +
      '<path d="M12 20.5s-7-4.4-9-8.7C1.2 8.1 3.4 4.5 7 4.5c2 0 3.6 1.1 5 2.8 1.4-1.7 3-2.8 5-2.8 3.6 0 5.8 3.6 4 7.3-2 4.3-9 8.7-9 8.7z" fill="#FB7185" stroke="#141B29" stroke-width="2" stroke-linejoin="round"/>' +
      '</svg>';
  } else {
    el.innerHTML =
      '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">' +
      '<path d="M12 2.5l7.5 3.2v5.8c0 4.9-3.2 9.1-7.5 10.5-4.3-1.4-7.5-5.6-7.5-10.5V5.7L12 2.5z" fill="#2DD4BF" stroke="#141B29" stroke-width="2" stroke-linejoin="round"/>' +
      '<path d="M12 6.5v11M8.5 10.5h7" stroke="#141B29" stroke-width="2" stroke-linecap="round"/>' +
      '</svg>';
  }
  setPos(el, wx, wy);
  pickups.push({ x: wx, y: wy, type: type, el: el });
}

function spawnBird() {
  const wx = cam + W + 60;
  const wy = STAND_Y - randomRange(150, 440);
  const el = createBox('div', 'bird', actorsEl);
  el.innerHTML =
    '<svg viewBox="0 0 34 18" width="34" height="18" aria-hidden="true">' +
    '<path d="M2 12 Q9 3 17 10 Q25 3 32 12" fill="none" stroke="#141B29" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>' +
    '</svg>';
  setPos(el, wx, wy);
  hazards.push({
    x: wx,
    y: wy,
    vx: -randomRange(105, 175),
    phase: randomRange(0, 6.28),
    el: el
  });
}

function spawnCar() {
  if (!carsEl) return;
  const goingLeft = Math.random() < 0.5;
  const laneY = goingLeft ? 16 : 56;
  const startX = goingLeft ? W + 80 : -80;
  const speed = goingLeft ? -randomRange(220, 320) : randomRange(110, 190);
  const carColors = ['#C84517', '#F59E0B', '#0F766E', '#2563EB', '#E2E8F0'];

  const el = createBox('div', 'car' + (goingLeft ? ' left' : ''), carsEl);
  el.style.setProperty('--car-c', randomChoice(carColors));
  el.innerHTML =
    '<div class="car-top"></div>' +
    '<div class="wheel w1"></div>' +
    '<div class="wheel w2"></div>' +
    '<div class="headlight"></div>';
  setPos(el, startX, laneY);
  cars.push({ x: startX, y: laneY, vx: speed, el: el });
}

function updateCars(dt) {
  carTimer -= dt;
  if (carTimer <= 0) {
    carTimer = randomRange(1.6, 3.4);
    spawnCar();
  }
  for (let i = cars.length - 1; i >= 0; i--) {
    const c = cars[i];
    c.x += c.vx * dt;
    c.el.style.left = c.x + 'px';
    if (c.x < -120 || c.x > W + 120) {
      c.el.remove();
      cars.splice(i, 1);
    }
  }
}

function dropPackage() {
  if (mode !== 'play' || dropCd > 0) return;
  dropCd = DROP_COOLDOWN;
  droneEl.classList.add('reloading');
  SFX.drop();

  const el = createBox('div', 'pkg', pkgsEl);
  packages.push({
    ...releaseClassic(player, cam),
    rot: randomRange(-8, 8),
    vr: randomRange(-100, 100),
    el: el,
    state: 'fall'
  });
}

function updatePackages(dt) {
  for (let i = packages.length - 1; i >= 0; i--) {
    const p = packages[i];
    if (p.state !== 'fall') continue;

    p.rot += p.vr * dt;
    const impact = stepClassicPackage(p, dt, surfaceTopY);
    if (impact?.bounced) {
      p.vr *= -0.5;
      SFX.thud();
    } else if (impact) {
      resolvePackage(p, impact.surface);
      packages.splice(i, 1);
      continue;
    }
    p.el.style.transform = 'translate(' + (p.x - 16) + 'px, ' + p.y + 'px) rotate(' + p.rot + 'deg)';
  }
}

function resolvePackage(p, surfY) {
  p.el.style.left = (p.x - 16) + 'px';
  p.el.style.top = p.y + 'px';
  p.el.style.transform = 'none';
  p.el.classList.add('landed');
  setTimeout(function () {
    p.el.remove();
  }, 800);
  dust(p.x, surfY);

  const hitCustomer = deliveryCustomer(p.x, surfY);

  if (hitCustomer) {
    deliverSuccess(p, hitCustomer, surfY);
  } else {
    streak = 0;
    updateHUD();
    misses++;
    popupText(p.x, surfY - 40, 'miss', 'miss');
  }
}

function deliverSuccess(p, c, surfY) {
  c.state = 'done';
  c.el.classList.add('happy');
  setTimeout(function () {
    c.el.remove();
  }, 2600);

  streak++;
  if (streak > bestStreak) bestStreak = streak;
  const mult = streak >= 4 ? 3 : (streak >= 2 ? 2 : 1);
  const isBullseye = Math.abs(c.x - p.x) < 28;
  if (isBullseye) bullseyes++;

  const vipMult = c.vip ? 2 : 1;
  const pts = (isBullseye ? 150 : 100) * mult * vipMult;
  deliveries++;
  addScore(pts);
  updateHUD();

  const prefix = c.vip ? 'VIP ' : (isBullseye ? 'BULLSEYE ' : '');
  const label = prefix + '+' + pts + (mult > 1 ? ' (x' + mult + ')' : '');
  popupText(p.x, surfY - 50, label, (isBullseye || c.vip) ? 'bullseye' : '');
  popupText(c.x + randomRange(-14, 14), c.feetY - 70, '♥', 'heart');
  confetti(p.x, surfY - 8, (isBullseye || c.vip) ? 22 : 14);
  SFX.deliver();
}

function addScore(n) {
  score += n;
  const targetLevel = Math.min(5, Math.floor(score / 500) + 1);
  if (targetLevel > level) {
    levelUp(targetLevel);
  }
  if (!endless && !wonShift && score >= GOAL_SCORE && mode === 'play') {
    wonShift = true;
    winAt = tGlobal + 0.65;
  }
}

function levelUp(n) {
  level = n;
  stage.classList.remove('lvl1', 'lvl2', 'lvl3', 'lvl4', 'lvl5');
  stage.classList.add('lvl' + n);
  droneEl.classList.remove('lvl1', 'lvl2', 'lvl3', 'lvl4', 'lvl5');
  droneEl.classList.add('lvl' + n);
  levelEl.textContent = 'LV ' + n;
  levelEl.className = n >= 4 ? 'lv3' : (n >= 2 ? 'lv2' : '');

  const info = LEVELS[n];
  showToast('DRONE UPGRADED!', info.name + ' • LEVEL ' + n, info.color);
  SFX.upgrade();
  confetti(player.x + cam, player.y, 12);
}

// Visual effects and particles
function popupText(wx, wy, txt, cls) {
  const e = createBox('div', 'pop ' + (cls || ''), fxEl);
  e.textContent = txt;
  setPos(e, wx - 30, wy);
  setTimeout(function () {
    e.remove();
  }, 1000);
}

function spawnPart(parent, cls, x, y, opts) {
  if (flightSettings.particles === 'off' || parts.length >= 160) return;
  const el = createBox('i', cls, parent);
  const size = opts.size || 6;
  el.style.width = size + 'px';
  el.style.height = size + 'px';
  if (opts.color) el.style.background = opts.color;

  parts.push(Object.assign({
    el: el,
    x: x,
    y: y,
    vx: 0,
    vy: 0,
    g: 600,
    life: 0.8,
    max: 0.8,
    rot: 0,
    vr: 0
  }, opts));
}

function confetti(wx, wy, count) {
  if (flightSettings.particles === 'off') return;
  const n = Math.min(160 - parts.length, (count || 14) * (flightSettings.particles === 'low' ? 0.5 : 1));
  for (let i = 0; i < n; i++) {
    const el = createBox('i', 'cf', fxEl);
    el.style.width = randomRange(5, 9) + 'px';
    el.style.height = randomRange(6, 11) + 'px';
    el.style.background = randomChoice(CONF);
    parts.push({
      el: el,
      x: wx,
      y: wy,
      vx: randomRange(-170, 170),
      vy: randomRange(-280, -70),
      g: 620,
      life: randomRange(0.6, 1),
      max: 1,
      rot: randomRange(0, 360),
      vr: randomRange(-400, 400)
    });
  }
}

function sparks(wx, wy) {
  const colors = ['#ffd166', '#ff9f43', '#ff5d5d', '#fff'];
  for (let i = 0; i < 11; i++) {
    spawnPart(fxEl, 'sp', wx, wy, {
      color: randomChoice(colors),
      vx: randomRange(-220, 220),
      vy: randomRange(-240, 40),
      g: 900,
      life: randomRange(0.25, 0.45),
      max: 0.45,
      size: randomRange(4, 7)
    });
  }
}

function dust(wx, wy) {
  for (let i = 0; i < 5; i++) {
    spawnPart(fxEl, 'du', wx + randomRange(-10, 10), wy - 4, {
      vx: randomRange(-40, 40),
      vy: randomRange(-50, -10),
      g: -30,
      life: randomRange(0.3, 0.5),
      max: 0.5,
      size: randomRange(5, 9)
    });
  }
}

function enginePuff() {
  const color = LEVELS[level] ? LEVELS[level].color : '#38BDF8';
  spawnPart(fxScrEl, 'ep', player.x + randomRange(-6, 6), player.y + 32, {
    color: color,
    vx: randomRange(-16, 16),
    vy: randomRange(50, 100),
    g: 60,
    life: 0.35,
    max: 0.35,
    size: randomRange(3, 6)
  });
}

function updateParts(dt) {
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    p.life -= dt;
    if (p.life <= 0) {
      p.el.remove();
      parts.splice(i, 1);
      continue;
    }
    p.vy += p.g * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.rot += (p.vr || 0) * dt;
    p.el.style.transform = 'translate(' + p.x + 'px, ' + p.y + 'px) rotate(' + p.rot + 'deg)';
    p.el.style.opacity = clampVal(p.life / p.max, 0, 1);
  }
}

function shake() {
  if (flightSettings.shake === false || flightSettings.reducedMotion) return;
  camEl.classList.remove('shake');
  // trigger reflow to restart CSS animation
  camEl.offsetWidth;
  camEl.classList.add('shake');
}

// HUD and menus
function buildHearts() {
  heartsEl.innerHTML = '';
  for (let i = 0; i < MAX_LIVES; i++) {
    const s = document.createElement('span');
    s.className = 'heart';
    s.innerHTML =
      '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">' +
      '<path d="M12 20.5s-7-4.4-9-8.7C1.2 8.1 3.4 4.5 7 4.5c2 0 3.6 1.1 5 2.8 1.4-1.7 3-2.8 5-2.8 3.6 0 5.8 3.6 4 7.3-2 4.3-9 8.7-9 8.7z"/>' +
      '</svg>';
    heartsEl.appendChild(s);
  }
}

function updateHUD() {
  const children = heartsEl.children;
  for (let i = 0; i < children.length; i++) {
    children[i].classList.toggle('lost', i >= lives);
  }
  const mult = streak >= 4 ? 3 : (streak >= 2 ? 2 : 1);
  streakEl.textContent = 'x' + mult;
  streakChipEl.classList.toggle('hot', mult === 2);
  streakChipEl.classList.toggle('blazing', mult === 3);
}

function showLegend() {
  legendEl.classList.add('show');
  clearTimeout(legendTimer);
  legendTimer = setTimeout(function () {
    legendEl.classList.remove('show');
  }, 5000);
}

function toggleLegend() {
  if (legendEl.classList.contains('show')) {
    legendEl.classList.remove('show');
  } else {
    showLegend();
  }
}

function showToast(title, sub, color) {
  document.getElementById('toastTitle').textContent = title;
  document.getElementById('toastSub').textContent = sub;
  toastEl.style.setProperty('--tc', color || '#7ef2ff');
  toastEl.classList.remove('show');
  toastEl.offsetWidth;
  toastEl.classList.add('show');
}

function fmtTime(t) {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return m + ':' + String(s).padStart(2, '0');
}

function statsHTML() {
  return (
    '<div class="stat"><b>' + score + '</b>SCORE</div>' +
    '<div class="stat"><b>' + deliveries + '</b>DELIVERIES</div>' +
    '<div class="stat"><b>' + crashes + '</b>CRASHES</div>' +
    '<div class="stat"><b>' + fmtTime(playTime) + '</b>TIME</div>'
  );
}

function computeGrade(isWin) {
  if (!isWin && score < 1000) return 'C';
  if (!isWin) return 'B';
  if (crashes === 0 && (bullseyes >= 3 || playTime < 75)) return 'S';
  if (crashes <= 1 && playTime < 105) return 'A';
  if (crashes <= 2) return 'B';
  return 'C';
}

function updateEndRecords(isWin) {
  const prevBest = loadBest(STORE_SCORE);
  const newBestScore = prevBest === null || score > prevBest;
  if (newBestScore) saveBest(STORE_SCORE, score);
  const bestScore = Math.max(score, prevBest || 0);

  let newBestTime = false;
  let bestTime = loadBest(STORE_TIME);
  if (isWin && !endless) {
    newBestTime = bestTime === null || playTime < bestTime;
    if (newBestTime) {
      bestTime = playTime;
      saveBest(STORE_TIME, playTime);
    }
  }

  const grade = computeGrade(isWin || wonShift);
  const gEl = document.getElementById('endGrade');
  gEl.textContent = grade;
  gEl.className = 'grade-badge g-' + grade;

  const pills = [];
  pills.push(
    '<span class="best-pill' + (newBestScore ? ' new' : '') + '">' +
    (newBestScore ? '★ NEW BEST SCORE: ' : 'BEST SCORE: ') + bestScore + '</span>'
  );
  if (bestTime !== null) {
    pills.push(
      '<span class="best-pill' + (newBestTime ? ' new' : '') + '">' +
      (newBestTime ? '★ FASTEST SHIFT: ' : 'BEST TIME: ') + fmtTime(bestTime) + '</span>'
    );
  }
  document.getElementById('endBest').innerHTML = pills.join('');
}

function confettiRain() {
  const rain = document.getElementById('rain');
  rain.innerHTML = '';
  for (let i = 0; i < 44; i++) {
    const p = document.createElement('i');
    p.style.left = randomRange(0, 100) + '%';
    p.style.background = randomChoice(CONF);
    p.style.animationDuration = randomRange(1.6, 3.2) + 's';
    p.style.animationDelay = randomRange(0, 1.4) + 's';
    rain.appendChild(p);
  }
}

function showScreen(id) {
  const ids = ['startScreen', 'pauseScreen', 'endScreen'];
  for (let i = 0; i < ids.length; i++) {
    const screen = document.getElementById(ids[i]);
    screen.classList.toggle('on', ids[i] === id);
    screen.inert = ids[i] !== id;
    screen.hidden = ids[i] !== id;
  }
}

export function startGame(asEndless = false) {
  stage.hidden = false;
  classicInputEnabled = true;
  document.activeElement?.blur();
  initAudio();
  startHum();
  SFX.click();
  resetGame('play');
  endless = asEndless;
  document.querySelector('#hud .chip-goal').hidden = endless;
  showScreen(null);
  showToast('GO!', endless ? 'CHASE THE HIGH SCORE' : 'DELIVER TO ' + GOAL_SCORE + ' PTS', '#7ef2ff');
  showLegend();
}

function togglePause() {
  if (mode === 'play') {
    changeMode('pause');
    stage.classList.remove('playing');
    showScreen('pauseScreen');
    document.getElementById('btnResume').focus({ preventScroll: true });
    setHum(0);
    SFX.click();
  } else if (mode === 'pause') {
    changeMode('play');
    document.activeElement?.blur();
    stage.classList.add('playing');
    showScreen(null);
    setHum(0.022);
    SFX.click();
  }
}

function toggleSound() {
  setMuted(!muted);
  window.dispatchEvent(new CustomEvent('skyward:muted', { detail: muted }));
  if (!muted) {
    initAudio();
    setHum(mode === 'play' ? 0.022 : 0);
  } else {
    setHum(0);
  }
  SFX.click();
}

function emitArcadeReport(won) {
  const metrics = { time: Math.round(playTime * 1000), deliveries, attempts: deliveries + misses,
    perfect: bullseyes, hits: crashes, distance: Math.round(traveled) };
  const delta = Object.fromEntries(Object.entries(metrics).map(([key, value]) => [key, value - previousReport[key]]));
  previousReport = metrics;
  window.dispatchEvent(new CustomEvent('skyward:arcade-results', { detail: {
    ...delta, score, won, endless, seconds: metrics.time, activeTime: delta.time,
    combo: bestStreak >= 4 ? 3 : bestStreak >= 2 ? 2 : Number(bestStreak > 0),
  } }));
}

function gameOver() {
  if (!changeMode('over')) return;
  stage.classList.remove('playing');
  setHum(0);
  SFX.over();
  document.getElementById('endScreen').className = 'screen overTheme';
  document.getElementById('endTitle').textContent = endless ? 'ENDLESS SHIFT OVER' : 'GAME OVER';
  document.getElementById('endSub').textContent = endless ? 'FINAL SCORE: ' + score + ' PTS' : 'THE DRONE IS DOWN…';
  updateEndRecords(false);
  emitArcadeReport(false);
  document.getElementById('endStats').innerHTML = statsHTML();
  document.getElementById('btnRetry').textContent = 'TRY AGAIN';
  document.getElementById('btnEndless').hidden = true;
  showScreen('endScreen');
  document.getElementById('btnRetry').focus({ preventScroll: true });
}

function winGame() {
  if (mode !== 'play') return;
  if (!changeMode('win')) return;
  stage.classList.remove('playing');
  setHum(0);
  SFX.win();
  document.getElementById('endScreen').className = 'screen winTheme';
  document.getElementById('endTitle').textContent = 'MISSION COMPLETE!';
  document.getElementById('endSub').textContent = GOAL_SCORE + ' POINTS REACHED!';
  updateEndRecords(true);
  emitArcadeReport(true);
  document.getElementById('endStats').innerHTML = statsHTML();
  document.getElementById('btnRetry').textContent = 'PLAY AGAIN';
  document.getElementById('btnEndless').hidden = false;
  confettiRain();
  showScreen('endScreen');
  document.getElementById('btnRetry').focus({ preventScroll: true });
}

document.getElementById('btnStart').addEventListener('click', () => startGame(endless));
document.getElementById('btnRetry').addEventListener('click', () => startGame(endless));
document.getElementById('btnEndless').addEventListener('click', function () {
  initAudio();
  SFX.click();
  endless = true;
  document.querySelector('#hud .chip-goal').hidden = true;
  changeMode('play');
  document.activeElement?.blur();
  stage.classList.add('playing');
  showScreen(null);
  setHum(0.022);
  showToast('ENDLESS SHIFT!', 'CHASE THE HIGH SCORE', '#ffd166');
});
document.getElementById('btnResume').addEventListener('click', togglePause);
document.getElementById('btnPause').addEventListener('click', function () {
  if (mode === 'play' || mode === 'pause') togglePause();
});
document.getElementById('btnSound').addEventListener('click', toggleSound);
document.getElementById('btnInfo').addEventListener('click', toggleLegend);

// Drone movement and collision checks
function updatePlayer(dt) {
  if (mode === 'menu') {
    const side = W < 680 ? 0.18 : 0.085;
    player.x += (W * side + Math.sin(tGlobal * 0.46) * 25 - player.x) * dt * 2;
    player.y += (H * 0.23 + Math.sin(tGlobal * 1.2) * 14 - player.y) * dt * 2;
  }
  boost = classicThrust(player, keys, LEVELS[level], boost, dt, mode === 'play');

  player.x += player.vx * dt;
  player.y += player.vy * dt;
  if (mode === 'play') traveled += Math.hypot(player.vx + LEVELS[level].camSpeed, player.vy) * dt;

  if (player.x < W * 0.055) {
    player.x = W * 0.055;
    player.vx = 0;
  }
  if (player.x > W * 0.6875) {
    player.x = W * 0.6875;
    player.vx = 0;
  }
  if (player.y < 60) {
    player.y = 60;
    player.vy = 0;
  }
  if (player.y > STAND_Y - 46) {
    player.y = STAND_Y - 46;
    player.vy = 0;
  }

  const targetTilt = clampVal(player.vx * 0.035, -12, 12);
  player.tilt += (targetTilt - player.tilt) * Math.min(1, dt * 10);

  if (mode === 'play' && Math.random() < dt * (14 + Math.abs(player.vx) * 0.05)) {
    enginePuff();
  }
}

function renderDrone() {
  if (tGlobal >= invulnUntil) droneEl.classList.remove('hit');
  const bob = Math.sin(tGlobal * 3.1) * 4 + Math.sin(tGlobal * 5.7) * 1.5;
  droneEl.style.transform =
    'translate3d(' + player.x + 'px, ' + (player.y + bob) + 'px, 0) rotate(' + player.tilt + 'deg)';

  const wx = player.x + cam;
  const sy = surfaceTopY(wx, player.y + 10);
  const d = sy - (player.y + 30);
  shadowEl.style.left = wx + 'px';
  shadowEl.style.top = (sy - 8) + 'px';
  shadowEl.style.transform = 'scale(' + clampVal(1.05 - d / 700, 0.3, 1.05) + ')';
  shadowEl.style.opacity = clampVal(0.36 - d / 1600, 0.06, 0.36);
}

function updateCustomers(dt) {
  for (let i = 0; i < customers.length; i++) {
    const c = customers[i];
    if (c.state !== 'idle' || !c.vip) continue;
    if (c.x - cam > W + 40) continue;

    c.vipTimer -= dt;
    const bar = c.el.querySelector('.vip-bar i');
    if (bar) {
      bar.style.width = clampVal((c.vipTimer / c.vipMax) * 100, 0, 100) + '%';
    }
    if (c.vipTimer <= 0) {
      c.vip = false;
      c.el.classList.remove('vip');
      const b = c.el.querySelector('.bubble');
      if (b) b.innerHTML = BOX_SVG;
      const vb = c.el.querySelector('.vip-bar');
      if (vb) vb.remove();
    }
  }
}

function updatePickups() {
  const wx = player.x + cam;
  const wy = player.y;
  for (let i = pickups.length - 1; i >= 0; i--) {
    const pk = pickups[i];
    const dx = wx - pk.x;
    const dy = wy - pk.y;
    if (dx * dx + dy * dy < 38 * 38) {
      if (pk.type === 'heart') {
        if (lives < MAX_LIVES) {
          lives++;
          updateHUD();
          popupText(pk.x, pk.y - 20, '+1 LIFE', 'heart');
        } else {
          addScore(50);
          popupText(pk.x, pk.y - 20, '+50');
        }
      } else {
        shielded = true;
        droneEl.classList.add('shielded');
        popupText(pk.x, pk.y - 20, 'SHIELD ON!', 'shield');
      }
      SFX.deliver();
      pk.el.remove();
      pickups.splice(i, 1);
    }
  }
}

function updateHazards(dt) {
  if (level >= 2) {
    birdTimer -= dt;
    if (birdTimer <= 0) {
      const minGap = Math.max(0.95, 4.0 - level * 0.5 - (endless ? Math.floor(playTime / 50) * 0.22 : 0));
      birdTimer = randomRange(minGap, minGap + 1.6);
      spawnBird();
    }
  }
  for (let i = hazards.length - 1; i >= 0; i--) {
    const h = hazards[i];
    h.x += h.vx * dt;
    h.y += Math.sin(tGlobal * 6 + h.phase) * 22 * dt;
    setPos(h.el, h.x, h.y);
    if (h.x < cam - 120) {
      h.el.remove();
      hazards.splice(i, 1);
    }
  }
}

function checkHits() {
  if (mode !== 'play' || tGlobal < invulnUntil || winAt) return;
  const cx = player.x;
  const cy = player.y;

  for (let i = 0; i < obstacles.length; i++) {
    const o = obstacles[i];
    const sx = o.x - cam;
    if (sx > W + 60 || sx + o.w < -60) continue;
    const nx = clampVal(cx, sx, sx + o.w);
    const ny = clampVal(cy, o.y, o.y + o.h);
    const dx = cx - nx;
    const dy = cy - ny;
    if (dx * dx + dy * dy < HIT_R * HIT_R) {
      hurt();
      return;
    }
  }

  for (let i = 0; i < hazards.length; i++) {
    const h = hazards[i];
    const sx = h.x - cam;
    const dx = cx - sx;
    const dy = cy - h.y;
    if (dx * dx + dy * dy < (HIT_R + 12) * (HIT_R + 12)) {
      hurt();
      return;
    }
  }
}

function hurt() {
  if (shielded) {
    shielded = false;
    droneEl.classList.remove('shielded');
    invulnUntil = tGlobal + 1.5;
    droneEl.classList.add('hit');
    sparks(player.x + cam, player.y);
    shake();
    popupText(player.x + cam, player.y - 30, 'SHIELD SAVED!', 'shield');
    SFX.thud();
    return;
  }

  lives--;
  crashes++;
  streak = 0;
  invulnUntil = tGlobal + 2;
  player.vx = -200;
  player.vy = -160;
  droneEl.classList.add('hit');
  sparks(player.x + cam, player.y);
  shake();
  flashEl.classList.remove('on');
  flashEl.offsetWidth;
  flashEl.classList.add('on');
  SFX.hurt();
  updateHUD();
  if (lives <= 0) gameOver();
}

function deliveryCustomer(x, surface) {
  return customers.find(customer => customer.state === 'idle' &&
    Math.abs(customer.x - x) < DELIVER_RADIUS && Math.abs(customer.feetY - surface) < 48);
}

function renderDropGuide() {
  let customer = null;
  let landing = null;
  if (mode === 'play' && !dropCd && flightSettings.prediction !== false) {
    const parcel = releaseClassic(player, cam);
    const center = () => (parcel.x - cam).toFixed(2) + ',' + (parcel.y + CLASSIC_PARCEL_SIZE / 2).toFixed(2);
    const points = [center()];
    for (let tick = 1; tick <= 240; tick++) {
      const impact = stepClassicPackage(parcel, STEP, surfaceTopY);
      if (impact && !impact.bounced) {
        landing = impact.surface;
        customer = deliveryCustomer(parcel.x, landing);
        const path = [...points, center()].join(' ');
        aimLine.setAttribute('points', path);
        aimOutline.setAttribute('points', path);
        aimPoint.setAttribute('cx', (parcel.x - cam).toFixed(2));
        aimPoint.setAttribute('cy', (landing - 2).toFixed(2));
        break;
      }
      if (tick % 6 === 0 || impact) points.push(center());
    }
  }

  aimEl.classList.toggle('active', landing !== null);
  aimEl.classList.toggle('locked', Boolean(customer));
  if (customer !== aimedCustomer) {
    aimedCustomer?.el.classList.remove('targeted');
    customer?.el.classList.add('targeted');
    aimedCustomer = customer;
  }
}

// Reset, cleanup, and main loop
function clearLayer(el) {
  while (el.firstChild) {
    el.removeChild(el.firstChild);
  }
}

function resetGame(toMode) {
  clearLayer(worldEl);
  clearLayer(actorsEl);
  clearLayer(pkgsEl);
  clearLayer(fxEl);
  clearLayer(fxScrEl);
  clearLayer(midEl);
  clearLayer(farEl);
  if (carsEl) clearLayer(carsEl);

  worldEl.appendChild(actorsEl);
  worldEl.appendChild(pkgsEl);
  worldEl.appendChild(fxEl);
  worldEl.appendChild(shadowEl);

  statics.length = 0;
  midStatics.length = 0;
  farStatics.length = 0;
  platforms.length = 0;
  obstacles.length = 0;
  customers.length = 0;
  packages.length = 0;
  pickups.length = 0;
  hazards.length = 0;
  cars.length = 0;
  parts.length = 0;

  cam = 0;
  score = 0;
  dispScore = 0;
  lives = MAX_LIVES;
  level = 1;
  deliveries = 0;
  crashes = 0;
  bullseyes = 0;
  streak = 0;
  bestStreak = 0;
  playTime = 0;
  dropCd = 0;
  shielded = false;
  endless = false;
  wonShift = false;
  winAt = 0;
  misses = 0;
  traveled = 0;
  previousReport = { time: 0, deliveries: 0, attempts: 0, perfect: 0, hits: 0, distance: 0 };
  document.querySelector('#hud .chip-goal').hidden = false;
  birdTimer = 2.5;
  carTimer = 0.8;
  boost = 100;
  genX = -300;
  midX = -200;
  farX = -100;
  chunkN = 0;
  sinceCustomer = 2;
  lastPole = null;

  player.x = W * (toMode === 'menu' ? 0.085 : 0.234);
  player.y = H * (toMode === 'menu' ? 0.23 : 0.389);
  player.vx = 0;
  player.vy = 0;
  player.tilt = 0;

  stage.classList.remove('lvl1', 'lvl2', 'lvl3', 'lvl4', 'lvl5');
  stage.classList.add('lvl1');
  droneEl.className = 'lvl1';
  levelEl.textContent = 'LV 1';
  levelEl.className = '';
  tGlobal = 0;
  invulnUntil = 1.5;
  keys.clear();
  clock.reset();

  aimedCustomer = null;
  buildHearts();
  updateHUD();
  ensureWorld();
  changeMode(toMode);
  stage.classList.toggle('playing', toMode === 'play');
  setHum(toMode === 'play' ? 0.022 : 0);
}

function cleanup() {
  const cut = cam - 500;
  for (let i = statics.length - 1; i >= 0; i--) {
    const s = statics[i];
    if (s.x + s.w < cut) {
      s.el.remove();
      statics.splice(i, 1);
    }
  }
  for (let i = platforms.length - 1; i >= 0; i--) {
    if (platforms[i].x1 < cut) platforms.splice(i, 1);
  }
  for (let i = obstacles.length - 1; i >= 0; i--) {
    if (obstacles[i].x + obstacles[i].w < cut) obstacles.splice(i, 1);
  }
  for (let i = customers.length - 1; i >= 0; i--) {
    const c = customers[i];
    if (c.x < cut + 360 && c.state === 'idle') {
      c.el.remove();
      customers.splice(i, 1);
    } else if (c.x < cut - 100) {
      c.el.remove();
      customers.splice(i, 1);
    }
  }
  for (let i = pickups.length - 1; i >= 0; i--) {
    if (pickups[i].x < cut) {
      pickups[i].el.remove();
      pickups.splice(i, 1);
    }
  }
  const cutMid = cam * 0.45 - 600;
  for (let i = midStatics.length - 1; i >= 0; i--) {
    const s = midStatics[i];
    if (s.x + s.w < cutMid) {
      s.el.remove();
      midStatics.splice(i, 1);
    }
  }
  const cutFar = cam * 0.18 - 700;
  for (let i = farStatics.length - 1; i >= 0; i--) {
    const s = farStatics[i];
    if (s.x + s.w < cutFar) {
      s.el.remove();
      farStatics.splice(i, 1);
    }
  }
}

function render(elapsed = 0) {
  worldEl.style.transform = 'translate3d(' + (-cam) + 'px, 0, 0)';
  midEl.style.transform = 'translate3d(' + (-cam * 0.45) + 'px, 0, 0)';
  farEl.style.transform = 'translate3d(' + (-cam * 0.18) + 'px, 0, 0)';
  roadEl.style.setProperty('--rshift', (-cam % 96) + 'px');
  walkEl.style.setProperty('--wshift', (-cam % 63) + 'px');
  renderDrone();
  renderDropGuide();

  boostFillEl.style.width = Math.round(boost) + '%';
  dispScore += (score - dispScore) * (1 - Math.exp(-elapsed * 12));
  if (Math.abs(score - dispScore) < 0.6) dispScore = score;
  scoreEl.textContent = Math.round(dispScore);
}

function frame(now) {
  requestAnimationFrame(frame);
  if (document.hidden || stage.hidden || !['play', 'menu'].includes(mode)) return;
  const elapsed = clock.advance(now, updateSimulation);
  render(elapsed);
}

function updateSimulation(dt) {
  tGlobal += dt;

  if (mode === 'play') {
    playTime += dt;
    cam += (LEVELS[level].camSpeed + (endless ? Math.min(70, playTime * 0.22) : 0)) * dt;
    if (winAt && tGlobal >= winAt) {
      winAt = 0;
      winGame();
      return false;
    }
    music(dt, level);
    if (dropCd > 0) {
      dropCd = Math.max(0, dropCd - dt);
      if (dropCd === 0) droneEl.classList.remove('reloading');
    }
    updatePlayer(dt);
    updatePackages(dt);
    if (mode !== 'play') return false;
    updateCustomers(dt);
    updatePickups();
    updateHazards(dt);
    checkHits();
    if (mode !== 'play') return false;

    if (humOsc && !muted) {
      humOsc.frequency.value = 68 + Math.min(60, Math.abs(player.vx) * 0.06 + Math.abs(player.vy) * 0.05);
    }
  } else if (mode === 'menu') {
    music(dt);
    if (flightSettings.reducedMotion) return;
    cam += CAM_SPEED * 0.55 * dt;
    updatePlayer(dt);
  }

  if (mode !== 'pause') {
    updateParts(dt);
    updateCars(dt);
  }

  cleanT += dt;
  if (cleanT > 1.4) {
    cleanT = 0;
    cleanup();
  }
  ensureWorld();
}

function shiftElY(el, dy) {
  if (!el || !el.style || !el.style.top) return;
  const cur = parseFloat(el.style.top) || 0;
  el.style.top = (cur + dy) + 'px';
}

function resizeView() {
  const maxLogicalH = 840;
  const scale = window.innerHeight > maxLogicalH ? window.innerHeight / maxLogicalH : 1;
  const newW = Math.ceil(window.innerWidth / scale);
  const newH = Math.ceil(window.innerHeight / scale);
  const oldH = H;
  const dy = newH - oldH;

  W = newW;
  H = newH;
  STAND_Y = H - ROAD_H - SIDE_H;

  stage.style.width = W + 'px';
  stage.style.height = H + 'px';
  stage.style.transformOrigin = '0 0';
  stage.style.transform = scale !== 1 ? 'scale(' + scale + ')' : 'none';
  stage.style.setProperty('--h', H + 'px');

  if (dy !== 0 && statics.length > 0) {
    for (let i = 0; i < statics.length; i++) shiftElY(statics[i].el, dy);
    for (let i = 0; i < midStatics.length; i++) shiftElY(midStatics[i].el, dy);
    for (let i = 0; i < farStatics.length; i++) shiftElY(farStatics[i].el, dy);
    for (let i = 0; i < platforms.length; i++) platforms[i].topY += dy;
    for (let i = 0; i < obstacles.length; i++) obstacles[i].y += dy;
    for (let i = 0; i < customers.length; i++) {
      customers[i].feetY += dy;
      shiftElY(customers[i].el, dy);
    }
    for (let i = 0; i < pickups.length; i++) {
      pickups[i].y += dy;
      shiftElY(pickups[i].el, dy);
    }
    for (let i = 0; i < hazards.length; i++) {
      hazards[i].y += dy;
      shiftElY(hazards[i].el, dy);
    }
    for (let i = 0; i < packages.length; i++) {
      packages[i].y += dy;
      shiftElY(packages[i].el, dy);
    }
    for (let i = 0; i < parts.length; i++) parts[i].y += dy;
    if (lastPole) lastPole.wy += dy;
    player.y = clampVal(player.y + dy, 60, STAND_Y - 46);
  }
  ensureWorld();
  render();
}

window.addEventListener('resize', resizeView);

const clouds = document.querySelectorAll('.cloud');
for (let i = 0; i < clouds.length; i++) {
  const c = clouds[i];
  c.style.animationDuration = randomRange(70, 130) + 's';
  c.style.animationDelay = -randomRange(0, 120) + 's';
  const sc = randomRange(0.55, 1.25);
  c.style.width = 150 * sc + 'px';
  c.style.height = 44 * sc + 'px';
}

if (starsEl) {
  for (let i = 0; i < 24; i++) {
    const st = createBox('div', 'star', starsEl);
    st.style.left = randomRange(2, 98) + '%';
    st.style.top = randomRange(4, 52) + '%';
    st.style.animationDelay = randomRange(0, 2) + 's';
  }
}

if (stormRainEl) {
  for (let i = 0; i < 28; i++) {
    const dr = createBox('div', 'drop', stormRainEl);
    dr.style.left = randomRange(0, 105) + '%';
    dr.style.animationDuration = randomRange(0.55, 0.95) + 's';
    dr.style.animationDelay = -randomRange(0, 1.5) + 's';
  }
}

export function showClassicPreview(showStart = false) {
  classicInputEnabled = false;
  resetGame('menu');
  showScreen(showStart ? 'startScreen' : null);
}

export const classicAudio = { initAudio, playTone, startHum, setHum, configure: configureAudio, music };

resizeView();
showClassicPreview(true);
render();
requestAnimationFrame(frame);

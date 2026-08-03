'use strict';
/* =========================================================
   SKYWARD EXPRESS — Prototype v1
   Single-file game logic. DOM + CSS transforms only.
   Sections:
     1. Config & State      6. Deliveries & Customers
     2. DOM & Helpers       7. FX (particles / popups)
     3. Audio (WebAudio)    8. UI (HUD / screens / toast)
     4. Input               9. Collisions
     5. World Generation   10. Game Loop & Init
   ========================================================= */


/* =========================================================
   1. CONFIG & STATE
   ========================================================= */
let W = 1280, H = 720;                 // logical resolution = viewport (whole game always visible)
const ROAD_H = 96, SIDE_H = 26;
let STAND_Y = H - ROAD_H - SIDE_H;     // sidewalk top / feet line
const CAM_SPEED = 150;                 // px/s world scroll
const GOAL_SCORE = 1000;
const MAX_LIVES = 3;
const HIT_R = 22;                      // drone collision radius
const DROP_COOLDOWN = 0.45;
const PKG_H = 24;
const DELIVER_RADIUS = 88;             // horizontal px tolerance
const GRAVITY = 1500;

// Per-level drone physics & visuals
const LEVELS = [null,
  { accel: 1500, maxSpeed: 330 },      // LV1
  { accel: 1950, maxSpeed: 405 },      // LV2  (smoother + faster)
  { accel: 2100, maxSpeed: 435 },      // LV3  (premium)
];

const PALETTE = [
  { c:'#ff9aa8', roof:'#d45d74' }, { c:'#ffcf6b', roof:'#d99a2b' },
  { c:'#8be0a4', roof:'#48a86b' }, { c:'#7cc9f2', roof:'#3f86b8' },
  { c:'#b9a4f6', roof:'#7d63c9' }, { c:'#ffb27a', roof:'#d97b3f' },
  { c:'#f2e6d8', roof:'#b09a83' },
];
const MIDPAL  = ['#a7b6d4', '#93a9cf', '#b9c6e2', '#8fa3c8'];
const FARPAL  = ['#cfd9ef', '#c4d2ec', '#d8e1f4'];
const AWCOLS  = ['#ff6b6b', '#4cc9f0', '#8fd694', '#ffb35c', '#b9a4f6'];
const NEON    = ['#7ef2ff', '#ff8fa3', '#ffd166', '#8fd694'];
const SIGNS   = ['NOODLE','SUSHI','CAFÉ','HOTEL','24H','RAMEN','PIXEL','TACOS','DONUTS','GYM'];
const ADS     = ['SKY EXPRESS — WE DELIVER','DRONE COLA','MOON MALL','NEKO RAMEN','ZAP! INTERNET','CLOUD 9 LOFTS'];
const CONF    = ['#ff6b6b','#ffd166','#4ecdc4','#7cc9f2','#b9a4f6','#8fd694'];

// ---- mutable state ----
let mode = 'menu';                     // menu | play | pause | over | win
let cam = 0, tGlobal = 0, playTime = 0;
let score = 0, dispScore = 0, lives = MAX_LIVES, level = 1;
let deliveries = 0, crashes = 0;
let invulnUntil = 0, dropCd = 0;
let genX = 0, midX = 0, farX = 0, chunkN = 0, sinceCustomer = 0;
let lastPole = null, cleanT = 0;
let muted = false;
let legendTimer = 0;

const platforms = [];                  // landing surfaces {x0,x1,topY}
const obstacles = [];                  // colliders {x,y,w,h}
const customers = [];                  // {x,feetY,state,el}
const packages  = [];
const parts     = [];                  // particles
const statics = [], midStatics = [], farStatics = [];

const player = { x: 300, y: 280, vx: 0, vy: 0, tilt: 0 };


/* =========================================================
   2. DOM & HELPERS
   ========================================================= */
const $ = id => document.getElementById(id);
const stage   = $('stage'),  camEl   = $('cam');
const skyEl   = $('sky'),    farEl   = $('farLayer'), midEl = $('midLayer');
const worldEl = $('world'),  actorsEl= $('actors'), pkgsEl = $('pkgs');
const fxEl    = $('fx'),     fxScrEl = $('fxScreen');
const roadEl  = $('road'),   walkEl  = $('walk');
const droneEl = $('drone'),  shadowEl= $('dshadow');
const legendEl= $('legend');
const scoreEl = $('scoreVal'), heartsEl = $('hearts'), levelEl = $('levelVal');
const toastEl = $('toast'), flashEl = $('flash');

const rnd   = (a,b) => a + Math.random() * (b - a);
const irnd  = (a,b) => Math.floor(rnd(a, b + 1));
const pick  = arr => arr[Math.floor(Math.random() * arr.length)];
const chance= p => Math.random() < p;
const clamp = (v,a,b) => v < a ? a : (v > b ? b : v);

function make(tag, cls, parent){
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  (parent || worldEl).appendChild(e);
  return e;
}
function place(e, x, y){ e.style.left = x + 'px'; e.style.top = y + 'px'; }
function addStatic(el, x, w){ statics.push({ el, x, w }); }

// First surface at or below `fromY` under world-x `wx` (else the sidewalk).
function surfaceTopY(wx, fromY){
  let best = STAND_Y;
  for (let i = 0; i < platforms.length; i++){
    const p = platforms[i];
    if (wx >= p.x0 && wx <= p.x1 && p.topY >= fromY && p.topY < best) best = p.topY;
  }
  return best;
}


/* =========================================================
   3. AUDIO — tiny WebAudio synth (no audio files needed)
   ========================================================= */
let AC = null, humOsc = null, humGain = null;

function audio(){
  if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
  if (AC.state === 'suspended') AC.resume();
  return AC;
}
function tone(f, o = {}){
  if (muted || !AC) return;
  const { dur = .15, type = 'sine', vol = .2, slide = 0, delay = 0 } = o;
  const t = AC.currentTime + delay;
  const osc = AC.createOscillator(), g = AC.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(f, t);
  if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + .015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(AC.destination);
  osc.start(t); osc.stop(t + dur + .05);
}
const SFX = {
  click(){ tone(700, { type:'triangle', dur:.08, vol:.15 }); },
  drop(){  tone(520, { type:'sawtooth', dur:.2,  vol:.12, slide:-340 }); },
  thud(){  tone(130, { type:'triangle', dur:.12, vol:.2,  slide:-40 }); },
  deliver(){ [660,880,1174].forEach((f,i)=>tone(f,{type:'triangle',dur:.14,vol:.18,delay:i*.07})); },
  upgrade(){ [523,659,784,1046].forEach((f,i)=>tone(f,{type:'square',dur:.12,vol:.11,delay:i*.09})); },
  hurt(){ tone(210,{type:'square',dur:.28,vol:.22,slide:-130}); tone(90,{type:'sawtooth',dur:.25,vol:.14,delay:.02}); },
  over(){ [392,330,262,196].forEach((f,i)=>tone(f,{type:'triangle',dur:.3,vol:.18,delay:i*.22})); },
  win(){  [523,659,784,1046,784,1046].forEach((f,i)=>tone(f,{type:'triangle',dur:.16,vol:.2,delay:i*.11})); },
};
function startHum(){
  if (humOsc || !AC) return;
  humOsc = AC.createOscillator(); humOsc.type = 'sawtooth'; humOsc.frequency.value = 68;
  const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 220;
  humGain = AC.createGain(); humGain.gain.value = 0;
  humOsc.connect(lp).connect(humGain).connect(AC.destination);
  humOsc.start();
}
function setHum(target){
  if (humGain && AC) humGain.gain.setTargetAtTime(muted ? 0 : target, AC.currentTime, .1);
}


/* =========================================================
   4. INPUT
   ========================================================= */
const keys = new Set();

window.addEventListener('keydown', e => {
  const k = e.key;
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(k)) e.preventDefault();

  if (mode === 'menu' && (k === ' ' || k === 'Enter')) { startGame(); return; }

  if (k === 'ArrowUp'   || k === 'w') keys.add('up');
  if (k === 'ArrowDown' || k === 's') keys.add('down');
  if (k === 'ArrowLeft' || k === 'a') keys.add('left');
  if (k === 'ArrowRight'|| k === 'd') keys.add('right');
  if ((k === ' ' || e.code === 'Space') && !e.repeat) dropPackage();
  if (k === 'p' || k === 'P') togglePause();
  if (k === 'm' || k === 'M') toggleSound();
});
window.addEventListener('keyup', e => {
  const k = e.key;
  if (k === 'ArrowUp'   || k === 'w') keys.delete('up');
  if (k === 'ArrowDown' || k === 's') keys.delete('down');
  if (k === 'ArrowLeft' || k === 'a') keys.delete('left');
  if (k === 'ArrowRight'|| k === 'd') keys.delete('right');
});
window.addEventListener('blur', () => { if (mode === 'play') togglePause(); });


/* =========================================================
   5. WORLD GENERATION (chunks, buildings, props, obstacles)
   ========================================================= */
function makeChunk(x){
  chunkN++;
  const w = rnd(560, 780);
  let bInfo = null;
  const r = Math.random();

  if (chunkN > 2 && r < 0.13)      makePlaza(x, w);
  else if (chunkN > 2 && r < 0.25) bInfo = makeDepot(x, w);
  else                             bInfo = makeBlock(x, w);

  if (r >= 0.13 || chance(.3)) streetProps(x, w);
  if (chunkN % 9 === 5 && chance(.8)) addCrane(x + rnd(180, w - 180));

  sinceCustomer++;
  if (chunkN > 1 && (chance(.55) || sinceCustomer >= 3)){
    if (trySpawnCustomer(x, w, bInfo)) sinceCustomer = 0;
  }
  return w;
}

function makeBlock(x, w){
  const bw = w - rnd(70, 120);
  const bx = x + rnd(10, Math.max(11, w - bw - 10));
  const bh = rnd(180, 430);
  const pal = pick(PALETTE);

  const el = make('div', 'bld');
  el.style.width = bw + 'px'; el.style.height = bh + 'px';
  place(el, bx, STAND_Y - bh);
  el.style.setProperty('--c', pal.c);
  el.style.setProperty('--roof', pal.roof);
  el.style.setProperty('--glass', chance(.22) ? 'rgba(255,229,150,.85)' : 'rgba(31,58,92,.38)');

  make('div', 'win', el);
  make('div', 'door', el);
  if (chance(.72)){
    const aw = make('div', 'awning', el);
    aw.style.setProperty('--aw', pick(AWCOLS));
  }
  if (chance(.38)){
    const s = make('div', 'sign ' + (chance(.5) ? 's-l' : 's-r'), el);
    s.textContent = pick(SIGNS);
    s.style.setProperty('--sc', pick(NEON));
    s.style.top = rnd(18, 45) + '%';
  }
  addStatic(el, bx, bw);

  const topY = STAND_Y - bh;
  platforms.push({ x0: bx + 8, x1: bx + bw - 8, topY });
  roofProps({ x: bx, w: bw, y: topY });
  return { x: bx, y: topY, w: bw, h: bh };
}

function makeDepot(x, w){
  const bw = w - rnd(60, 90);
  const bx = x + rnd(8, Math.max(9, w - bw - 8));
  const bh = rnd(120, 160);
  const pal = pick(PALETTE);

  const el = make('div', 'bld depot');
  el.style.width = bw + 'px'; el.style.height = bh + 'px';
  place(el, bx, STAND_Y - bh);
  el.style.setProperty('--c', pal.c);
  el.style.setProperty('--roof', pal.roof);
  make('div', 'roll', el);
  const ds = make('div', 'docksign', el); ds.textContent = 'DEPOT';
  addStatic(el, bx, bw);

  // crate stacks on the sidewalk (decor)
  for (let i = 0; i < irnd(1, 2); i++){
    const cr = make('div', 'crate');
    place(cr, bx + bw + 8 + i * 34, STAND_Y - 30);
    addStatic(cr, bx + bw + 8 + i * 34, 30);
  }
  const topY = STAND_Y - bh;
  platforms.push({ x0: bx + 8, x1: bx + bw - 8, topY });
  return { x: bx, y: topY, w: bw, h: bh };
}

function makePlaza(x, w){
  const n = irnd(2, 3);
  for (let i = 0; i < n; i++) addTree(x + rnd(60, w - 60));
  if (chance(.5)){
    const b = make('div', 'bench');
    const bx = x + rnd(70, w - 120);
    place(b, bx, STAND_Y - 18);
    addStatic(b, bx, 56);
  }
  if (chance(.5)){
    const h = make('div', 'hydrant');
    const hx = x + rnd(60, w - 80);
    place(h, hx, STAND_Y - 30);
    addStatic(h, hx, 20);
  }
}

function streetProps(x, w){
  if (chance(.5))  addPole(x + rnd(50, w - 50));
  if (chance(.4))  addTree(x + rnd(60, w - 60));
  if (chance(.2))  addTLight(x + rnd(70, w - 70));
  if (chance(.22)) addBarrier(x + rnd(60, w - 60));
}

/* ---- street pieces ---- */
function addPole(px){
  const POLE_H = 300, wy = STAND_Y - POLE_H + 26;
  const el = make('div', 'pole');
  el.style.width = '10px'; el.style.height = POLE_H + 'px';
  place(el, px - 5, STAND_Y - POLE_H);
  obstacles.push({ x: px - 6, y: STAND_Y - POLE_H, w: 12, h: POLE_H });
  addStatic(el, px - 5, 10);

  if (lastPole && px - lastPole.x > 180 && px - lastPole.x < 620){
    const x0 = lastPole.x, d = px - x0;
    const wel = make('div', 'wire');
    wel.style.width = d + 'px';
    place(wel, x0, lastPole.wy);
    obstacles.push({ x: x0 + 10, y: lastPole.wy + 10, w: d - 20, h: 8 });
    addStatic(wel, x0, d);
  }
  lastPole = { x: px, wy };
}
function addTree(tx){
  const el = make('div', 'tree');
  el.innerHTML = '<div class="canopy"></div><div class="trunk"></div>';
  place(el, tx - 37, STAND_Y - 178);
  obstacles.push({ x: tx - 30, y: STAND_Y - 172, w: 60, h: 100 });
  addStatic(el, tx - 37, 74);
}
function addTLight(tx){
  const el = make('div', 'tl');
  el.style.height = '190px';
  el.innerHTML = '<div class="head"><i></i><i></i><i></i></div>';
  place(el, tx - 8, STAND_Y - 190);
  obstacles.push({ x: tx - 15, y: STAND_Y - 190, w: 30, h: 56 });
  addStatic(el, tx - 15, 30);
}
function addBarrier(bx){
  const el = make('div', 'barrier');
  place(el, bx - 24, STAND_Y - 26);
  obstacles.push({ x: bx - 24, y: STAND_Y - 26, w: 48, h: 26 });
  addStatic(el, bx - 24, 48);
}
function addCrane(cx){
  const jy = 118, ty = 132;
  const tower = make('div', 'craneT');
  tower.style.height = (STAND_Y - ty) + 'px';
  tower.innerHTML = '<div class="beacon"></div>';
  place(tower, cx - 10, ty);
  const jib = make('div', 'craneJ');
  jib.style.width = '320px';
  jib.innerHTML = '<div class="cable"></div><div class="loadbox"></div>';
  place(jib, cx - 60, jy);
  obstacles.push({ x: cx - 60, y: jy - 4, w: 320, h: 18 });
  obstacles.push({ x: cx - 10, y: ty, w: 20, h: STAND_Y - ty });
  addStatic(tower, cx - 10, 20);
  addStatic(jib, cx - 60, 320);
}

/* ---- rooftop props (decor + colliders) ---- */
function roofProps(b){
  const zones = [];
  const n = irnd(0, 2);
  const widths = { ac: 38, tank: 58, ant: 14, dish: 32, board: 132 };
  for (let i = 0; i < n; i++){
    const t = pick(['ac','tank','ant','dish','board']);
    const wd = widths[t];
    let px = null;
    for (let a = 0; a < 6; a++){
      const cand = rnd(b.x + 12, Math.max(b.x + 13, b.x + b.w - 12 - wd));
      if (!zones.some(([s, e]) => cand < e + 18 && cand + wd > s - 18)){ px = cand; break; }
    }
    if (px === null) continue;
    zones.push([px, px + wd]);
    addRoofProp(t, px, b.y);
  }
}
function addRoofProp(t, px, ry){
  let el;
  if (t === 'ac'){
    el = make('div', 'ac'); el.innerHTML = '<i></i>';
    place(el, px, ry - 26);
    obstacles.push({ x: px + 2, y: ry - 26, w: 34, h: 26 });
    addStatic(el, px, 38);
  } else if (t === 'tank'){
    el = make('div', 'tank'); el.innerHTML = '<div class="t-top"></div><div class="t-body"></div>';
    place(el, px, ry - 84);
    obstacles.push({ x: px + 6, y: ry - 80, w: 46, h: 80 });
    addStatic(el, px, 58);
  } else if (t === 'ant'){
    el = make('div', 'ant'); el.innerHTML = '<i></i>';
    el.style.height = '88px';
    place(el, px, ry - 88);
    obstacles.push({ x: px + 4, y: ry - 88, w: 6, h: 88 });
    addStatic(el, px, 14);
  } else if (t === 'dish'){
    el = make('div', 'dish');
    place(el, px, ry - 28);
    obstacles.push({ x: px + 2, y: ry - 26, w: 28, h: 26 });
    addStatic(el, px, 32);
  } else { // billboard
    el = make('div', 'rboard');
    el.innerHTML = '<div class="panel">' + pick(ADS) + '</div>';
    place(el, px, ry - 92);
    obstacles.push({ x: px + 4, y: ry - 92, w: 124, h: 58 });
    addStatic(el, px, 132);
  }
}
function addBalcony(x0, y, w2){
  const el = make('div', 'balcony');
  el.style.width = w2 + 'px';
  place(el, x0, y);
  platforms.push({ x0: x0 + 6, x1: x0 + w2 - 6, topY: y });
  addStatic(el, x0, w2);
}

/* ---- parallax layers ---- */
function makeMid(x){
  const w = rnd(300, 520), h = rnd(120, 300);
  const el = make('div', 'mbld', midEl);
  el.style.width = w + 'px'; el.style.height = h + 'px';
  el.style.background = pick(MIDPAL);
  el.style.backgroundImage = 'radial-gradient(rgba(255,255,255,.5) 1.2px, transparent 1.7px)';
  el.style.backgroundSize = '13px 17px';
  place(el, x, H - 70 - h);
  midStatics.push({ el, x, w });
  return w + rnd(40, 150);
}
function makeFar(x){
  const w = rnd(380, 640), h = rnd(70, 180);
  const el = make('div', 'fbld', farEl);
  el.style.width = w + 'px'; el.style.height = h + 'px';
  el.style.background = pick(FARPAL);
  place(el, x, H - 150 - h);
  farStatics.push({ el, x, w });
  return w + rnd(60, 200);
}

function ensureWorld(){
  while (genX < cam + W * 1.9)              genX  += makeChunk(genX);
  while (midX < cam * 0.45 + W * 1.6)       midX  += makeMid(midX);
  while (farX < cam * 0.18 + W * 1.6)       farX  += makeFar(farX);
}


/* =========================================================
   6. DELIVERIES & CUSTOMERS
   ========================================================= */
function trySpawnCustomer(x, w, b){
  const spots = [];

  // sidewalk spot (kept clear of street obstacles)
  const sx = x + rnd(80, w - 80);
  if (!obstacles.some(o => o.y > STAND_Y - 130 && Math.abs(o.x + o.w / 2 - sx) < 55)){
    spots.push({ x: sx, y: STAND_Y });
  }
  // rooftop spot(s) — weighted, kept clear of roof props
  if (b){
    for (let i = 0; i < 2; i++){
      const rx = rnd(b.x + 46, Math.max(b.x + 47, b.x + b.w - 46));
      if (!obstacles.some(o => o.y > b.y - 140 && o.y < b.y + 40 && Math.abs(o.x + o.w / 2 - rx) < 70)){
        spots.push({ x: rx, y: b.y });
        break;
      }
    }
    // balcony spot on tall buildings
    if (b.h > 270 && chance(.55)){
      const bw2 = 92;
      const bx0 = b.x + b.w * rnd(.15, .55);
      const by  = b.y + b.h * rnd(.3, .55);
      addBalcony(bx0, by, bw2);
      spots.push({ x: bx0 + bw2 / 2, y: by });
    }
  }
  if (!spots.length) return false;
  const s = pick(spots);
  spawnCustomer(s.x, s.y);
  return true;
}

function spawnCustomer(fx, fy){
  const el = make('div', 'customer c' + irnd(1, 5), actorsEl);
  place(el, fx - 16, fy - 48);
  el.innerHTML =
    '<div class="ring"></div>' +
    '<div class="bubble">📦</div>' +
    '<div class="cwrap"><div class="c-head"></div><div class="c-arm"></div><div class="c-torso"></div></div>';
  customers.push({ x: fx, feetY: fy, state: 'idle', el });
}

function dropPackage(){
  if (mode !== 'play' || dropCd > 0) return;
  dropCd = DROP_COOLDOWN;
  SFX.drop();
  const el = make('div', 'pkg', pkgsEl);
  packages.push({
    x: player.x + cam, y: player.y + 30,
    vx: player.vx * 0.35, vy: 60,
    rot: rnd(-8, 8), vr: rnd(-100, 100),
    el, state: 'fall',
  });
}

function updatePackages(dt){
  for (let i = packages.length - 1; i >= 0; i--){
    const p = packages[i];
    if (p.state !== 'fall') continue;

    p.vy += GRAVITY * dt;
    p.x  += p.vx * dt;
    p.y  += p.vy * dt;
    p.rot+= p.vr * dt;

    const surf = surfaceTopY(p.x, p.y);
    if (p.y + PKG_H >= surf){
      p.y = surf - PKG_H;
      if (p.vy > 260){                 // one small bounce, then settle
        p.vy = -p.vy * 0.3;
        p.vx *= 0.6; p.vr *= -0.5;
        SFX.thud();
      } else {
        resolvePackage(p, surf);
        packages.splice(i, 1);
        continue;
      }
    }
    p.el.style.transform = `translate(${p.x - 13}px, ${p.y}px) rotate(${p.rot}deg)`;
  }
}

function resolvePackage(p, surfY){
  p.el.style.left = (p.x - 13) + 'px';
  p.el.style.top  = p.y + 'px';
  p.el.style.transform = 'none';
  p.el.classList.add('landed');
  setTimeout(() => p.el.remove(), 800);

  const c = customers.find(c =>
    c.state === 'idle' &&
    Math.abs(c.x - p.x) < DELIVER_RADIUS &&
    Math.abs(c.feetY - surfY) < 48
  );
  if (c) deliverSuccess(p, c, surfY);
  else   popupText(p.x, surfY - 40, 'miss', 'miss');
}

function deliverSuccess(p, c, surfY){
  c.state = 'done';
  c.el.classList.add('happy');
  setTimeout(() => { c.el.remove(); }, 2600);

  deliveries++;
  addScore(100);
  popupText(p.x, surfY - 50, '+100');
  popupText(c.x + rnd(-14, 14), c.feetY - 70, '♥', 'heart');
  confetti(p.x, surfY - 8);
  SFX.deliver();
}

function addScore(n){
  score += n;
  if (score >= 500 && level === 1) levelUp(2);
  if (score >= GOAL_SCORE && level === 2){
    levelUp(3);
    setTimeout(winGame, 900);
  }
}

function levelUp(n){
  level = n;
  droneEl.classList.remove('lvl1', 'lvl2', 'lvl3');
  droneEl.classList.add('lvl' + n);
  levelEl.textContent = 'LV ' + n;
  levelEl.className = n === 3 ? 'lv3' : (n === 2 ? 'lv2' : '');
  if (n < 3) showToast('DRONE UPGRADED!', 'LEVEL ' + n, n === 2 ? '#40f0dc' : '#ffd166');
  SFX.upgrade();
  confetti(player.x + cam, player.y, 10);
}


/* =========================================================
   7. FX — particles, popups, shake
   ========================================================= */
function popupText(wx, wy, txt, cls = ''){
  const e = make('div', 'pop ' + cls, fxEl);
  e.textContent = txt;
  place(e, wx - 30, wy);
  setTimeout(() => e.remove(), 1000);
}
function spawnPart(parent, cls, x, y, opts){
  const el = make('i', cls, parent);
  el.style.width = el.style.height = (opts.size || 6) + 'px';
  if (opts.color) el.style.background = opts.color;
  parts.push(Object.assign({ el, x, y, vx: 0, vy: 0, g: 600, life: .8, max: .8, rot: 0, vr: 0 }, opts));
}
function confetti(wx, wy, n = 14){
  for (let i = 0; i < n; i++){
    const el = make('i', 'cf', fxEl);
    el.style.width = rnd(5, 9) + 'px'; el.style.height = rnd(6, 11) + 'px';
    el.style.background = pick(CONF);
    parts.push({ el, x: wx, y: wy, vx: rnd(-170, 170), vy: rnd(-280, -70),
                 g: 620, life: rnd(.6, 1), max: 1, rot: rnd(0, 360), vr: rnd(-400, 400) });
  }
}
function sparks(wx, wy){
  for (let i = 0; i < 11; i++){
    spawnPart(fxEl, 'sp', wx, wy, {
      color: pick(['#ffd166','#ff9f43','#ff5d5d','#fff']),
      vx: rnd(-220, 220), vy: rnd(-240, 40), g: 900, life: rnd(.25, .45), max: .45, size: rnd(4, 7),
    });
  }
}
function dust(wx, wy){
  for (let i = 0; i < 5; i++){
    spawnPart(fxEl, 'du', wx + rnd(-10, 10), wy - 4, {
      vx: rnd(-40, 40), vy: rnd(-50, -10), g: -30, life: rnd(.3, .5), max: .5, size: rnd(5, 9),
    });
  }
}
function enginePuff(){
  spawnPart(fxScrEl, 'ep', player.x + rnd(-6, 6), player.y + 32, {
    color: level === 3 ? '#ffd166' : (level === 2 ? '#40f0dc' : '#7ef2ff'),
    vx: rnd(-16, 16), vy: rnd(50, 100), g: 60, life: .35, max: .35, size: rnd(3, 6),
  });
}
function updateParts(dt){
  for (let i = parts.length - 1; i >= 0; i--){
    const p = parts[i];
    p.life -= dt;
    if (p.life <= 0){ p.el.remove(); parts.splice(i, 1); continue; }
    p.vy += p.g * dt;
    p.x += p.vx * dt; p.y += p.vy * dt;
    p.rot += (p.vr || 0) * dt;
    p.el.style.transform = `translate(${p.x}px, ${p.y}px) rotate(${p.rot}deg)`;
    p.el.style.opacity = clamp(p.life / p.max, 0, 1);
  }
}
function shake(){
  camEl.classList.remove('shake');
  void camEl.offsetWidth;               // restart animation
  camEl.classList.add('shake');
}


/* =========================================================
   8. UI — HUD, toast, screens
   ========================================================= */
function buildHearts(){
  heartsEl.innerHTML = '';
  for (let i = 0; i < MAX_LIVES; i++){
    const s = document.createElement('span');
    s.className = 'heart'; s.textContent = '❤';
    heartsEl.appendChild(s);
  }
}
function updateHUD(){
  [...heartsEl.children].forEach((h, i) => h.classList.toggle('lost', i >= lives));
}
function showLegend(){
  legendEl.classList.add('show');
  clearTimeout(legendTimer);
  legendTimer = setTimeout(() => legendEl.classList.remove('show'), 5000);
}
function toggleLegend(){
  if (legendEl.classList.contains('show')){
    legendEl.classList.remove('show');
  } else {
    showLegend();
  }
}

function showToast(title, sub, color){
  $('toastTitle').textContent = title;
  $('toastSub').textContent = sub;
  toastEl.style.setProperty('--tc', color || '#7ef2ff');
  toastEl.classList.remove('show');
  void toastEl.offsetWidth;
  toastEl.classList.add('show');
}
function fmtTime(t){
  const m = Math.floor(t / 60), s = Math.floor(t % 60);
  return m + ':' + String(s).padStart(2, '0');
}
function statsHTML(){
  return `<div class="stat"><b>${deliveries}</b>DELIVERIES</div>` +
         `<div class="stat"><b>${crashes}</b>CRASHES</div>` +
         `<div class="stat"><b>${fmtTime(playTime)}</b>TIME</div>`;
}
function confettiRain(){
  const rain = $('rain');
  rain.innerHTML = '';
  for (let i = 0; i < 44; i++){
    const p = document.createElement('i');
    p.style.left = rnd(0, 100) + '%';
    p.style.background = pick(CONF);
    p.style.animationDuration = rnd(1.6, 3.2) + 's';
    p.style.animationDelay = rnd(0, 1.4) + 's';
    rain.appendChild(p);
  }
}

function showScreen(id){
  ['startScreen','pauseScreen','endScreen'].forEach(s => $(s).classList.toggle('on', s === id));
}
function startGame(){
  audio(); startHum(); SFX.click();
  resetGame('play');
  showScreen(null);
  showToast('GO!', 'DELIVER TO 1000 PTS', '#7ef2ff');
  showLegend();
}
function togglePause(){
  if (mode === 'play'){
    mode = 'pause'; showScreen('pauseScreen'); setHum(0); SFX.click();
  } else if (mode === 'pause'){
    mode = 'play'; showScreen(null); setHum(.022); SFX.click();
  }
}
function toggleSound(){
  muted = !muted;
  $('btnSound').classList.toggle('muted', muted);
  if (!muted){ audio(); setHum(mode === 'play' ? .022 : 0); }
  else setHum(0);
  SFX.click();
}
function gameOver(){
  mode = 'over'; setHum(0); SFX.over();
  $('endScreen').className = 'screen overTheme';
  $('endTitle').textContent = 'GAME OVER';
  $('endSub').textContent = 'THE DRONE IS DOWN…';
  $('endStats').innerHTML = statsHTML();
  $('btnRetry').textContent = 'TRY AGAIN';
  showScreen('endScreen');
}
function winGame(){
  if (mode !== 'play') return;
  mode = 'win'; setHum(0); SFX.win();
  $('endScreen').className = 'screen winTheme';
  $('endTitle').textContent = 'MISSION COMPLETE!';
  $('endSub').textContent = '1000 POINTS REACHED!';
  $('endStats').innerHTML = statsHTML();
  $('btnRetry').textContent = 'FLY AGAIN';
  confettiRain();
  showScreen('endScreen');
}

$('btnStart').addEventListener('click', startGame);
$('btnRetry').addEventListener('click', () => { audio(); SFX.click(); resetGame('play'); showScreen(null); showToast('GO!', 'DELIVER TO 1000 PTS', '#7ef2ff'); showLegend(); });
$('btnResume').addEventListener('click', togglePause);
$('btnPause').addEventListener('click', () => { if (mode === 'play' || mode === 'pause') togglePause(); });
$('btnSound').addEventListener('click', toggleSound);
$('btnInfo').addEventListener('click', toggleLegend);


/* =========================================================
   9. PLAYER & COLLISIONS
   ========================================================= */
function updatePlayer(dt){
  const L = LEVELS[level];
  let ax = 0, ay = 0;

  if (mode === 'play'){
    if (keys.has('left'))  ax -= 1;
    if (keys.has('right')) ax += 1;
    if (keys.has('up'))    ay -= 1;
    if (keys.has('down'))  ay += 1;
  } else { // attract mode: glide gently toward the anchor
    player.x += (W * 0.234 - player.x) * dt * 2;
    player.y += (H * 0.375 + Math.sin(tGlobal * 1.2) * 14 - player.y) * dt * 2;
  }

  // acceleration + exponential drag = smooth ease-in / ease-out momentum
  player.vx += ax * L.accel * dt;
  player.vy += ay * L.accel * dt;
  const damp = Math.exp(-dt * 2.4);
  player.vx *= damp; player.vy *= damp;
  player.vx = clamp(player.vx, -L.maxSpeed, L.maxSpeed);
  player.vy = clamp(player.vy, -L.maxSpeed, L.maxSpeed);

  player.x += player.vx * dt;
  player.y += player.vy * dt;
  if (player.x < W * 0.055)   { player.x = W * 0.055;   player.vx = 0; }
  if (player.x > W * 0.6875)  { player.x = W * 0.6875;  player.vx = 0; }
  if (player.y < 60)          { player.y = 60;          player.vy = 0; }
  if (player.y > STAND_Y - 46){ player.y = STAND_Y - 46; player.vy = 0; }

  // bank tilt from horizontal velocity
  const targetTilt = clamp(player.vx * 0.035, -12, 12);
  player.tilt += (targetTilt - player.tilt) * Math.min(1, dt * 10);

  // engine trail
  if (mode === 'play' && chance(dt * (14 + Math.abs(player.vx) * 0.05))) enginePuff();
}

function renderDrone(){
  const bob = Math.sin(tGlobal * 3.1) * 4 + Math.sin(tGlobal * 5.7) * 1.5;
  droneEl.style.transform =
    `translate3d(${player.x}px, ${player.y + bob}px, 0) rotate(${player.tilt}deg)`;

  // floating shadow on the nearest surface below
  const wx = player.x + cam;
  const sy = surfaceTopY(wx, player.y + 10);
  const d = sy - (player.y + 30);
  shadowEl.style.left = wx + 'px';
  shadowEl.style.top = (sy - 8) + 'px';
  shadowEl.style.transform = `scale(${clamp(1.05 - d / 700, .3, 1.05)})`;
  shadowEl.style.opacity = clamp(.36 - d / 1600, .06, .36);
}

function checkHits(){
  if (mode !== 'play' || tGlobal < invulnUntil) return;
  const cx = player.x, cy = player.y;
  for (const o of obstacles){
    const sx = o.x - cam;
    if (sx > W + 60 || sx + o.w < -60) continue;
    const nx = clamp(cx, sx, sx + o.w);
    const ny = clamp(cy, o.y, o.y + o.h);
    const dx = cx - nx, dy = cy - ny;
    if (dx * dx + dy * dy < HIT_R * HIT_R){ hurt(); break; }
  }
}
function hurt(){
  lives--; crashes++;
  invulnUntil = tGlobal + 2;
  player.vx = -200; player.vy = -160;
  droneEl.classList.add('hit');
  setTimeout(() => droneEl.classList.remove('hit'), 2100);
  sparks(player.x + cam, player.y);
  shake();
  flashEl.classList.remove('on'); void flashEl.offsetWidth; flashEl.classList.add('on');
  SFX.hurt();
  updateHUD();
  if (lives <= 0) gameOver();
}

// dashed ring under the customer currently in drop range
function targetCheck(){
  for (const c of customers){
    if (c.state !== 'idle') continue;
    const onScreen = c.x - cam > -60 && c.x - cam < W + 60;
    const inRange = onScreen &&
      Math.abs(player.x - (c.x - cam)) < 95 &&
      player.y < c.feetY - 60;
    c.el.classList.toggle('targeted', inRange);
  }
}


/* =========================================================
   10. GAME LOOP, RESET & INIT
   ========================================================= */
function clearLayer(el){ while (el.firstChild) el.removeChild(el.firstChild); }

function resetGame(toMode){
  clearLayer(worldEl); clearLayer(actorsEl); clearLayer(pkgsEl);
  clearLayer(fxEl); clearLayer(fxScrEl); clearLayer(midEl); clearLayer(farEl);
  // world keeps its structural child layers — re-add them
  worldEl.appendChild(actorsEl); worldEl.appendChild(pkgsEl);
  worldEl.appendChild(fxEl); worldEl.appendChild(shadowEl);

  statics.length = midStatics.length = farStatics.length = 0;
  platforms.length = obstacles.length = customers.length = 0;
  packages.length = parts.length = 0;

  cam = 0; score = 0; dispScore = 0; lives = MAX_LIVES; level = 1;
  deliveries = 0; crashes = 0; playTime = 0; dropCd = 0;
  genX = -300; midX = -200; farX = -100; chunkN = 0; sinceCustomer = 2; lastPole = null;

  player.x = W * 0.234; player.y = H * 0.389; player.vx = 0; player.vy = 0; player.tilt = 0;
  droneEl.className = 'lvl1';
  levelEl.textContent = 'LV 1'; levelEl.className = '';
  invulnUntil = 1.5;                     // safe spawn grace

  buildHearts(); updateHUD();
  ensureWorld();
  mode = toMode;
  setHum(toMode === 'play' ? .022 : 0);
}

function cleanup(){
  const cut = cam - 500;
  for (let i = statics.length - 1; i >= 0; i--){
    const s = statics[i];
    if (s.x + s.w < cut){ s.el.remove(); statics.splice(i, 1); }
  }
  for (let i = platforms.length - 1; i >= 0; i--)
    if (platforms[i].x1 < cut) platforms.splice(i, 1);
  for (let i = obstacles.length - 1; i >= 0; i--)
    if (obstacles[i].x + obstacles[i].w < cut) obstacles.splice(i, 1);
  for (let i = customers.length - 1; i >= 0; i--){
    const c = customers[i];
    if (c.x < cut + 360 && c.state === 'idle'){ c.el.remove(); customers.splice(i, 1); }
    else if (c.x < cut - 100){ c.el.remove(); customers.splice(i, 1); }
  }
  const cutMid = cam * 0.45 - 600;
  for (let i = midStatics.length - 1; i >= 0; i--){
    const s = midStatics[i];
    if (s.x + s.w < cutMid){ s.el.remove(); midStatics.splice(i, 1); }
  }
  const cutFar = cam * 0.18 - 700;
  for (let i = farStatics.length - 1; i >= 0; i--){
    const s = farStatics[i];
    if (s.x + s.w < cutFar){ s.el.remove(); farStatics.splice(i, 1); }
  }
}

function render(){
  worldEl.style.transform = `translate3d(${-cam}px,0,0)`;
  midEl.style.transform   = `translate3d(${-cam * 0.45}px,0,0)`;
  farEl.style.transform   = `translate3d(${-cam * 0.18}px,0,0)`;
  roadEl.style.setProperty('--rshift', (-cam % 96) + 'px');
  walkEl.style.setProperty('--wshift', (-cam % 63) + 'px');
  renderDrone();

  // score count-up
  dispScore += (score - dispScore) * 0.18;
  if (Math.abs(score - dispScore) < 0.6) dispScore = score;
  scoreEl.textContent = Math.round(dispScore);
}

let last = performance.now();
function frame(now){
  requestAnimationFrame(frame);
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;
  tGlobal += dt;

  if (mode === 'play'){
    playTime += dt;
    cam += CAM_SPEED * dt;
    dropCd = Math.max(0, dropCd - dt);
    updatePlayer(dt);
    updatePackages(dt);
    checkHits();
    targetCheck();
    // subtle prop pitch with throttle
    if (humOsc && !muted){
      humOsc.frequency.value = 68 + Math.min(60, Math.abs(player.vx) * .06 + Math.abs(player.vy) * .05);
    }
  } else if (mode === 'menu'){
    cam += CAM_SPEED * 0.55 * dt;
    updatePlayer(dt);
  }

  if (mode !== 'pause') updateParts(dt);

  cleanT += dt;
  if (cleanT > 1.4){ cleanT = 0; cleanup(); }
  ensureWorld();
  render();
}

/* ---- boot ---- */
function resizeView(){
  W = window.innerWidth;
  H = window.innerHeight;
  STAND_Y = H - ROAD_H - SIDE_H;
  stage.style.setProperty('--h', H + 'px');   // keep CSS road/walk in sync with JS
}
window.addEventListener('resize', resizeView);

// give the ambient clouds variety
document.querySelectorAll('.cloud').forEach((c, i) => {
  c.style.animationDuration = rnd(70, 130) + 's';
  c.style.animationDelay = -rnd(0, 120) + 's';
  const sc = rnd(.55, 1.25);
  c.style.width = 150 * sc + 'px';
  c.style.height = 44 * sc + 'px';
});

resizeView();
resetGame('menu');      // attract mode behind the start screen
requestAnimationFrame(frame);

# 🛸 Skyward Express — How the Code Works

A friendly, plain-English walkthrough of how this game is built.
No prior coding knowledge needed — I'll explain everything as we go.

---

## 📁 The 3 Files

| File | What it does |
|------|-------------|
| `index.html` | The **skeleton** — defines the layout, HUD, and screens |
| `script.js` | The **brain** — all game logic, physics, and effects |
| `style.css` | The **art** — every building, character, and cloud is drawn with CSS |

The game is **"canvas-free"**: there are no images and no `<canvas>` element.
Everything you see is made of styled `<div>` elements animated by JavaScript.

---

## 🧠 How the Browser Runs It (30-second overview)

1. The browser loads `index.html`.
2. At the bottom of `index.html`, `<script src="script.js">` loads the game code.
3. `script.js` runs immediately and:
   - Finds all the important HTML elements (the HUD, the layers, the buttons...)
   - Builds a starting city
   - Starts a **game loop** — a function that runs ~60 times per second
4. The game loop keeps everything moving: the camera scrolls, physics update, collisions are checked, and the screen is redrawn every frame.

That's the whole idea. Now let's look at each part in detail.

---

## 🧩 Part 1: `index.html` — The Structure

The HTML is essentially a stack of **layers** (like transparent sheets of paper stacked on top of each other).

### The layers (top to bottom visually):

```
#sky          →  the sun + clouds (very back)
#farLayer     →  distant buildings (slowest parallax)
#midLayer     →  mid-distance buildings (medium parallax)
#world        →  the main city (buildings, props, characters)
#walk / #road →  sidewalk + road (scroll with CSS)
#drone        →  the player's drone (doesn't scroll!)
#hud          →  score, lives, level (static UI)
.screen       →  menu / pause / end screens
```

### Key things to notice

- **`#cam`** — a "camera" wrapper. When the drone crashes, this shakes via a CSS class.
- **`#drone`** — lives *outside* the scrolling world, so it stays centered-ish while the city scrolls by.
- **The drone's body** is made of nested divs: arms, propellers, hull, visor, cargo.
- **HUD chips** — score (`/ 1000`), hearts (3 lives), and drone level.
- **Three screens** — start, pause, end. Each is a `<section class="screen">` that gets shown/hidden by JavaScript.
- **Buttons** — ⓘ info, 🔊 sound, ⏸ pause, plus START / RESUME / FLY AGAIN.

---

## 🧠 Part 2: `script.js` — The Brain (section by section)

The file is split into 10 sections. Here's the map:

| Section | Lines | Purpose |
|---------|------|---------|
| 1. Config & State | 17–69 | Constants + all game variables |
| 2. DOM & Helpers | 74–108 | Grabs HTML elements + utility functions |
| 3. Audio | 114–155 | Sound effects via WebAudio (no files!) |
| 4. Input | 161–184 | Keyboard controls |
| 5. World Generation | 190–432 | Randomly builds the city |
| 6. Deliveries & Customers | 438–567 | The actual "game" — drop packages |
| 7. FX | 573–631 | Particles, popups, screen shake |
| 8. UI | 637–741 | HUD updates, toasts, screens |
| 9. Player & Collisions | 747–835 | Drone physics + crash detection |
| 10. Game Loop | 841–962 | The heartbeat of everything |

---

### Section 1 — Config & State (the "settings" and "memory")

**Constants** (can never change):

```js
const CAM_SPEED = 150;        // world scrolls 150 px per second
const GOAL_SCORE = 1000;      // win at 1000 points
const MAX_LIVES = 3;          // 3 hearts
const GRAVITY = 1500;         // how hard dropped packages fall
const DELIVER_RADIUS = 88;    // how close a package must land to count
```

**Levels** — the drone gets stronger as you score:

```js
const LEVELS = [null,
  { accel: 1500, maxSpeed: 330 },   // LV1 — base drone
  { accel: 1950, maxSpeed: 405 },   // LV2 — reached at 500 pts
  { accel: 2100, maxSpeed: 435 },   // LV3 — reached at 1000 pts
];
```

**Color palettes** — every building color, neon sign color, etc. is randomly picked from these lists.

**Mutable state** — the game's "memory" that changes while playing:

```js
let mode = 'menu';       // menu | play | pause | over | win
let cam = 0;             // camera position (world scroll offset)
let score = 0;           // actual score
let lives = 3;
let level = 1;
```

**Arrays that hold "live objects"**:

```js
const platforms = [];   // places you can land a package on
const obstacles = [];   // things you can crash into
const customers = [];   // people waiting for packages
const packages  = [];   // packages you dropped
const parts     = [];   // particles (confetti, sparks, dust)
```

And the **player object** — the drone's position & velocity:

```js
const player = { x: 300, y: 280, vx: 0, vy: 0, tilt: 0 };
```

- `x`, `y` = screen position
- `vx`, `vy` = velocity (how fast it's moving in each direction)
- `tilt` = how much the drone banks

---

### Section 2 — DOM & Helpers (grabbing elements + shortcuts)

**`$` is a shortcut** for finding elements by ID:

```js
const $ = id => document.getElementById(id);
const stage = $('stage');   // same as document.getElementById('stage')
```

**Random helpers** — used everywhere:

```js
rnd(a, b)   → random number between a and b
irnd(a, b)  → random *integer* between a and b
pick(arr)   → pick a random item from an array
chance(p)   → true p% of the time (p = 0.5 → 50%)
clamp(v,a,b)→ keep v between a and b
```

**`make(tag, cls, parent)`** — creates a div, styles it via a CSS class, and adds it to the world. This is how 99% of objects (buildings, poles, customers) get created.

**`surfaceTopY(wx, fromY)`** — this is important: it finds the top of the surface below a given world position (a building roof, a balcony, or the sidewalk). Used by packages to know where they land.

---

### Section 3 — Audio (beeps & boops, no files needed)

The game **synthesizes** all sounds using the WebAudio API — there are no `.mp3` or `.wav` files.

- `audio()` — creates (or reuses) the AudioContext
- `tone(freq, options)` — plays one beep with a given frequency, duration, volume, and optional slide
- `SFX` — a collection of sound effects:
  - `click()` — menu clicks
  - `drop()` — package drop (sliding sawtooth)
  - `deliver()` — happy 3-note chime
  - `hurt()` — crash buzz
  - `over()` / `win()` — little melodies
- `startHum()` — a constant **engine hum** (low sawtooth through a lowpass filter)
- `setHum(target)` — smoothly adjusts the humming volume (louder in game, silent when paused/muted)

---

### Section 4 — Input (keyboard controls)

The game tracks which keys are **currently held down** with a `Set`:

```js
const keys = new Set();
```

- `keydown` → adds the direction to the set (e.g. press `←` → adds `'left'`)
- `keyup` → removes it
- Arrow keys AND `WASD` both work (nice for left-handed players)
- `Space` → drop a package
- `P` → pause / resume
- `M` → mute / unmute
- Pressing `Space`/`Enter` on the menu → start the game
- If the window loses focus (`blur`), the game auto-pauses so you don't die while alt-tabbing

---

### Section 5 — World Generation (how the city builds itself)

The city is generated in **chunks** — slices of terrain roughly 560–780 pixels wide. The game only generates what's ahead, and deletes what's behind (this is called *streaming* — it keeps memory small and the game infinite).

#### How a chunk is decided (with weighted randomness):

```js
if (chunkN > 2 && r < 0.13)      makePlaza(...)   // trees, benches, hydrants (13%)
else if (chunkN > 2 && r < 0.25) makeDepot(...)   // cargo docks (12%)
else                             makeBlock(...)   // regular building (75%)
```

#### What gets placed per chunk:

- **`makeBlock`** — a random-width, random-height, random-color building.
  - Roofs become **landing platforms**
  - May get awnings, neon signs, windows, doors
- **`makeDepot`** — a low warehouse with big rolling doors + stacked crates
- **`makePlaza`** — no building; just trees, a bench, maybe a hydrant
- **`streetProps`** — light poles, trees, traffic lights, barriers (random odds)
- **`addCrane`** — a construction crane every ~9 chunks (a big hazard!)

#### Rooftop props (hazards on roofs):

Air conditioners, water tanks, antennas, satellite dishes, and billboards. The code also deliberately **spaces them apart** so you can (usually) weave between them.

#### Parallax (fake depth):

- Far buildings scroll at **18%** of camera speed
- Mid buildings scroll at **45%**
- Main world scrolls at **100%**

This makes the background feel far away, just like real 3D games — but with pure math:

```js
midEl.style.transform = `translate3d(${-cam * 0.45}px,0,0)`;
farEl.style.transform = `translate3d(${-cam * 0.18}px,0,0)`;
```

---

### Section 6 — Deliveries & Customers (the actual gameplay loop)

#### Spawning customers

`trySpawnCustomer` decides where a customer appears. Possible spots:

1. **Sidewalk** — standing at the base of the chunk (kept clear of obstacles)
2. **Rooftop** — on top of the building, away from roof props
3. **Balcony** — on tall buildings (55% chance), a balcony platform is created mid-building

If no spot is safe, no customer spawns that chunk.

#### Dropping a package (Space key)

```js
function dropPackage(){
  if (mode !== 'play' || dropCd > 0) return;   // can't drop in menus or during cooldown
  dropCd = DROP_COOLDOWN;                       // 0.45s cooldown
  ...
  packages.push({ x: player.x + cam, y: player.y + 30,   // spawn at drone
                  vx: player.vx * 0.35, vy: 60, ... });  // inherit a bit of your momentum
}
```

The package inherits **35% of the drone's horizontal speed** — so if you're flying fast sideways, the package will fly sideways too. That's a real skill element!

#### Package physics (gravity + bounce)

Every frame, falling packages:

- speed up due to `GRAVITY` (1500 px/s²)
- move sideways at constant velocity
- rotate slowly (`vr`)

When a package hits a surface:

- If falling **fast** (> 260 px/s) → it **bounces** once (loses 70% of speed) and keeps moving
- If falling **slow** → it **settles** and gets "resolved"

#### The delivery check (`resolvePackage`)

The package looks for a customer who is:

1. Still `idle` (not already served)
2. Within **88 px** horizontally
3. On the **same surface** (within 48 px vertical)

If found → `deliverSuccess()` → **+100 points** + confetti + happy customer animation.
If not → a grey "miss" text pops up.

#### Leveling up

```js
function addScore(n){
  score += n;
  if (score >= 500 && level === 1) levelUp(2);   // 500 → LV2
  if (score >= GOAL_SCORE && level === 2){       // 1000 → LV3 + win!
    levelUp(3);
    setTimeout(winGame, 900);
  }
}
```

Each level-up changes the drone's CSS variables (faster spin, new colors) and its physics (acceleration & max speed) from the `LEVELS` table.

---

### Section 7 — FX (making it feel juicy)

- **`popupText`** — floating "+100", "miss", or "♥" text (CSS animation lifts & fades it)
- **`confetti`** — colorful rectangles with random velocity + gravity
- **`sparks`** — orange/red particles on a crash
- **`dust`** — soft grey puffs
- **`enginePuff`** — tiny colored puffs behind the drone (color matches your level!)
- **`updateParts`** — every particle gets: gravity applied → position updated → opacity faded by remaining life → cleaned up when dead
- **`shake()`** — restarts the camera shake CSS animation on crash

---

### Section 8 — UI (HUD, toasts, screens)

- **`buildHearts()`** — creates 3 ❤ spans
- **`updateHUD()`** — greys out lost hearts (adds `.lost`)
- **`showLegend()`** — shows the control hint bar at the bottom for 5 seconds
- **`showToast()`** — big "GO!" / "DRONE UPGRADED!" announcements, with a custom color via a CSS variable
- **`statsHTML()`** — builds the end-screen stats (deliveries, crashes, time)
- **`showScreen(id)`** — shows exactly one screen (start/pause/end), hides the rest
- **`gameOver()`** — red theme, "GAME OVER", button says "TRY AGAIN"
- **`winGame()`** — gold theme, "MISSION COMPLETE!", button says "FLY AGAIN", plus **confetti rain** (44 falling pieces with random colors/speeds/delays)

---

### Section 9 — Player Movement & Collisions (the drone)

#### Movement (smooth acceleration)

```js
player.vx += ax * L.accel * dt;      // accelerate
const damp = Math.exp(-dt * 2.4);    // exponential drag
player.vx *= damp;                   // slow down smoothly when you let go
player.vx = clamp(player.vx, -L.maxSpeed, L.maxSpeed);   // speed cap
```

This is why the drone feels **floaty and smooth** instead of snappy — it eases in and eases out.

#### Screen bounds

The drone can fly anywhere except the very edges:

```js
player.x < W * 0.055    → clamp (left edge)
player.x > W * 0.6875   → clamp (right edge)
player.y < 60           → clamp (ceiling)
player.y > STAND_Y - 46 → clamp (ground level)
```

#### Banking tilt

Turning left/right tilts the drone body (`vx * 0.035`, clamped to ±12°), and the tilt eases toward the target — that's why the drone leans into turns.

#### Shadow

A fake shadow is rendered under the drone, projected onto whatever surface is below it. The shadow scales up/down and fades based on distance — a classic *"fake 3D"* trick.

#### Collision detection (circle vs rectangle)

For every obstacle, the code does **distance checking**:

```js
const nx = clamp(cx, sx, sx + o.w);   // nearest point on the box to the drone
const ny = clamp(cy, o.y, o.y + o.h);
const dx = cx - nx, dy = cy - ny;
if (dx*dx + dy*dy < HIT_R*HIT_R) hurt();
```

This finds the closest point on each obstacle rectangle to the drone's center, then checks if that distance is less than the drone's radius (22 px). If yes → **you crashed**.

#### When you crash (`hurt()`)

1. Lose a life, count a crash
2. **2 seconds of invulnerability** (`invulnUntil`)
3. Get knocked back (`vx = -200, vy = -160`) — you bounce away
4. Sparks fly, screen shakes, red flash, alarm sound
5. Drone blinks (`.hit` class)
6. If hearts hit 0 → game over

---

### Section 10 — The Game Loop (the heartbeat)

This is the single most important function:

```js
function frame(now){
  requestAnimationFrame(frame);        // schedule the NEXT frame (≈60 fps)
  const dt = Math.min(0.033, (now - last) / 1000);  // time since last frame (capped)
  last = now;
  tGlobal += dt;

  if (mode === 'play'){
    playTime += dt;
    cam += CAM_SPEED * dt;             // scroll the world
    dropCd = Math.max(0, dropCd - dt);
    updatePlayer(dt);                  // move drone
    updatePackages(dt);                // fall + settle packages
    checkHits();                       // crash detection
    targetCheck();                     // highlight in-range customers
  } else if (mode === 'menu'){
    cam += CAM_SPEED * 0.55 * dt;      // slow attract-mode scrolling
    updatePlayer(dt);                  // drone glides automatically
  }

  updateParts(dt);                     // animate all particles
  cleanup();                           // delete off-screen stuff
  ensureWorld();                       // generate more city ahead
  render();                            // draw everything
}
```

**`requestAnimationFrame(frame)`** is the browser's built-in ~60fps timer. Every frame the world moves slightly, physics get updated, and the screen redraws — creating the illusion of continuous motion.

#### `render()` — the final draw

```js
worldEl.style.transform = `translate3d(${-cam}px,0,0)`;       // main world
midEl.style.transform   = `translate3d(${-cam * 0.45}px,0,0)`; // mid parallax
farEl.style.transform   = `translate3d(${-cam * 0.18}px,0,0)`; // far parallax
```

The camera scroll is just a **negative translateX**! The CSS road stripes also shift via CSS variables (`--rshift`, `--wshift`) so the road stripes scroll perfectly with the world.

The score also **counts up smoothly**: `dispScore` eases toward the real `score` (18% per frame) — a satisfying "tick, tick, tick" effect.

#### Cleanup — don't let memory grow forever

Every 1.4 seconds, everything more than 500px behind the camera is removed from the DOM and from the arrays. That's what lets the game scroll forever without slowing down.

---

## 🎨 Part 3: `style.css` — The Art Engine

Since there are no images, every visual is CSS. Here are the clever tricks:

### Procedural buildings
- Random colors via **CSS custom properties**: `--c`, `--roof`, `--glass`
- Windows are drawn with **repeating gradients**, not actual divs
- The roof has a rounded "cap" using `::before`
- Neon signs flicker with a `neon` keyframe animation

### Parallax
- `.fbld` and `.mbld` just sit in huge layers that JS translates at different speeds

### The drone is all divs
- **Propellers** "spin" by scaling `scaleX()` from 1 → 0.14 → 1 repeatedly — the classic strobe effect
- Level-up changes CSS variables (`--prop`, `--glowC`, `--glowS`, `--accent`) — one rule, instant new look:
  ```css
  #drone.lvl2{ --prop:.11s; --glowC:rgba(64,240,220,.95); ... }
  #drone.lvl3{ --prop:.09s; --glowC:rgba(255,200,80,1); ... }
  ```

### Customers
- 5 skin/hair color variants via `.c1`–`.c5` classes
- A waving arm (CSS `rotate` animation)
- A dashed **target ring** that only appears when you're in range (`.targeted` class)
- On success → `.happy` class switches to jump + cheer animations

### Camera shake
```css
@keyframes shakeCam{
  20%{ transform:translate(-7px,4px);}  40%{ transform:translate(6px,-5px);}
  80%{ transform:translate(3px,4px);}
}
```
JS re-triggers it by removing/re-adding the class.

### HUD & screens
- Panels pop in with a bouncy `cubic-bezier(.2,1.5,.4,1)` scale animation
- Buttons have 3D press effects using `box-shadow` offsets
- Toast announcements scale in, hold, then fade up

---

## 🔄 How a Full Game Works, Step by Step

1. **Page loads** → `resizeView()` sets the window size, `resetGame('menu')` builds the first bit of city, `requestAnimationFrame(frame)` starts the loop.
2. **Menu mode** → the city scrolls slowly. The drone auto-glides around (attract mode). Random buildings generate endlessly behind the start screen.
3. **Player presses SPACE / START** → `startGame()`:
   - Starts audio + engine hum
   - `resetGame('play')` clears everything and rebuilds a fresh city
   - Toast says "GO! DELIVER TO 1000 PTS"
4. **In play mode** (every frame):
   - World scrolls 150 px/s
   - Drone moves toward held keys, eased by drag
   - Dropped packages fall with gravity and bounce
   - Collisions are checked → crashes hurt you
   - Customers spawn as chunks pass, packages hitting customers score +100
   - At 500 pts → **LV2** (faster). At 1000 pts → **LV3**, then win!
5. **Lose all hearts** → `gameOver()` → stats screen → "TRY AGAIN" resets.
6. **Reach 1000 pts** → `winGame()` → confetti rain → "FLY AGAIN" resets.

---

## 🧰 Key Code Patterns (things to steal & reuse)

### 1. Delta-time (`dt`)
Always multiply movement by `dt` (seconds since last frame) so the game runs the same speed on fast and slow screens.

```js
const dt = Math.min(0.033, (now - last) / 1000);
player.x += player.vx * dt;
```

### 2. Exponential drag (smooth momentum)
```js
const damp = Math.exp(-dt * 2.4);
player.vx *= damp;
```
Higher number = "stickier" movement.

### 3. Easing (smooth transitions toward a target)
```js
value += (target - value) * factor;   // factor < 1
```

### 4. Object pooling-lite (create / reuse / destroy)
Objects are pushed into arrays, updated in a loop, and spliced out when dead. Simple and reads clearly.

### 5. Streaming chunks
Generate ahead, delete behind, keep scrolling forever:
```js
while (genX < cam + W * 1.9) genX += makeChunk(genX);
// ...and in cleanup(): if (s.x + s.w < cam - 500) s.el.remove();
```

### 6. Circle-vs-rect collision in one line
```js
const nx = clamp(cx, sx, sx + o.w);
if (cx*ny stuff...) // see Section 9
```

### 7. CSS variables as a "live theming" system
One class toggle (`.lvl2`) instantly changes colors, speeds, and sizes of the drone, the engine puff, the HUD label — all through CSS custom properties.

---

## ⚡ Quick Reference — Where Things Live

| "I want to change…" | Go to |
|---|---|
| Drone speed / acceleration | `LEVELS` in script.js (Section 1) |
| Score goal (1000) | `GOAL_SCORE` in script.js |
| Lives (3) | `MAX_LIVES` in script.js |
| Camera scroll speed | `CAM_SPEED` in script.js |
| Package gravity/bounce | `GRAVITY`, `PKG_H` in script.js |
| Delivery tolerance | `DELIVER_RADIUS` in script.js |
| Building colors | `PALETTE` in script.js + `.bld` in style.css |
| Drone look per level | `#drone.lvl1/2/3` in style.css |
| Sound effects | `SFX` object in script.js (Section 3) |
| Game-over / win text | `gameOver()` / `winGame()` in script.js |
| Control hints | `#legend` in HTML + `showLegend()` in script.js |
| Level-up messages | `levelUp()` + `showToast()` in script.js |
| Crowd/customer density | `chance(.55)` in `makeChunk` (script.js Section 5) |

---

## 🚀 Final Thoughts

Skyward Express is a great example of a **complete game in three files**:

- **HTML** = the stage and props
- **CSS** = the entire art department (no images!)
- **JS** = the director, cameraman, physics engine, referee, and sound guy

The clever parts to remember:

1. **Fake parallax 3D** — just 3 layers moving at different speeds
2. **Procedural generation** — random chunks streamed forever, cleaned up behind you
3. **Physics without a physics engine** — simple `vx += a*dt`, `x += v*dt`
4. **Juice** — the game "feels" good because of drag, easing, bounces, screen shake, particles, and sound
5. **No assets** — everything is math + CSS. The whole game ships in ~1,760 lines of code.

Now you know how the machine under the hood works. Go fly! 🛸
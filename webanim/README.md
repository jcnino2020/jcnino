# 🛸 Skyward Express

A fast, juicy, canvas-free arcade game built with **pure HTML, CSS, and JavaScript** — no images, no assets, no libraries. Everything you see (buildings, people, clouds, the drone itself) is drawn with CSS and animated by JavaScript.

Fly a delivery drone through an endless procedurally generated city, drop packages to waiting customers, dodge obstacles, and level up your drone as you rack up points.

---

## 🎮 How to Play

- **Goal:** Score **1000 points** to win.
- **Deliveries:** Fly near a customer (you'll see a dashed target ring) and press **SPACE** to drop a package. Land it within range for **+100 points**.
- **Crashes:** Hitting buildings, cranes, poles, rooftop props, or trees costs a heart. You have **3 hearts**.
- **Level ups:**
  | Score | Level | Effect |
  |-------|-------|--------|
  | 0 | LV1 | Base drone |
  | 500 | LV2 | Faster acceleration & top speed, new colors |
  | 1000 | LV3 | Even faster, new colors, then 🏆 WIN |

---

## 🕹️ Controls

| Key | Action |
|-----|--------|
| `←` / `A` | Move left |
| `→` / `D` | Move right |
| `↑` / `W` | Move up |
| `↓` / `S` | Move down |
| `SPACE` | Drop a package / Start game |
| `P` | Pause / Resume |
| `M` | Mute / Unmute |
| `ENTER` | Start from menu |

---

## ▶️ How to Run

No build step, no dependencies, no server required.

**Option A — just open the file:**

```bash
open index.html
```

**Option B — serve it locally (recommended for best experience):**

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

That's it. The whole game is three files.

---

## 📁 Project Structure

| File | Purpose |
|------|---------|
| `index.html` | Page structure, layers, HUD, and menu screens |
| `style.css` | All visuals — buildings, drone, people, animations (no images!) |
| `script.js` | All game logic — physics, generation, delivery, audio, FX |

> 📚 **Project docs:**
> - **[CODE_GUIDE.md](./CODE_GUIDE.md)** — plain-English walkthrough of how the code works
> - **[ANIMATION_PROPOSAL.md](./ANIMATION_PROPOSAL.md)** — class proposal explaining the animation & keyframe design

---

## ✨ Features

- 🏙️ **Endless procedural city** — buildings, warehouses, plazas, cranes, and rooftop hazards generated forever, cleaned up behind you.
- 🎭 **Fake 3D parallax** — 3 layers scrolling at different speeds for real depth.
- 🎛️ **No-asset art** — buildings with randomized colors/windows, animated neon signs, waving customers.
- 🔊 **Synthesized audio** — all sound effects generated with the WebAudio API (no audio files).
- 🎁 **Physics-y packages** — gravity, bouncing, and momentum inheritance from the drone.
- 💥 **Crashes with juice** — screen shake, sparks, red flash, invulnerability blink, knockback.
- 🏆 **Level-up system** — the drone gets faster and changes colors at 500 and 1000 points.
- 🌧️ **Confetti rain** on victory, plus per-crash particles, engine puffs, and floating score text.

---

## 🛠️ Tweak It

The game is designed to be easy to mod. All the important knobs live at the top of `script.js`:

```js
const CAM_SPEED = 150;      // world scroll speed
const GOAL_SCORE = 1000;    // points to win
const MAX_LIVES = 3;        // hearts
const GRAVITY = 1500;       // package fall speed
const DELIVER_RADIUS = 88;  // delivery tolerance
```

Change any of those numbers, save, and refresh — instant game tuning.

---

## 🧰 Tech Stack

- Plain JavaScript (ES6) — no frameworks
- CSS3 — custom properties, keyframe animations, gradients
- WebAudio API — procedural sound effects
- `requestAnimationFrame` — 60fps game loop with delta-time

---

## 📄 License

Free to use, modify, and learn from. Go fly! 🛸
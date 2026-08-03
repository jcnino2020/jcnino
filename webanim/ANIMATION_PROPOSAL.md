# 🛸 Web Animation Proposal — "Skyward Express" Delivery Drone

**Submitted by:** [Your Name]
**Course:** Web Animation
**Date:** August 5, 2025

---

## 🎯 Concept Overview

A small delivery drone flies through a futuristic city skyline. The viewer watches the drone soar through the air, weave between buildings, and make deliveries as the city scrolls endlessly behind it. The entire animation is created with pure CSS animation and keyframe styling — no images, no video, no downloaded assets.

The star of the animation is the **delivery drone**, a character made of many moving parts: a body, a glowing visor, landing arms, two spinning propellers, and a cargo parcel carried underneath. Every piece animates to make the drone feel alive and responsive.

---

## 🧑‍✈️ The Character

| Part | What it looks like |
|------|-------------------|
| **Body** | The main drone frame |
| **Hull** | A sleek front shell |
| **Visor** | A glowing "eye" light |
| **Arms / Landing Gear** | Folded legs |
| **Propellers** | Two spinning rotors on top |
| **Cargo Box** | A parcel carried underneath |
| **Engine Trail** | Small colored puffs that follow behind |

---

## 🎬 The 5 Movements

The drone performs **5 distinct animated movements**. Here is exactly what the viewer will see for each one:

### 1. 🎡 Spinning Propellers
- **What the viewer sees:** The two propellers on top of the drone spin so fast they blur into see-through circles, like a real quadcopter taking off.
- **When it happens:** Constantly — as soon as the drone appears on screen.

### 2. ⬅️➡️ Gliding Left & Right
- **What the viewer sees:** The drone sweeps smoothly across the screen. When it changes direction, its body **tilts and leans into the turn** — like a plane banking — tilting up to 12 degrees before leveling back out.
- **When it happens:** Whenever the drone moves left or right.

### 3. ⬆️⬇️ Climbing & Descending
- **What the viewer sees:** The drone rises up toward the top of the screen and sinks back down toward the ground. The motion is floaty and smooth, like a balloon on a string, rather than sudden or jerky.
- **When it happens:** Whenever the drone moves up or down.

### 4. 🌊 Hovering in Place
- **What the viewer sees:** When the drone isn't moving, it doesn't just freeze mid-air. It gently **bobs up and down a few pixels**, hovering in place exactly like a real drone holding its position against the wind.
- **When it happens:** Automatically, whenever the player isn't steering.

### 5. 💥 Crash Reaction
- **What the viewer sees:** If the drone bumps into a building or obstacle:
  1. The **entire screen shakes** for a moment.
  2. The drone **flashes red and blinks** on and off for a couple of seconds.
  3. **Sparks burst outward** in every direction.
  4. The drone gets **knocked backward and upward** before recovering.
  5. One of the drone's heart icons fades away.
- **When it happens:** Whenever the drone collides with something.

---

## 🎥 What the Viewer Sees (Scene Walkthrough)

1. **Opening:** A dark screen fades in to reveal the title **"SKYWARD EXPRESS"** popping onto the screen with a bouncy spring effect. Behind it, a city skyline stretches into the distance.

2. **The city comes alive:** The skyline scrolls slowly across the screen. The buildings closest to the viewer move faster, while the buildings far away move slower — this creates a feeling of real 3D depth, even though the animation is flat.

3. **The drone takes the stage:** The drone floats in from off-screen, propellers spinning, gently bobbing. On its own, it glides up, down, left, and right to show off — like a demo mode.

4. **Interactive flight:** When the player presses the arrow keys, the drone responds instantly — leaning into turns, climbing, diving, always leaving a trail of little engine puffs behind it.

5. **A delivery drop:** The drone releases a small brown parcel. The parcel tumbles through the air, spins, and falls toward the ground below.

6. **A happy customer:** When the parcel lands next to a waiting person, a green **"+100"** floats up, confetti bursts out, and the person jumps for joy and waves.

7. **A crash moment:** The drone hits a rooftop antenna. The screen shakes, sparks fly, the drone blinks red, and a heart icon disappears from the corner.

8. **Victory finale:** When the score reaches 1000, **gold confetti rains down** from the top of the screen, and the drone's body transforms with a brand-new glowing color scheme.

---

## 🛠️ How the Animation Will Be Built (Concept)

The animation will be built using **two key techniques**:

1. **CSS Keyframe Animations** — Every continuous motion (the spinning propellers, the screen shake, the bobbing, the confetti falling, the title popping in) will be defined as a keyframe animation with clear start and end states: from → to.

2. **The Parallax Depth Trick** — The city will be split into **3 layers of buildings**. Each layer scrolls at a different speed: the farthest layer moves the slowest, the middle layer moves a bit faster, and the nearest layer moves the fastest. This simple trick makes a flat 2D scene feel like a deep, 3D world.

No images, no video, no external files — just animated shapes and layers moving in sync.

---

## ✅ Requirements Checklist

- [x] At least **1 character** — the delivery drone
- [x] **5 movements** (requirement is 3–5):
  1. 🎡 Spinning propellers (rotate)
  2. ⬅️➡️ Gliding left & right (move + banking tilt/rotate)
  3. ⬆️⬇️ Climbing & descending (move up & down)
  4. 🌊 Hovering bob (idle animation)
  5. 💥 Crash reaction (shake + blink + knockback)
- [x] Uses **CSS Animation and Keyframes** style code
- [x] Explains **how the animation will move / what the viewer will see**

---

## 🎁 Why This Animation Will Be Fun to Watch

- **Every action has a reaction** — crashes shake the screen, deliveries burst confetti, the drone leaves a trail of puffs.
- **Fake 3D depth** — the three-layer scrolling city makes the flat screen feel like a real world.
- **The character has personality** — the drone glides, floats, leans, blinks, and celebrates. It feels alive, not like a static picture.
- **Zero downloads** — everything is built from code and math, so it loads instantly with nothing to install.

---

*Proposal prepared for Web Animation class.* 🛸
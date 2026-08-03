# 🛸 Simple Web Animation — Movement & Visual Guide

## 📖 Concept Overview
This animation showcases a **Skyward Drone Character** floating inside a fullscreen starry night backdrop.

The entire stage spans **100% of the browser window** (`100vw` × `100vh`) with no outer borders, cards, or clutter. The canvas automatically resizes dynamically as the browser window changes size.

---

## 🎬 What the Viewer Will See & How it Moves

### 1. 🌊 Continuous Hovering (Idle State)
- **What the viewer sees:** When no controls are pressed, the drone gently bobs up and down (vertical floating animation) while its twin top rotors spin at high speed and a cargo parcel rests under its body.

### 2. ⬅️ Continuous Move Left (Long-Press Banking Float)
- **What the viewer sees:** When long-pressing `←` or `A`, the drone glides continuously across the entire screen to the left. The character **tilts -18° counter-clockwise** into the bank and smoothly levels back out when released.

### 3. ➡️ Continuous Move Right (Long-Press Banking Float)
- **What the viewer sees:** When long-pressing `→` or `D`, the drone glides continuously across the screen to the right while **tilting +18° clockwise**.

### 4. ⬆️ Continuous Move Up (Climbing Ascent)
- **What the viewer sees:** When long-pressing `↑` or `W`, the drone ascends upward toward the top of the browser screen.

### 5. ⬇️ Continuous Move Down (Descending Dive)
- **What the viewer sees:** When long-pressing `↓` or `S`, the drone descends downward toward the bottom of the browser screen.

### 6. 📦 Action — Package Box Drop (Physics Drop)
- **What the viewer sees:** Pressing `Spacebar` or clicking anywhere on screen releases a **cardboard parcel box** from underneath the drone. The box tumbles down with gravity, inherits horizontal momentum, hits the ground with a dust puff animation, and fades away.

---

## ℹ️ Auto-Hiding Controls & Info Toggle
- The keyboard controls overlay automatically **fades out after 5 seconds** to keep the stage clean.
- A sleek **ℹ️ info button** is located in the **lower-left corner**. Clicking it shows the keyboard controls again whenever needed.

---

## 🕹️ Controls Summary

| Input | Character Movement | Visual Result |
| :--- | :--- | :--- |
| **Long-Press `A` / `←`** | Continuous Left Glide | Smoothly glides left & tilts -18° |
| **Long-Press `D` / `→`** | Continuous Right Glide | Smoothly glides right & tilts +18° |
| **Long-Press `W` / `↑`** | Continuous Up Ascent | Ascends upward continuously |
| **Long-Press `S` / `↓`** | Continuous Down Descent | Descends downward continuously |
| **Press `Space` / Click** | Package Drop Action 📦 | Releases a tumbling box with gravity & landing puff |
| **Click ℹ️ (Lower Left)** | Toggle Controls Overlay | Shows / hides keyboard controls hint |

---

## 🛠️ How to Run
Open [index.html](file:///Users/jcnino/Documents/WebAnim2/simple/index.html) in your browser.

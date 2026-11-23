# Skyward Express — Rooftop Dispatch

Rooftop Dispatch is a standalone edition of Skyward Express. It uses the same campaign, arcade rules, and flight physics as the game in the neighboring `webanim-redesign` folder.

The title screen runs on the contract renderer. Desktop pilots can choose a route in the split contract board, while phones open a focused briefing. The briefing shares its background with the flight it launches. Classic Shift and Endless still use the original arcade renderer.

## Run locally

From this directory:

```sh
npm run build
npm test
python3 -m http.server 8732 --bind 127.0.0.1
```

Open `http://127.0.0.1:8732/`. Use WASD or arrow keys to fly, Space to drop, Shift to boost, and P or Escape to pause.

Rooftop Dispatch uses its own browser save keys. To bring a career over from the previous edition, export the JSON from Settings in that edition and import it from Settings here.

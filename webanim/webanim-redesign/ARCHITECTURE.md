# Architecture

This directory is a standalone static game. The parent repository has its own Tailwind build and Vercel configuration. The named Skyward Express deployment matched this directory’s original HTML, CSS and JavaScript byte for byte. The parent webanim entry is a separate three-level prototype. The sibling Full Edition is an additional local draft, and the original game uses procedural DOM, CSS and inline SVG assets.

| Module | Responsibility |
| --- | --- |
| index.html, style.css, dispatch.css | Game shell, original arcade scene, dispatch and flight layouts |
| script.js | Classic Shift and Endless renderer, procedural scenery, legacy arcade rules and shared Web Audio |
| game/core.js, game/input.js | Fixed-step clock, transition validation, key aliases and captured pointer inputs |
| game/balance.js, game/physics.js | Flight profile, collision and battery rules, swept parcels, delivery quality and combos |
| game/contracts.js, game/mission.js | District data, deterministic route variations, objectives and mission state |
| game/renderer.js | Canvas 2D flight view, parallax, weather, physical pad markers, forecast, effects and camera |
| game/career.js | Progression, equipment, statistics, versioned save validation, import, export and legacy record migration |
| game/dispatch.js, game/terminal.js | Menu routing, accessible HUD, briefings, results, settings, garage and persistence |

The visible game scene uses requestAnimationFrame. Simulation runs at 120 Hz with a 100 ms maximum catch-up window. The active flight pauses on blur or page hide. Career rendering stops while paused, and Classic Shift skips paused and hidden updates. Career runs use world coordinates and a capped canvas DPR. The Classic Shift renderer retains its original screen-space flight boundaries and adjusts world objects when the viewport changes.

A contract moves through briefing, countdown, flight, optional pause, a single terminal outcome and results. A package resolves against the first crossed pad or hazard and can score only once. Results update a versioned localStorage key in one write. Old Classic Shift high score and time migrate on first load.

## Phase 0 audit

The shipped game’s strengths were its city atmosphere, readable layouts, delivery combo, five visual stages, mobile direction pad and original sound effects. Flight, collision, scoring, UI, world generation and audio shared one script. Frame timing followed display refresh, and delayed win and hit callbacks could outlive a shift. The original project had no game-specific automated checks, no contract catalog and no career saves. An exact pre-change copy of the three deployed source files was archived in a temporary checkpoint before edits.

The expansion retained Classic Shift in the original renderer. The new contract simulation uses an independent renderer so its mission data and physical coordinates can be tested without the DOM.

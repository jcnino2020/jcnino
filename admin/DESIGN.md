# Cinema Suite & Darkroom Terminal

The admin workstation is an obsidian-and-amber creative production suite designed for JC Niñonuevo's photography, aerial drone cinematography, and video projects. It replaces the previous green sidebar dashboard with a full-bleed contact sheet stage, mission control telemetry HUD, horizontal studio transport strip, and slide-over darkroom inspector.

## Layout & Architecture

- **Cinematic Header & Telemetry**: Ultra-dark glass transport bar with illuminated studio tag (`CINEMA SUITE // CMS`), live LED sync beacon, draft revision counter, global search (⌘K), and multi-target publish menu.
- **Studio Horizon Transport Strip**: A sticky horizontal mode switcher with keyboard shortcuts (`0` Mission Overview, `1` Highlights, `2` Drone Shots, `3` Framed Moments, `4` School Events, `5` Collections Hub, `6` Video Projects, `7` Negros Aerials SE) and live category counters.
- **Full-Bleed Stage Canvas**: Pure obsidian substrate with subtle carbon grid coordinates (`#07080b`), generous negative space, and high-density content hierarchy.
- **Mission Control Telemetry HUD**: Overview first viewport featuring a 4-cell studio KPI strip, dynamic audience vector scope (traffic trend), and real-time live monitor radar.
- **Darkroom Film Contact Sheet**: Curated media cards styled like medium-format negative slides with frame markers (`[ROLL 01 • FR 04]`), hover overlay with quick inspect/edit, drag-and-drop reorder, and camera EXIF readouts (`camera • aperture • shutter`).
- **Slide-Over Darkroom Inspector**: A dedicated slide-over panel on the right with cinematic preview monitor, physical photo replacement dropzone, EXIF auto-extractor, and SEO metadata controls.
- **Floating Glass Command Dock**: A frosted capsule anchored at the bottom center providing quick media ingestion, ⌘K search, view jump, and instant live site publishing.

## Tokens

| Role | Token Value | Purpose |
| --- | --- | --- |
| Canvas Substrate | `#07080b` | Base canvas with subtle carbon grid |
| Primary Base | `#0a0c12` | Main panels, drawer substrate |
| Secondary Surface | `#0e111a` | Cards, transport bar, header |
| Elevated Surface | `#131724` | Active cards, inspector sections |
| Floating Glass Dock | `rgba(16, 20, 32, 0.78)` | Bottom command capsule (blur 24px) |
| Hairline Border | `rgba(255, 255, 255, 0.08)` | Razor-sharp 1px structural dividing lines |
| Primary Ink | `#f8fafc` | High-contrast display & body text |
| Secondary Ink | `#94a3b8` | Supporting metadata & labels |
| Muted Ink | `#64748b` | Technical guides & helpers |
| Phosphor Amber | `#f59e0b` / `#fbbf24` | Primary actions, camera telemetry, active roll selection |
| Laser Emerald | `#10b981` | Live sync status, successful commits, positive trends |
| REC Crimson | `#ef4444` | Recording status, active monitoring, destructive actions |
| Cyan Telemetry | `#06b6d4` | Drone flight altitude, video telemetry |

## Typography

- **Interface**: Plus Jakarta Sans / Inter with clean geometric tracking.
- **Telemetry & Technical**: JetBrains Mono for frame numbers (`FR 08/24`), focal lengths, shutter speeds, ISO, drone altitudes, visitor counts, and commit hashes.
- **Tabular Numerals**: Strict `tabular-nums` formatting to prevent layout shift during real-time telemetry updates.

## Components & Behavior

- **Contact Sheet Grid**: 4-5 responsive columns on desktop, repacking fluidly on smaller screens.
- **Interactive Drag & Drop**: Native HTML5 drag-and-drop reordering with ghost state and local persistence.
- **State Integrity**: Distinguishes local drafts (`localStorage`), direct disk writes (File System Access API), downloadable `.js` database, and live GitHub publishing.
- **Themed Browser Surfaces**: Obsidian and amber custom scrollbars, themed text selection (`#fbbf24` on `#78350f`), and 2px amber focus outlines.

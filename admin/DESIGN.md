# Portfolio Workbench

The admin is an operational catalogue for JC Niñonuevo's media, not a public-facing portfolio page. Its first task is curation; analytics follow the content work.

## Layout

- A persistent dark green rail groups Library, Insights, and Site tools.
- A compact header keeps search, save/publish, and session actions available.
- The editing canvas is light and high-contrast. Photo thumbnails retain their color.
- On the overview, collections and recent media appear before audience metrics.
- On narrow screens, the rail becomes the existing mobile drawer; content grids collapse without hiding controls.

## Tokens

| Role | Value |
| --- | --- |
| Rail | `#193329` |
| Header | `#142820` |
| Canvas | `#f2f5f2` |
| Surface | `#ffffff` |
| Ink | `#182d22` |
| Secondary ink | `#456154` |
| Primary action | `#197c59` |
| Selected rail item | `#c7eabe` |
| Rule | `#dce6de` |
| Error | `#ad3f3d` |

## Components

Controls use short labels and familiar shapes. Selected controls, keyboard focus, hover, disabled, and destructive states remain distinct. Tables and lists use horizontal rules for scanability. Cards frame individual media, collections, or self-contained tools; page sections remain unframed.

## Behavior

Do not fabricate audience data. Empty activity, live locations, and pages say what is unavailable. The save menu distinguishes publishing from direct disk writes and downloads. Existing storage, auth, upload, and publishing contracts are preserved.

The implementation lives in `admin/workspace.css` on top of the existing functional styles; `admin/admin-core.js` remains the shared behavior layer.

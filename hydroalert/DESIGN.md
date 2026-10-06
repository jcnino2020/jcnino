---
name: HydroAlert Negros
description: A hydrological monitoring desk for explicitly simulated river awareness and local field observations.
colors:
  ground: "#f2f5f3"
  surface: "#ffffff"
  ink: "#20352c"
  muted: "#58665e"
  line: "#d1dbd5"
  forest: "#154c3b"
  forest-hover: "#22644e"
  green: "#236248"
  green-soft: "#e2eee7"
  water: "#17659b"
  water-soft: "#e8f1f7"
  amber: "#8b530b"
  amber-soft: "#fff0cf"
  red: "#ac3035"
  red-soft: "#fbe9e7"
typography:
  headline:
    fontFamily: '"Public Sans", sans-serif'
    fontSize: "32px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "0"
  section:
    fontFamily: '"Public Sans", sans-serif'
    fontSize: "22px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "0"
  title:
    fontFamily: '"Public Sans", sans-serif'
    fontSize: "17px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "0"
  body:
    fontFamily: '"Public Sans", sans-serif'
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "0"
  button:
    fontFamily: '"Public Sans", sans-serif'
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0"
  label:
    fontFamily: '"Public Sans", sans-serif'
    fontSize: "13px"
    fontWeight: 600
    letterSpacing: "0"
  small:
    fontFamily: '"Public Sans", sans-serif'
    fontSize: "12px"
    letterSpacing: "0"
  reading:
    fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace"
    fontSize: "30px"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "0"
rounded:
  control: "4px"
  dialog: "6px"
spacing:
  compact: "8px"
  small: "12px"
  regular: "16px"
  section: "24px"
  page: "32px"
components:
  button-primary:
    backgroundColor: "{colors.forest}"
    textColor: "{colors.surface}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  button-primary-hover:
    backgroundColor: "{colors.forest-hover}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  button-secondary-hover:
    backgroundColor: "{colors.green-soft}"
  button-destructive:
    backgroundColor: "{colors.red-soft}"
    textColor: "{colors.red}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "11px 12px"
    width: "100%"
  navigation-active:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.forest}"
    rounded: "{rounded.control}"
    padding: "11px 16px"
  station-selected:
    backgroundColor: "{colors.green-soft}"
    textColor: "{colors.ink}"
    padding: "18px 20px"
    width: "100%"
  advisory:
    backgroundColor: "{colors.green-soft}"
    padding: "28px"
  status:
    textColor: "{colors.green}"
    size: "12px"
---

# Design System: HydroAlert Negros

## Overview

**Creative North Star: "Hydrological Station Strip-Chart Recorder"**

HydroAlert is a bright monitoring desk: a forest-green structural header, white working surfaces, calibrated blue traces, and ruled station records. Public Sans keeps the three task views direct and readable. Amber and red communicate changes in the synthetic scenario through explicit labels as well as color.

The identity is independent of a photography portfolio. This is an operating tool with compact controls and task-led views, not a marketing composition. The persistent prototype banner and local-only report notices are part of the visual hierarchy, because synthetic readings and unsent records must remain recognizable while using the tool.

This document was extracted from the three HTML routes, style.css, core.js, storage.js, app.js, font provenance, and the committed surface direction. Browser access was explicitly unavailable in this session. It describes source-observed design and behavior, not rendered approval or screenshot verification.

**Key Characteristics:**

- Bright green-and-white monitoring desk with blue water traces.
- Flat ruled workspaces, compact native controls, and restrained corners.
- Synthetic states expressed through labels, units, thresholds, and semantic color.
- Persistent simulation and local-only disclosure across task views.

## Colors

The palette separates structural forest green from blue measured-looking traces and amber/red demonstration states. The frontmatter owns the exact source values.

### Primary

- **Forest structure:** header, primary actions, selected navigation text, and checkbox accents. Forest hover deepens interactive feedback without changing the structural role.
- **Routine green:** routine state labels. The soft green surface marks selected stations, selected scenario stages, and baseline advisories.

### Secondary

- **Water blue:** links, water traces, chart endpoints, schematic connections, and focus outlines on light surfaces. Soft water blue forms the trace area and schematic background.

### Tertiary

- **Rising amber:** rising-state text and demonstration threshold rules. Soft amber carries the persistent prototype notice and rising advisory surface.
- **High-water red:** high-state text, destructive confirmations, and visible form errors. Soft red carries high-water advisories and destructive buttons.

### Neutral

- **Desk ground:** page background and low-emphasis hover surfaces.
- **White work surface:** charts, station rows, controls, and dialogs.
- **Reading ink:** primary text and readings.
- **Supporting gray-green:** descriptions, captions, time labels, and secondary metadata.
- **Rule line:** section boundaries, chart grid, rows, tables, and input borders.

**The State Has Words Rule.** Every routine, rising, and high-water state must retain a readable label; color is supplemental.

## Typography

**Display and body font:** Public Sans with sans-serif fallback.
**Numeric font:** ui-monospace, SFMono-Regular, Consolas, monospace with tabular numerals.

Local Public Sans files supply regular, semibold, and bold weights. fonts/sources.json records the official Google Fonts CSS and google/fonts source URLs; fonts/Public-Sans-OFL.txt carries the SIL Open Font License. The interface uses the local files with font-display: swap. Icons currently come from Font Awesome 6.4.0 through a CDN; they are not locally bundled fonts.

### Hierarchy

- **Headline:** route headings; reduces to (28px) below the mobile breakpoint.
- **Section:** default second-level heading, with compact work-area headings at (16px), (19px), or (20px), depending on source context.
- **Title:** third-level headings.
- **Body:** readable operational copy with paragraph measure capped at (70ch).
- **Button and label:** compact semibold action text and field labels.
- **Small:** notices, captions, provenance, and supporting metadata; some diagram and plot labels use (10px) or (11px).
- **Reading:** selected water level and rainfall, reducing to (27px) on mobile; station values use (20px), then (18px).

**The Stable Type Rule.** Use fixed type sizes and zero letter spacing; responsive changes select discrete sizes rather than viewport-scaled type.

## Layout

The shared header and main content are centered within (1400px), with (32px) desktop page padding. The notice and footer align to the corresponding (1336px) inner width. The header has a minimum height of (76px). Route heading, visitor-device clock, scenario controls, and work areas open directly at the usable task.

Monitoring pairs a (300px) roster with a flexible trace workspace. Lower sections use an unframed two-column layout. Community uses two columns at a (1.25fr / 1fr) ratio; reporting uses (1fr / 1.15fr). Dividers organize sections instead of floating nested cards.

At (1050px) and below, outer padding becomes (24px), the roster becomes (250px), and section gaps tighten. At (760px) and below, the header wraps and navigation becomes three equal columns; route headings and device time stack, scenario controls become a two-by-two grid, the roster becomes two columns, and the trace follows underneath. Lower, community, reporting, and paired field grids become single-column. The community table hides its rainfall column. Station values and status labels can wrap within their row rather than collide.

The final chart rule fixes height at (300px), with full-width SVG and separately positioned readable axis/time labels; it overrides the earlier aspect-ratio declaration. Below (420px), alternate intermediate time labels become invisible while endpoints remain. Do not infer rendered fit from these source rules.

## Elevation & Depth

Work surfaces are flat at rest, differentiated through background tones and one-pixel rules. Only native dialogs lift: their source shadow is `0 16px 40px rgb(32 53 44 / .16)`, paired with a dimmed `rgb(16 34 25 / .55)` backdrop. No glass effects or decorative gradients are part of this identity.

**The Flat Desk Rule.** Use ruled sections and tonal surfaces for everyday organization; reserve elevation for modal decisions and report details.

## Shapes

Controls use the frontmatter's modest control radius; dialogs use the dialog radius. Station rows, advisory sections, schematic bands, and report rows remain square and flat. Circular dots and station nodes are semantic marks, not background decoration. Native inputs, selects, radios, checkboxes, and dialogs retain familiar interaction geometry.

## Components

### Buttons

Primary actions pair forest fill with white text; secondary actions use white fill and a rule border; destructive confirmation uses red text and border over soft red. Buttons have a minimum height of (44px); icon-only controls also have width (44px). Standard hover uses soft green, while the primary hover uses forest hover. Disabled controls show opacity (.6) and a not-allowed cursor. Secondary destructive buttons inherit the source's soft-green hover.

The default focus outline is (3px) water blue with (3px) offset. Header controls override outline color to white so keyboard focus stays distinct against forest green. Icon-only actions carry accessible names; reset, location removal, export, clear, and project-directory controls have native title tooltips in source.

### Navigation

The green header carries HydroAlert, Negros context, and the three persistent routes: /hydroalert/, /hydroalert/resident.html, and /hydroalert/mobile/. Current-page navigation is white with forest text and semibold emphasis. Hover uses forest hover and white text. Narrow-screen navigation preserves all three route names.

### Scenario Controls and Status

A native radio group forms segmented stages: Baseline, Upstream rain, Downstream rise, and High water. Checked stages use soft green with forest text. Keyboard focus outlines the visible segment. Text-plus-dot status marks use green, amber, or red, with no raised chip container.

Run, pause, replay, reset, station selection, the blue trace, relationship diagram, and chronology reflect the same synthetic scenario. Playback advances every (3000ms) and pauses when the document is hidden. A polite live region announces scenario stage changes. The current thresholds (1.5m / 2.4m) and six-point illustrative series are demonstration-only.

### Station Workspace and Trace

Station rows combine location/role, tabular reading, and explicit status. Pressed selection uses the soft-green surface, not elevation. The selected trace has a blue line, soft-blue area, dashed amber thresholds, units, and an accessible SVG title/description updated with station and level. The relationship diagram is explicitly schematic, not a geographic map or a travel-time prediction.

The displayed visitor-device clock updates each second. It must not be presented as sensor freshness. Scenario chronology records local interaction times, not verified observation timestamps.

### Advisory and Readiness

The community advisory shifts among soft green, amber, and red while retaining example wording and warning-source context. Readiness uses native green-accent checkboxes, a count, and localStorage persistence when available. It is a personal checklist, not a safety assessment. Official-resource rows remain plain linked text with dividers.

### Fields and Local Reports

White native fields use the rule border, control radius, visible labels, and supporting copy. Textareas resize vertically. Form errors use red text in a status region; failed saves preserve entered content for retry.

Reports and optional real JPEG/PNG/WebP photos are stored only in this browser's IndexedDB. Photo selection is limited to (5 MB); previews use object-fit: contain. The optional device-location button requests browser geolocation permission and reports denial or failure without preventing a location-free save. Coordinates represent device location, not verified station coordinates.

The report log contains saved records only, with water/rain filtering and a native detail dialog. Export downloads JSON metadata, including local-only delivery and photo-presence information, but excludes photo files. Clear-all requires a native modal and checked irreversible-delete acknowledgement. High-water saving also requires explicit local-only confirmation. Report details retain a durable local identifier and delivery disclosure.

### Dialogs and Motion

Native dialogs provide constrained widths of `min(560px,calc(100% - 32px))`, a maximum height of (85vh), scrolling, close controls, and modal focus behavior. The reduced-motion media query removes animations and transitions and changes smooth scrolling to automatic scrolling. It does not disable the manually initiated scenario timer.

## Do's and Don'ts

### Do:

- **Do** preserve the bright monitoring desk, ruled workspaces, and blue calibrated trace.
- **Do** keep simulation and local-only disclosures visible in all three routes.
- **Do** pair severity colors with explicit state text and units.
- **Do** retain native controls, keyboard focus, accessible names, and reduced-motion handling.
- **Do** distinguish visitor-device time, synthetic chronology, and locally recorded observations.
- **Do** preserve contain-fit real report photos and permission-based optional device location.

### Don't:

- **Don't** imply live sensors, verified safety, validated lead time, alert delivery, or rescue dispatch.
- **Don't** present the relationship diagram as a geographic map.
- **Don't** replace the operating workspace with a photograph hero, phone frame, dark glass, or gradient heading.
- **Don't** add nested floating cards or decorative metrics.
- **Don't** claim browser rendering, screenshot approval, or mobile fit verification from this source-only documentation.

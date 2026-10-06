---
name: Y2K38 Explorer
description: An instrument workspace for observing finite time representations.
colors:
  paper: "#f4f5f6"
  surface: "#fff"
  ink: "#252331"
  muted: "#63616e"
  line: "#d8d8df"
  plum: "#3d294e"
  accent: "#654184"
  teal: "#086d64"
  teal-soft: "#dcefeb"
  danger: "#a83236"
  danger-soft: "#fae7e4"
  soft: "#eae8ef"
typography:
  display:
    fontFamily: '"Space Grotesk", sans-serif'
    fontSize: "48px"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "0"
  headline:
    fontFamily: '"Space Grotesk", sans-serif'
    fontSize: "28px"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "0"
  title:
    fontFamily: '"Space Grotesk", sans-serif'
    fontSize: "21px"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "0"
  body:
    fontFamily: '"IBM Plex Sans", sans-serif'
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "0"
  label:
    fontFamily: '"IBM Plex Sans", sans-serif'
    fontSize: "13px"
    fontWeight: 400
    letterSpacing: "0"
  button:
    fontFamily: '"IBM Plex Sans", sans-serif'
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.4
  measurement:
    fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace"
    fontSize: "30px"
    lineHeight: 1.8
rounded:
  control: "4px"
  bit: "2px"
spacing:
  compact: "8px"
  control: "12px"
  small: "16px"
  panel: "24px"
  section: "32px"
  workspace: "40px"
  reading: "48px"
components:
  button-primary:
    backgroundColor: "{colors.plum}"
    textColor: "#fff"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  button-danger:
    backgroundColor: "{colors.danger-soft}"
    textColor: "{colors.danger}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  timestamp-input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "12px"
  navigation-active:
    backgroundColor: "#f4f5f6"
    textColor: "{colors.plum}"
    rounded: "{rounded.control}"
    padding: "12px"
  instrument:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
  bit-active:
    backgroundColor: "{colors.teal-soft}"
    textColor: "{colors.teal}"
    rounded: "{rounded.bit}"
    padding: "12px 0 6px"
  overflow-readout:
    backgroundColor: "{colors.danger-soft}"
    textColor: "{colors.danger}"
    padding: "20px 24px"
---

# Design System: Y2K38 Explorer

## Overview

**Creative North Star: "The Time-Representation Laboratory"**

An instrument panel makes an invisible integer boundary observable. A plum rail anchors a light workspace; measured values, editable bits, and paired UTC dates provide the visual emphasis. This independent identity and its descriptive language are implementation choices made under the user's delegated, code-first redesign, rather than separately approved brand language.

The experience is compact, precise, and approachable. Its signature visual is actual binary data generated from the requested integer, not a raster illustration. Educational reading follows the working experiment, with source-linked evidence and explicitly bounded model claims.

**Key Characteristics:**

- A fixed plum rail and a light calibration workspace.
- Teal preserved data; coral overflow with explicit text labels.
- Geometric headings, humanist prose, and monospace measurements.
- Flat surfaces and small corners that organize working instruments.

Extraction covers style.css, app.js, core.js, all four HTML routes, PRODUCT.md, and the overview direction contract. Source-only finish review found label-opacity contrast and a composition-contract mismatch; the opacity was removed and the contract now records the full-width instrument. Reviewer verdict: **Ship at SOURCE-ONLY scope**. Domain and DOM-double tests (`node tests/lab.test.cjs`) and HTTP 200 checks for supplied pages/assets passed. No screenshots or rendered mobile/desktop approval were available: browser access, including localhost workarounds, was denied. These documents record implementation evidence, not rendered visual approval.

## Colors

The palette uses a structural plum anchor, teal data, and coral range warnings against cool neutral surfaces. Frontmatter records the light defaults exactly; dark theme overrides are in the sidecar.

### Primary

- **Plum Rail:** Persistent navigation, product identity, and primary actions.
- **Plum Link:** Links, route indices, countdown, and input caret.

### Secondary

- **Instrument Teal:** Valid stored values, active value bits, state dots, and wider-representation comparisons.
- **Teal Wash:** Active binary cells, historical evidence asides, and the wider-capacity table row.

### Tertiary

- **Overflow Coral:** Out-of-range text, invalid-field borders, and the active sign bit.
- **Coral Wash:** Overflow presets and interpreted-date warnings.

### Neutral

- **Calibration Paper:** Workspace background and inset readouts.
- **Instrument White:** Main working surface and default controls.
- **Graphite Ink:** Primary text.
- **Muted Graphite:** Labels and supporting explanations, at full opacity.
- **Divider Gray:** Panel borders and row separators.
- **Quiet Lilac:** Inactive bits, neutral hover surfaces, and code blocks.

**The State Has Words Rule.** Pair teal and coral states with explicit labels, signed values, and UTC dates; color alone never explains overflow.

## Typography

**Display Font:** Space Grotesk, sans-serif fallback, self-hosted at weight 700.
**Body Font:** IBM Plex Sans, sans-serif fallback, self-hosted at weights 400 and 600.
**Label/Mono Font:** System monospace for measured data and code.

Space Grotesk gives the instrument a clear geometric identity. IBM Plex Sans supports sustained reading and modest control labels. Monospace marks timestamps, register bits, hexadecimal values, formulas, and code rather than ordinary prose.

### Hierarchy

- **Display:** Route titles, reducing from the frontmatter default to 36px below 760px; maximum width 800px.
- **Headline:** Reading section headings, reducing to 25px below 760px.
- **Title:** Route continuation headings. Instrument titles use a compact 20px desktop / 18px mobile variant.
- **Body:** Reading text with a 70ch default maximum. Route introductions use 18px, reducing to 16px below 760px.
- **Label:** Supporting field labels and metadata. Buttons use the separate semibold button role; the state label is 13px / 600, reducing to 12px on mobile.
- **Measurement:** Signed readout with tabular numerals; mobile uses 26px / 1.4. Editable seconds use 21px desktop / 18px mobile. Dates use 15px desktop / 13px mobile.

**The Measured Type Rule.** Reserve monospace for data, code, and measurement metadata; headings and prose keep their respective self-hosted families.

## Layout

Desktop uses a fixed 212px left rail with a corresponding workspace offset. A 64px-minimum topbar spans the workspace. Main content is centered at a maximum 1280px width with 40px horizontal and top padding and 64px bottom padding. The title is unframed above the full-width instrument; this composition preserves register and date-reading width.

The instrument divides into an 18px-by-24px header, 24px body, and 16px-by-24px footer. Readouts and paired dates use two columns; explanations use two columns with a 48px gap. History rows use 120px / flexible / 240px tracks. Migration guidance uses 1.2fr / 1fr tracks with a 56px gap. Reading sections are unframed rows or bands rather than floating cards.

At 1150px and below the rail becomes 184px, workspace padding becomes 28px, the register changes from 32 to 16 columns, and history asides move into the content column. At 760px and below the rail becomes a static header with four equal navigation tracks; the workspace offset disappears, padding becomes 20px horizontally, the register uses eight columns, paired dates and reading columns stack, and controls wrap. The bit register uses minimum 66px cells on desktop and 48px cells on mobile. Primary and ordinary controls retain a minimum 44px height. At 1600px and above the footer centers within its maximum 1200px width.

## Elevation & Depth

No shadows are used. Depth comes from a plum navigation plane, white working surface, paper readout insets, tonal state washes, and one-pixel dividers. Focus uses a 3px teal outline offset by 4px. The bit hover outline uses 2px accent inset by 2px. Interpreted-date backgrounds and signed-value text settle over 160ms ease-out; reduced-motion mode disables transitions and smooth scrolling. The rollover sequence advances every 850ms and stops after seven ticks or when the document becomes hidden.

**The Flat Instrument Rule.** Use boundaries and state surfaces to explain structure; do not add ambient shadows to the existing instrument system.

## Shapes

Controls and the framed instrument use the small control corner in frontmatter; binary cells use the smaller bit corner. Status indicators are circular. Fields and controls have one-pixel borders, while reading sections use straight dividers. The four-square identity mark is an implemented geometric symbol; it is not an image dependency.

## Components

### Buttons

Compact commands combine familiar Remix Icon symbols with semibold labels where the action needs wording. Primary commands use plum with white text; hover uses #594068. Secondary controls use the surface and divider border, changing to the quiet neutral on hover. The overflow preset uses the coral wash and warning text. Icon-only step and theme controls are 44px square, with accessible names and native title tooltips. Disabled controls use 0.55 opacity and a not-allowed cursor. All keyboard-focusable commands receive the teal focus outline.

### Inputs / Fields

Timestamp inputs sit on paper with an ink monospace value, divider border, 12px padding, and accent caret. Invalid values receive a coral border and an adjacent textual status error. The native timeline range and migration checkboxes use teal accent color. Out-of-timeline values disable the timeline and show a return-to-preset message.

### Navigation

The plum rail uses 15px body text and 48px-minimum links. Inactive text is #e0d6e8; hover is #503a62 with white text. The active route uses the light paper background and plum semibold text. Mobile links reduce to 12px and 44px-minimum height, with icons hidden and four equal tracks. The theme choice persists locally and keeps an explicit accessible state.

### Instrument Container

The main lab is the genuinely framed tool: surface background, divider border, small corners, and clipped overflow. Header, working body, and footer are separated by dividers. An overflow data attribute changes the state and signed readout to coral, and the interpreted date to the coral wash. Reading sections outside the lab stay unframed.

The instrument follows the device clock by default, updating once per second while the page is visible. Manual commands and edits pause following; focusing the timestamp field or timeline also pauses it so updates do not interrupt input. Live now resumes following and exposes its active state through aria-pressed and the existing teal wash, teal border, and teal text. A following instrument catches up to the device clock when the page becomes visible again.

### Binary Register

Thirty-two accessible button cells show the actual low 32 bits from the exact BigInt timestamp. Each cell presents a digit, bit position, pressed state, and title. Value bits use teal when active; the sign bit uses the coral wash when off and solid warning color when on. The register adapts its column count without horizontal scrolling. Clicking a bit stops playback and applies the model's signed 32-bit interpretation.

### Status and Paired Dates

A dot and written state label accompany the signed readout. Requested and interpreted UTC dates sit beside one another on desktop and stack on mobile with a divider. The 64-bit comparison stays visible beneath them. Live announcements are reserved for explicit commands and boundary-state changes.

### Evidence and Capacity Rows

History uses ruled rows with numeric years, prose, source links, and compact tonal evidence asides. The capacity comparison is a native table with semibold labels, display-family width labels, and a teal wider-range row. Migration uses native checkboxes and ruled list rows; checked labels turn teal.

## Do's and Don'ts

### Do:

- Do use explicit UTC dates, seconds, signedness, and state labels beside measured data.
- Do use the self-hosted display and body families, and keep monospace for measurements and code.
- Do preserve small corners, flat surfaces, dividers, and useful 44px control targets.
- Do treat the interactive binary representation as the primary data visual.
- Do disclose the source-only verification limit until rendered desktop and mobile checks are available.

### Don't:

- Don't describe two's-complement wrapping as the behavior of every real system.
- Don't reduce label opacity; use the muted text token at full opacity.
- Don't add glass, gradient text, ornamental grids, emoji, or decorative cards to this identity.
- Don't replace actual register data with decorative raster imagery.
- Don't claim screenshot approval or rendered responsiveness from source tests alone.

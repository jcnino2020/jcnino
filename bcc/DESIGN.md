---
name: BCC Elite Grading Portal
description: A light academic record desk for exploring sample grades by role.
colors:
  forest: "#184b38"
  forest-dark: "#103d2e"
  forest-light: "#e7f1ea"
  gold: "#aa7723"
  gold-light: "#fbf3e1"
  ink: "#1d3028"
  muted: "#55655d"
  line: "#ccd8d0"
  surface: "#fff"
  ground: "#f3f6f3"
  alert: "#9d342e"
typography:
  entry-heading:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif'
    fontSize: "clamp(36px, 3.9vw, 62px)"
    fontWeight: 700
    lineHeight: 1.08
  page-heading:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif'
    fontSize: "clamp(27px, 2.5vw, 36px)"
    lineHeight: 1.25
  section-heading:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif'
    fontSize: "20px"
    lineHeight: 1.25
  body:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif'
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "0"
  table:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif'
    fontSize: "14px"
  label:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif'
    fontSize: "13px"
    fontWeight: 600
rounded:
  square: "0"
  control: "4px"
spacing:
  control-y: "9px"
  control-x: "15px"
  table-y: "14px"
  table-x: "16px"
  section: "24px"
components:
  button-primary:
    backgroundColor: "{colors.forest}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
    padding: "9px 15px"
    height: "44px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "9px 15px"
    height: "44px"
  record-section:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.square}"
  field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "44px"
---

# Design System: BCC Elite Grading Portal

## Overview

**Creative North Star: "The Academic Record Desk"**

BCC Elite presents sample academic work as a clear, usable record desk. The independent light system combines white and muted green paper surfaces, deep forest navigation, restrained gold, dark text, ruled tables, and compact controls. The first entry view uses the pre-existing crest at `bcc/assets/img/logo.png`; that reference asset does not establish official institutional endorsement.

The visual language serves three direct paths: a student reads grades and schedule, while faculty and administrators inspect a roster and edit browser-local demonstration grades. Sample status stays visible in entry, workspace, records, and the printed copy. This is a browser-only concept, not a live college service.

**Key Characteristics:**
- Forest navigation against light record surfaces.
- Rectangular, ruled tables and dense but readable numeric columns.
- Gold for active work and sample notices, with explicit text labels.
- Role-aware navigation and a print treatment that marks the report as a demonstration.

## Colors

### Primary
- **Forest** (`forest`): navigation identity, links, course codes, and primary actions.
- **Deep Forest** (`forest-dark`): persistent workspace rail.
- **Soft Forest** (`forest-light`): quiet hover feedback.

### Secondary
- **Academic Gold** (`gold`): focus and brand detail; use sparingly.
- **Gold Paper** (`gold-light`): sample notices and demo status.

### Neutral
- **Ink** (`ink`): main text.
- **Muted Ink** (`muted`): metadata, support copy, and table headings.
- **Rule** (`line`): section borders and dividers.
- **Paper** (`surface`): entry form, workspace header, summary, records, and fields.
- **Desk Ground** (`ground`): workspace canvas.
- **Alert Red** (`alert`): validation and destructive action text.

**The Record Contrast Rule.** Keep record data in dark text on light surfaces; use forest as structure and emphasis, not as a data-table fill.

## Typography

**Display and Body Font:** System sans stack, beginning with the platform UI font and falling back to Segoe UI and Arial. The implementation uses no remote font.

Type is direct and administrative. The entry heading has a larger, tighter line height; workspace and section headings step down quickly. Tables use compact text and tabular numerals for aligned comparisons.

### Hierarchy
- **Entry heading:** Large bold introduction, constrained to about 12 characters per line.
- **Page heading:** Role-aware view title above actions and the record.
- **Section heading:** Compact title within a ruled record section.
- **Body:** Standard copy and table context.
- **Label:** Field labels, metadata, statuses, and table headings.

**The Numeric Alignment Rule.** Keep grades, course codes, and summary values stable with tabular numerals where the source applies them.

## Layout

Entry has a 72px top bar and two columns: a forest context pane with the crest, and a white role selector. The workspace uses a 248px forest rail and a main content area capped at 1400px. A role-aware heading sits above a three-part summary strip and large record sections. Sections use ruled edges and table rows; a table may scroll horizontally while preserving its minimum readable width.

At 1000px, the rail narrows to 220px and secondary utility columns stack. At 760px, entry panes stack, the rail becomes a horizontally scrollable navigation row, summaries and profile details become one column, and role switching moves into the header. At 420px, edge padding and entry heading size tighten. Content actions remain visible. The print layout removes navigation and controls, expands the record, and shows the explicit demonstration-copy stamp.

## Elevation & Depth

The system is flat. There are no drop shadows for surfaces. White against muted ground, solid forest navigation, borders, table rules, and active fills establish hierarchy. The mobile active navigation state uses an inset bottom rule rather than floating elevation.

**The Ruled Surface Rule.** Prefer the existing one-pixel borders and section divisions to decorative shadow or glass effects.

## Shapes

Record sections, tables, role rows, summary strips, badges, and notices are rectangular. Buttons, fields, navigation controls, and mobile role switching have a restrained 4px radius. Tables collapse borders into continuous horizontal rules. The square crest frame and square role icons reinforce the records-office geometry.

## Components

### Role Entry
Three full-width student, faculty, and administrator rows have an icon cell, title, supporting task description, and arrow. Rules divide the rows; hover and keyboard focus tint the whole row. A gold-paper notice states that accounts and grades are samples before any role is chosen.

### Navigation
The desktop forest rail holds brand, current sample identity, role-aware view buttons, and Switch role. Student views are Overview, My grades, Schedule, and Profile. Faculty and administrator views are Overview, Gradebook, Students, and Profile. The active button uses a pale gold fill and `aria-current="page"`; on narrow screens, the navigation becomes a horizontal row with a gold underline.

### Buttons
Primary actions use a forest fill and white text. Secondary actions use white with an outlined edge. Destructive reset uses red text and border. All have a 44px minimum height and a small radius. Hover adjusts the surface color; the global focus treatment is a visible gold three-pixel outline. The print button says "Print demo copy"; the administrator reset requires confirmation before clearing local edits.

### Records and Tables
White bordered sections contain a compact heading, pale table header, ruled rows, and a sample-status note. Course codes and grade columns use stable numeric glyph widths. Sample and locally edited records carry distinct green or gold tags. The printed grade view identifies itself as a demonstration copy, not an official transcript.

### Fields
Gradebook selects and numeric inputs are labeled, white, bordered, and at least 44px tall. Faculty and administrator edits save to browser storage. Status and error text reports the local outcome. Student views read the same local demonstration record.

### Accessibility and Motion
Skip links, semantic headings and labels, `aria-current`, status announcements, visible focus, and touch-sized controls support navigation. Reduced-motion preference disables smooth scrolling. No other motion vocabulary is defined by the current source.

## Do's and Don'ts

### Do:
- **Do** keep sample and browser-local status explicit in every relevant workflow.
- **Do** preserve the forest, gold, light-paper system and ruled record layout.
- **Do** keep role-specific navigation, grade tables, print labeling, and reset behavior legible at narrow widths.
- **Do** use the pre-existing crest on entry with its provenance understood as a reference asset.

### Don't:
- **Don't** present demonstration data or print output as official college records.
- **Don't** convert the working record desk into a dark glass login showcase or a decorative dashboard.
- **Don't** replace horizontal table scrolling with cramped, unreadable grade columns.

Verification note: This document was matched to HTML, CSS, JavaScript, PRODUCT.md, and the surface brief. Browser and rendered review were prohibited for this pass; no screenshot or visual approval is claimed. The project tests passed in the implementation workflow.

---
name: Portfolio Admin
description: A calm charcoal workspace for portfolio curation
colors:
  canvas: "#111214"
  rail: "#161719"
  surface: "#191a1d"
  elevated: "#232429"
  hover: "#222328"
  rule: "#2b2c30"
  control-rule: "#3a3b41"
  ink: "#f1f1f2"
  secondary-ink: "#c1c2c8"
  muted-ink: "#a1a2ab"
  action: "#eeeeef"
  action-ink: "#151619"
  selected: "#2c2d32"
  field: "#141518"
  focus: "#e0e1e6"
  success: "#10b981"
  danger: "#ef4444"
  telemetry: "#06b6d4"
typography:
  title:
    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "28px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "14px"
    lineHeight: 1.5
    letterSpacing: "-0.01em"
  label:
    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    letterSpacing: "0"
rounded:
  control: "6px"
  photo: "8px"
  card: "10px"
  dialog: "12px"
spacing:
  compact: "8px"
  field: "12px"
  small: "16px"
  medium: "20px"
  section: "24px"
  large: "28px"
  stack: "32px"
  wide: "44px"
components:
  button-primary:
    backgroundColor: "{colors.action}"
    textColor: "{colors.action-ink}"
    rounded: "{rounded.control}"
    padding: "8px 14px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.secondary-ink}"
    rounded: "{rounded.control}"
    padding: "8px 14px"
  field:
    backgroundColor: "{colors.field}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "10px 12px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.card}"
    padding: "24px"
---

# Design System: Portfolio Admin

## Overview

**Creative North Star: "Quiet Studio"**

A restrained charcoal workspace for maintaining a photography portfolio. Helvetica Neue, quiet rules and pale actions keep the operational interface familiar while photography supplies the visual emphasis. This system applies only to the admin; the public portfolio remains its own surface.

**Key Characteristics:**
- One navigation rail and a generous work surface.
- Photographic thumbnails with compact supporting text.
- Flat resting surfaces and progressive disclosure.

## Colors

The palette uses charcoal layers and pale neutral actions. Action is the primary emphasis; canvas, rail, surface and elevated tones separate working regions. Ink, secondary ink and muted ink provide a readable hierarchy. Rules define containers without bright framing. Success, danger and telemetry remain functional semantic colors.

## Typography

Helvetica Neue with Helvetica, Arial and sans-serif fallbacks carries every role. Titles are compact and semibold; labels use sentence case. Body text follows the base role, inputs use 13px, and secondary metadata uses 11px. Mobile page titles become 24px at 768px and below.

## Layout

Desktop uses a 224px rail and 68px header. The main work surface is capped at 1360px with 40px top, 44px inline and 64px bottom padding and 32px section gaps. Recent work uses three columns and 24px gutters; collection shortcuts use four photographs.

At 1100px and below, inline padding becomes 28px, recent work uses two columns, and settings side content stacks. At 768px and below, the rail becomes a 252px off-canvas drawer, the header is 60px high, collection shortcuts become two columns, and content padding becomes 28px 20px 44px. At 640px and below, media grids use two columns with 14px gaps, forms stack, edit drawers fill the viewport width, and buttons are at least 40px high. At 360px and below, media grids use one column. Touch devices expose media actions; keyboard focus also reveals them.

## Elevation & Depth

Resting cards and photographs have no shadows or hover lift. Tonal surfaces and hairline rules establish structure. Dropdowns retain a compact shadow (0 12px 32px #0006); dialogs and command overlays retain their functional overlay treatments. Feedback uses the existing 140ms and 220ms eased transitions; reduced-motion preferences reduce transition and animation durations to 0.01ms.

## Shapes

Controls use the control radius; photographs and menus use the photo radius. Form cards use the card radius and the login panel uses the dialog radius. Images crop to 4:3 where the thumbnail component specifies it. Profile avatars remain circular.

## Components

Primary buttons are pale with dark text, a 38px desktop minimum height and no lift; hover turns white. Secondary actions are transparent with a control-rule border and a darker hover fill. Fields use the field surface, control-rule border and a 40px minimum height. Keyboard focus uses a 2px pale outline with 4px offset.

Navigation uses compact sentence-case rows, subtle neutral hover and a selected neutral fill. Cards are flat, bordered and padded; their border stays quiet on hover. Media tiles place metadata outside the photograph with no surrounding card chrome. Audience at a glance uses a native disclosure with a rule above and below, a 20px vertical summary pad, and a 24px content gap. Settings sections use the same native disclosure interaction. Metric filter tabs retain a pale selected state.

Visual verification covered desktop and mobile overview plus mobile settings; mobile navigation opens and highlights the selected route. Save, publish and backend behavior were outside this visual review. Drawer focus transfer, focus trapping and expanded-state semantics remain follow-up work.

## Do's and Don'ts

- Do use the pale primary action for the next meaningful operation.
- Do preserve visible keyboard focus and reduced-motion support.
- Do keep semantic color tied to status, errors and data.
- Don't introduce decorative dashboard panels or repeated navigation.
- Don't add decorative gradients, pulsing status lights or hover lift.
- Don't hide essential media actions from keyboard or touch users.

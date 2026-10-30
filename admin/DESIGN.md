---
name: Portfolio Admin
colors:
  canvas: "#000000"
  surface: "#0f0f0f"
  rule: "#1f1f1f"
  ink: "#ffffff"
  muted-ink: "#a0a0a0"
typography:
  title:
    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "48px"
    fontWeight: 700
    lineHeight: 1
  body:
    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "16px"
    lineHeight: 1.5
  introduction:
    fontSize: "18px"
    lineHeight: "28px"
  navigation:
    fontSize: "14px"
    fontWeight: 700
rounded:
  control: "4px"
  photograph: "4px"
  action: "9999px"
spacing:
  grid: "16px"
  desktop-gutter: "40px"
  mobile-gutter: "24px"
---

# Portfolio Admin

The user explicitly requested the same sizing and styling as the public index and Framed Moments pages. Their shipped visual system is authoritative. The admin loads the same versioned portfolio and Tailwind stylesheets. The final Public portfolio parity block in workspace.css adapts this system to admin operations.

## Typography and color

Self-hosted Helvetica Neue, black canvas, white text and actions, #0f0f0f surfaces, #1f1f1f dividers and #a0a0a0 secondary text match assets/portfolio.css. Page headings match Framed Moments: 48px/48px bold on desktop and 36px/40px below 640px. Introductions are 18px/28px; body and fields 16px; navigation and buttons 14px bold; metadata 12px. Section headings use the index's 24px bold category treatment.

## Layout and controls

Desktop header is 80px and mobile header 64px, matching public navigation. Admin retains a 248px operational rail, a 264px mobile drawer, content max-width 1280px, 40px desktop and 24px mobile gutters. Photo grids use 16px gaps, three columns on large screens, two below 1100px and one below 640px. Public gallery photo corners are 4px; white primary actions and outlined secondary actions are pills like the main site's controls. Form fields stay rectangular for editing.

## Capabilities

Preserve authentication, analytics, media and collection management, editing, backups, settings, security, save options and publishing. The simplified overview retains collections and recent work first, with audience detail in a native disclosure. No new factual claims or analytics values.

## Interaction and verification

Keyboard focus and reduced motion remain supported. Photo navigation tiles support Enter and Space. Drawer focus transfer, trapping and expanded-state semantics remain followups. Existing five-route checks and shared JavaScript syntax checks pass. Review screenshots cover desktop/mobile; local preview does not verify live saving, publishing or backend responses.

---
name: The Feline Archive
description: An independent, image-led index of cat-related art from the Art Institute of Chicago.
colors:
  catalog-ink: "#193335"
  muted-ink: "#4d6767"
  index-teal: "#203b3d"
  index-rule: "#688284"
  gallery-paper: "#f1f5f2"
  artwork-mount: "#e1e9e5"
  white: "#fff"
  catalog-rule: "#c3d0ca"
  vermilion: "#b83d2d"
  vermilion-deep: "#8f2d22"
  pale-mint: "#c7e2d7"
  focus-vermilion: "#cf4f36"
typography:
  display:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "6rem"
    fontWeight: 500
    lineHeight: 0.88
    letterSpacing: "0"
  section:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "35px"
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: "0"
  artwork-title:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "22px"
    fontWeight: 500
    lineHeight: 1.13
  body:
    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "12px"
    fontWeight: 700
rounded:
  field: "2px"
  circle: "50%"
spacing:
  compact: "10px"
  control: "16px"
  section: "36px"
components:
  search-field:
    backgroundColor: "{colors.white}"
    textColor: "{colors.catalog-ink}"
    rounded: "{rounded.field}"
    height: "48px"
  artwork-mount:
    backgroundColor: "{colors.artwork-mount}"
    padding: "18px"
  save-button:
    backgroundColor: "{colors.vermilion}"
    textColor: "{colors.white}"
    padding: "0 15px"
    height: "46px"
  load-more-button:
    textColor: "{colors.catalog-ink}"
    padding: "0 22px"
    height: "48px"
  view-tabs:
    textColor: "{colors.muted-ink}"
    height: "43px"
  gallery-message:
    backgroundColor: "{colors.white}"
    textColor: "{colors.catalog-ink}"
    padding: "34px"
---

# Design System: The Feline Archive

## Overview

**Creative North Star: "The Open Print-Room Cabinet"**

The archive treats each artwork as a catalogued object. Pale mounts give the images room to breathe, slim rules organize their labels, and a deep index surface identifies the collection. The gallery is image-led and asymmetrical, with one larger lead work and compact controls above it.

The material idea stays functional: crisp type, quiet surfaces, restrained vermilion markers, and metadata that remains legible when an image is missing. Motion is brief and serves selection or opening a work.

**Key Characteristics:**
- Artworks occupy the visual center; their labels live directly beneath them.
- The dark index header contrasts with a pale, open gallery.
- Thin rules and numbering establish catalog rhythm without enclosing every work in a card.

## Colors

The palette pairs cool green-teal neutrals with a sparingly used red accent.

### Primary
- **Vermilion:** Marks the header edge, active view, accession numbers, selection, and save controls.
- **Deep Vermilion:** Supplies readable accent text and hover states.

### Neutral
- **Index Teal:** Grounds the masthead and toast surface.
- **Catalog Ink:** Carries primary text and strong outlines.
- **Muted Ink:** Carries secondary text, attribution, and status copy.
- **Gallery Paper:** Serves as the page and dialog background.
- **Artwork Mount:** Frames images without cropping them.
- **White:** Separates inputs and message panels from the pale page.
- **Catalog Rule and Index Rule:** Divide labels, controls, and header content.
- **Pale Mint:** Lightens hover feedback on the dark header and search control.
- **Focus Vermilion:** Gives keyboard focus a visible outline independent of hover.

**The Sparse Marker Rule.** Use vermilion for state and catalog accents, leaving artwork colors dominant.

## Typography

**Display Font:** Newsreader, with Georgia and serif fallbacks.
**Body Font:** Helvetica Neue, with Helvetica, Arial, and sans-serif fallbacks.

Newsreader gives the title and artwork names an editorial register. The sans-serif keeps controls, counts, captions, and metadata compact and scannable.

### Hierarchy
- **Display:** The archive name uses the large Newsreader role; it steps down at the two responsive breakpoints.
- **Section:** Newsreader introduces the collection and message states.
- **Artwork title:** Newsreader identifies each work; the lead title and dialog title increase in scale.
- **Body:** Sans-serif supports the short collection description and state messages.
- **Label:** Small, bold sans-serif distinguishes controls, accession numbers, and metadata keys.

**The Object Name Rule.** Let artwork titles carry expressive type; keep surrounding catalog facts plain.

## Layout

The masthead, collection, and footer share a centered container capped at 1560px, with 36px side gutters on larger screens and 16px on mobile. The collection header pairs title/status with a search field. The desktop gallery uses three columns with a lead work spanning two; it becomes two columns below 1050px and one below 500px. The dialog moves from image-and-record columns to a vertically scrolling layout below 700px.

Spacing follows the work: 20px horizontal gallery gaps on desktop, 32px row gaps, and a 22px transition from tools to artwork. Controls hold stable 44-48px touch targets. Mounts use fixed aspect ratios and `object-fit: contain`, so the full artwork remains inspectable.

## Elevation & Depth

The gallery is flat. Pale mounts, white message panels, catalog rules, and the dark masthead create depth through color and framing. The open artwork dialog is the elevated layer, with a dark backdrop and a broad shadow (`0 18px 80px rgb(0 0 0 / 26%)`); the toast uses a smaller shadow (`0 6px 30px rgb(0 0 0 / 18%)`).

**The Flat Catalog Rule.** Keep gallery items unshadowed; reserve shadows for overlays.

## Shapes

Rectangular mounts and square-cornered controls dominate. The search field has only a 2px radius. Hairline borders and short accent rules provide structure. Circular geometry appears on the dialog's previous and next icon controls and the tiny source indicator.

## Components

### Search Field
The white 48px field has a subtle green border, a text input, and a separate arrow submit control. Its wrapper gets a 3px focus outline on focus within. The arrow area shifts from pale green to mint on hover.

### View Tabs
All and Saved form a quiet segmented view through text and a shared lower rule. The active view receives a 3px vermilion underline and ink text. Counts use tabular numerals.

### Artwork Item
Each work has a pale, contained image mount and an adjacent two-part label: numbered accent rail plus title and attribution. Hover gently enlarges the image and deepens title color. A separate bookmark control shows saved state with a pale red fill; the item itself has no card border or shadow.

### Buttons
Load More is an outlined command that inverts to ink on hover. The dialog Save action uses a solid vermilion fill and a pale red saved state; the Museum Record action is outlined. Icon controls are 44px square, with explicit accessible names and visible keyboard focus.

### Artwork Dialog
The large native dialog pairs a contained artwork stage with a scrollable catalog record and adjacent-work controls. At mobile widths the image stage sits above the record. It enters with a short fade and vertical movement; reduced-motion preferences suppress that movement.

### Message Panel
Loading, empty, and failure states use one full-gallery white panel with a thin rule. The text stays concise, and recoverable states provide a direct action.

## Do's and Don'ts

### Do:
- **Do** keep each artwork entirely visible within its mount.
- **Do** keep title, artist, and catalog details legible when an image is unavailable.
- **Do** use thin rules and controlled spacing to organize repeated records.
- **Do** show the vermilion accent where an item or view has meaningful state.

### Don't:
- **Don't** add shadowed cards around every gallery item.
- **Don't** crop artworks to force identical image compositions.
- **Don't** turn the cabinet reference into literal drawer ornaments or paper textures.

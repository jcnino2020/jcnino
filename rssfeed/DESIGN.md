---
name: Vox Reader
description: A clean library catalogue and reading desk for Vox RSS stories.
colors:
  paper: "#ffffff"
  desk: "#f1f3f2"
  ink: "#202522"
  muted: "#5f6861"
  rule: "#d8ded9"
  yellow: "#f4df42"
  selected: "#fff8cd"
  blue: "#135b83"
  danger: "#a33326"
typography:
  display:
    fontFamily: '"Public Sans", sans-serif'
    fontSize: "46px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0"
  headline:
    fontFamily: '"Public Sans", sans-serif'
    fontSize: "36px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0"
  title:
    fontFamily: '"Public Sans", sans-serif'
    fontSize: "16px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0"
  body:
    fontFamily: 'Georgia, "Times New Roman", serif'
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.85
    letterSpacing: "0"
  label:
    fontFamily: '"Public Sans", sans-serif'
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0"
rounded:
  image: "2px"
  control: "4px"
spacing:
  tight: "6px"
  small: "8px"
  medium: "12px"
  regular: "16px"
  roomy: "20px"
  inset: "24px"
components:
  icon-button:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    width: "44px"
    height: "44px"
  search:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0 12px"
  story-selected:
    backgroundColor: "{colors.selected}"
    textColor: "{colors.ink}"
  retry-button:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
---

# Design System: Vox Reader

## Overview

**Creative North Star: "The Library Catalogue"**

A clean reading desk pairs a browsable catalogue with a continuous article pane. Quiet, compact tools support scanning and returning to saved stories; the reading text has space to breathe.

White paper, a yellow masthead, charcoal type and blue source actions establish the visual identity. This is an independent Vox RSS reader: publisher attribution and original-source links remain visible, and the interface makes no promise of complete article access.

**Key Characteristics:**
- Flat, ruled catalogue rows.
- Clear selected and saved states.
- Sans-serif tools with serif reading text.
- Publisher imagery inside the article flow.

## Colors

The palette combines warm yellow identity with a cool, neutral desk and distinct blue actions. Frontmatter values are normative and map directly to the custom properties in `style.css`.

### Primary
- **Masthead Yellow** (`yellow`): masthead and text selection.
- **Selection Wash** (`selected`): selected stories, pressed bookmarks and the no-script notice.

### Secondary
- **Source Blue** (`blue`): links, categories, progress, focus outlines and article quotations.
- **Error Red** (`danger`): feed failure status.

### Neutral
- **Paper** (`paper`): reading ground and search field.
- **Desk** (`desk`): catalogue, progress track and code blocks.
- **Charcoal Ink** (`ink`): primary type, active tabs and retry controls.
- **Quiet Green-Grey** (`muted`): metadata, secondary labels and status.
- **Catalogue Rule** (`rule`): separators and table borders.

## Typography

Public Sans is served locally in regular, semibold and bold weights. Georgia, with Times New Roman fallback, carries article text. All interface letter spacing is zero.

The wordmark uses the display role; article titles use the headline role; story rows use the title role. Catalogue heading is 19px semibold. Metadata and captions use 12-13px UI text. Article subheadings are 24px or 20px semibold Public Sans.

Reading size is a native selector offering 16px, 18px and 20px, with 18px as the default. Article title size steps to 30px at the middle breakpoint and 28px on narrow screens; the wordmark steps to 36px on narrow screens.

## Layout

The desktop masthead is 100px tall. Below it, a viewport-height desk has a 360px catalogue and a fluid reading pane, constrained to 1800px overall. Catalogue and article scroll independently. The article occupies a maximum 780px box with 40px horizontal padding and 48px top padding.

At 1050px and below, the catalogue becomes 320px and article padding tightens. At 760px and below, the masthead becomes 80px and catalogue and reader alternate as full-height views; a Stories back control returns to the catalogue. At 360px and below, horizontal insets and toolbar gaps tighten further. Headlines and feed content wrap rather than forcing horizontal page overflow; tables and code blocks scroll within the article.

## Elevation & Depth

There are no shadows. Depth comes from neutral surfaces, single-pixel rules, selected-row tint and a dark toast above the desk. The reading progress indicator is a thin blue line.

Article arrival uses a 220ms fade and 6px vertical movement with `cubic-bezier(.16,1,.3,1)`. Reduced motion disables that arrival and smooth article scrolling.

## Shapes

Catalogue rows and page sections are square and unframed. Tool controls, search, retry and toast have restrained 4px corners; article images have 2px corners. Icon controls are fixed at 44px square, and primary interactive controls maintain a 44px minimum height.

## Components

Search is a white, bordered field with a blue focus-within outline. Latest and Saved are plain text controls with counts; the active view gains semibold ink and an ink underline. Sort and reading size use native selectors.

Story rows contain category, headline and date/author metadata with a separate bookmark control. Selection tints the whole row; saved state uses a filled bookmark, pressed semantics and a yellow wash. Refresh, save and original-source tools use Remix Icon symbols, descriptive labels and native title tooltips.

The reader keeps attribution above sanitized publisher content and an original-source link below it. Scroll progress follows the article scroll container. Loading, empty, search-no-match and feed-error states use the same restrained typography and spacing; retry is a dark button. Toasts communicate storage outcomes without shifting the layout.

Saved feed text is browser-local, limited to 60 stories; quota or blocked-storage failures preserve the previous collection. Saved images still require internet access. Saved story deep links resolve to their matching article when the feed is unavailable. Feed and stored HTML pass through vendored DOMPurify before rendering.

## Do's and Don'ts

### Do:
- Do use ruled catalogue rows and a continuous reading pane.
- Do preserve publisher attribution, original-source links and honest feed status.
- Do maintain visible focus, fixed icon targets and reduced-motion behavior.
- Do place publisher imagery within the readable article flow.

### Don't:
- Don't replace the reading desk with promotional cards or an article modal.
- Don't imply official Vox affiliation or guaranteed complete article access.
- Don't present browser-local saves as remote sync or promise offline images.

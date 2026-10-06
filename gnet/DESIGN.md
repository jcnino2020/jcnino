---
name: GNET
description: Local fiber internet and practical subscriber services.
colors:
  bg: "#f4f6f8"
  paper: "#ffffff"
  ink: "#20252b"
  muted: "#59636f"
  red: "#cf202b"
  red-hover: "#ad1822"
  line: "#dce1e6"
  tint: "#fff0f0"
typography:
  display:
    fontFamily: '"Barlow", Arial, sans-serif'
    fontSize: "72px"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "0"
  headline:
    fontFamily: '"Barlow", Arial, sans-serif'
    fontSize: "36px"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "0"
  title:
    fontFamily: '"Barlow", Arial, sans-serif'
    fontSize: "24px"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "0"
  body:
    fontFamily: '"Source Sans 3", Arial, sans-serif'
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "0"
  label:
    fontFamily: '"Source Sans 3", Arial, sans-serif'
    fontSize: "14px"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "0"
rounded:
  radius: "6px"
spacing:
  control-gap: "12px"
  item-gap: "20px"
  panel-padding: "24px"
  content-gap: "32px"
  container-inset: "32px"
  section-mobile: "48px"
  section: "72px"
components:
  button-primary:
    backgroundColor: "{colors.red}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.radius}"
    padding: "12px 22px"
  button-primary-hover:
    backgroundColor: "{colors.red-hover}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.radius}"
    padding: "12px 22px"
  button-outline-hover:
    backgroundColor: "{colors.tint}"
    textColor: "{colors.red}"
  button-small:
    backgroundColor: "{colors.tint}"
    textColor: "{colors.red}"
    rounded: "{rounded.radius}"
    padding: "10px 14px"
  button-light:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.red}"
    rounded: "{rounded.radius}"
    padding: "12px 22px"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.radius}"
    padding: "12px 16px"
  plan-card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.radius}"
    padding: "28px"
  plan-choice:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.radius}"
    padding: "14px 8px"
  plan-choice-selected:
    backgroundColor: "{colors.red}"
    textColor: "{colors.paper}"
---

# Design System: GNET

## Overview

**Creative North Star: "The Local Telecom Storefront"**

GNET has an independent ISP identity: recognizable red signage, cool white and pale gray fields, pale blue service areas, charcoal text, and practical controls. Barlow headings and Source Sans 3 interface text support package comparison and repeated subscriber tasks through clear headings, bordered tools, and direct navigation.

The implemented system is flat, compact around tools, and more spacious around product information. Existing GNET identity and service artwork remain brand anchors, paired with a generated illustrative home-broadband image. GNET uses section-local fonts and imagery, independent of the photography portfolio. This document extracts `styles/main.css` and the six HTML routes; browser evidence was unavailable following an earlier browser-access denial. It records implemented source, not visual approval or verified computed styles.

**Key Characteristics:**

- Red commands and active states.
- Self-hosted Barlow and Source Sans 3 with fixed responsive sizes.
- Flat ruled sections and gently rounded controls.
- Existing brand and product artwork with illustrative broadband imagery.

## Colors

The primary red sits against cool neutrals; pale red supports selected and hover states.

### Primary

- **GNET Red** (`red`): primary commands, active navigation, links, focus outlines, and the contact band.
- **Deep Command Red** (`red-hover`): primary-button hover and stronger tinted-button text.
- **Pale Red** (`tint`): member-portal control and outline-button hover.

### Neutral

- **Cool Field** (`bg`): page background.
- **White Paper** (`paper`): navigation, repeated cards, inputs, and framed tools.
- **Charcoal Ink** (`ink`): primary text and outline-button labels.
- **Quiet Gray** (`muted`): supporting copy, notes, and utility text.
- **Divider Gray** (`line`): section rules, card borders, and tool boundaries.

Additional component-local colors remain in the CSS: tinted highlighted plans, pale-blue utility/finder backgrounds (#e9f4fa), utility text (#365d72), finder rules (#ccdde7), form borders, a light photographic overlay, and the green coverage legend. They are not generalized into a new palette.

## Typography

**Display Font:** Barlow, with Arial and sans-serif fallbacks, self-hosted at weights 700 and 800.

**Body and UI Font:** Source Sans 3, with Arial and sans-serif fallbacks, self-hosted as Latin and Latin-ext variable WOFF2 files covering weights 400 through 700.

The display family gives GNET a distinct commercial heading voice; the UI family supports readable service copy and subscriber tools. Tabular plan numbers improve comparison. Letter spacing is zero throughout the shared type rules. Font files and their OFL licenses live under `/gnet/files/`: `barlow-700.woff2`, `barlow-800.woff2`, `source-sans-latin.woff2`, `source-sans-latin-ext.woff2`, `barlow-OFL.txt`, and `source-sans-OFL.txt`. No portfolio font paths are used.

### Hierarchy

- **Display:** homepage heading uses the frontmatter display role with a red text span; tablet uses 56px and mobile uses 48px. Plan speeds use Barlow at 56px and weight 800, reducing to 44px on mobile. Other page headings use 48px, reducing to 36px.
- **Headline:** section headings use the frontmatter headline role, reducing to 28px on mobile.
- **Title:** service and tool titles use the frontmatter title role; secondary help titles use 18px.
- **Body:** ordinary copy uses the 17px body role. Hero copy uses 20px, reducing to 18px at tablet and mobile widths. Other introductions use 18px and reduce to 16px on mobile; supporting service and tool copy uses 14px.
- **Label:** shared buttons use the label role. Desktop navigation uses 14px at weight 500; utility and fine print use 12px.

## Layout

The shared container is at most 1200px wide with 32px horizontal insets, reducing to 24px at the mobile breakpoint. Sections use the documented section spacing. Full-width background bands establish content groups without wrapping page sections in cards.

Three equal columns present plans and previews; services use two columns. Customer tools use a main/support split of 1.6fr to 1fr. Desktop navigation stays in a sticky white header above a utility strip. At widths up to 1199px navigation becomes denser; at 959px the navigation becomes a toggle-controlled panel and customer tools stack; at 639px most grids become one column. Quick access retains two columns on mobile.

The illustrative broadband photograph is unframed and full width. The hero has a desktop minimum height of 510px. At mobile widths the photograph is anchored to the bottom at its natural aspect ratio, with its full intrinsic height plus a 24px gap reserved beneath the content using calc(56.28vw + 24px). Hero commands lead to plans and coverage. The coverage map is 520px high, reducing to 420px. Responsive font sizes are discrete rather than viewport-scaled.

## Elevation & Depth

There are no authored box shadows. White surfaces, pale fields, borders, and section rules define depth. The sticky header establishes functional stacking; the light photographic overlay provides dark-text contrast and disappears on mobile. Shared buttons transition background, color, and border color over 160ms with ease timing. Reduced-motion preferences remove transitions and smooth scrolling.

## Shapes

Buttons, plan cards, service cards, inputs, and framed tools share the frontmatter radius. Borders remain thin and visible. Circular geometry is reserved for the small coverage legend marker. Repeated cards contain individual products; complete page sections remain unframed.

## Components

### Buttons

Confident, compact commands with visible states. Standard buttons have a minimum height of 48px; the tinted member-portal variant uses 44px. Primary buttons use red/white, outlines use charcoal with a gray border, light buttons reverse the contact-band palette. The homepage uses the primary and outline variants. Hover changes color and surface without movement. Disabled buttons reduce opacity and use a wait cursor. Focus uses a 3px red outline offset by 4px.

### Cards / Containers

Plan cards use white surfaces, divider borders, 28px padding, and aligned speed/price information. At intermediate widths padding reduces to 22px, returning to 28px for stacked mobile cards. The highlighted plan uses a red border and a local pale red surface. Service cards use 24px padding and pair existing artwork with descriptions. Bill inquiry is a framed tool with 32px padding, reducing to 24px on mobile.

### Inputs / Fields

Bill inquiry uses a white field with a local gray border, 50px minimum height, and muted placeholder text. Red caret and the shared focus outline identify interaction. The action aligns beside the field and stacks below it on mobile. Status text reserves height; error text uses a local darker red.

### Navigation

The current page and hovered links use red text with a red lower rule. The mobile panel opens below the header and scrolls within the available viewport. Portal text hides at some widths; the link retains the accessible name "Member Portal". The menu button carries its expanded state and controlled-navigation relationship.

### Plan Selection

Three native radio options render as bordered rectangular choices. A selected option becomes red with white text; keyboard focus outlines its visible label. The speed and monthly price update in place.

### Disclosures

Native details/summary controls reveal FAQ answers, service descriptions, and incumbent package artwork. Dividers group FAQ rows. The plus icon rotates when a disclosure opens.

### Asset Provenance

The logo, package artwork, and service artwork are reused unchanged from incumbent local paths. The logo is `/gnet/files/logo-250920241.png`. The homepage image `/gnet/files/home-fiber-hero.webp` is generated illustrative home-broadband photography (1672 x 941, approximately 97 KB), not an actual GNET customer, site, or endorsed device. Its exact generation prompt is preserved in `home-fiber-hero.prompt.txt` and `home-fiber-hero.webp.json`. The raw asset was inspected; its in-page rendering was not browser-verified. No photography-portfolio image is used.

The three package images are `/gnet/files/package-251016-bdf990e5ab.png`, `/gnet/files/package-251016-39f4578da4.png`, and `/gnet/files/package-251016-caf1d10728.png`.

The six service images are `/gnet/files/product-260527-a3f6463aae.png`, `/gnet/files/product-260527-bb178e174e.png`, `/gnet/files/product-260527-41483d7709.png`, `/gnet/files/product-260527-a8084766a3.png`, `/gnet/files/product-260527-ff97af526a.png`, and `/gnet/files/product-260527-5aa1dcd9f1.png`. Provenance records incumbent reuse, not independent authorship or license verification.

## Do's and Don'ts

### Do:

- **Do** use the implemented red commands, cool fields, and charcoal text.
- **Do** retain visible keyboard focus and native form/disclosure semantics.
- **Do** preserve the existing GNET logo and supplied artwork.
- **Do** keep customer tools readable, bounded, and responsive.

### Don't:

- **Don't** import photography-portfolio fonts, photographs, or shared styles into GNET.
- **Don't** introduce glow, mesh backgrounds, preloaders, or animated signal rings into this selected visual world.
- **Don't** add decorative shadows or nest complete page sections inside cards.
- **Don't** represent source extraction as rendered visual approval.

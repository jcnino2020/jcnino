---
name: University of St. La Salle
description: An institutional admissions prospectus for the Bacolod university.
colors:
  pine: "#073e2b"
  pine-deep: "#042c20"
  leaf: "#15704b"
  gold: "#d5a846"
  gold-light: "#f1dba3"
  paper: "#f4f7f2"
  white: "#fff"
  ink: "#17352b"
  muted: "#51685d"
  line: "#cbd8ce"
  sky: "#e7eff0"
typography:
  display:
    fontFamily: "Public Sans, Arial, sans-serif"
    fontSize: "5.7rem"
    fontWeight: 600
    lineHeight: 0.96
    letterSpacing: "0"
  headline:
    fontFamily: "Public Sans, Arial, sans-serif"
    fontSize: "4.4rem"
    fontWeight: 600
    lineHeight: 1.03
    letterSpacing: "0"
  title:
    fontFamily: "Public Sans, Arial, sans-serif"
    fontSize: "2.7rem"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "0"
  body:
    fontFamily: "Public Sans, Arial, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.7
  label:
    fontFamily: "Public Sans, Arial, sans-serif"
    fontSize: "13px"
    fontWeight: 700
    lineHeight: 1.2
rounded:
  action: "3px"
  news-card: "4px"
spacing:
  compact: "12px"
  control: "20px"
  section: "76px"
  section-mobile: "57px"
components:
  button-dark:
    backgroundColor: "{colors.pine}"
    textColor: "{colors.white}"
    typography: "{typography.label}"
    rounded: "{rounded.action}"
    padding: "0 20px"
    height: "48px"
  button-dark-hover:
    backgroundColor: "{colors.leaf}"
  button-light:
    backgroundColor: "{colors.white}"
    textColor: "{colors.pine}"
    typography: "{typography.label}"
    rounded: "{rounded.action}"
    padding: "0 20px"
    height: "48px"
  button-light-hover:
    backgroundColor: "{colors.gold-light}"
  button-gold:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.pine-deep}"
    typography: "{typography.label}"
    rounded: "{rounded.action}"
    padding: "0 20px"
    height: "48px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.pine}"
    typography: "{typography.label}"
    rounded: "{rounded.action}"
    padding: "0 20px"
    height: "48px"
  news-card:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.news-card}"
---

# Design System: University of St. La Salle

## Overview

**Creative North Star: "The Admissions Prospectus"**

The site reads as a working university front door. Real campus photography gives the home page a sense of place; a green masthead, compact utility links, and direct applicant actions make the next step easy to find. Interior pages are quieter and denser, using title bands, clear source links, and ruled rows to organize university information.

The material character is flat and editorial. Warm white and pale blue-green bands create rhythm without turning every section into a card. Gold appears as a precise wayfinding accent on active navigation, selected tabs, top rules, and key calls to action.

**Key Characteristics:**

- Authentic campus and university imagery at useful scale.
- Public Sans throughout, with size and weight creating hierarchy.
- Green institutional bands, restrained gold marks, and readable ruled lists.
- One consistent masthead and footer across all six routes.

## Colors

### Primary

- **Institutional Pine:** Masthead actions, interior title bands, calls to action, and dark green sections.
- **Deep Pine:** Utility strip and footer; also the image fallback behind the home hero.
- **Leaf Green:** Hover feedback and directional icons.

### Secondary

- **Wayfinding Gold:** Selected tab and navigation rules, proof dividers, and the gold action. Use the lighter gold for hover and focus on dark surfaces.

### Neutral

- **Paper and White:** Page ground and readable content bands.
- **Ink and Muted Green:** Main text and secondary explanation.
- **Line Green and Pale Sky:** Dividers and alternate information bands.

**The Gold Marker Rule.** Gold marks direction or emphasis; it does not become a large background except on the deliberate gold action.

## Typography

**Font:** Public Sans, with Arial and sans-serif fallbacks. Its regular, semibold, and bold weights are loaded from local font files; no external font request is needed.

Semibold Public Sans gives institution and story headlines a clear, contemporary voice. Regular Public Sans keeps explanations and reading passages comfortable, while bold marks navigation and actions. The home display is 5.7rem on desktop, 4.2rem below 800px, and 3.15rem below 600px. Interior page titles step from 4.4rem to 3.4rem and 2.7rem at those same breakpoints. Section headings start at 2.7rem and fall to 2.15rem on small screens.

**The Single Family Rule.** Use Public Sans throughout; create hierarchy with size, weight, and spacing rather than a second typeface.

## Layout

The centered shell is capped at 1440px, with 32px side gutters on desktop and 16px at 800px and below. Full-width color bands hold content inside that shell. Standard sections use 76px vertical padding, falling to 57px below 800px; compact sections use 54px. Interior content uses a main column and narrower aside, with a 64px gap, then stacks below 800px.

Three-column wayfinding and proof grids become single columns below 600px. The news grid becomes two columns below 1100px, then one below 600px. The home hero caps its height at 620px and uses a different crop and bottom-up overlay on small screens. The next section should remain visible as the first screen ends.

**The Ruled Row Rule.** Program paths, services, admissions routes, and secondary links use aligned rows and dividers; reserve framed cards for image-led news items.

## Elevation & Depth

The system is flat at rest. Background bands, borders, photographs, and typographic hierarchy carry most depth. The only shadow is the open mobile navigation disclosure (`0 10px 25px rgba(0,0,0,.12)`), where it clarifies that the menu floats over the page.

## Shapes

Actions have small 3px corners; news cards use 4px corners and clip their images. Most information surfaces are square-edged, divided with 1px lines or 2-3px gold rules. Images use full rectangular crops. The brand's official logo keeps its natural proportions rather than being reconstructed in type.

## Components

### Buttons and Links

Primary actions are 48px high on desktop and 46px on small screens, with 13px bold Public Sans and 3px corners. Dark pine, white, gold, and pine-outlined variants adapt to their surrounding band. Dark buttons shift to leaf on hover; white buttons to light gold; outlined buttons fill pine. Text links remain visibly underlined with gold decoration and shift to leaf on hover. External destinations carry an outward arrow or explicit destination language.

### Navigation

The 32px utility strip sits above an 82px white masthead. Primary links have a 44px target and a gold underline for hover and current page. At 800px the masthead reduces to 68px, the horizontal navigation becomes a 44px menu button, and a white disclosure presents the routes as 47px rows. The same five routes and applicant action remain available.

### Applicant Pathway Tabs

Three full-width, 48px tabs sit on a divider. The selected tab uses pine text and a 3px gold bottom rule. Its panel pairs an editorial title, short explanation, and one route action. Below 600px tabs can scroll horizontally; the panel stacks. Click and arrow keys change the selected panel, and focus follows keyboard selection.

### News Cards and Information Rows

News is the one repeated framed card: white surface, 1px line border, 4px corners, large image, compact date/category label, and semibold Public Sans title. Other repeated links use open rows with line dividers and leaf directional arrows. Aside panels use a gold top rule and no surrounding card.

**The Visible Focus Rule.** Interactive elements carry a 3px focus outline, using pine on light backgrounds and light gold on dark backgrounds. Reduced-motion preference removes smooth scrolling and transition duration.

## Do's and Don'ts

### Do:

- **Do** show a real campus or university image when a large visual is needed.
- **Do** put dense information in ruled rows with clear route labels and source links.
- **Do** retain the green masthead, compact utility destinations, and clear applicant action.

### Don't:

- **Don't** repeat the large home hero on interior routes; use the compact green title band.
- **Don't** wrap every section or list in floating cards.
- **Don't** use generic stock imagery, fabricated deadline badges, or decorative dashboard motifs.

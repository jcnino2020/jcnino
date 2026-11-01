---
name: Studio Admin
colors:
  canvas: "#f1f3f3"
  surface: "#fdfefe"
  navigation: "#f8fafa"
  rule: "#dce1e1"
  ink: "#23292c"
  muted-ink: "#657074"
  accent: "#295f4d"
typography:
  family: "Studio Helvetica, Helvetica Neue, Helvetica, Arial, sans-serif"
  titleSize: "36px"
  titleWeight: 500
  bodySize: "16px"
rounded:
  controls: "6px"
  photographs: "4px"
  panels: "8px"
  dialogs: "12px"
---

# Studio

The user selected Studio from the local Taste design directions and explicitly
approved replacing the admin and deploying it. This supersedes the earlier request
for a black admin matching the public portfolio. The public site keeps its design.

Studio is a light operational workspace for daily photo curation. The photographer's
name, actual images, collection names, existing routes, and working APIs are retained.
Self-hosted Helvetica Neue, cool silver surfaces, green actions, and restrained
borders carry the approved concept through every admin page.

The header is 78px on desktop, 84px on large displays, and 62px on mobile. The
persistent navigation rail is 264px, 240px on smaller desktops, and 296px at 1800px
and above. Page headings are 34–40px, medium weight, with short supporting copy.
Navigation uses 15–16px text and 44–48px rows. Controls use 14–16px text and clear contrast; the visual
emphasis belongs to the photographs. Photo cards have 4:3 crops and compact titles
and filenames. Selection uses a green border. Frame numbering and quality claims
are removed.

On desktop at 1100px and above, the functional inspector sits beside the grid.
Caption and alternative text come first; camera/location fields are disclosed below.
Below 1100px it becomes an editing drawer with focus management and keyboard exit.
Navigation becomes a mobile drawer below 769px. Cards support pointer and keyboard
selection; drag-and-drop ordering remains available.

Publishing is an explicit primary action, with local exports under More. Uploads
read EXIF from the original file on-device before compression and store it in the
existing gallery metadata. Missing metadata remains blank and editable. Unavailable
analytics and audit sources use honest status/empty states, never sample activity.

admin.css supplies structural components. workspace.css is the single Studio visual
layer, replacing the previous accumulated overrides. Every admin route shares it.
The library additionally loads locally vendored ExifReader and capture-metadata.js.
Reduced motion, focus rings, authentication, Blob uploads, database publication,
settings forms, security history, and snapshot recovery remain part of the product.

Visitor analytics appears above collections on Overview. It uses authenticated full-period aggregates from visitor_logs, Asia/Manila daily buckets, page/search filters, ranking bars, and a paginated visitor log. Browser sessions are estimates, not unique people. Empty, local-only, and unavailable data are labelled.

# BCC Elite Portal

Scope: `/bcc/` and `/bcc/dashboard.html`. Mode: Operate. User requested full BCC redesign and chose code-first work in this project history. The existing app is a browser-only demo; production database files are disconnected.

Grounded directions: registrar ledger, campus noticeboard, course timetable, academic record desk, student services counter, civic wayfinding, library index. The seed assigned the academic record desk (candidate 4, `467bda63`). The requester had an opportunity to steer and did not select a different direction before implementation.

Challengers: terminal wayfinding was competitive for navigation but less suited to grade tables (keep decisive active state); high-density web was competitive for scanability but too packed for accessibility (keep compact row rhythm); hall catalogue, travel pass, and type specimen lost on audience identification and product clarity (keep explicit row identity, priority columns, and strong typographic numerals respectively).

## Direction contract
THESIS: A working academic record desk where student, faculty and admin paths lead directly to grades, not a glass login showcase or generic KPI dashboard.
OWN-WORLD: Paper-white and muted green surfaces, deep forest navigation, gold used sparingly for active work and academic detail, dark legible text, rectangular ruled tables, compact controls, and a visible demo notice. Keep the recognizable BCC crest on entry.
STORY: Select a sample role, inspect a current sample record, move to grades or a class roster, edit local demo grades when faculty/admin, and print an expressly nonofficial copy.
FIRST VIEWPORT: Entry has crest and an immediate role selector. Dashboard has a fixed navigation rail, role-aware page heading, record summary, and a large course or roster table visible immediately; it is useful before scrolling.
FORM: Academic record desk, grounded candidate 4, seed `467bda63`. Signature interaction: role switching leads to different task menus while local grade changes persist across sample roles. Mobile uses a horizontal navigation row and stacked record details without hiding actions.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

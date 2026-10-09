# BCC Elite Grading Portal

<!-- impeccable:product-schema 1 -->

## Platform
web

## Users
Inferred from the existing prototype: students reviewing grades, faculty reviewing a class and entering sample grades, and an administrator reviewing the same demonstration data. No live school deployment or verified operational audience is established.

## Product Purpose
A three-role academic grading portal demonstration for Bacolod City College. The visible job is to inspect academic records and understand the grade-entry workflow.

## Operating Context
The existing site has a static sign-in page and a separate dashboard. Sample accounts, grades, and role labels are hardcoded in browser JavaScript. The PHP files are obsolete placeholders; the SQL and MongoDB files are unused schema and seed examples.

## Capabilities and Constraints
Preserve `/bcc/` and `/bcc/dashboard.html`, BCC Elite name, role-based student/faculty/admin entry, a student grade table, and a print action. Do not claim that demo data is official, authenticated, live, or transmitted to a database. Any editable demonstration grades must be described as browser-local. The old "Print Official Copy" label is inaccurate and should be corrected. Avoid adding a real login illusion around public demo credentials. Keep role switching and sign-out obvious.

## Brand Commitments
The supplied BCC Elite crest is a reference asset, not proof of official institutional endorsement. Its deep green and gold are recognizable cues to retain in a new, task-oriented visual identity. The user requested a full redesign and previously chose code-first work; completed work should be committed and pushed.

## Evidence on Hand
`index.html`, `dashboard.html`, `assets/css/style.css`, `assets/img/logo.png`, and unused `db.sql` / `db.mongodb.js`. All current student metrics and grades are demonstration content; the old nonfunctional `#` menu links do not establish backed services.

## Product Principles
Make sample status unmissable. Prioritize a scannable course and grade record. Use navigation that actually changes views. Let people print a clearly marked demo report. Keep browser-local edits recoverable and role scope explicit.

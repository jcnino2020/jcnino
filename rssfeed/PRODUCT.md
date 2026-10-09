# Vox Reader

<!-- impeccable:product-schema 1 -->

## Platform
web

## Users
Readers browsing Vox stories and returning to saved articles. The user confirmed a clean reading desk with search and saved stories.

## Product Purpose
Make the Vox RSS feed easy to scan and read without leaving the collection. Preserve article attribution and an original-source link.

## Capabilities and Constraints
Vox-only. Existing static HTML site uses /api/convert with third-party proxy fallbacks for the publisher feed. Local preview may not run that API. Feed availability and full article content are controlled by the publisher; no invented live stories or unrestricted article access. Saved stories stay in this browser, not an account or remote sync. Treat publisher markup as untrusted.

## Brand Commitments
Preserve Vox Reader name, publisher attribution, and source links. This is a personal reading project, not an official Vox product. User prefers building directly in code and automatic commit/push after verification.

## Evidence on Hand
Original rssfeed/index.html and existing api/convert.js. The old interface uses RSS/Atom entries, publisher imagery and HTML, a reader modal, yellow accents, and GSAP.

## Product Principles
Reading comes before chrome. Keep feed failures recoverable. Make saved state and freshness honest. Retain safe source links and never execute feed markup.

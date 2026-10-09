# Vox Reader

Static reading desk for the Vox RSS feed. Open `/rssfeed/` through the site's preview server or deployed website.

## Checks

Run `npm ci` and `npm test` in this folder. Tests use jsdom with synthetic feed entries; they do not verify rendered layout. `core.js` and `app.js` also support `node --check`.

## Content and Storage

The reader first uses the site's `/api/convert` endpoint, then the existing third-party proxy fallbacks. Each request has an eight-second timeout; invalid feed responses are skipped. Static previews may not provide the API route.

Saved feed text is stored under `vox-reader-saved-v1` in browser localStorage, with a 60-story limit and recoverable storage failures. No account sync exists. Images are publisher-hosted and still require internet access. Browser storage deletion also deletes saved stories.

Publisher HTML is sanitized with vendored DOMPurify before rendering and again on restoration. Original article links open in new tabs. This independent project does not promise full article access or affiliation with Vox.

Font provenance and licensing are in `fonts/`; DOMPurify source and license are in `vendor/`.

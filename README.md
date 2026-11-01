# JC Niñonuevo Portfolio

Static photography and video portfolio for JC Niñonuevo, featuring drone aerials, framed street and editorial photographs, school event coverage, and video editing projects.

## Pages

- `index.html` - Home, selected work, gallery highlights, about, and contact
- `drone-shots.html` - Drone photography gallery
- `framed-moments.html` - Street, nature, night, and travel photography gallery
- `school-events.html` - School event and publication photography gallery
- `video-projects.html` - Video project thumbnails and YouTube embeds

## Tech Stack

- Static HTML
- Tailwind CSS via CDN
- Shared custom CSS in `assets/portfolio.css`
- Shared custom JavaScript in `assets/portfolio.js`
- GSAP and ScrollTrigger via CDN
- GitHub Pages for hosting and vercel.app

## Recent Improvements

- **Asset Centralization**: Reusable CSS and JS logic migrated to `assets/` to ensure consistency and easier maintenance.
- **Enhanced UX**: Removed right-click context menu restrictions to respect browser defaults.
- **Accessibility**: Implemented accessible lightboxes with ARIA roles, labels, and full keyboard/swipe navigation.
- **Performance**: Optimized asset loading with `defer`, `fetchpriority`, and replaced remote image URLs with relative local paths.
- **SEO & Metadata**: Added comprehensive Open Graph and Twitter card support across all main pages.
- **Selected Work**: New featured projects section on the homepage to highlight professional experience.

## Run Locally

Open `index.html` directly in a browser, or serve the folder with any static server:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Deployment

This site is ready for GitHub Pages. Push changes to the repository branch configured for Pages, usually `main`, and GitHub Pages will serve the static files.

## Credits and Contact

Photography, video work, and portfolio content by JC Niñonuevo.

- Facebook: https://facebook.com/jcninoo
- Instagram: https://instagram.com/photos.jcnino
- Email: jcninonuevo@gmail.com

## Admin photo uploads

The admin uploads new photos to a **public Vercel Blob store**, with browser-generated
800 / 1200 / 1600 / 2048 px WebP variants. Each compressed image is limited to 2 MB;
source JPG, PNG, and WebP photos may be up to 40 MB. Original files are not uploaded.
The filename identifies the item; duplicate names in a gallery must be renamed or
replaced through the existing item's editor.

Connect a public Blob store to the `jcnino` Vercel project before deployment. The
Blob SDK supports Vercel's `BLOB_STORE_ID` / runtime OIDC connection, or the legacy
`BLOB_READ_WRITE_TOKEN` environment variable. Secrets stay on the server. Existing
`ADMIN_PASSWORD` and `MONGODB_URI` settings are required. Publishing never falls
back to an unauthenticated local session or a simulated successful upload.

`/api/gallery` stores the live gallery in MongoDB's `portfolio_gallery` collection.
The first publication includes all existing gallery data. Public pages load the
committed gallery as a fallback, then the live database snapshot. Uploads publish
immediately; other edits, order changes, and removals remain local until **Publish changes**. No redeploy is needed for these content changes. Revision
checks reject conflicting publications from other tabs. A stale local draft is
archived under `pm_previous_gallery_draft` before loading a newer live revision.

Removing or replacing a photo does not purge its Blob files, so saved snapshots can
still restore it. Blob cleanup is a separate storage-maintenance operation. If the
database is unavailable, public pages use the committed gallery and publishing is
blocked until it recovers.

Run uploader/API checks with `node --test tests/gallery.test.mjs` and the existing
workspace checks with `node admin/tests/workspace.test.cjs`.

## Studio admin

The approved Studio design uses a silver workspace, green actions, and a persistent
photo inspector on desktop. On smaller screens, selecting a photo opens a focused
editing drawer. The same visual system covers library, collections, videos,
analytics, settings, security, backups, and sign-in. Primary **Publish changes**
saves to the live database; **More** retains local save and export options.

Uploads read embedded camera, lens, aperture, shutter speed, ISO, focal length, and
full capture date before WebP conversion. The metadata is saved alongside the Blob
URLs and remains editable. JPEG, PNG, and WebP EXIF is parsed locally using the
vendored ExifReader 4.52.0 library. Missing metadata remains blank; a lens is never
guessed from focal length. GPS metadata is not added to the gallery record.

Run `node admin/tests/capture-metadata.test.cjs` for EXIF extraction and formatting,
and `node --test tests/security-logs.test.mjs` for honest audit-storage fallback.

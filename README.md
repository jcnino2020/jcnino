# JC Niñonuevo Portfolio

JC Niñonuevo’s photography and video portfolio covers drone aerials, street and travel photography, school and publication coverage, and video editing. The repository contains the public site, a private Studio for managing its content, and a collection of standalone web projects.

[Visit the portfolio](https://jcnino.dev/)

## Public site

| Page | What visitors can do |
| --- | --- |
| [Home](index.html) | Browse selected work, photography highlights, and the portfolio introduction. |
| [Gallery](gallery.html), [albums](album.html), and [map](map.html) | Explore the photo library by place, date, or camera, and browse available photo locations. |
| [Drone Shots](drone-shots.html) | Browse aerial photography. |
| [Framed Moments](framed-moments.html) | Browse street, nature, night, and travel photography. |
| [School Events](school-events.html) | Browse school events and publication coverage. |
| [Video Projects](video-projects.html) | Browse video projects and open their embedded YouTube videos. |
| [Stories](stories.html) | Explore photography, publication, and video work in context. |
| [Services](services.html) and [Contact](contact.html) | Review services and submit a project enquiry. |
| [Projects](projects/index.html) | Browse the standalone web projects. |

The photo viewer supports keyboard and touch navigation, direct photo links, and camera details where available. The gallery can show media engagement when its API responds. Public pages use page-level metadata, with crawl settings in [robots.txt](robots.txt) and canonical page URLs in [sitemap.xml](sitemap.xml).

## Local development

Use Node.js and npm for the CSS build and automated checks. The public pages are HTML with shared JavaScript and compiled Tailwind CSS.

```sh
npm ci
npm run build
python3 -m http.server 8000 --bind 127.0.0.1
```

Open [the local homepage](http://127.0.0.1:8000/) or [the local gallery](http://127.0.0.1:8000/gallery.html). The Python server is a static preview. Pages use the checked-in gallery snapshot there, and requests to serverless routes such as `/api/gallery` return 404. Use explicit `.html` paths for pages when testing with this server.

For CSS work, run `npm run watch` in another terminal. Both build commands compile [assets/tailwind.input.css](assets/tailwind.input.css) into `assets/tailwind.css`. Make styling changes in the source or the relevant custom stylesheet, then rebuild the compiled stylesheet.

For an end-to-end preview, run `vercel dev` from the repository root with the Vercel CLI and the project's development environment configured. Open the URL printed by the CLI. Use a development database and Blob store when testing uploads, publishing, or enquiries, since these actions write to the configured services.

## Studio

Open [Studio](admin/index.html) through `/admin/` on the API-backed deployment. Sign-in requires the configured administrator password. Studio includes the photo library, collections, videos, enquiries, analytics, settings, security logs, and backups. The library shows a persistent inspector on desktop and an editing drawer on smaller screens.

### Edit and publish

1. Sign in and let Studio load the current gallery revision.
2. Edit photo details, collections, ordering, videos, or gallery settings. Review the draft before publishing.
3. Select **Publish changes** to send the gallery to MongoDB. Public pages can read the new revision without a site redeploy.
4. Use **More** for local save and export options. Direct disk save requires a browser that supports directory access and a selected project folder. Exports and local snapshots are useful for backup and recovery.

On an empty gallery database, Studio starts from the committed data and sends the full gallery on first publication. Later writes include the revision Studio loaded. If another tab publishes first, the server rejects the stale write. Before replacing a stale local draft with the newer live revision, Studio archives it in browser storage under `pm_previous_gallery_draft`.

### Upload or replace photos

- Select a JPG, PNG, or WebP source of up to 40 MB. The browser generates WebP variants for the 800, 1200, 1600, and 2048 px size slots, each capped at 2 MiB. Vercel Blob stores the generated variants.
- Studio reads embedded camera, lens, aperture, shutter speed, ISO, focal length, and capture date before conversion using the vendored ExifReader library. Missing values remain blank and can be filled in the inspector. The upload EXIF workflow omits GPS from the gallery record.
- Each filename identifies an item within its gallery. Rename a duplicate or use the existing item's editor to replace it.
- Uploads publish the gallery immediately. For ordinary edits, reordering, or removals, use **Publish changes**.
- Removing or replacing a gallery item leaves its existing Blob files available for snapshot recovery. Blob cleanup is a separate operation.

When assigning locations, use the item's visibility setting. The public gallery response strips precise location data for hidden and approximate entries. Approximate entries may expose a rounded area. Keep sensitive coordinates out of the checked-in public snapshot as well.

### Enquiries and reporting

Public enquiries are validated and rate-limited by the API. Studio's authenticated inbox lists them and supports new, read, and archived statuses. The analytics views report visitor activity and media engagement from the configured data sources. Security logs show recorded sign-in attempts when audit storage is available.

## Architecture and repository layout

| Path | Responsibility |
| --- | --- |
| Root HTML pages | Public routes, page structure, and metadata. |
| [assets/gallery-data.js](assets/gallery-data.js) | Committed gallery snapshot for static previews and public fallback. |
| [assets/portfolio.js](assets/portfolio.js), [assets/gallery-media.js](assets/gallery-media.js), and [assets/gallery-explore.js](assets/gallery-explore.js) | Shared page behavior, media URL selection, and gallery exploration. |
| [assets/](assets/) and [images/](images/) | Styles, fonts, viewer scripts, downloads, and repository-hosted media. Optimized media is under `images/optimized/`. |
| [admin/](admin/) | Studio pages, browser-side draft handling, and editing tools. |
| [api/](api/) and [lib/](lib/) | Vercel handlers and shared session, storage, validation, and public-data helpers. |
| [functions/api/](functions/api/) | Separate Cloudflare-style handlers for a subset of routes. |
| [projects/](projects/) and standalone directories | Independent web projects and demos, including HydroAlert, DrainWatch, TruthLens, Viaje, and Web Animation. |
| [scripts/](scripts/) | Maintenance utilities, including batch photo-description generation. |
| [tests/](tests/) and [admin/tests/](admin/tests/) | API, gallery, viewer, routing, and Studio regression checks. |

Public pages load the committed gallery before requesting `/api/gallery?format=js`. A published snapshot takes precedence when available. MongoDB stores the live gallery in `portfolio_gallery`, with separate collections for enquiries, rate limits, likes, views, visitor activity, and sign-in logs. If the gallery database is unavailable, public browsing uses the committed snapshot and Studio retains the local draft while publishing is blocked.

### API routes

| Route | Purpose |
| --- | --- |
| `/api/gallery` | Read the live snapshot as JSON or JavaScript. Authenticated writes publish a revision. |
| `/api/auth` and `/api/logs` | Sign in and read authenticated audit history. |
| `/api/upload` | Store authenticated WebP uploads in the public Blob store. |
| `/api/enquiries` | Accept public submissions and provide authenticated inbox reads and status updates. |
| `/api/likes` and `/api/views` | Read and update media engagement counts. |
| `/api/track_visitor` and `/api/analytics` | Record visits and serve authenticated traffic reports. |
| `/api/ai`, `/api/convert`, and `/api/save` | Supporting handlers for AI requests, image fetching, and GitHub-backed saves. Studio's primary publish action uses `/api/gallery`. |

## Deployment and configuration

The full-stack setup uses Vercel to serve the static pages and run the Node.js handlers in `api/`. [vercel.json](vercel.json) enables clean URLs, redirects directory entry points to their trailing-slash URLs, and sets long-lived cache headers for shared assets and optimized images.

1. Import the repository into Vercel with the repository root as the project directory. Keep the output and routing settings from `vercel.json`.
2. Add the server-side environment variables below to the environments that need them. Connect a public Vercel Blob store for photo uploads.
3. Deploy and check the public gallery, Studio sign-in, and live gallery status. Verify writes against development or preview services before using production data.

| Variable | Used for |
| --- | --- |
| `ADMIN_PASSWORD` | Studio sign-in and server-side session verification. |
| `MONGODB_URI` | Database connection for publishing, enquiries, engagement, traffic, and audit storage. |
| `BLOB_STORE_ID` or `BLOB_READ_WRITE_TOKEN` | Public Blob uploads using Vercel's runtime OIDC connection or a legacy read/write token. |
| `DEEPSEEK_API_KEY` | Optional AI handler and DeepSeek description script. |
| `GEMINI_API_KEY` or `GOOGLE_API_KEY` | Optional Gemini description script. |
| `GITHUB_TOKEN`, `GITHUB_REPO`, `GITHUB_BRANCH` | Optional GitHub save handler. Its repository and branch default to `jcnino2020/jcnino` and `main`. |

Keep credentials in the deployment environment or a private local environment file. GitHub Pages or another static host can serve the committed site. The live Studio workflow requires compatible API routes and their backing services. [wrangler.jsonc](wrangler.jsonc) configures Cloudflare static assets separately from the Vercel deployment.

## Checks

```sh
node --test tests/*.test.mjs admin/tests/*.test.cjs
```

The suite covers gallery publishing and uploads, photo location privacy, viewer navigation, enquiries, analytics, audit storage, directory redirects, and Studio metadata tools. To run a focused check, pass the file directly to Node.

```sh
node --test tests/gallery.test.mjs
node --test tests/enquiries.test.mjs tests/analytics.test.mjs tests/security-logs.test.mjs
node admin/tests/capture-metadata.test.cjs
node admin/tests/reference-exif.test.cjs
node admin/tests/workspace.test.cjs
```

The directory redirect check scans the working tree for directories with an `index.html`. Run the suite from a clean checkout if local prototypes introduce additional routes.

## Credits and contact

Photography, video work, and portfolio content by JC Niñonuevo.

- [Project enquiries](https://jcnino.dev/contact)
- [Email](mailto:jcninonuevo@gmail.com)
- [Instagram](https://instagram.com/photos.jcnino)
- [Facebook](https://facebook.com/jcninoo)

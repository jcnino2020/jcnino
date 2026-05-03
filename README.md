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

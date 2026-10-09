# The Feline Archive

<!-- impeccable:product-schema 1 -->

## Platform
web

## Users
Visitors exploring cat-related artworks in the Art Institute of Chicago collection. This audience and its browsing task are inferred from the existing page because the redesign questions have not yet been answered.

## Product Purpose
Present a browsable, image-led view of cat-related collection records, with enough context to identify an artwork and follow it to the museum's source record. Search and browser-local saved works are redesign additions, not existing account features.

## Operating Context
The page is a standalone static subfolder of the portfolio. It fetches live collection metadata from the Art Institute of Chicago API and serves artwork images from the museum's IIIF endpoint. Network availability and the museum's response control what can be shown.

## Capabilities and Constraints
- Preserve the cat-art subject, museum attribution, creator attribution, and source links. Keeping this subject is an inferred decision pending user reply.
- Do not imply the page is an official Art Institute of Chicago product.
- The collection is a live API result, not a complete catalogue of all feline works.
- The artwork search filters to public-domain records, following the museum API's image-use recommendation.
- Saved works stay in the current browser; there is no account or cross-device sync.
- Metadata and image descriptions from the API are untrusted input and must be rendered safely.

## Brand Commitments
Retain the name The Feline Archive and Jan Carlo G. Niñonuevo attribution from the existing page. No visual styling is fixed by the current implementation.

## Evidence on Hand
`index.html` currently queries the Art Institute of Chicago artwork search API for cats, displays returned images, titles, and artists, and links no individual museum records. The museum's [API documentation](https://api.artic.edu/docs/) describes the search fields and IIIF image construction.

## Product Principles
- Artwork and its attribution lead the experience.
- Browsing remains usable when individual images are unavailable.
- Search, saved state, loading, and failures are explicit and recoverable.
- Source credit stays visible wherever artwork details appear.

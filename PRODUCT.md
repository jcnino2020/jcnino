# JC Niñonuevo Portfolio

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The portfolio owner manages photography, video, collections, and site settings through the admin workspace. Visitors browse the public portfolio.

## Product Purpose

The public site presents JC Niñonuevo's photography, film, and projects. The admin workspace lets the owner curate and publish that work, review audience activity, and maintain the site.

## Operating Context

The admin is a static browser interface backed by gallery data, local draft storage and snapshots, optional local-folder write access, and GitHub publishing. Some account and analytics operations depend on external APIs. The user is open to changing admin workflows during a full redesign.

## Capabilities and Constraints

- Preserve media, collection, analytics, settings, security, backup, authentication, and publishing capabilities.
- Keep the existing data format and external API contracts unless a workflow change requires a compatible adaptation.
- Clearly distinguish local drafts, direct disk writes, downloads, and publishing to the live site.
- Do not imply analytics or security information is live when the data source is unavailable.

## Evidence on Hand

- `admin/index.html` contains media and collection management and the overview.
- `admin/analytics.html`, `admin/settings.html`, `admin/security.html`, and `admin/backups.html` contain the supporting workspaces.
- `admin/admin-core.js` owns authentication, persistence, and shared actions.

## Product Principles

- Put the next task within easy reach.
- Make save and publish states unambiguous.
- Keep operational information scannable.
- Protect existing content and data while changing presentation.

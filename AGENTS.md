# Agent instructions

## Auto-deploy

This repo deploys to production from `main` on Vercel (`https://jcnino.dev`).

After completing any change to the site:

1. Stage only the files that belong to the change. Never commit `.DS_Store`, `.env`, `output/`, `reports/`, temporary files, or other unrelated local work.
2. Commit with a short, specific message describing the change.
3. Push to `origin main` so Vercel deploys automatically. Do not open a pull request unless the user asks.
4. When practical, verify the deploy by re-fetching the affected live URL and confirming the change is present.

Do not force-push, do not rewrite history, and do not deploy if the change is incomplete or a check fails — report the blocker instead.

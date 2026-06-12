# arboleda.co

Marketing site for arboleda — an AI consultancy automating finance and operations for Australian SMBs.

Static site, no build step. All pages live in [`site/`](site/):

- `index.html` — landing page
- `alchemy.html` / `aurora.html` / `anatomy.html` — the three practices
- `how-we-work.html` — engagement model
- `start.html`, `login.html`, `portal.html` — client portal flow
- `styles.css`, `site.js` — shared design system and behaviours

## Deployment

Pushes to `main` deploy automatically to GitHub Pages via
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml), which publishes
the `site/` folder to https://arboleda.co.

## Local preview

Serve the `site/` folder with any static server, e.g.:

```sh
npx serve site
```

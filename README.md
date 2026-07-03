# arboleda.co

Marketing site + client portal for arboleda — an AU consultancy automating finance and
operations for Australian SMBs. Three practices: **Anatomy** (systems foundations), **Aurora**
(decision intelligence), **Alchemy** (automation). The site sells a Step 0 (free preview) →
Step 1 (paid audit) → Step 2 (milestone-billed build) journey.

Static HTML/CSS/vanilla JS — **no build step, no framework**. Everything ships from [`site/`](site/).

## Layout

```
site/
  index.html  alchemy.html  aurora.html  anatomy.html  how-we-work.html   marketing
  start.html  login.html  portal.html  report.html  pay.html             portal flow
  report-content.js   pure content library (tools, metrics, pricing, deliverables) — no DOM
  report-render.js    pure string→HTML renderer
  store.js            storage adapter — localStorage (local mode) or Supabase (cloud mode)
  config.js           runtime config: empty = local mode, filled = cloud mode
  functions/          Cloudflare Pages Functions (server API; holds all secrets)
    _shared.js  api/intake.js  api/checkout.js  api/stripe-webhook.js  api/operator.js
  _redirects          Cloudflare clean-URL rules
  .env.example        server env template
supabase/schema.sql   Postgres schema + row-level security + operator allowlist + bucket
DEPLOY.md             two-stage deployment runbook (Stage 1 static, Stage 2 cloud)
go-live-plan.md       system-design rationale
```

## Two modes

- **Local mode (default):** `config.js` is blank. All client state lives in `localStorage`; the
  full intake → portal → engagement → payments flow runs in the browser with no backend. This is
  the prototype/demo mode and is always the clean fallback — blanking `config.js` returns to it.
- **Cloud mode:** fill `config.js` with the Supabase URL + anon key. `store.js` then syncs
  intake/discovery/engagement to Supabase, auth becomes magic-link, and the Pages Functions
  authorise payments and state transitions. Secrets live only in Cloudflare env vars.

## Deployment

Hosted on **Cloudflare Pages** (chosen so the `site/functions/` server API can run). Connect the
GitHub repo with: **build command = none**, **root directory = `site`** (so Functions are detected
at `site/functions` and `_redirects` is found), **build output directory = the root dir**. Pushes
to `main` then deploy automatically. Full runbook in [`DEPLOY.md`](DEPLOY.md).

## Local preview

```sh
# static pages only
npx serve site

# pages + Cloudflare Functions (needed to exercise /api/*)
npx wrangler pages dev site
```

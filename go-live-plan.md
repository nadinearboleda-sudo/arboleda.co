# arboleda.co — Implementation & Go-Live Plan

## 0. Recommendation in one line

Ship the marketing site **and** the prototype portal now on Cloudflare Pages (static, no backend), then build the real portal as Phase 2 on Supabase + Stripe. The prototype already sells; don't block launch on infrastructure you can add once real prospects are flowing.

---

## 1. Requirements

### Functional
- Public marketing pages (home, three practices, how-we-work) — indexable, fast, shareable.
- Intake wizard → produces a client-specific Step 0 view, 3 report previews, and an audit brief.
- Client portal: operating chain, co-build discovery, deliverables, engagement state, timeline, payments.
- Operator mode: post proposal w/ price, confirm sign-offs, runbook checklist.
- Checkout: deposit → balance → 3 build milestones.

### Non-functional
- **Scale:** tiny. Tens of prospects/month, low double-digit active engagements. This is a sales/delivery tool, not a consumer app — design for clarity and trust, not throughput.
- **Latency:** static-fast for public pages (SEO matters); portal interactivity is client-side.
- **Availability:** 99.9% from the host's CDN is plenty; no custom infra to fail.
- **Security:** the gating line — payments and deliverables must be server-enforced in Phase 2 (the prototype's localStorage gating is demo-only and trivially bypassed).
- **Cost target:** ~$0–25/mo Phase 1; ~$25–75/mo Phase 2 (Supabase free/pro + Stripe per-txn + domain).

### Constraints
- Solo / very small team. Favour managed services over anything self-hosted.
- Existing codebase is static HTML/CSS/vanilla JS with a clean content library (`report-content.js`) that's pure functions — this is the asset; keep it as the shared core for both phases.

---

## 2. Phase 1 — Static launch (this week)

### What goes live
Everything in `site/` exactly as built: pages, intake, portal, reports, checkout — all client-side. State lives in localStorage; "operator mode" and "payments" are demonstrations.

### Architecture
```
Browser ──HTTPS──> Cloudflare Pages (static CDN)
                     ├─ /            index.html
                     ├─ /alchemy …   practice pages
                     ├─ /start       intake  ──┐
                     ├─ /portal      portal   ─┤ localStorage:
                     ├─ /report      reports  ─┤  arboleda-intake / -discovery
                     ├─ /pay         checkout ─┤  arboleda-engagement / -runbook
                     └─ report-content.js (shared pure core)
```
No server, no database, no secrets. The `_redirects`/clean-URL config already exists (`netlify.toml`, `vercel.json`); add Cloudflare Pages' equivalent (`_redirects` file) so `/alchemy` → `alchemy.html`.

### Go-live checklist
1. **Pre-flight QA** (already mostly done): run the jsdom suite, click every page on the live preview, Lighthouse pass (SEO/perf/a11y), check OG image renders on a LinkedIn/Slack unfurl.
2. **Repo**: push `site/` to GitHub (private). This becomes the deploy source.
3. **Host**: connect repo to Cloudflare Pages; build command none, output dir `site/`. Add `_redirects` for clean URLs + a catch-all to the right .html.
4. **Domain**: point `arboleda.co` (apex + www) at Pages; force HTTPS; www→apex redirect. Set canonical host.
5. **robots/sitemap**: already present — confirm sitemap URL in Search Console; submit.
6. **Analytics**: Cloudflare Web Analytics or Plausible (privacy-friendly, no cookie banner). Add a goal on intake-submit and on each `/pay` visit (proxy for buying intent).
7. **Forms that actually send**: the intake "submit" and the mailto CTAs are the one real gap — wire intake submission to email you (Phase 1: a Cloudflare Pages Function or Formspree posting the intake JSON to hello@arboleda.co, so a lead never sits only in their browser).
8. **Disclaimer**: add a small "prototype — figures illustrative" note in the portal footer until Phase 2 (you have sample watermarks already; this covers the checkout).

### Phase 1 trade-offs
- **Win:** live in days, $0, nothing to secure, real prospect feedback now.
- **Accept:** state is per-browser (a client switching devices loses progress); "payments" don't move money; operator changes aren't shared with the client. All fine for sales demos and even early real engagements run high-touch.
- **Revisit when:** you have a paying client who needs the portal to persist across devices, or you want self-serve payment — that's the Phase 2 trigger.

---

## 3. Phase 2 — Real portal (fast-follow, ~2–4 weeks part-time)

### Added components
```
Browser ──> Cloudflare Pages (same static front end)
              │
              ├─ Supabase Auth (magic-link email)        ← replaces cosmetic login
              ├─ Supabase Postgres (engagements, intake, payments, deliverables)
              ├─ Supabase Storage (real deliverable files, signed URLs)
              └─ Stripe Checkout + webhook → Pages Function → DB state flip
```

### Data model (Postgres)
- `clients` (id, email, company, created_at)
- `intakes` (client_id, payload jsonb — the current intake object) 
- `engagements` (client_id, focus, state, price, signoffs jsonb, updated_at)
- `payments` (engagement_id, stage, amount, stripe_session_id, paid_at)
- `deliverables` (engagement_id, key, title, status, file_path, version, as_at)
- RLS: a client reads only their own rows; operator role reads/writes all.

### State machine moves server-side
The prototype's state strings (`proposal → step1_paid → … → m3`) become the `engagements.state` column. Transitions are server-authorised:
- client actions (intake, discovery) write directly (RLS-scoped).
- **payment** transitions only via the Stripe webhook (never the client) — closes the localStorage-bypass hole.
- **operator** transitions (post proposal, sign-offs) via an authenticated operator view.

### API surface (Pages Functions or Supabase RPC)
- `POST /api/intake` — upsert intake
- `POST /api/discovery` — upsert discovery
- `POST /api/checkout` — create Stripe session for a stage
- `POST /api/stripe-webhook` — verify, record payment, advance state
- `POST /api/operator/*` — proposal, signoff (operator-auth only)
- Reads go straight through Supabase client with RLS.

### Migration path (low-risk, the key advantage)
`report-content.js` is pure functions — it doesn't change. Only the *storage layer* swaps: today `localStorage.getItem('arboleda-engagement')`, Phase 2 a `loadEngagement()` that hits Supabase, falling back to localStorage when logged out. Wrap the ~5 storage keys behind a tiny `store.js` adapter in Phase 1 so Phase 2 is a one-file swap, not a rewrite.

### Phase 2 trade-offs
- **Supabase vs Firebase:** Supabase = Postgres + SQL + row-level security that maps cleanly to "client sees own data, operator sees all"; better fit than Firebase's document model for this relational data. Both have generous free tiers.
- **Stripe Checkout vs Payment Links:** Checkout (server-created sessions) lets you set the exact milestone amount and metadata; Payment Links are simpler but static. Use Checkout because amounts are operator-set per client.
- **Auth:** magic-link only — no passwords to manage, matches the "edit intake without re-entering password" behaviour already built.

---

## 4. Reliability & monitoring
- Phase 1: host status + uptime ping (e.g. UptimeRobot) on the apex; Search Console for indexing health.
- Phase 2: Stripe dashboard for payment health; Supabase logs; a webhook-failure alert to email (a dropped webhook = a client who paid but didn't unlock — the one thing that must never fail silently, so log + alert + a manual operator "mark paid" fallback).

## 5. Sequenced go-live

| When | Action |
|---|---|
| Day 1 | Add Cloudflare `_redirects`; wrap storage keys in `store.js`; final QA + Lighthouse |
| Day 1 | Wire intake submission to email (Formspree/Pages Function) |
| Day 2 | Push to GitHub; connect Cloudflare Pages; deploy to a `*.pages.dev` URL; smoke test |
| Day 2 | Point `arboleda.co` DNS; HTTPS; www→apex; submit sitemap |
| Day 3 | Analytics + uptime ping; soft launch (share with a few prospects) |
| Wk 2+ | Phase 2 when a real engagement needs persistence/payments: Supabase schema → auth → Stripe → swap `store.js` |

## 6. What I'd revisit as it grows
- Move `report-content.js` to a versioned package once both phases consume it, so deliverable logic has one source of truth.
- If operators exceed one person, add an audit log on engagement transitions.
- If clients self-serve heavily, add email notifications on each unlock (you already have the state machine to hang them off).

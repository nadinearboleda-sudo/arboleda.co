# arboleda.co — Deployment Runbook

Two-stage launch. **Stage 1** puts the site live as static files (works today, no accounts).
**Stage 2** turns on the real portal (auth, database, payments) by adding accounts + env vars
— no code changes, because the code already detects config and flips to cloud mode.

Everything Claude can build is built. The steps below are the account-level actions only
you can do (they need your logins, your card, your domain).

---

## Stage 1 — Static site live (≈1 hour, free)

1. **Create a GitHub repo** (private) and push the project. The deploy source is the `site/` folder.
2. **Cloudflare Pages** → Create project → connect the repo.
   - Build command: *(none)*
   - Build output directory: `site`
   - Deploy. You'll get a `https://<project>.pages.dev` URL.
3. **Smoke test** the `.pages.dev` URL: home, `/alchemy`, `/start` (complete an intake), `/portal`, a `/report?service=sample&type=sysmap`. Clean URLs come from `site/_redirects`.
4. **Custom domain**: Pages → Custom domains → add `arboleda.co` and `www.arboleda.co`.
   - In your DNS (you control it): add the CNAME/records Cloudflare shows. If your DNS is already on Cloudflare it's one click.
   - Set `www` → redirect to apex (or vice-versa); force HTTPS (Pages does this automatically).
5. **Search Console**: add the domain, submit `https://arboleda.co/sitemap.xml`.
6. **Analytics**: Cloudflare → Web Analytics → enable for the domain (no code, no cookie banner).

At this point the site and the **prototype** portal are live. State is per-browser; payments simulate. Good enough to run sales conversations.

---

## Stage 2 — Real portal (auth + DB + payments)

### 2a. Supabase (≈30 min)
1. Create a project at supabase.com. Note the **Project URL** and both keys (Settings → API): the `anon` (public) key and the `service_role` (secret) key.
2. SQL editor → paste and run `supabase/schema.sql`. This creates all tables, row-level security, the operator allowlist, and the deliverables storage bucket.
3. Make yourself an operator:
   ```sql
   insert into public.operators(email) values ('you@arboleda.co');
   ```
4. Auth → Providers → Email: enable. Auth → URL Configuration → set Site URL to `https://arboleda.co` and add `https://arboleda.co/portal` as a redirect URL (magic links return here).

### 2b. Turn on cloud mode in the browser
Edit `site/config.js`:
```js
window.ARBOLEDA_CONFIG = {
  supabaseUrl: 'https://YOUR-PROJECT.supabase.co',
  supabaseAnonKey: 'eyJ...'   // the anon/public key
};
```
Commit + push. That single file flips every page from local mode to cloud mode. Login now sends magic links; intake/discovery/engagement sync to Supabase per signed-in client.

### 2c. Stripe (≈30 min)
1. Create a Stripe account; start in **test mode**.
2. Developers → API keys → copy the **secret key** (`sk_test_...`).
3. Developers → Webhooks → Add endpoint:
   - URL: `https://arboleda.co/api/stripe-webhook`
   - Event: `checkout.session.completed`
   - Copy the **signing secret** (`whsec_...`).

### 2d. Cloudflare env vars (the secrets)
Pages → your project → Settings → Environment variables → add (see `site/.env.example`):
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`  (the secret one)
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `SITE_URL` = `https://arboleda.co`

Redeploy so the `functions/` pick them up. (The `/api/*` routes are Cloudflare Pages Functions — they deploy automatically from `site/functions/`.)

### 2e. End-to-end test (test mode)
1. Log in at `/login` with your email → click the magic link → land in `/portal`.
2. As operator (`/portal?op=1`) on a test client's engagement: post a proposal with a price.
3. As the client: open the proposal → pay the deposit → you're sent to Stripe Checkout → use test card `4242 4242 4242 4242`, any future expiry/CVC.
4. Confirm: back in `/portal`, the deposit shows paid and the audit deliverables unlocked — driven by the webhook, not the browser.
5. Test the sign-off gates: milestone 2/3 stay locked until you (operator) confirm connection/handover.
6. **Go live**: swap Stripe to live keys (`sk_live_`, new `whsec_` from a live-mode webhook), update the two Cloudflare vars, redeploy.

---

## Architecture (what runs where)

```
Browser ──> Cloudflare Pages (static: site/*.html, *.js, _redirects)
              │  config.js → cloud mode → supabase-js
              ├─ reads/writes intake, discovery, engagement.focus  (Supabase, RLS-scoped)
              │
              └─ /api/* → Cloudflare Pages Functions (site/functions/*)  [secrets here]
                   ├─ /api/checkout       → creates Stripe session (server-priced)
                   ├─ /api/stripe-webhook → verifies, records payment, advances state
                   └─ /api/operator       → propose / deliver / signoff / mark-paid (operator-only)
                          │
                          └─ Supabase (service role, bypasses RLS) — Postgres + Storage
```

## Security model (the important part)
- The browser only ever holds the Supabase **anon** key; row-level security means a client reads only their own rows.
- **Money and state never move from the browser.** `/api/checkout` computes the amount server-side from the client's stored intake (ignores any client-sent number); state advances only via the Stripe webhook (signature-verified) or an authenticated operator.
- A Postgres trigger blocks a client from editing `state`/`price`/`signoffs`/`payments` even if they craft a direct request — only operators or the service role can.
- If a webhook is ever missed (client paid, didn't unlock): operator action `mark-paid` is the manual fallback. Watch the Stripe dashboard's webhook delivery log; add an email alert later if volume grows.

## Rollback
- Cloud mode misbehaving? Blank `config.js` and redeploy → instantly back to local/prototype mode; the site keeps working.
- Each Cloudflare deploy is a versioned snapshot — one-click rollback in the Pages dashboard.

## Verified before handoff
All JS (client + 4 server functions) passes `node --check`; full local-mode flow re-tested over real HTTP (intake → portal states → samples) — the cloud scaffolding stays inert until `config.js` + env vars are set.

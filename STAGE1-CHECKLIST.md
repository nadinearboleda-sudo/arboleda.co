# Stage 1 launch checklist

Tick these off as you go. Full detail in [DEPLOY.md](DEPLOY.md). Steps are ordered to avoid
touching DNS twice and to let you test lead capture before the domain is verified.

**Keep private — paste into Cloudflare env vars yourself, never share:** the Resend `re_…` key,
and (Stage 2) the Stripe and Supabase service-role secrets.

---

## 0. DNS decision (do first)
- [ ] Decide where `arboleda.co` DNS lives. Easiest path: manage it on **Cloudflare** so the Pages
      domain + Resend records are all in one dashboard.
  - [ ] If not already on Cloudflare: add the site in Cloudflare → update nameservers at your
        registrar → wait for propagation before the domain/Resend steps.

## 1. Merge the PR
- [ ] Merge [PR #1](https://github.com/nadinearboleda-sudo/arboleda.co/pull/1) so `main` has the project.

## 2. Cloudflare Pages project
- [ ] Workers & Pages → Create → Pages → Connect to Git → `nadinearboleda-sudo/arboleda.co`.
- [ ] Production branch: `main`.
- [ ] Framework preset: **None**; Build command: **(empty)**.
- [ ] **Root directory (advanced): `site`**  ← required, or every `/api/*` route 404s.
- [ ] Build output directory: `/`.
- [ ] Save and Deploy → note the `https://<project>.pages.dev` URL.
- [ ] **Smoke test** `.pages.dev`: home, `/alchemy`, `/start`, `/portal`, `/report?service=sample&type=sysmap`.

## 3. Resend API key
- [ ] Sign up at resend.com.
- [ ] API Keys → Create → copy the `re_…` key (shown once).

## 4. Wire lead capture + test
- [ ] Cloudflare → project → Settings → Environment variables → Production → add:
  - [ ] `RESEND_API_KEY` = the `re_…` key
  - [ ] `LEAD_NOTIFY_TO` = `nadinearboleda@gmail.com`
  - [ ] `LEAD_NOTIFY_FROM` = `onboarding@resend.dev`  *(temporary shared sender)*
- [ ] Deployments → Retry deployment (env vars need a fresh deploy).
- [ ] **Checkpoint:** submit an intake on `.pages.dev/start` → lead email arrives. ✅ function + key work.

## 5. Verify domain in Resend (branded `from`)
- [ ] Resend → Domains → Add Domain → `arboleda.co`.
- [ ] Add the SPF/DKIM `TXT` + bounce `MX` records it shows, in Cloudflare DNS → click Verify.
- [ ] Change Cloudflare `LEAD_NOTIFY_FROM` = `arboleda leads <leads@arboleda.co>` → retry deployment.
- [ ] Submit one more test intake → confirms it still arrives, now from your domain.

## 6. Custom domain on Pages
- [ ] Pages → Custom domains → add `arboleda.co`, then `www.arboleda.co`.
- [ ] Confirm/add the DNS records (one click if DNS is on Cloudflare).
- [ ] Set `www` → redirect to apex (redirect rule); HTTPS is automatic.
- [ ] **Checkpoint:** `https://arboleda.co` loads, `www` redirects, a live intake emails you.

## 7. Analytics + SEO
- [ ] Cloudflare → Web Analytics → enable for `arboleda.co`.
- [ ] Google Search Console → add `arboleda.co` (verify via DNS `TXT`) → submit `https://arboleda.co/sitemap.xml`.

---

**Stage 1 done.** The marketing site + prototype portal are live; intakes email you; payments still
simulate (per-browser state). Good enough for sales conversations.

## → Stage 2 (when ready)
- [ ] DEPLOY.md §2a: create Supabase project, run `supabase/schema.sql`, add yourself as operator,
      enable Email auth + set the `/portal` redirect URL.
- [ ] Send Claude the Supabase **Project URL + anon (public) key** → `config.js` flipped to cloud mode.
- [ ] DEPLOY.md §2c–2e: Stripe test mode, Cloudflare server env vars, end-to-end test, then live keys.

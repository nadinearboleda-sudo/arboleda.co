// Shared helpers for Cloudflare Pages Functions.
// Env vars (set in Cloudflare → Pages → Settings → Environment variables):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY  (service role: server-only, bypasses RLS)
//   STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
//   SITE_URL  (e.g. https://arboleda.co)

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }
  });
}

// Minimal Supabase REST helper using the service-role key (bypasses RLS).
export function sb(env) {
  const base = env.SUPABASE_URL + '/rest/v1';
  const headers = {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    authorization: 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY,
    'content-type': 'application/json'
  };
  return {
    async select(table, query) {
      const r = await fetch(`${base}/${table}?${query}`, { headers });
      return r.ok ? r.json() : [];
    },
    async upsert(table, row, onConflict) {
      const q = onConflict ? `?on_conflict=${onConflict}` : '';
      const r = await fetch(`${base}/${table}${q}`, {
        method: 'POST',
        headers: { ...headers, prefer: 'resolution=merge-duplicates,return=representation' },
        body: JSON.stringify(row)
      });
      return r.ok ? r.json() : null;
    },
    async insert(table, row) {
      const r = await fetch(`${base}/${table}`, {
        method: 'POST',
        headers: { ...headers, prefer: 'return=representation' },
        body: JSON.stringify(row)
      });
      return r.ok ? r.json() : null;
    },
    async patch(table, query, row) {
      const r = await fetch(`${base}/${table}?${query}`, {
        method: 'PATCH',
        headers: { ...headers, prefer: 'return=representation' },
        body: JSON.stringify(row)
      });
      return r.ok ? r.json() : null;
    }
  };
}

// Verify the caller's Supabase access token (sent as Bearer) and return their email.
export async function authedEmail(request, env) {
  const auth = request.headers.get('authorization') || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const r = await fetch(env.SUPABASE_URL + '/auth/v1/user', {
    headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, authorization: 'Bearer ' + token }
  });
  if (!r.ok) return null;
  const u = await r.json();
  return u && u.email ? u.email : null;
}

export async function isOperator(email, env) {
  if (!email) return false;
  const rows = await sb(env).select('operators', `email=eq.${encodeURIComponent(email)}&select=email`);
  return Array.isArray(rows) && rows.length > 0;
}

export async function clientByEmail(email, env) {
  const rows = await sb(env).select('clients', `email=eq.${encodeURIComponent(email)}&select=*`);
  return rows && rows[0] ? rows[0] : null;
}

// Pricing — mirror of report-content.js so the server never trusts client amounts.
const AUDIT = { 'Under 50': 5000, '50–150': 8500, '150–300': 13500, '300–500': 18000, '500+': 22000 };
export function auditPrice(headcount, override) { return override || AUDIT[headcount] || 8500; }
export function step2Price(toolCount) { return 30000 + (toolCount || 0) * 2500; }

// Given a stage + engagement + intake, return the authoritative amount in cents.
export function amountForStage(stage, eng, intake) {
  const audit = auditPrice(intake?.payload?.headcount, eng?.price);
  const tools = (intake?.payload?.systems || []).length;
  const step2 = step2Price(tools);
  const credit = Math.min(audit, step2);
  const net = step2 - credit;
  const m1 = Math.round(net * 0.4), m2 = Math.round(net * 0.4), m3 = net - m1 - m2;
  const dep = Math.round(audit / 2), bal = audit - dep;
  const map = { 'audit-deposit': dep, 'audit-balance': bal, 'step2': m1, 'm2': m2, 'm3': m3 };
  return (map[stage] || 0) * 100; // Stripe wants cents
}

export const STAGE_NEXT = {
  'audit-deposit': 'step1_paid',
  'audit-balance': 'step1_delivered',
  'step2': 'step2_paid',
  'm2': 'm2',
  'm3': 'm3'
};

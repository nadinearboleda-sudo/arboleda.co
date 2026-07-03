// POST /api/stripe-webhook  (Stripe → server)
// The ONLY path that advances payment state. Verifies the Stripe signature, records
// the payment, and flips the engagement state. Idempotent on stripe_session_id.
import { sb, amountForStage, STAGE_NEXT } from '../_shared.js';

export async function onRequestPost({ request, env }) {
  const payload = await request.text();
  const sig = request.headers.get('stripe-signature') || '';
  const ok = await verifyStripe(payload, sig, env.STRIPE_WEBHOOK_SECRET);
  if (!ok) return new Response('bad signature', { status: 400 });

  const event = JSON.parse(payload);
  if (event.type !== 'checkout.session.completed') return new Response('ignored', { status: 200 });

  const session = event.data.object;
  const stage = session.metadata && session.metadata.stage;
  const clientId = session.metadata && session.metadata.client_id;
  if (!STAGE_NEXT[stage] || !clientId) return new Response('missing metadata', { status: 200 });

  const db = sb(env);

  // Idempotency: bail if we've already recorded this session.
  const existing = await db.select('payments', `stripe_session_id=eq.${session.id}&select=id`);
  if (existing && existing.length) return new Response('already processed', { status: 200 });

  const amount = Math.round((session.amount_total || 0) / 100);
  await db.insert('payments', { client_id: clientId, stage, amount, stripe_session_id: session.id });

  // Append to engagement.payments and advance state (service role bypasses RLS).
  const engRows = await db.select('engagements', `client_id=eq.${clientId}&select=*`);
  const eng = engRows[0] || { payments: [] };
  const payments = (eng.payments || []).concat([{ stage, amount, date: new Date().toISOString().slice(0, 10) }]);
  await db.upsert('engagements',
    { client_id: clientId, state: STAGE_NEXT[stage], payments },
    'client_id');

  return new Response('ok', { status: 200 });
}

// Stripe signature verification (HMAC-SHA256) using Web Crypto — no SDK needed.
async function verifyStripe(payload, sigHeader, secret) {
  if (!secret) return false;
  const parts = Object.fromEntries(sigHeader.split(',').map(kv => kv.split('=')));
  const t = parts.t, v1 = parts.v1;
  if (!t || !v1) return false;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = await crypto.subtle.sign('HMAC', key, enc.encode(t + '.' + payload));
  const hex = [...new Uint8Array(mac)].map(b => b.toString(16).padStart(2, '0')).join('');
  // constant-time-ish compare + 5-min tolerance
  if (Math.abs(Date.now() / 1000 - Number(t)) > 300) return false;
  if (hex.length !== v1.length) return false;
  let diff = 0;
  for (let i = 0; i < hex.length; i++) diff |= hex.charCodeAt(i) ^ v1.charCodeAt(i);
  return diff === 0;
}

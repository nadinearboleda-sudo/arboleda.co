// POST /api/checkout  { stage }
// Auth: client Bearer token. Creates a Stripe Checkout session for the authoritative
// amount (computed server-side from their intake + engagement) and returns the URL.
import { json, sb, authedEmail, clientByEmail, amountForStage, STAGE_NEXT } from '../_shared.js';

export async function onRequestPost({ request, env }) {
  const email = await authedEmail(request, env);
  if (!email) return json({ error: 'Not signed in' }, 401);

  let body = {};
  try { body = await request.json(); } catch (e) {}
  const stage = body.stage;
  if (!STAGE_NEXT[stage]) return json({ error: 'Unknown stage' }, 400);

  const client = await clientByEmail(email, env);
  if (!client) return json({ error: 'No client record' }, 404);

  const db = sb(env);
  const intakeRows = await db.select('intakes', `client_id=eq.${client.id}&select=payload`);
  const engRows = await db.select('engagements', `client_id=eq.${client.id}&select=*`);
  const intake = intakeRows[0] || { payload: {} };
  const eng = engRows[0] || {};

  const amount = amountForStage(stage, eng, intake);
  if (amount <= 0) return json({ error: 'No amount due for this stage' }, 400);

  // Guard ordering: can't pay a stage out of sequence.
  const order = ['discovery', 'proposal', 'step1_paid', 'step1_delivered', 'step2_paid', 'm2', 'm3'];
  const required = { 'audit-deposit': 'proposal', 'audit-balance': 'step1_paid', 'step2': 'step1_delivered', 'm2': 'step2_paid', 'm3': 'm2' };
  if (order.indexOf(eng.state || 'discovery') < order.indexOf(required[stage])) {
    return json({ error: 'This payment is not unlocked yet' }, 409);
  }
  // Milestone 2/3 require the matching operator sign-off.
  if (stage === 'm2' && !(eng.signoffs && eng.signoffs.connection)) return json({ error: 'Awaiting connection sign-off' }, 409);
  if (stage === 'm3' && !(eng.signoffs && eng.signoffs.handover)) return json({ error: 'Awaiting handover confirmation' }, 409);

  const form = new URLSearchParams();
  form.set('mode', 'payment');
  form.set('success_url', env.SITE_URL + '/portal?paid=' + stage);
  form.set('cancel_url', env.SITE_URL + '/portal');
  form.set('customer_email', email);
  form.set('client_reference_id', client.id);
  form.set('metadata[stage]', stage);
  form.set('metadata[client_id]', client.id);
  form.set('line_items[0][quantity]', '1');
  form.set('line_items[0][price_data][currency]', 'aud');
  form.set('line_items[0][price_data][unit_amount]', String(amount));
  form.set('line_items[0][price_data][product_data][name]', 'arboleda.co — ' + stage);

  const r = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      authorization: 'Bearer ' + env.STRIPE_SECRET_KEY,
      'content-type': 'application/x-www-form-urlencoded'
    },
    body: form
  });
  const session = await r.json();
  if (!r.ok) return json({ error: session.error ? session.error.message : 'Stripe error' }, 502);
  return json({ url: session.url });
}

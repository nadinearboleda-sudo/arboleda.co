// POST /api/operator  { action, clientEmail, ... }
// Operator-only engagement transitions. Auth: operator Bearer token.
// Actions:
//   propose      { clientEmail, focus, price }   → state=proposal
//   deliver      { clientEmail }                  → state=step1_delivered
//   signoff      { clientEmail, kind }            → signoffs[kind]=true  (kind: connection|handover)
//   mark-paid    { clientEmail, stage }           → manual fallback if a webhook is missed
//                ( amountOverride + reason )         optional audited override only
import { json, sb, authedEmail, isOperator, clientByEmail, amountForStage, STAGE_NEXT } from '../_shared.js';

export async function onRequestPost({ request, env }) {
  const email = await authedEmail(request, env);
  if (!email || !(await isOperator(email, env))) return json({ error: 'Operator only' }, 403);

  let body = {};
  try { body = await request.json(); } catch (e) {}
  const target = await clientByEmail(body.clientEmail, env);
  if (!target) return json({ error: 'Client not found' }, 404);

  const db = sb(env);
  const engRows = await db.select('engagements', `client_id=eq.${target.id}&select=*`);
  const eng = engRows[0] || { client_id: target.id, signoffs: {}, payments: [] };

  if (body.action === 'propose') {
    await db.upsert('engagements', {
      client_id: target.id,
      focus: body.focus || eng.focus || 'unsure',
      price: body.price || null,
      state: 'proposal'
    }, 'client_id');
    return json({ ok: true, state: 'proposal' });
  }

  if (body.action === 'deliver') {
    await db.upsert('engagements', { client_id: target.id, state: 'step1_delivered' }, 'client_id');
    return json({ ok: true, state: 'step1_delivered' });
  }

  if (body.action === 'signoff') {
    const kind = body.kind === 'handover' ? 'handover' : 'connection';
    const signoffs = Object.assign({}, eng.signoffs, { [kind]: true });
    await db.upsert('engagements', { client_id: target.id, signoffs }, 'client_id');
    return json({ ok: true, signoffs });
  }

  if (body.action === 'mark-paid') {
    const stage = body.stage;
    if (!STAGE_NEXT[stage]) return json({ error: 'Unknown stage' }, 400);
    // Server-authoritative amount (dollars, matching the webhook). Never trust a
    // client-supplied figure; allow an override only with an explicit reason.
    const intakeRows = await db.select('intakes', `client_id=eq.${target.id}&select=payload`);
    const intake = intakeRows[0] || { payload: {} };
    let amount = Math.round(amountForStage(stage, eng, intake) / 100);
    if (body.amountOverride != null && body.reason) amount = Number(body.amountOverride) || 0;
    await db.insert('payments', { client_id: target.id, stage, amount, stripe_session_id: 'manual-' + Date.now() });
    const payments = (eng.payments || []).concat([{ stage, amount, date: new Date().toISOString().slice(0, 10) }]);
    await db.upsert('engagements', { client_id: target.id, state: STAGE_NEXT[stage], payments }, 'client_id');
    return json({ ok: true, state: STAGE_NEXT[stage] });
  }

  return json({ error: 'Unknown action' }, 400);
}

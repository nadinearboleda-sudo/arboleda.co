// POST /api/intake  { intent, name, email, company, headcount, role, industry,
//                     goal, kpis[], systems[], otherSystems, pain }
// No auth — public lead capture. Emails the new intake to the team via Resend.
// Best-effort: the client also stores the intake locally and never blocks on this call.
// Env vars (Cloudflare → Pages → Settings → Environment variables):
//   RESEND_API_KEY      Resend API key (server-only)
//   LEAD_NOTIFY_TO      where leads are sent, e.g. you@arboleda.co
//   LEAD_NOTIFY_FROM    a verified Resend sender, e.g. "arboleda <leads@arboleda.co>"
import { json } from '../_shared.js';

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export async function onRequestPost({ request, env }) {
  let d;
  try { d = await request.json(); } catch (e) { return json({ error: 'Bad JSON' }, 400); }
  if (!d || typeof d !== 'object') return json({ error: 'Bad payload' }, 400);

  // Minimal validation — need at least an email or a name to be worth notifying.
  const email = (d.email || '').toString().trim();
  const name = (d.name || '').toString().trim();
  if (!email && !name) return json({ error: 'Name or email required' }, 400);
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: 'Invalid email' }, 400);

  // Without a configured key we can't send — succeed quietly so local/preview
  // (and any transient outage) never breaks the intake flow.
  if (!env.RESEND_API_KEY || !env.LEAD_NOTIFY_TO || !env.LEAD_NOTIFY_FROM) {
    return json({ ok: true, delivered: false });
  }

  const rows = [
    ['Intent', d.intent], ['Name', name], ['Email', email], ['Company', d.company],
    ['Headcount', d.headcount], ['Role', d.role], ['Industry', d.industry], ['Goal', d.goal],
    ['KPIs', Array.isArray(d.kpis) ? d.kpis.join(', ') : d.kpis],
    ['Systems', Array.isArray(d.systems) ? d.systems.join(', ') : d.systems],
    ['Other systems', d.otherSystems], ['Pain', d.pain]
  ];
  const text = rows.map(([k, v]) => `${k}: ${v == null || v === '' ? '—' : v}`).join('\n');
  const html = '<h2>New intake — arboleda.co</h2><table cellpadding="6" style="border-collapse:collapse">'
    + rows.map(([k, v]) =>
        `<tr><td style="vertical-align:top;color:#666"><strong>${esc(k)}</strong></td><td>${esc(v == null || v === '' ? '—' : v)}</td></tr>`
      ).join('')
    + '</table>';

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: 'Bearer ' + env.RESEND_API_KEY, 'content-type': 'application/json' },
    body: JSON.stringify({
      from: env.LEAD_NOTIFY_FROM,
      to: env.LEAD_NOTIFY_TO,
      reply_to: email || undefined,
      subject: `New intake: ${name || email || 'unknown'}${d.company ? ' — ' + d.company : ''}`,
      text,
      html
    })
  });
  if (!r.ok) {
    // Don't leak provider detail to the browser; the client treats this as best-effort.
    return json({ ok: false, delivered: false }, 502);
  }
  return json({ ok: true, delivered: true });
}

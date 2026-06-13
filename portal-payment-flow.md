# Portal Plan — Payment Gates & Deliverable Unlocks

The principle stays: **free until the audit, then two buying decisions only** (Step 1 audit, Step 2 build). Payment never gates the client's own inputs (brief, discovery) — only arboleda's outputs.

## 1. The state machine

```
visitor → intake_done → discovery_done → call_booked → proposal_sent
   → step1_paid (audit running) → step1_delivered (deliverables unlocked)
   → step2_proposed → step2_paid → step2_milestone_1..3 → care_plan
```

Portal status row evolves with state:

| State | Status chips |
|---|---|
| discovery_done | ✓ Intake · ✓ Discovery · **Audit call** · Proposal |
| proposal_sent | … · ✓ Call · **Proposal — accept & pay** |
| step1_paid | … · ✓ Paid · **Audit in progress (day x of 15)** |
| step1_delivered | … · ✓ Audit delivered · **Step 2 proposal ready** |
| step2_paid | … · **Build — milestone 1 of 3** |

## 2. Payment gates

**Gate 1 — the audit (first dollar).**
After the call, a "Your fixed-price proposal" card appears in the portal: scope summary pulled from the brief, price from the headcount band, terms.

| Headcount | Audit price |
|---|---|
| Under 50 | $4–6k |
| 50–150 | $7.5–10k |
| 150–300 | $12–15k |
| 300–500+ | $15–25k |

- 50% deposit unlocks: audit kickoff, **Deliverables** sidebar section (in-progress view), working documents as they're produced (draft process map visible early — builds trust).
- 50% balance at the executive readout unlocks: final deliverables (download + portal view).
- **Credit-back**: 100% of the audit fee credits against Step 2 if signed within 90 days. Shown on the proposal card and repeated on the Step 2 proposal ("$8,500 already paid → applied").

**Gate 2 — Step 2 build.**
The audit's final deliverable *is* the Step 2 proposal (scope, connector list, price, milestones). Milestone billing 40/40/20:

- 40% on signing → unlocks **Milestone 1: Connect** (read-only connections via Merge/agentic layer, data-quality report)
- 40% at connection sign-off → unlocks **Milestone 2: Build** (ontology / decision view / automations in staging, demo access)
- 20% at handover → unlocks **Milestone 3: Deliver** (production cutover, runbooks, training, care-plan offer)

## 3. Key deliverables (what unlocks, per focus)

| | Step 1 (audit) — unlocks at readout | Step 2 (build) — unlocks per milestone |
|---|---|---|
| **Alchemy** | Ops Automation Audit: 10–15 processes scored, top-5 wins with hours/$ quantified, prioritised roadmap, exec readout deck | M1 connection + data report · M2 agentic automations in staging + automation spec · M3 live automations, runbooks, training |
| **Aurora** | AI readiness scorecard, governance pack, 90-day plan, draft metric catalogue | M1 connection + data report · M2 decision-intelligence proposal: KPI definitions with lineage + live dashboards in staging · M3 production decision view + board pack template |
| **Anatomy** | Current-state systems map, target architecture, integration plan (+ vendor criteria if relevant) | M1 connection via Merge + data report · M2 business data ontology + architecture blueprint · M3 integration runbook + handover |

Locked deliverables are **visible but locked** — card with title, one-line description, lock icon, and what unlocks it ("Unlocks at milestone 2"). Seeing the named deliverable is the strongest reason to pay the next milestone.

## 4. Portal UX changes

1. **Proposal card** (new, appears post-call): scope from brief, price, terms, credit-back note, "Accept & pay deposit" → checkout.
2. **Deliverables section** (currently a locked sidebar stub): becomes a card grid; each card = deliverable with state locked / in-progress / ready (view + PDF). ROI reports stay locked until care plan.
3. **Roadmap rows** gain price + payment state per step (focus-aware, as now).
4. **Receipts/terms**: simple payments list under the proposal card.

## 5. Implementation phases

**Phase A — prototype (no backend, buildable now):**
- `arboleda-engagement` in localStorage: `{state, focus, price, payments[], milestone}`
- Fake checkout page `/pay?stage=audit|m1|m2|m3` (brand-styled, "Pay $X" button) that advances state — demonstrates the full flow end-to-end
- Deliverables grid with lock states; sample deliverables rendered as report.html variants watermarked "SAMPLE"
- An admin-ish dev toggle (querystring `?state=`) to demo any stage

**Phase B — real (needs backend):**
- Stripe Payment Links or Checkout per stage; webhook flips the state flag
- Real auth (the current login is cosmetic) — magic-link email is enough
- Deliverables as actual files (signed URLs) + generated portal views
- Invoice/receipt emails; Xero invoice sync (eat the dog food)

## 6. Guardrails

- Never gate the brief or discovery answers — their data stays theirs.
- Watermarked samples of every deliverable type visible pre-payment (show the shape, not the substance — same logic as Step 0 reports).
- One refund rule, stated plainly: deposit refundable until kickoff; balance only due if the readout happens.
- Credit-back expiry (90 days) is the only urgency mechanism — no fake countdowns.

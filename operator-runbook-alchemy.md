# Operator Runbook — Audit Call → Automation Deliverable (Alchemy)

End state: agentic automations specified and built with measured ROI, autonomy tiers matched to the client's appetite, human-in-the-loop checkpoints where judgement lives, exception playbooks, and readiness appendices for Anatomy and Aurora.

**Where it lands:** Step 1 audit = processes measured + roadmap; the build needs connections → Step 2 M1 (connect + observe) and M2 (specify + build in staging), M3 (production cutover).

---

## Phase A — Post-call setup (days 0–2)

| # | Step | Output |
|---|------|--------|
| A1 | Re-read the brief: picked processes + claimed hours, autonomy appetite, approval thresholds | Scope confirmation |
| A2 | Collect read-only access per system; confirm AI policy status (from discovery) — if none exists, supply the one-page template | Access register + policy status |
| A3 | Sub-processor consent (agentic layer, LLM provider); data-residency check against discovery answer | Signed consent |
| A4 | Collect the approval matrix: who can approve what dollar value, today, in writing | Approval matrix v0 |
| A5 | Book process walkthroughs (30 min × top 3 processes, with the person who actually does the work — not their manager) | Calendar holds |

## Phase B — Connect & observe (week 1) → M1

| # | Step | Output |
|---|------|--------|
| B1 | Connect systems read-only; log granted scopes | Connection log |
| B2 | **Measure the processes** — from system timestamps: volumes/month, cycle times, touch counts per process (replaces the claimed hours with measured ones) | Process baseline table |
| B3 | **Exception-rate measurement** — % of instances that deviate from the happy path, and the top 5 deviation reasons | Exception profile per process |
| B4 | **Attribute touchpoint map** — every field each process reads/writes, across systems | Touchpoint matrix (the safety basis) |
| B5 | Current-automation inventory (Zapier/Power Automate/macros): what exists, what breaks, what it costs | Existing-automation register |
| B6 | Walkthroughs from A5: capture the undocumented judgement calls — these become HITL checkpoints | Judgement log |

**M1 gate (connection sign-off):** data-quality + process baseline report = B2–B6. Milestone 2 unlocks.

## Phase C — Specify (week 2)

| # | Step | Output |
|---|------|--------|
| C1 | **Automation spec per process**: trigger, steps, systems touched, data in/out, guardrails, rollback | Spec sheet per automation |
| C2 | **Autonomy tiering** — map each automation to the client's appetite: human-approves-each-run / exceptions-only / fully-automated; never above their stated tier in v1 | Autonomy column, ratified |
| C3 | **HITL checkpoint design** — from the judgement log + approval matrix: exactly where a human decides, what they see, how they approve | Checkpoint design per automation |
| C4 | **Measured ROI per automation** — baseline hours (B2) × loaded cost vs build + run cost; payback per automation | ROI table (measured, not estimated) |
| C5 | Prioritised build order: ROI × risk × dependency; client signs the order | Build plan v1.0 |

## Phase D — Build in staging (weeks 2–3) → M2

| # | Step | Output |
|---|------|--------|
| D1 | Build agentic workflows (LangChain or equivalent) against staging/sandbox; replay historical data through them | Staging automations |
| D2 | **Acceptance tests** — for each automation: happy path + the top 5 exceptions from B3 must behave per spec | Test log |
| D3 | **Exception playbooks** — what the human sees when the automation punts, and what they do | Playbook per automation |
| D4 | Monitoring & alerting: run logs, failure alerts, weekly digest; define "automation health" metrics | Monitoring design |
| D5 | Demo on their data; client signs acceptance criteria per automation | Acceptance sign-off |

## Phase E — Cutover & next-phase prep (week 3–4) → M3

| # | Step | Output |
|---|------|--------|
| E1 | Production cutover, one automation at a time, rollback ready; first week supervised | Live automations |
| E2 | Runbooks + training for the owning team; ownership named per automation | Handover pack |
| E3 | Baseline the care-plan metrics: hours saved/month, exception rate, automation health | ROI baseline (feeds quarterly ROI report) |
| E4 | **Anatomy preparation** — integration debt the build surfaced (re-keying eliminated, but spine gaps remain documented) | Anatomy readiness appendix |
| E5 | **Aurora preparation** — metrics now feedable from automated flows (clean, timestamped process data) | Aurora readiness appendix |

## Deliverable structure

1. Executive summary + as-at date and version
2. Process baselines — measured volumes, cycle times, hours (not claims)
3. Exception profiles + judgement log
4. Automation specifications (trigger → steps → guardrails → rollback)
5. Autonomy tiers (ratified against client appetite)
6. HITL checkpoint designs + approval matrix
7. Measured ROI per automation + payback
8. Acceptance test results · 9. Exception playbooks · 10. Monitoring & health metrics
11. Runbooks & ownership
12. Anatomy readiness appendix · 13. Aurora readiness appendix

## Cadence (typical 3-automation build)

Week 1: A + B (≈3 days) · Week 2: C + spec sign-off (≈2.5 days) · Weeks 2–3: D (≈4 days) · Week 3–4: E cutover (≈2 days). Client time: 3 walkthroughs + spec review + acceptance ≈ 5 hours.

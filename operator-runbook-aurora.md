# Operator Runbook — Audit Call → Decision-Intelligence Deliverable (Aurora)

End state: a ratified metric catalogue (definitions, formulas, lineage, owners), reconciled numbers computed two ways, live dashboards in staging, and readiness appendices for Anatomy and Alchemy.

**Where it lands:** Step 1 audit = readiness scorecard + draft catalogue; attribute-level metric work needs connections → Step 2 M1 (connect + inventory) and M2 (define + build). The M2 readout *is* the decision-intelligence proposal, with live numbers.

---

## Phase A — Post-call setup (days 0–2)

| # | Step | Output |
|---|------|--------|
| A1 | Re-read the brief: which metrics they can't answer confidently, reports that exist today, hours/month spent assembling them | Scope confirmation |
| A2 | Collect read-only access per system + a copy of the current board pack / management P&L (the artefact to beat) | Access register + baseline pack |
| A3 | Sub-processor consent; confirm BI licences already owned (Power BI/Tableau/none) | Tooling decision |
| A4 | Harvest the definition conflicts: "the two metrics people argue about" — get each camp's version in writing | Conflict register, both definitions verbatim |
| A5 | Book two workshops: metric definitions (C-end) and readout (E) | Calendar holds |

## Phase B — Connect & inventory (week 1) → M1

| # | Step | Output |
|---|------|--------|
| B1 | Connect systems read-only via the integration layer; log granted scopes | Connection log |
| B2 | **Metric-source inventory** — for each candidate KPI: the exact source objects and attributes it needs, per system | KPI × attribute matrix |
| B3 | **Input quality & freshness** — fill rate, staleness and update cadence for every attribute feeding a metric | Quality flags per KPI input |
| B4 | **Reporting inventory** — every recurring report/workbook: source, owner, hours/month, who consumes it | Report register (the automation candidates for Alchemy later) |
| B5 | Computability triage: each KPI → computable now / after fixes / not yet (and the missing piece) | Readiness map v1 |

**M1 gate (connection sign-off):** data-quality report = B2–B5. Client confirms; milestone 2 unlocks.

## Phase C — Define & reconcile (week 2)

| # | Step | Output |
|---|------|--------|
| C1 | **Metric definition catalogue** — per KPI: formula, source attributes, grain, refresh cadence, exclusions, owner | Definition catalogue draft |
| C2 | **Two-way reconciliation** — compute each headline metric two independent ways (e.g. ARR from billing vs from CRM); document variance and its cause | Reconciliation log — the trust artefact |
| C3 | Resolve the definition conflicts from A4 with evidence (show both versions computed; recommend one) | Decision memo per conflict |
| C4 | **Definitions workshop** (60–90 min): ratify formulas, owners, exclusions; leadership signs the catalogue | Ratified catalogue v1.0, dated |
| C5 | Benchmark targets per KPI (industry ranges from the content library + their goal) | Target column in the catalogue |

## Phase D — Build the decision view (week 2–3) → M2

| # | Step | Output |
|---|------|--------|
| D1 | Build dashboards in staging on their BI stack: board pack, unit economics, forecast inputs | Staging decision view |
| D2 | **Lineage per tile** — every number traceable: tile → metric → attributes → source fields | Lineage graph (extends the spine graph) |
| D3 | Commentary workflow: where humans annotate, who, when (commentary is the only manual step left) | Commentary SOP |
| D4 | Access model: who sees what (board vs exec vs team views); sensitive metrics flagged | Access proposal |
| D5 | Parallel-run one cycle: new view vs old pack; reconcile every divergence | Parallel-run log |

## Phase E — Readout & next-phase prep (week 3)

| # | Step | Output |
|---|------|--------|
| E1 | Assemble deliverable (structure below), version + as-at date | Decision-intelligence pack v1.0 |
| E2 | **Anatomy preparation** — every spine gap that surfaced (join failures, duplicate sources, ownerless attributes) | Anatomy readiness appendix |
| E3 | **Alchemy preparation** — the report register (B4) priced: hours × loaded cost per report; automation candidates ranked | Alchemy readiness appendix |
| E4 | Readout with live, reconciled numbers; capture decisions | Signed-off deliverable |
| E5 | Feed E2/E3 into the next-phase proposal | Next-phase scope |

## Deliverable structure

1. Executive summary + as-at date and version
2. Metric definition catalogue (ratified): formula, sources, grain, owner, refresh, exclusions
3. Reconciliation log — every headline number computed two ways
4. Definition-conflict decisions (the arguments, settled with evidence)
5. KPI readiness map: computable now / after fixes / not yet
6. Decision view: dashboard set + lineage per tile
7. Commentary & ownership model
8. Access model
9. Benchmark targets
10. Anatomy readiness appendix · 11. Alchemy readiness appendix

## Cadence (typical 4-system client)

Week 1: A + B (≈3 days) · Week 2: C + definitions workshop (≈3 days) · Week 3: D + parallel run + E (≈3 days). Client time: two workshops + one parallel-run review ≈ 4 hours.

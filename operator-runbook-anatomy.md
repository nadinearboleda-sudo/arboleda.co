# Operator Runbook — Audit Call → Attribute-Level Anatomy Deliverable

What has to happen, in order, for the deliverable to contain: attribute-level analysis, survivorship rules, human-in-the-loop mismatch queue, company + suggested glossary, data ontology, lineage & value-chain graph, freshness dates, access-control review, duplicate systems, resolved entities, and Aurora/Alchemy preparation.

**Where it lands in the engagement:** the audit (Step 1) produces the *category-level* map and this plan; the attribute-level work requires connections, so it spans Step 2 M1 (connect + profile) and M2 (resolve + ratify). The readout of M2 *is* the ontology deliverable.

---

## Phase A — Post-call setup (days 0–2)

| # | Step | Output |
|---|------|--------|
| A1 | Re-read the brief: systems, owners, join-keys answer, volumes, data rules | Scope confirmation note |
| A2 | Collect read-only access per system (per-tool checklist from the brief: Xero adviser invite, restricted Stripe key, view-only roles) | **Access register**: system, credential type, scope, granted-by, date |
| A3 | Sub-processor consent (Merge/agentic layer) + security questionnaire if flagged in discovery | Signed consent on file |
| A4 | Sandbox vs production decision per system (from discovery answer) | Connection plan |
| A5 | Book the two workshops now: glossary (B-end) and survivorship ratification (C-end) | Calendar holds with named attendees |

## Phase B — Connect, extract, profile (week 1) → M1

| # | Step | Output |
|---|------|--------|
| B1 | Connect each system read-only via the unified API layer; log scopes actually granted vs requested | Connection log |
| B2 | Pull full schema + sampled records per object | Raw extracts (masked PII at rest) |
| B3 | **Attribute inventory** — per system × object × field: name, type, fill rate, distinct count, example values (masked) | The attribute-level backbone (workbook, one row per attribute) |
| B4 | **Freshness analysis** — per attribute: last-updated distribution, % stale >12 months; per object: latest record date | "Date of latest update" columns + staleness flags |
| B5 | **Access-control extract** — users, roles, permission levels per system; flag admin sprawl, ex-staff accounts, shared logins | Access-control findings table |
| B6 | **Duplicate-systems matrix** — capability × system grid; highlight where two systems both hold the same object class (e.g. invoices in both PSA and accounting) | Overlap heatmap + recommendation per overlap (keep / merge / kill) |
| B7 | PII / sensitivity classification per attribute (public / internal / sensitive / regulated) | Sensitivity column in the inventory |

**M1 gate (connection sign-off):** data-quality report = B3–B7 summarised. Client confirms; milestone 2 payment unlocks.

## Phase C — Resolve entities & catalogue mismatches (week 2)

| # | Step | Output |
|---|------|--------|
| C1 | **Entity resolution**, per master entity (customer, employee, project, item): deterministic pass (ABN, email, domain, invoice refs) → fuzzy pass (name similarity + co-occurring attributes) | **Resolved-entity register**: canonical ID, source records, match confidence (exact / high / review) |
| C2 | **Mismatch catalogue** — for each resolved entity, attribute-level conflicts (same customer, three payment terms; two trading names) | Mismatch table: entity, attribute, values by source, proposed resolution |
| C3 | Classify each mismatch: **auto-resolvable** (survivorship rule applies) vs **human-in-the-loop** (business judgement needed) | HITL queue — the explicit list the client must decide, with a recommended default each |
| C4 | **Survivorship matrix** — per canonical attribute: source precedence + rationale + freshness tiebreaker (e.g. billing email: Stripe > Xero > CRM, most-recent-wins on tie) | Draft rules, default set + flagged exceptions |
| C5 | Low-confidence matches → sample review with system owners (async, 30 min each) | Confidence upgraded or split |

## Phase D — Define & ratify (week 2–3)

| # | Step | Output |
|---|------|--------|
| D1 | **Glossary workshop** (60–90 min): harvest the company's actual words (what do you call clients/jobs/agreements; where do definitions disagree — the two metrics people argue about, from discovery) | **Company glossary**: term, their definition, where it's used, where it conflicts |
| D2 | **Suggested glossary** — canonical term per concept, mapped to company synonyms; flag terms to retire | Suggested glossary with adoption notes |
| D3 | **Ontology draft** — master entities, canonical attributes (name, type, owner system, sensitivity, survivorship rule), relationships between entities | The data ontology document |
| D4 | **Lineage & value-chain graph** — source field → canonical attribute → consumers (reports, metrics, automations), each attribute tagged to its value-chain link (sell / deliver / bill / pay / close / decide) | Graph (rendered) + machine-readable edges |
| D5 | **Access-control recommendations** — per master record & sensitivity class: who reads, who writes, what gets revoked | Access model proposal |
| D6 | **Survivorship ratification workshop** (60 min): walk the HITL queue + draft rules; client decides, owners are named per master record | Ratified rules + decision log |

## Phase E — Package, readout, prepare the next phases (week 3) → M2

| # | Step | Output |
|---|------|--------|
| E1 | Assemble the deliverable (structure below) | Ontology pack v1.0, dated |
| E2 | **Aurora preparation** — metric-readiness map: for each candidate KPI, which canonical attributes it needs and their quality/freshness today → computable now / after fixes / not yet | Aurora readiness appendix |
| E3 | **Alchemy preparation** — automation-safety map: for each candidate process, the attributes it touches, their mismatch rate, and where HITL checkpoints must sit | Alchemy readiness appendix |
| E4 | Readout to leadership; capture decisions; version and date-stamp everything | Signed-off deliverable |
| E5 | Feed E2/E3 into the next-phase proposal (the journey's "recommended next") | Step 2/next-phase scope |

---

## Deliverable structure (the table of contents the client receives)

1. Executive summary + **as-at date and version**
2. Attribute inventory (per system × object × field, with fill, freshness, sensitivity)
3. Resolved-entity register + match confidence
4. Mismatch catalogue + **human-in-the-loop queue** (decisions made, decisions pending)
5. Survivorship matrix (ratified)
6. Glossary — company definitions + suggested canonical glossary
7. Data ontology (entities, attributes, owners, relationships)
8. Lineage & value-chain graph
9. Access control: findings + recommended model
10. Duplicate systems: overlap matrix + keep/merge/kill recommendations
11. Aurora readiness appendix (metrics computable now / after fixes)
12. Alchemy readiness appendix (processes safe to automate / HITL points)

## Operator tooling (Phase B prototype)

- Extraction: Merge unified API (accounting, CRM, HRIS categories) + native APIs where Merge lacks coverage (Productive, HaloPSA)
- Profiling: Python + DuckDB over extracts (fill, distincts, freshness percentiles)
- Entity resolution: deterministic SQL passes + Splink (or rapidfuzz) for fuzzy; thresholds: ≥0.95 auto, 0.80–0.95 review, <0.80 no-match
- Graphs: the existing spine/lineage SVG generators extend to attribute level
- Everything versioned in one client repo; PII masked at extract, never in the deliverable

## Cadence & effort (typical 4-system client)

Week 1: A + B (≈3 days effort) · Week 2: C (≈3 days) + D workshops · Week 3: D finalise + E (≈2 days). Two client workshops + two async owner reviews — about 4 hours of their time total.

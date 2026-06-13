# Portal Plan — Variable Step 0 Reports

**Decisions locked:** pre-authored content library (no backend) · industry/goal/KPI questions added to intake Step 2.

## 1. Concept

Intake selections drive a personalized Step 0 in the portal: three report previews (one per practice), assembled from a pre-authored content library keyed by the user's stack, industry, and goals. Each preview exports as a 1–2 page PDF. Mid-level depth: real insight about *their tools*, generic about *their data* — the pitch for Step 1 is "connect your data and this becomes yours."

## 2. Intake changes (start.html)

**Step 2 (About your company) — add:**

| Field | Type | Values |
|---|---|---|
| Industry | select | SaaS / Tech services / Professional services / Healthcare / Construction / Retail & ecommerce / Other |
| Top goal (12 months) | select | Faster close / Raise capital / Margin visibility / Scale without headcount / Systems consolidation |
| KPIs that matter most | checkboxes | ARR & churn / Cash & runway / Project margin / Utilisation / Close duration / CAC & pipeline |

**Step 3 (Your systems) — replace "A PSA tool" with:**
- ☐ Productive
- ☐ Kantata

Final tool list: Xero, HubSpot, Employment Hero, Productive, Kantata, Other ERP, Mostly spreadsheets.

**Persistence:** save all intake answers to `localStorage` as `arboleda_intake` `{ name, company, industry, goal, kpis[], systems[], pain }`. Portal reads this on load; falls back to current static cards if absent.

## 3. Content library (new `report-content.js`)

One researched **data-model block per tool** (shared by all three reports):

| Tool | Core objects to document |
|---|---|
| Xero | Contacts, Invoices, Bills, Payments, Journals, Bank Transactions, Tracking Categories, Reports API |
| HubSpot | Companies, Contacts, Deals, Pipelines, Line Items, Quotes, Tickets, Associations |
| Employment Hero | Employees, Pay Runs, Leave, Timesheets, Onboarding checklists |
| Productive | Projects, Budgets, Services, Time Entries, Bookings, Invoices, Profitability fields |
| Kantata | Projects, Tasks, Time & Expense, Resource Plans, Rate Cards, Invoices, Insights API |
| Other ERP | Generic GL/AP/AR/inventory pattern + "native workflow features you already pay for" |
| Spreadsheets | Treated as risk/migration-source block, not a system block |

Each tool block: ~120 words — key entities, what links well, known integration edges (e.g. Productive↔Xero invoice sync, HubSpot deal→invoice handoff).

**Per-service proposal blocks** (selected by industry + goal + KPIs):

- **Anatomy** — unified data-model proposal: entity map showing how the selected tools' objects join into one spine (Customer, Project, Invoice, Employee as master entities), who should own each, 2–3 integration moves. Industry variant adjusts the master-entity emphasis (e.g. Project-centric for services, ARR-centric for SaaS).
- **Aurora** — key metrics catalogue: 8–10 metrics derivable *from their selected stack*, each with source objects, formula sketch, and why it matters for their stated goal/KPIs. Flag metrics currently impossible with their stack (gap = Step 1 hook).
- **Alchemy** — top 10 process use cases ranked for their stack + industry: name, systems touched, typical hours saved range, complexity (Low/Med/High). Generic effort ranges only — no client numbers.

Library size: 7 tool blocks + ~6 industry variants × 3 services. All static JS/JSON, versionable in the repo.

## 4. Portal changes (portal.html)

- **Step 0 rebuilt as three service report cards** (Anatomy / Aurora / Alchemy), each showing: a rendered preview (first section visible, rest faded), "Download PDF" button, and a "This is the generic version — Step 1 connects your data" banner.
- Renderer composes: intro (name/company/industry interpolated) → data-model summaries for selected tools only → service proposal block → next-step CTA.
- Tool cards from the current design remain as the compact summary row above the reports.

## 5. PDF generation

Print-stylesheet approach, zero dependencies:
- Each report renders into a hidden `/report` view with `@media print` CSS (A4, brand header, page numbers, 1–2 pages enforced by content budget).
- "Download PDF" opens it and triggers `window.print()`. Works offline, no backend, no library.
- (Optional later: html2pdf.js from CDN for a true one-click .pdf file.)

## 6. Depth calibration (lead-magnet guardrails)

**In:** named entities/objects per tool, integration edges, metric formulas in sketch form, process names with generic effort ranges, industry-level framing.
**Out (reserved for Step 1):** their actual data, reconciled numbers, scored/prioritised roadmap, dollar estimates specific to them, dashboards, implementation sequencing.
Every report footer: *"Built from your stack selection — not yet your data. The Ops Audit connects both."*

## 7. Build sequence

1. Intake: new fields + Productive/Kantata + localStorage persistence (small)
2. Research + write content library: 7 tool data-model blocks, 3 × proposal blocks with industry variants (the bulk of the work)
3. Portal Step 0 renderer + fallback (medium)
4. Print/PDF view + stylesheet (small)
5. QA: every tool combo renders sanely, 1–2 page budget holds, empty-selection fallback

## 8. Open items

- "Other ERP" free-text capture (which ERP?) — improves the generic block cheaply
- Email capture of the PDF (needs a form backend later — Netlify Forms/Formspree)
- Analytics on which reports get downloaded (signal for sales follow-up)

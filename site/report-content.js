/* arboleda.co — Step 0 report content library + generators.
   Pure data + pure functions: no DOM. Used by portal.html and report.html,
   and testable in Node (module.exports at bottom). */
(function (root) {
  'use strict';

  /* ---------------------------------------------------------------- tools */
  var TOOLS = {
    'Xero': {
      category: 'Accounting',
      summary: 'Xero is the financial system of record. Its core objects — Contacts, Invoices, Bills, Payments, Manual Journals and Bank Transactions — hang off the Chart of Accounts, with Tracking Categories providing the two dimensions most SMBs use for department or project splits. Almost everything reconciles back to the bank feed, which makes Xero the natural anchor for any unified model: other systems should write into it (invoices, payroll journals) rather than copy out of it.',
      entities: [
        ['Contacts', 'customers & suppliers — the master "who"'],
        ['Invoices / Bills', 'AR and AP documents, line-level accounts'],
        ['Payments & Bank Transactions', 'cash truth via bank feeds'],
        ['Manual Journals', 'the entry point for payroll & accrual automation'],
        ['Tracking Categories', 'two free dimensions — dept, project, location'],
        ['Reports API', 'P&L, balance sheet, aged AR/AP pulled programmatically']
      ],
      feeds: { customer: 'Contacts', invoice: 'Invoices & Payments', gl: 'Chart of Accounts + Journals' }
    },
    'HubSpot': {
      category: 'CRM',
      summary: 'HubSpot holds the commercial pipeline. Companies, Contacts and Deals are linked through a flexible Associations model; Deals carry Line Items and move through Pipelines with stage history, which is what makes conversion and velocity reporting possible. Quotes and Tickets extend it toward order capture and service. The single most valuable integration move is making a won Deal trigger downstream objects — a Xero invoice, a Productive budget or a Kantata workspace — so revenue never gets re-keyed.',
      entities: [
        ['Companies & Contacts', 'the commercial "who" — must map 1:1 to Xero Contacts'],
        ['Deals & Pipelines', 'value, stage history, close dates — forecast inputs'],
        ['Line Items & Quotes', 'what was actually sold, at what price'],
        ['Tickets', 'service issues — a churn early-warning signal'],
        ['Associations', 'the glue: any object linked to any other']
      ],
      feeds: { customer: 'Companies & Contacts', invoice: 'Deals & Line Items (source of)', project: 'Won Deals (trigger)' }
    },
    'Employment Hero': {
      category: 'HR & payroll',
      summary: 'Employment Hero is the people system of record: Employees with employment history and cost data, Pay Runs, Leave, Timesheets and Onboarding checklists. Two integration edges matter most. Pay run journals should post to the accounting GL automatically — payroll is usually the largest cost line and the most re-keyed. And leave/timesheet data should feed whatever plans capacity (Productive, Kantata or a spreadsheet), because utilisation numbers are fiction if they ignore approved leave.',
      entities: [
        ['Employees', 'the master "who works here", with cost rates'],
        ['Pay Runs', 'gross-to-net detail — source of payroll journals'],
        ['Leave & Timesheets', 'the capacity signal for resource planning'],
        ['Onboarding checklists', 'workflow objects worth automating end-to-end']
      ],
      feeds: { employee: 'Employees & Pay Runs', gl: 'Payroll journals (source of)' }
    },
    'Productive': {
      category: 'PSA',
      summary: 'Productive is an agency/consultancy operating system with an unusually clean financial chain: an Invoice attributes back to a Budget, the Budget is made of Services, and Services collect Time Entries — so every invoiced dollar traces to logged hours. Deals convert to Budgets on win, Bookings allocate people forward, and built-in profitability fields give project margin without spreadsheet work. The integration that pays first: Productive invoices syncing to Xero, and HubSpot deals (if both exist) handing off to Productive deals/budgets.',
      entities: [
        ['Projects & Budgets', 'the financial plan per engagement'],
        ['Services', 'the work lines — pricing and delivery meet here'],
        ['Time Entries', 'hours against services — the cost driver'],
        ['Bookings', 'forward allocation — utilisation & capacity'],
        ['Invoices', 'attribute to budgets → services → time'],
        ['Deals', 'pipeline that converts into budgets on win']
      ],
      feeds: { project: 'Projects, Budgets & Services', employee: 'Bookings & Time Entries', invoice: 'Invoices (sync to accounting)' }
    },
    'Kantata': {
      category: 'PSA',
      summary: 'Kantata (OX) models delivery as Workspaces containing Stories — tasks, milestones and issues that carry both planning and financial attributes. Time Entries and Expenses log against Stories; Allocations and Resource Plans manage who works on what; Rate Cards and Cost Rates turn hours into revenue and cost, giving margin per workspace. Its Insights reporting is strong, but the data should still land in one warehouse/BI layer with finance data, and invoices should export to accounting rather than live in two places.',
      entities: [
        ['Workspaces', 'projects — the unit of delivery and margin'],
        ['Stories', 'tasks/milestones with planning + financial attributes'],
        ['Time Entries & Expenses', 'effort and cost against stories'],
        ['Allocations & Resource Plans', 'forward capacity and demand'],
        ['Rate Cards & Cost Rates', 'bill and cost rates per role'],
        ['Invoices', 'billing — export to the accounting GL']
      ],
      feeds: { project: 'Workspaces & Stories', employee: 'Allocations & Time Entries', invoice: 'Invoices (export to accounting)' }
    },
    'MYOB': {
      category: 'Accounting',
      summary: 'MYOB (Business / AccountRight) is the other half of the Australian SMB accounting market. Cards (contacts), Invoices, Bills, Banking and Journals hang off the chart of accounts, with Jobs and Categories as the costing dimensions. The same anchor principle applies as with Xero: MYOB should receive postings (payroll journals, sales invoices) from upstream systems rather than have data re-keyed into it — and its reporting should be pulled programmatically, not exported monthly.',
      entities: [
        ['Cards', 'customers & suppliers — the master "who"'],
        ['Invoices / Bills', 'AR and AP documents, line-level accounts'],
        ['Banking & Reconciliation', 'cash truth via bank feeds'],
        ['Journals', 'entry point for payroll & accrual automation'],
        ['Jobs & Categories', 'costing dimensions — project, dept, location']
      ],
      feeds: { customer: 'Cards', invoice: 'Invoices & Payments', gl: 'Chart of Accounts + Journals' }
    },
    'NetSuite': {
      category: 'ERP',
      summary: 'NetSuite is the upper-mid-market ERP: Entities (customers, vendors), Transactions (sales orders, invoices, journals), Items and Subsidiaries in one ledger, with SuiteAnalytics and saved searches for programmatic reporting and SuiteFlow for native approvals. Most NetSuite accounts use a fraction of what they pay for — approval workflows, recurring journals, saved-search alerts. The unified-model job is keeping NetSuite the financial spine while CRM, billing and people systems write into it cleanly.',
      entities: [
        ['Entities', 'customers & vendors across subsidiaries'],
        ['Transactions', 'sales orders, invoices, journals — the GL feed'],
        ['Items & Price Levels', 'what is sold, at what price'],
        ['Subsidiaries', 'multi-entity consolidation built in'],
        ['SuiteAnalytics / Saved Searches', 'programmatic reporting'],
        ['SuiteFlow', 'native approval & workflow engine — often unused']
      ],
      feeds: { customer: 'Entities', invoice: 'Transactions (AR)', gl: 'General Ledger' }
    },
    'Salesforce': {
      category: 'CRM',
      summary: 'Salesforce holds the commercial pipeline for mid-market teams: Accounts and Contacts linked to Opportunities with full stage history, Products and Price Books defining what was sold, Cases carrying service signals. Reports and flows are powerful but often sprawl. The highest-value integration move mirrors HubSpot: a closed-won Opportunity should trigger downstream objects — an invoice, sales order, budget or workspace — so revenue never gets re-keyed, and won value reconciles to invoiced value monthly.',
      entities: [
        ['Accounts & Contacts', 'the commercial "who" — must map 1:1 to accounting'],
        ['Opportunities', 'value, stage history, close dates — forecast inputs'],
        ['Products & Price Books', 'what was actually sold, at what price'],
        ['Cases', 'service issues — a churn early-warning signal'],
        ['Flows & Reports', 'automation and reporting — prone to sprawl']
      ],
      feeds: { customer: 'Accounts & Contacts', invoice: 'Opportunities & Products (source of)', project: 'Closed-won Opportunities (trigger)' }
    },
    'Stripe': {
      category: 'Billing & payments',
      summary: 'Stripe is the revenue source of truth for subscription and online businesses: Customers, Subscriptions, Invoices, Charges and Payouts, with Products and Prices defining the catalogue. ARR, churn and NRR should be computed here — not in the CRM — because billing is what customers actually pay. The two chronic gaps: payout reconciliation (lump-sum deposits hiding fees and refunds) and involuntary churn from failed payments, typically 20–40% of gross churn and the cheapest to fix.',
      entities: [
        ['Customers & Subscriptions', 'the recurring-revenue source of truth'],
        ['Invoices & Charges', 'what was billed and what was paid'],
        ['Payouts', 'lump-sum bank deposits — fees, refunds, revenue entangled'],
        ['Products & Prices', 'the catalogue ARR bridges are built on'],
        ['Events / webhooks', 'the trigger layer for billing automation']
      ],
      feeds: { customer: 'Customers', invoice: 'Subscriptions & Invoices (billing truth)' }
    },
    'Deputy / Tanda': {
      category: 'Rostering & time',
      summary: 'Deputy and Tanda own the rostered-workforce layer: shifts and rosters by location, timesheets with award interpretation, and leave that affects coverage. For rostered teams, labour is the largest controllable cost — and it is controlled (or lost) at the roster, days before payroll sees it. The integration that matters: approved timesheets flowing to payroll without re-keying, and rostered-vs-actual wage cost landing against budget weekly, by location.',
      entities: [
        ['Rosters & Shifts', 'planned labour cost, by location and week'],
        ['Timesheets', 'actual hours, award-interpreted'],
        ['Leave & Availability', 'the coverage signal'],
        ['Locations / Areas', 'the cost-centre dimension wage reporting needs']
      ],
      feeds: { employee: 'Timesheets & Rosters', gl: 'Wage costing journals (source of)' }
    },
    'HaloPSA / ConnectWise': {
      category: 'MSP PSA',
      summary: 'HaloPSA and ConnectWise run the MSP operating rhythm: Tickets carry the work, Agreements carry recurring revenue, Projects carry the one-off work, and Time Entries land against all three. Billing is where MSPs leak margin — agreement true-ups, out-of-scope tickets never invoiced, and the monthly billing run done by hand. The PSA should generate invoices automatically into accounting, and agreement profitability should be reportable per client without a spreadsheet.',
      entities: [
        ['Tickets', 'the work — and the out-of-scope billing leakage'],
        ['Agreements / Contracts', 'recurring revenue and entitlements'],
        ['Projects & Time Entries', 'one-off work, effort and cost'],
        ['Invoices', 'agreement + ticket billing — automate into the GL'],
        ['Configurations / Assets', 'what is under management, per client']
      ],
      feeds: { customer: 'Clients', project: 'Tickets, Projects & Agreements', invoice: 'Invoices (sync to accounting)' }
    },
    'Planning / FP&A': {
      category: 'Planning',
      summary: 'A planning tool (Cube, Pigment, Causal, Fathom and peers) is a consumer of the spine, not a source: it should receive actuals from the GL and headcount from the people system automatically, and hold the driver-based model, scenarios and reforecasts. The failure mode is a model fed by monthly CSV exports — at that point it is a slower spreadsheet. Wired correctly, reforecasting becomes a review, plan-vs-actual variance is continuous, and board scenarios take minutes.',
      entities: [
        ['Models & Drivers', 'the assumptions revenue and cost hang off'],
        ['Scenarios', 'hire vs automate vs outsource, priced'],
        ['Plan vs Actuals', 'continuous variance once actuals auto-feed'],
        ['Headcount plan', 'the biggest cost line, planned properly']
      ],
      feeds: {}
    },
    'Other ERP': {
      category: 'ERP',
      summary: 'Whatever the ERP, the pattern holds: a GL surrounded by AP, AR, and possibly inventory and order modules — plus workflow features (approval chains, recurring journals, bank rules) that most teams pay for but never switch on. Before adding any new tool, the cheapest wins are usually native: approval workflows, scheduled reports and bank rules. The unified-model job is deciding which objects the ERP owns (usually GL, AP) versus which it should receive from upstream systems.',
      entities: [
        ['General Ledger', 'the spine — everything posts here eventually'],
        ['AP / AR modules', 'documents and approval workflows'],
        ['Native workflow features', 'approvals, recurring journals, bank rules — often unused'],
        ['Order / inventory modules', 'if present, the order-to-cash source']
      ],
      feeds: { gl: 'General Ledger', invoice: 'AR module' }
    },
    'Spreadsheets': {
      category: 'Spreadsheets',
      summary: 'Spreadsheets are not a system — they are a queue of automation candidates. Every recurring workbook is one of three things: a report (automate it from source data), a process (move it into a workflow tool), or a dataset that has quietly become a system of record (the riskiest kind — migrate it). The Step 1 audit treats each recurring spreadsheet as a process to score; the unified model treats them as migration sources, never as owners of master data.',
      entities: [
        ['Recurring reports', 'automation candidates — usually the biggest pool of hours'],
        ['Shadow systems of record', 'master data living outside any system — a risk register item'],
        ['Manual handoffs', 'copy-paste between tools — integration candidates']
      ],
      feeds: {}
    }
  };

  /* ----------------------------------------------- integration edges (pairs) */
  var EDGES = [
    { pair: ['HubSpot', 'Xero'], text: 'Won HubSpot Deals (with Line Items) create draft Xero Invoices against the matching Contact — deal-to-invoice without re-keying, and revenue reporting that agrees with what sales sees.' },
    { pair: ['HubSpot', 'Productive'], text: 'HubSpot Deals hand off to Productive on win — company, value and line items become a Deal/Budget, so delivery starts with the numbers sales closed on.' },
    { pair: ['HubSpot', 'Kantata'], text: 'A won HubSpot Deal triggers a Kantata Workspace from a template — scope, value and client carried across, no project set-up from scratch.' },
    { pair: ['Productive', 'Xero'], text: 'Productive Invoices sync to Xero (contact-matched, line-level), and payments flow back — so AR status is identical in both systems.' },
    { pair: ['Kantata', 'Xero'], text: 'Kantata invoices export to Xero against matched Contacts, keeping the GL as the single financial truth while Kantata owns delivery detail.' },
    { pair: ['Employment Hero', 'Xero'], text: 'Pay run journals post from Employment Hero to Xero automatically — the largest cost line lands in the GL without re-keying, every cycle.' },
    { pair: ['Employment Hero', 'Productive'], text: 'Approved leave from Employment Hero adjusts Productive Bookings — utilisation and capacity plans that respect reality.' },
    { pair: ['Employment Hero', 'Kantata'], text: 'Leave and employment data from Employment Hero feed Kantata Resource Plans — allocations never assume someone who is on leave.' },
    { pair: ['HubSpot', 'Other ERP'], text: 'Won Deals raise sales orders/invoices in the ERP via its API or native connector — order-to-cash starts in the CRM and ends in the GL untouched by hand.' },
    { pair: ['Other ERP', 'Employment Hero'], text: 'Payroll journals from Employment Hero map to the ERP GL — one posting rule set, applied every pay run.' },
    { pair: ['Spreadsheets', 'Xero'], text: 'Recurring management workbooks rebuilt on live Xero Reports API data — same layout, zero manual refresh.' },
    { pair: ['Spreadsheets', 'Productive'], text: 'Utilisation and WIP workbooks replaced by Productive’s native profitability and booking reports — one less spreadsheet to feed.' },
    { pair: ['Spreadsheets', 'Kantata'], text: 'Margin and capacity workbooks replaced by Kantata Insights views — the spreadsheet becomes a consumer, not a system.' },
    { pair: ['Salesforce', 'Xero'], text: 'Closed-won Salesforce Opportunities (with Products) create draft Xero Invoices against matched Contacts — won value reconciles to invoiced value monthly.' },
    { pair: ['Salesforce', 'NetSuite'], text: 'Closed-won Opportunities raise NetSuite Sales Orders with items and pricing carried across — quote-to-cash with no re-keying.' },
    { pair: ['Salesforce', 'Stripe'], text: 'Won Opportunities provision Stripe Subscriptions from Products/Price Books — the CRM and billing never disagree on what was sold.' },
    { pair: ['HubSpot', 'Stripe'], text: 'Won HubSpot Deals create Stripe Subscriptions or payment links; billing status flows back to the Company record for churn-risk visibility.' },
    { pair: ['Stripe', 'Xero'], text: 'Stripe Payouts auto-split into fees, refunds and revenue in Xero — the lump-sum-deposit reconciliation headache disappears.' },
    { pair: ['Stripe', 'MYOB'], text: 'Stripe Payouts post to MYOB split into fees, refunds and revenue — billing and the GL agree daily, not at month end.' },
    { pair: ['Stripe', 'NetSuite'], text: 'Stripe billing feeds NetSuite revenue recognition journals — subscriptions, credits and refunds posted by rule.' },
    { pair: ['MYOB', 'HubSpot'], text: 'Won HubSpot Deals create draft MYOB Invoices against matched Cards — deal-to-invoice without re-keying.' },
    { pair: ['MYOB', 'Employment Hero'], text: 'Pay run journals post from Employment Hero to MYOB automatically — the largest cost line lands without re-keying, every cycle.' },
    { pair: ['NetSuite', 'HubSpot'], text: 'Won HubSpot Deals raise NetSuite Sales Orders — order-to-cash starts in the CRM and ends in the GL untouched by hand.' },
    { pair: ['NetSuite', 'Employment Hero'], text: 'Employment Hero pay run journals map to NetSuite subsidiaries and accounts — one posting rule set, applied every cycle.' },
    { pair: ['Deputy / Tanda', 'Employment Hero'], text: 'Approved, award-interpreted timesheets flow from Deputy/Tanda to Employment Hero payroll — no re-keying, no interpretation disputes at pay time.' },
    { pair: ['Deputy / Tanda', 'Xero'], text: 'Rostered and actual wage cost posts to Xero by location weekly — labour variance visible days before payroll, not weeks after.' },
    { pair: ['HaloPSA / ConnectWise', 'Xero'], text: 'Agreement and ticket billing generates Xero invoices automatically — the monthly billing run becomes a review, and out-of-scope work stops slipping through unbilled.' },
    { pair: ['Planning / FP&A', 'Xero'], text: 'Xero actuals auto-feed the planning model — plan-vs-actual variance is continuous and reforecasts take minutes, not days.' },
    { pair: ['Planning / FP&A', 'NetSuite'], text: 'NetSuite actuals flow to the planning model by account and subsidiary — one driver-based model, always current.' },
    { pair: ['Planning / FP&A', 'Employment Hero'], text: 'Headcount and employment cost from Employment Hero drive the workforce plan — the biggest cost line planned from real data.' }
  ];

  /* ------------------------------------------------------------ industries */
  var INDUSTRIES = {
    'SaaS / software': {
      anatomy: 'For a SaaS business the spine is ARR-centric: the customer record and its subscription/contract history are the master thread, and every system must agree on who the customer is and what they pay per period.',
      masterEmphasis: 'customer',
      tags: ['saas', 'arr', 'recurring']
    },
    'Tech services / MSP': {
      anatomy: 'For tech services the spine runs customer → contract → recurring service + project work. The model must handle both recurring revenue (agreements) and project revenue (engagements) without double-counting.',
      masterEmphasis: 'project',
      tags: ['services', 'recurring', 'project']
    },
    'Professional services': {
      anatomy: 'For professional services the engagement is the atomic unit: people, hours, rates and invoices all hang off the project. Margin and utilisation are only trustworthy when time, cost rates and billing share one definition of "the project".',
      masterEmphasis: 'project',
      tags: ['services', 'project', 'utilisation']
    },
    'Healthcare': {
      anatomy: 'For healthcare operators the spine pairs the service/roster layer with compliance: workforce data, rostered hours and funding claims must reconcile to payroll and the GL, with clear ownership of patient/client master data outside the finance stack.',
      masterEmphasis: 'employee',
      tags: ['roster', 'compliance', 'workforce']
    },
    'Construction': {
      anatomy: 'For construction the job is the master entity: estimates, variations, progress claims, subcontractor costs and retentions all attach to the job, and WIP must reconcile between the operational system and the GL every month.',
      masterEmphasis: 'project',
      tags: ['job-costing', 'wip', 'project']
    },
    'Retail & ecommerce': {
      anatomy: 'For retail/ecommerce the spine is order-to-cash plus inventory: SKU and channel data must map cleanly to revenue and COGS lines in the GL, and the customer record consolidates across channels.',
      masterEmphasis: 'customer',
      tags: ['inventory', 'order-to-cash', 'channels']
    },
    'Other': {
      anatomy: 'The spine generalises: one master record each for customer, engagement/work, invoice, employee and the GL — with every system either owning one of those records or subscribing to it, never both.',
      masterEmphasis: 'customer',
      tags: []
    }
  };

  var GOALS = {
    'Faster month-end close': { tags: ['close', 'automation'], line: 'a faster, more automated month-end close' },
    'Raise capital / investor-ready numbers': { tags: ['arr', 'investor', 'recurring'], line: 'investor-ready numbers that reconcile under diligence' },
    'Margin visibility': { tags: ['margin', 'project', 'utilisation'], line: 'clear margin visibility by project, service and client' },
    'Scale without adding headcount': { tags: ['automation', 'capacity'], line: 'scaling output without growing headcount' },
    'Systems consolidation': { tags: ['integration', 'consolidation'], line: 'a consolidated, well-integrated systems stack' }
  };

  var KPI_TAGS = {
    'ARR & churn': ['arr', 'recurring', 'investor'],
    'Cash & runway': ['cash'],
    'Project margin': ['margin', 'project'],
    'Utilisation': ['utilisation', 'capacity'],
    'Close duration': ['close'],
    'CAC & pipeline': ['pipeline', 'investor']
  };

  /* -------------------------------------------------------------- metrics
     sources: array of OR-groups; metric is available if for every group,
     at least one listed tool is selected. */
  var METRICS = [
    { name: 'ARR / MRR movement', formula: 'Sum of active recurring line items per month, bridged: opening + new + expansion − contraction − churn = closing', sources: [['Stripe', 'HubSpot', 'Salesforce', 'NetSuite', 'Other ERP', 'Productive', 'HaloPSA / ConnectWise']], tags: ['arr', 'recurring', 'investor', 'saas'], why: 'The first number investors and boards ask for — and the one most often quoted differently by sales and finance.' },
    { name: 'Net revenue retention', formula: 'Closing recurring revenue of a cohort ÷ its opening recurring revenue, trailing 12 months', tags: ['arr', 'recurring', 'investor', 'saas'], sources: [['Stripe', 'HubSpot', 'Salesforce', 'NetSuite', 'Other ERP']], why: 'Tells you whether the existing base grows or shrinks without new logos — the single best health metric for recurring revenue.' },
    { name: 'Cash runway', formula: 'Cash at bank ÷ trailing 3-month average net burn (operating cash out − in)', sources: [['Xero', 'MYOB', 'NetSuite', 'Other ERP']], tags: ['cash', 'investor'], why: 'The survival metric. Pulled live from bank feeds it stops being a month-old estimate.' },
    { name: 'DSO / AR aging', formula: 'Average days from invoice issue to payment; aged buckets 0–30/31–60/61–90+', sources: [['Xero', 'MYOB', 'NetSuite', 'Other ERP', 'Productive', 'Kantata', 'HaloPSA / ConnectWise', 'Stripe']], tags: ['cash', 'close'], why: 'Every day of DSO is working capital you are lending to customers interest-free.' },
    { name: 'Month-end close duration', formula: 'Working days from period end to signed-off P&L, tracked per close with a checklist timestamp', sources: [['Xero', 'MYOB', 'NetSuite', 'Other ERP']], tags: ['close'], why: 'You cannot shorten what you do not measure — and the trend shows whether automation is actually landing.' },
    { name: 'Project / engagement margin', formula: '(Recognised revenue − (hours × cost rate) − direct costs) ÷ revenue, per project', sources: [['Productive', 'Kantata', 'HaloPSA / ConnectWise'], ['Xero', 'MYOB', 'NetSuite', 'Other ERP', 'Productive', 'Kantata', 'HaloPSA / ConnectWise']], tags: ['margin', 'project', 'services'], why: 'The profit truth per engagement — and the input every pricing decision should start from.' },
    { name: 'Utilisation (billable %)', formula: 'Billable hours ÷ capacity hours (net of approved leave), per person and team', sources: [['Productive', 'Kantata', 'HaloPSA / ConnectWise']], tags: ['utilisation', 'capacity', 'services'], why: 'The single biggest lever on services profitability; honest only when leave data flows in automatically.' },
    { name: 'Revenue per employee', formula: 'Trailing-12-month revenue ÷ average FTE', sources: [['Xero', 'MYOB', 'NetSuite', 'Other ERP'], ['Employment Hero', 'Deputy / Tanda', 'Productive', 'Kantata', 'HaloPSA / ConnectWise']], tags: ['capacity', 'investor'], why: 'The cleanest scale-without-headcount tracker — it should rise as automation lands.' },
    { name: 'CAC & payback', formula: 'Sales + marketing cost per period ÷ new customers won; payback = CAC ÷ monthly gross profit per customer', sources: [['HubSpot', 'Salesforce'], ['Xero', 'MYOB', 'NetSuite', 'Other ERP']], tags: ['pipeline', 'investor', 'arr'], why: 'Connects the CRM to the GL — the metric is fiction if marketing spend and revenue live in different systems.' },
    { name: 'Pipeline coverage & velocity', formula: 'Open weighted pipeline ÷ next-quarter target; average days per stage from Deal stage history', sources: [['HubSpot', 'Salesforce']], tags: ['pipeline'], why: 'Forward revenue visibility — stage history makes the forecast inspectable instead of vibes.' },
    { name: 'Payroll cost ratio', formula: 'Total employment cost (gross + super + on-costs) ÷ revenue, monthly', sources: [['Employment Hero', 'Deputy / Tanda'], ['Xero', 'MYOB', 'NetSuite', 'Other ERP']], tags: ['cash', 'capacity'], why: 'People are the biggest line; this keeps growth honest as headcount and revenue move.' },
    { name: 'WIP & unbilled revenue', formula: 'Hours logged × bill rate − amounts invoiced, per project at period end', sources: [['Productive', 'Kantata', 'HaloPSA / ConnectWise']], tags: ['margin', 'project', 'close', 'wip'], why: 'Unbilled work is silent cash leakage — surfacing it at close converts directly to invoices.' },
    { name: 'Leave liability & capacity outlook', formula: 'Accrued leave balance × loaded rate; forward capacity = contracted hours − approved leave − existing bookings', sources: [['Employment Hero', 'Deputy / Tanda']], tags: ['capacity', 'utilisation', 'workforce'], why: 'A balance-sheet item and a planning input most SMBs only discover at audit time.' },
    { name: 'Recurring vs project revenue mix', formula: 'Revenue tagged by stream (agreement vs engagement) ÷ total, trended', sources: [['Xero', 'MYOB', 'NetSuite', 'Other ERP', 'Productive', 'HaloPSA / ConnectWise', 'Stripe']], tags: ['recurring', 'services', 'investor'], why: 'Valuation and planning both hinge on the mix — and the GL only answers it if revenue is tagged at source.' },
    { name: 'Billing health (failed payments & payouts)', formula: 'Failed-payment rate, involuntary churn recovered, payout-to-GL reconciliation gap', sources: [['Stripe']], tags: ['arr', 'cash', 'recurring'], why: 'Involuntary churn is typically 20–40% of gross churn — and the cheapest churn to fix.' },
    { name: 'Wage cost vs roster plan', formula: 'Rostered wage cost vs award-interpreted actuals vs budget, by location and week', sources: [['Deputy / Tanda'], ['Xero', 'MYOB', 'NetSuite', 'Other ERP']], tags: ['workforce', 'capacity', 'cash'], why: 'For rostered teams labour is the largest controllable cost — and it is controlled at the roster, days before payroll sees it.' },
    { name: 'Plan vs actual variance (driver-based)', formula: 'Monthly actuals vs driver-based plan, variance decomposed by driver; reforecast cadence tracked', sources: [['Planning / FP&A'], ['Xero', 'MYOB', 'NetSuite', 'Other ERP']], tags: ['investor', 'cash', 'close'], why: 'When actuals auto-feed the model, reforecasting stops being a quarterly project and becomes a monthly review.' }
  ];

  /* ------------------------------------------------------------ processes
     requires: array of OR-groups (every group must be satisfied). */
  var PROCESSES = [
    { name: 'Month-end close checklist & journal automation', requires: [['Xero', 'MYOB', 'NetSuite', 'Other ERP']], hours: '15–40 h/mo', complexity: 'Med', tags: ['close', 'automation'], desc: 'Close checklist with owners and timestamps; recurring journals, accruals and payroll postings automated.' },
    { name: 'AP capture & approval flow', requires: [['Xero', 'MYOB', 'NetSuite', 'Other ERP']], hours: '10–25 h/mo', complexity: 'Low', tags: ['close', 'automation', 'cash'], desc: 'Bills captured from email/OCR, coded by rules, routed for approval, posted — exceptions only.' },
    { name: 'AR dunning & payment matching', requires: [['Xero', 'MYOB', 'NetSuite', 'Other ERP']], hours: '8–20 h/mo', complexity: 'Low', tags: ['cash'], desc: 'Tone-aware reminder sequences by aging bucket; payments auto-matched from the bank feed.' },
    { name: 'Automated board & management pack', requires: [['Xero', 'MYOB', 'NetSuite', 'Other ERP']], hours: '10–30 h/mo', complexity: 'Med', tags: ['investor', 'close', 'arr'], desc: 'P&L, cash, KPIs assembled from live data on a schedule — commentary is the only manual step left.' },
    { name: 'Deal-to-invoice handoff', requires: [['HubSpot', 'Salesforce'], ['Xero', 'MYOB', 'NetSuite', 'Other ERP', 'Productive', 'Kantata', 'Stripe']], hours: '5–15 h/mo', complexity: 'Low', tags: ['pipeline', 'automation', 'arr'], desc: 'Won deal triggers draft invoice / budget / workspace with line items carried across — zero re-keying.' },
    { name: 'CRM hygiene & revenue reconciliation', requires: [['HubSpot', 'Salesforce'], ['Xero', 'MYOB', 'NetSuite', 'Other ERP']], hours: '6–12 h/mo', complexity: 'Med', tags: ['pipeline', 'investor'], desc: 'Companies matched to accounting contacts; won-deal value reconciled to invoiced revenue monthly.' },
    { name: 'Lead routing & pipeline stage hygiene', requires: [['HubSpot', 'Salesforce']], hours: '5–12 h/mo', complexity: 'Low', tags: ['pipeline', 'automation'], desc: 'Inbound leads routed by rules, stale deals flagged, stage criteria enforced — the pipeline stays believable without manual policing.' },
    { name: 'Payroll-to-ledger sync', requires: [['Employment Hero'], ['Xero', 'MYOB', 'NetSuite', 'Other ERP']], hours: '4–10 h/mo', complexity: 'Low', tags: ['close', 'automation'], desc: 'Pay run journals mapped and posted automatically each cycle, with variance flags vs last run.' },
    { name: 'Employee onboarding / offboarding ops', requires: [['Employment Hero']], hours: '6–15 h/mo', complexity: 'Med', tags: ['workforce', 'automation'], desc: 'Checklist-driven provisioning across HR, payroll, IT and tools — start/finish dates drive everything.' },
    { name: 'Leave-aware capacity planning', requires: [['Employment Hero'], ['Productive', 'Kantata']], hours: '4–10 h/mo', complexity: 'Med', tags: ['capacity', 'utilisation'], desc: 'Approved leave flows into bookings/resource plans automatically; capacity reports stop lying.' },
    { name: 'Time-entry compliance & WIP review', requires: [['Productive', 'Kantata', 'HaloPSA / ConnectWise']], hours: '6–15 h/mo', complexity: 'Low', tags: ['margin', 'wip', 'utilisation'], desc: 'Missing-time nudges, locked periods, and a weekly WIP/unbilled view per project lead.' },
    { name: 'Project margin reporting', requires: [['Productive', 'Kantata', 'HaloPSA / ConnectWise']], hours: '8–20 h/mo', complexity: 'Med', tags: ['margin', 'project', 'services'], desc: 'Margin per project/service from native profitability data — replaces the monthly margin workbook.' },
    { name: 'PSA-to-GL invoice sync', requires: [['Productive', 'Kantata', 'HaloPSA / ConnectWise'], ['Xero', 'MYOB', 'NetSuite', 'Other ERP']], hours: '4–12 h/mo', complexity: 'Low', tags: ['close', 'cash', 'automation'], desc: 'Invoices raised in the PSA land in the GL contact-matched and line-coded; payments flow back.' },
    { name: 'Recurring report automation', requires: [['Spreadsheets']], hours: '10–30 h/mo', complexity: 'Low', tags: ['automation', 'close'], desc: 'Each recurring workbook rebuilt on live source data — same layout, zero manual refresh, one owner.' },
    { name: 'Spreadsheet system-of-record migration', requires: [['Spreadsheets']], hours: '5–15 h/mo', complexity: 'High', tags: ['consolidation', 'integration'], desc: 'Master data living in workbooks identified and migrated into the owning system, with access rules.' },
    { name: 'ERP native workflow activation', requires: [['Other ERP']], hours: '5–15 h/mo', complexity: 'Low', tags: ['automation', 'consolidation'], desc: 'Approval chains, bank rules, recurring journals and scheduled reports you already pay for — switched on.' },
    { name: 'Expense & procurement workflow', requires: [['Xero', 'MYOB', 'NetSuite', 'Other ERP', 'Employment Hero']], hours: '5–12 h/mo', complexity: 'Low', tags: ['automation', 'cash'], desc: 'Requests, approvals and reimbursements in one flow, coded at capture — no end-of-month shoebox.' },
    { name: 'Payout & billing reconciliation (Stripe)', requires: [['Stripe'], ['Xero', 'MYOB', 'NetSuite', 'Other ERP']], hours: '6–15 h/mo', complexity: 'Low', tags: ['cash', 'close', 'recurring', 'automation'], desc: 'Payouts auto-split into fees, refunds and revenue; billing and the GL agree daily instead of fighting at month end.' },
    { name: 'Failed-payment recovery & dunning', requires: [['Stripe']], hours: '4–10 h/mo', complexity: 'Low', tags: ['arr', 'cash', 'recurring'], desc: 'Smart retries, card-update prompts and tone-aware dunning — recovering the cheapest churn there is.' },
    { name: 'Roster-to-payroll reconciliation', requires: [['Deputy / Tanda']], hours: '6–14 h/mo', complexity: 'Med', tags: ['workforce', 'capacity', 'close'], desc: 'Award-interpreted timesheets flow to payroll untouched; rostered-vs-actual wage variance flagged weekly by location.' },
    { name: 'Agreement & ticket billing automation', requires: [['HaloPSA / ConnectWise']], hours: '8–18 h/mo', complexity: 'Med', tags: ['recurring', 'cash', 'automation'], desc: 'Recurring agreements and billable tickets invoice themselves — out-of-scope work stops slipping through unbilled.' },
    { name: 'Driver-based reforecast refresh', requires: [['Planning / FP&A'], ['Xero', 'MYOB', 'NetSuite', 'Other ERP']], hours: '6–12 h/mo', complexity: 'Med', tags: ['investor', 'cash'], desc: 'Actuals land in the planning model automatically — the reforecast becomes a review, not a rebuild.' },
    { name: 'Planning model data feeds', requires: [['Planning / FP&A']], hours: '4–10 h/mo', complexity: 'Low', tags: ['investor', 'automation'], desc: 'Every manual CSV upload into the planning model replaced with a scheduled feed — the model is always current.' }
  ];

  /* ----------------------------------------------------------- benchmarks */
  var BENCHMARKS = {
    alchemy: [
      { stat: '$13–16 → ~$3', label: 'Cost per invoice processed', detail: 'Average manual cost per supplier invoice versus best-in-class automated AP — with cycle times falling from ~17 days to ~3.', source: 'Ardent Partners, State of ePayables' },
      { stat: '≤ 5 days', label: 'Top-quartile month-end close', detail: 'Top performers close in five days or less; bottom-quartile teams take 10+. Checklist and journal automation is most of the gap.', source: 'APQC Open Standards Benchmarking' },
      { stat: '1–3 months', label: 'Typical AP automation payback', detail: 'AP and reconciliation automations are consistently the fastest-payback finance projects; most automation programs return their cost within 6–12 months.', source: 'Industry ROI studies, 2024–25' },
      { stat: '75–90%', label: 'Fewer processing errors', detail: 'Manual entry runs 1–4% errors per field and 1–2% duplicate payments; automated flows approach zero on both.', source: 'Finance automation benchmarks' }
    ],
    aurora: [
      { stat: '6 vs 15 days', label: 'Management reporting cycle', detail: 'Top-quartile finance teams produce period-end management reports in ~6 days; bottom quartile take 15. Live-fed dashboards collapse this to continuous.', source: 'APQC, Metric of the Month' },
      { stat: '>60%', label: 'Faster reporting after automation', detail: 'Companies implementing end-to-end reporting automation cut reporting timelines by more than half — commentary becomes the only manual step.', source: 'Industry ROI studies, 2024–25' },
      { stat: 'One version', label: 'of ARR, churn and cash', detail: 'The qualitative payoff: board and diligence questions answered from one reconciled view instead of three conflicting spreadsheets.', source: 'arboleda engagement pattern' }
    ],
    auroraPSA: { stat: '+1 pt utilisation', label: 'What one point is worth', detail: 'Illustrative arithmetic: 1 percentage point × ~1,800 capacity hours × $150 bill rate ≈ $2,700 per consultant per year — ~$54k/yr across a 20-person delivery team.', source: 'Worked example, not a survey' },
    anatomy: [
      { stat: '17 → 3 days', label: 'Invoice cycle, integrated stacks', detail: 'End-to-end integrated invoice flows complete in ~3 days versus ~17 manual — the gap is integration, not effort.', source: 'Ardent Partners, State of ePayables' },
      { stat: '1–2%', label: 'Duplicate payments in manual AP', detail: 'Re-keying between systems is where duplicates and mismatches enter. A unified spine removes the re-keying entirely.', source: 'AP benchmarks' },
      { stat: '6–12 months', label: 'Typical integration payback', detail: 'Systems integration pays back within the year when scoped against re-keying hours, error cost and decision latency.', source: 'Industry ROI studies, 2024–25' }
    ]
  };

  function hoursRange(h) {
    var m = /(\d+)[–-](\d+)/.exec(h);
    return m ? [parseInt(m[1], 10), parseInt(m[2], 10)] : [0, 0];
  }
  function valueLine(h) {
    var r = hoursRange(h);
    if (!r[1]) return '';
    var lo = Math.round(r[0] * 12 * 65 / 1000), hi = Math.round(r[1] * 12 * 65 / 1000);
    return '≈ $' + lo + '–' + hi + 'k/yr back at a $65/h loaded cost';
  }

  /* --------------------------------------------- value chain (Step 0 view) */
  var CHAIN_BASE = [
    { id: 'sell', name: 'Win & sell', sub: 'Pipeline → closed-won', tools: ['HubSpot', 'Salesforce'],
      possible: 'Closed-won deals trigger invoices, budgets or workspaces downstream — and revenue reporting agrees with what sales sees.',
      gap: 'No CRM selected — if deals live in inboxes or a sheet, the audit maps how they become revenue today.' },
    { id: 'deliver', name: 'Deliver the work', sub: 'Projects, time & agreements', tools: ['Productive', 'Kantata', 'HaloPSA / ConnectWise'],
      possible: 'Time, budgets and agreements chain to invoices — margin and utilisation reported automatically, WIP visible before it leaks.',
      gap: 'No delivery system selected — if you sell time or projects, margin is probably assembled by hand each month.' },
    { id: 'bill', name: 'Bill & collect', sub: 'Invoices → cash in bank', tools: ['Stripe', 'Xero', 'MYOB', 'NetSuite', 'Other ERP'],
      possible: 'Invoices raise themselves from upstream systems; payouts reconcile, reminders run by aging bucket, payments auto-match.',
      gap: 'No billing or AR system selected — collection is manual, and DSO is invisible.' },
    { id: 'people', name: 'Pay & support people', sub: 'Roster → payroll → GL', tools: ['Employment Hero', 'Deputy / Tanda'],
      possible: 'Timesheets and pay runs flow to the ledger without re-keying — and leave feeds capacity planning so utilisation stops lying.',
      gap: 'No people system selected — payroll journals and leave liability are likely re-keyed or unknown.' },
    { id: 'close', name: 'Record & close', sub: 'Transactions → trusted P&L', tools: ['Xero', 'MYOB', 'NetSuite', 'Other ERP'],
      possible: 'Journals, accruals and reconciliations run on rules with a timestamped close checklist — top-quartile teams close in ≤5 days.',
      gap: 'No accounting system selected — everything upstream lands nowhere trusted. This is the first gap to fix.' },
    { id: 'decide', name: 'Decide & plan', sub: 'Numbers → decisions', tools: ['Planning / FP&A'],
      possible: 'Actuals and headcount feed the planning model automatically — reforecasts become a review, scenarios take minutes.',
      gap: 'No planning tool — the board pack, forecasts and scenarios are living in spreadsheets. The Aurora report shows what your stack can already answer.' }
  ];

  var CHAIN_INDUSTRY = {
    'SaaS / software': {
      label: 'a SaaS business',
      sell: { sub: 'Pipeline → closed-won → subscription', possible: 'Closed-won deals provision the subscription automatically — what was sold and what gets billed never disagree.' },
      deliver: { name: 'Onboard & retain', sub: 'Activation → renewal', tools: ['HubSpot', 'Salesforce', 'Stripe'],
        possible: 'Tickets, billing status and account signals feed churn-risk visibility — renewals and expansion stop being surprises.',
        gap: 'Nothing tracks the customer after the sale — churn shows up in billing data, which is too late.' },
      bill: { sub: 'Subscriptions → cash', possible: 'Stripe is the ARR source of truth: payouts reconcile to the GL, failed payments retry themselves, and involuntary churn gets recovered.' },
      decide: { possible: 'ARR bridge, churn cohorts and runway feed the model automatically — the metrics investors ask for, always current.' }
    },
    'Tech services / MSP': {
      label: 'a tech services / MSP business',
      deliver: { name: 'Run agreements & projects', sub: 'Tickets, agreements → billable work', tools: ['HaloPSA / ConnectWise', 'Productive', 'Kantata'],
        possible: 'Tickets, agreements and projects carry their own billing — out-of-scope work stops slipping through unbilled, and agreement profitability is reportable per client.',
        gap: 'No PSA selected — agreements, tickets and projects are probably billed from memory and a spreadsheet.' },
      bill: { sub: 'Agreement billing → cash', possible: 'The monthly agreement billing run generates itself into the GL — true-ups included, review instead of rebuild.' }
    },
    'Professional services': {
      label: 'a professional-services firm',
      deliver: { name: 'Deliver engagements', sub: 'Time → margin', possible: 'Every logged hour chains to a budget and an invoice — margin per engagement and utilisation reported automatically, WIP visible at close.' }
    },
    'Healthcare': {
      label: 'a healthcare operator',
      deliver: { name: 'Deliver care & services', sub: 'Roster → service delivery', tools: ['Deputy / Tanda', 'Other ERP'],
        possible: 'Rostered coverage matches demand, and delivered services reconcile to funding claims — the operational truth feeds the financial one.',
        gap: 'No rostering or service system selected — coverage, award compliance and funding claims are likely managed by hand.' },
      people: { possible: 'Award-interpreted timesheets flow to payroll untouched — compliance built in, and wage cost lands against budget by location weekly.' }
    },
    'Construction': {
      label: 'a construction business',
      deliver: { name: 'Run the jobs', sub: 'Estimate → variations → completion', tools: ['Other ERP', 'Productive'],
        possible: 'Job costs, variations and committed spend track against estimate in one place — margin per job visible before the job ends, not after.',
        gap: 'No job-costing system selected — margin per job is probably discovered at completion, when it’s too late to fix.' },
      bill: { name: 'Claim & collect', sub: 'Progress claims → retentions → cash', possible: 'Progress claims generate from job data, retentions are tracked to release dates, and payments auto-match — cash position per job, live.' }
    },
    'Retail & ecommerce': {
      label: 'a retail / ecommerce business',
      sell: { name: 'Sell across channels', sub: 'Orders → revenue', tools: ['HubSpot', 'Salesforce', 'Stripe', 'Other ERP'],
        possible: 'Orders from every channel reconcile to revenue and fees automatically — channel margin stops being a quarterly archaeology project.',
        gap: 'No order or payment system selected — channel revenue is reconciled by hand, if at all.' },
      deliver: { name: 'Stock & fulfil', sub: 'Inventory → fulfilment', tools: ['Other ERP'],
        possible: 'Inventory, COGS and fulfilment live in the ERP — stock truth and the GL agree without a count-day scramble.',
        gap: 'No inventory system selected — stock truth probably lives in a spreadsheet, and COGS is an estimate.' }
    },
    'Other': { label: 'your business' }
  };

  function sizeTier(headcount) {
    if (headcount === 'Under 50') return 'small';
    if (headcount === '50–150') return 'mid';
    if (headcount === '500+' || headcount === '300–500' || headcount === '150–300') return 'large';
    return 'mid';
  }
  var CHAIN_SIZE = {
    small: {
      gapSuffix: ' Normal at your size — the audit shows when this gap starts costing real money.',
      stages: { decide: { gap: 'No planning tool — fine at your size. A driver-based sheet fed by live actuals usually beats buying software here.' } }
    },
    mid: { gapSuffix: '' },
    large: {
      gapSuffix: ' At your headcount this gap is usually absorbing a full-time person.',
      stages: {
        close: { possibleSuffix: ' At your size, approval controls and multi-entity consolidation matter as much as speed.' },
        decide: { possibleSuffix: ' With multiple teams planning, one driver-based model stops the version wars.' }
      }
    }
  };

  function valueChain(intake) {
    intake = intake || {};
    var ind = CHAIN_INDUSTRY[intake.industry] || CHAIN_INDUSTRY['Other'];
    var size = CHAIN_SIZE[sizeTier(intake.headcount)];
    var stages = CHAIN_BASE.map(function (base) {
      var o = ind[base.id] || {};
      var so = (size.stages || {})[base.id] || {};
      var st = {
        id: base.id,
        name: o.name || base.name,
        sub: o.sub || base.sub,
        tools: o.tools || base.tools,
        possible: (so.possible || o.possible || base.possible) + (so.possibleSuffix || ''),
        gap: (so.gap || o.gap || base.gap)
      };
      if (!so.gap) st.gap += (size.gapSuffix || '');
      return st;
    });
    return { label: ind.label, stages: stages };
  }

  /* ------------------------------------------------- discovery (Step 1 co-build) */
  var DISCOVERY_TOOL_QS = {
    'Xero': { q: 'How is Xero set up?', options: ['Single entity', 'Multiple entities / orgs', 'Multi-currency in play'], ready: 'Read-only advisor invite to Xero (we never need edit access for the audit)' },
    'HubSpot': { q: 'Which HubSpot hubs do you run?', options: ['Sales hub only', 'Sales + Marketing', 'Sales + Service', 'Most hubs / Enterprise'], ready: 'View-only HubSpot seat, or a screenshot tour of pipelines and deal stages' },
    'Employment Hero': { q: 'How does payroll run?', options: ['In-house via Employment Hero', 'Outsourced, EH for HR only', 'Mixed'], ready: 'A recent pay-run journal export (figures can be redacted)' },
    'Productive': { q: 'How disciplined is time entry in Productive?', options: ['Daily and complete', 'Weekly-ish, mostly complete', 'Patchy — chased at month end'], ready: 'Read-only Productive access, or last month’s profitability report export' },
    'Kantata': { q: 'How disciplined is time entry in Kantata?', options: ['Daily and complete', 'Weekly-ish, mostly complete', 'Patchy — chased at month end'], ready: 'Reporting access to Kantata Insights, or a recent margin report export' },
    'MYOB': { q: 'Which MYOB product?', options: ['MYOB Business', 'AccountRight', 'MYOB Acumatica', 'Not sure'], ready: 'Read-only adviser access to MYOB (we never need edit access)' },
    'NetSuite': { q: 'How is NetSuite configured?', options: ['Single subsidiary', 'Multi-subsidiary', 'Heavily customised'], ready: 'A view-only NetSuite role, or a saved-search export of the chart of accounts' },
    'Salesforce': { q: 'Which Salesforce clouds do you run?', options: ['Sales Cloud only', 'Sales + Service', 'Sales + CPQ / Billing'], ready: 'View-only Salesforce access, or a pipeline report export with stage history' },
    'Stripe': { q: 'What runs through Stripe?', options: ['All revenue', 'Subscriptions only', 'Card payments only', 'Mixed'], ready: 'A restricted read-only Stripe key, or last month’s payout reconciliation report' },
    'Deputy / Tanda': { q: 'How do approved rosters reach payroll?', options: ['Automatic sync', 'Export / import', 'Re-keyed manually'], ready: 'A roster-vs-timesheet export for one location, one recent week' },
    'HaloPSA / ConnectWise': { q: 'How do agreements get billed each month?', options: ['Auto from the PSA', 'Exported to accounting', 'Manually assembled'], ready: 'Read-only PSA access, or one recent agreement billing run export' },
    'Planning / FP&A': { q: 'How do actuals get into the planning model?', options: ['Auto connector', 'Monthly CSV upload', 'Re-keyed by hand'], ready: 'The model structure — a tab/driver list or screenshot is enough' },
    'Other ERP': { q: 'Which ERP is it, and is anyone using its workflow features?', freetext: true, ready: 'The ERP name + a list of modules you pay for (your account manager can supply this)' },
    'Spreadsheets': { q: 'Roughly how many recurring spreadsheets does the team maintain?', options: ['A handful (1–5)', 'Dozens (6–20)', 'Honestly, lost count'], ready: 'Your three most-hated recurring workbooks (blank copies are fine)' }
  };
  var DISCOVERY_CONSTANTS = {
    teamSizes: ['1–2', '3–5', '6–10', '10+'],
    timelines: ['ASAP — this quarter', 'Next quarter', 'This financial year', 'Exploring for now'],
    budgets: ['Under $10k to start', '$10–25k', '$25–50k', 'Depends on the roadmap']
  };

  /* Step 2 readiness: the questions that make systems connectable */
  var DISCOVERY_CONNECT = {
    approver: { key: 'connectApprover', label: 'Who approves connecting a third-party tool to your systems?', options: ['Me', 'CFO / Founder', 'IT or security review', 'Not sure'] },
    sandbox: { key: 'sandbox', label: 'Could we connect to a test environment first?', options: ['Sandbox available', 'Production only', 'Not sure'] },
    joinKeys: { key: 'joinKeys', label: 'How is the same customer identified across systems?', options: ['Consistent IDs / ABN', 'Names match, mostly', 'They don’t — manual matching', 'Not sure'] },
    invoiceVol: { key: 'invoiceVol', label: 'Roughly how many invoices a month?', options: ['Under 50', '50–200', '200–1,000', '1,000+'] },
    dataRules: { key: 'dataRules', label: 'Any data rules we should know about?', options: ['Data must stay in Australia', 'Security questionnaire required', 'AI usage policy in place', 'None / not sure'], multi: true },
    existing: { key: 'existingIntegrations', label: 'What already syncs between systems today?', freetext: true, placeholder: 'e.g. HubSpot–Xero native sync; Zapier for invoices' }
  };

  /* One extra discovery question per focus */
  var FOCUS_EXTRA = {
    alchemy: { key: 'autonomy', label: 'When a workflow can run without a human, should it?', options: ['A human approves each run', 'Humans review exceptions only', 'Fully automated where safe'], briefLabel: 'Autonomy appetite' },
    aurora: { key: 'reportsToday', label: 'Which reports exist today?', options: ['Board pack', 'Management P&L', 'Forecast model', 'Metric dashboard', 'None / ad-hoc'], multi: true, briefLabel: 'Reports today' },
    anatomy: { key: 'entityWord', label: 'What do you call the people you sell to?', options: ['Clients', 'Customers', 'Accounts', 'Members / patients'], briefLabel: 'Your word for them' }
  };

  var STEP2_PATH = {
    alchemy: 'Step 2 connects your systems through an agentic layer (e.g. LangChain) and delivers the business automation proposal — your agentic automations, specified and prioritised.',
    aurora: 'Step 2 connects your systems through an agentic integration layer and delivers the decision-intelligence proposal — the KPIs that best serve your business, defined and fed live.',
    anatomy: 'Step 2 connects your source systems through a unified API layer (e.g. Merge) and delivers your business-defined data ontology and target architecture.',
    unsure: 'Step 2 connects your source systems through a unified integration layer and delivers the proposal the audit recommends — automation, decision intelligence or architecture.'
  };

  var FOCUS_META = {
    alchemy: { label: 'Automation (Alchemy)', painsTitle: 'Where the hours go (your words)', scopeTitle: 'Proposed audit scope — first five processes', deep: 'Deep-dive the top two processes end-to-end (20 min)' },
    aurora: { label: 'Decision intelligence (Aurora)', painsTitle: 'Questions you can\u2019t answer confidently today', scopeTitle: 'Proposed audit scope — first five metrics to stand up', deep: 'Walk the two metrics that hurt most, from source objects to board pack (20 min)' },
    anatomy: { label: 'Systems foundations (Anatomy)', painsTitle: 'Where data breaks between systems', scopeTitle: 'Proposed audit scope — first integration moves', deep: 'Trace one customer and one invoice through every system, end to end (20 min)' },
    unsure: { label: 'Open — recommend on the call', painsTitle: 'Where the hours go (your words)', scopeTitle: 'Proposed audit scope — first five candidates', deep: 'Deep-dive the two areas that hurt most (20 min)' }
  };

  function auroraCandidates(intake) {
    return buildAurora(intake).metrics.slice(0, 8).map(function (m) { return m.name; });
  }
  function anatomyBreakCandidates(intake) {
    var tools = selectedTools(intake);
    var items = activeEdges(tools).map(function (e) { return 'Data re-keyed between ' + e.pair[0] + ' and ' + e.pair[1]; });
    items = items.concat([
      'Customer details differ across systems',
      'Report numbers don\u2019t match the source systems',
      'Master data lives in spreadsheets',
      'No one owns metric definitions'
    ]);
    return items.slice(0, 8);
  }

  function buildBrief(intake, disc) {
    disc = disc || {};
    var tools = selectedTools(intake);
    var ctx = ctxTags(intake);
    var focus = FOCUS_META[disc.focus] ? disc.focus : 'unsure';
    var fm = FOCUS_META[focus];
    // candidate pain processes = stack-available, ranked
    var ranked = [];
    PROCESSES.forEach(function (p) {
      if (groupsSatisfied(p.requires, tools)) ranked.push({ name: p.name, hours: p.hours, score: scoreTags(p.tags, ctx) });
    });
    ranked.sort(function (a, b) { return b.score - a.score; });
    function est(hrs) {
      if (hrs && !isNaN(parseFloat(hrs))) return '\u2248 $' + Math.round(parseFloat(hrs) * 12 * 65 / 1000) + 'k/yr at $65/h loaded';
      return '';
    }
    var pains = [], scope = [];
    if (focus === 'aurora') {
      pains = (disc.metrics || []).map(function (m) { return { name: m, hours: '', est: '' }; });
      if (disc.reportHours) pains.push({ name: 'Assembling recurring reports', hours: disc.reportHours, est: est(disc.reportHours) });
      scope = (disc.metrics || []).slice(0, 5);
      auroraCandidates(intake).forEach(function (m) { if (scope.length < 5 && scope.indexOf(m) === -1) scope.push(m); });
    } else if (focus === 'anatomy') {
      pains = (disc.breaks || []).map(function (b) { return { name: b, hours: '', est: '' }; });
      scope = activeEdges(tools).slice(0, 5).map(function (e) { return e.pair.join(' \u2194 ') + ' — ' + e.text.split(' — ')[0]; });
    } else {
      var picked = (disc.processes || []);
      pains = picked.map(function (sel) {
        var hrs = (disc.processHours || {})[sel] || '';
        return { name: sel, hours: hrs, est: est(hrs) };
      });
      scope = picked.slice(0, 5);
      ranked.forEach(function (p) { if (scope.length < 5 && scope.indexOf(p.name) === -1) scope.push(p.name); });
    }
    var ready = tools.map(function (t) { return { tool: t, item: DISCOVERY_TOOL_QS[t].ready }; });
    ready.push({ tool: 'Approvals', item: 'Sign-off for read-only third-party connections' + (disc.connectApprover && disc.connectApprover !== 'Me' ? ' — from ' + disc.connectApprover : '') });
    ready.push({ tool: 'Security', item: 'Your AI / data-security policy, if one exists' });
    var fx = FOCUS_EXTRA[focus];
    var fxAnswer = fx ? (fx.multi ? ((disc[fx.key] || []).join(', ') || '') : (disc[fx.key] || '')) : '';
    var readiness = [
      ['Connection approver', disc.connectApprover || '—'],
      ['Test environment', disc.sandbox || '—'],
      ['Customer matching across systems', disc.joinKeys || '—'],
      ['Invoice volume', disc.invoiceVol || '—'],
      ['Data rules', (disc.dataRules || []).join(', ') || '—'],
      ['Existing integrations', disc.existingIntegrations || '—']
    ];
    tools.forEach(function (t) {
      var o = (disc.toolOwners || {})[t];
      if (o) readiness.push([t + ' owner', o]);
    });
    if (fx && fxAnswer) readiness.push([fx.briefLabel, fxAnswer]);
    var sysNotes = tools.map(function (t) {
      var ans = (disc.toolAnswers || {})[t];
      return { tool: t, q: DISCOVERY_TOOL_QS[t].q, a: ans || '—' };
    });
    return {
      service: 'brief',
      title: 'Audit call brief — ' + (intake.company || 'your company'),
      subtitle: 'Co-built discovery: what we already know, what we’ll validate on the call, and what to have ready.',
      intro: 'This brief was assembled from your intake and discovery answers. It is the working spec for your Ops Automation Audit call — review it, correct anything, and bring it to the call.',
      focus: focus,
      painsTitle: fm.painsTitle,
      scopeTitle: fm.scopeTitle,
      snapshot: {
        company: intake.company || '—', industry: intake.industry || '—', headcount: intake.headcount || '—',
        role: intake.role || '—', goal: intake.goal || '—', kpis: (intake.kpis || []).join(', ') || '—',
        focus: fm.label,
        stack: tools.join(', ') + (intake.otherSystems ? '; also: ' + intake.otherSystems : '') || '—',
        team: disc.teamSize ? disc.teamSize + ' in finance/ops' : '—',
        timeline: disc.timeline || '—', budget: disc.budget || '—'
      },
      pains: pains,
      sysNotes: sysNotes,
      success: disc.success || '',
      scope: scope,
      step2: STEP2_PATH[focus],
      readiness: readiness,
      ready: ready,
      agenda: [
        'Walk the brief: confirm the pains and priorities (15 min)',
        fm.deep,
        'Systems access plan and what the audit will measure (10 min)',
        'Fixed price, timeline and the audit deliverable (10 min)'
      ],
      cta: 'The audit call turns this brief into a fixed-price, fixed-scope Ops Automation Audit — 2–3 weeks, your top five wins quantified.'
    };
  }

  /* ------------------------------------------- engagement: pricing & deliverables */
  var PRICING = {
    audit: { 'Under 50': 5000, '50–150': 8500, '150–300': 13500, '300–500': 18000, '500+': 22000 },
    step2Base: 30000, step2PerTool: 2500
  };
  function auditPrice(intake) { return PRICING.audit[(intake || {}).headcount] || 8500; }
  function step2Price(intake) {
    return PRICING.step2Base + selectedTools(intake || {}).length * PRICING.step2PerTool;
  }
  function money(n) { return '$' + n.toLocaleString('en-AU'); }

  /* Engagement states, in order */
  var ENGAGEMENT_STATES = ['discovery', 'proposal', 'step1_paid', 'step1_delivered', 'step2_paid', 'm2', 'm3'];
  function stateRank(st) { var i = ENGAGEMENT_STATES.indexOf(st); return i === -1 ? 0 : i; }

  var DELIVERABLES = {
    alchemy: {
      step1: [
        ['Ops Automation Audit report', '10–15 processes scored — your top five wins with hours and dollars quantified'],
        ['Prioritised automation roadmap', 'Sequenced by ROI, effort and dependency'],
        ['Executive readout deck', 'The findings, presented to your leadership']
      ],
      m1: [
        ['Read-only connections live', 'Systems connected through the agentic layer — nothing written back'],
        ['Data-quality report', 'What the connected data can and can’t support, before anything is built']
      ],
      m2: [
        ['Agentic automations in staging', 'Your priority processes running end-to-end on test data'],
        ['Automation specification', 'Each automation documented: triggers, guardrails, human checkpoints']
      ],
      m3: [
        ['Production automations', 'Live, monitored, with rollback'],
        ['Runbooks & training', 'Your team owns the daily operation — care plan optional']
      ]
    },
    aurora: {
      step1: [
        ['AI readiness scorecard', 'Data quality, system maturity and team capability, scored'],
        ['Governance pack & 90-day plan', 'Safe-to-automate classifications and a usable AI policy'],
        ['Draft metric catalogue', 'The KPIs that matter for your goal, defined once']
      ],
      m1: [
        ['Read-only connections live', 'Source systems connected through the integration layer'],
        ['Data-quality report', 'Which metrics your data can support today — and which need work']
      ],
      m2: [
        ['Decision-intelligence proposal', 'The KPI set that best serves your business: definitions, lineage, ownership'],
        ['Live dashboards in staging', 'Board pack and unit economics fed by real data']
      ],
      m3: [
        ['Production decision view', 'One reconciled view — ARR, churn and cash answers that match'],
        ['Board pack template & handover', 'Commentary is the only manual step left']
      ]
    },
    anatomy: {
      step1: [
        ['Current-state systems map', 'Every system touching finance and ops — data, breaks, owners', 'sysmap'],
        ['Target architecture & integration plan', 'The spine you need and the path to it', 'target'],
        ['Executive readout deck', 'The findings, presented to your leadership', 'readout']
      ],
      m1: [
        ['Read-only connections live', 'Source systems connected through the unified API layer (e.g. Merge)'],
        ['Data-quality report', 'Field-level reality: duplicates, mismatches, join keys']
      ],
      m2: [
        ['Business data ontology', 'Your master records, defined in your language, with single owners'],
        ['Architecture blueprint', 'The target-state design, ratified against real data']
      ],
      m3: [
        ['Integration runbook & handover', 'How the spine runs, breaks and recovers — documented'],
        ['Vendor-decision support pack', 'If a system must change, the buyer’s-side evaluation kit']
      ]
    }
  };
  DELIVERABLES.unsure = DELIVERABLES.alchemy;

  /* ------------------------------------------------------------- helpers */
  var CANON = ['Xero', 'MYOB', 'NetSuite', 'HubSpot', 'Salesforce', 'Stripe', 'Employment Hero', 'Deputy / Tanda', 'Productive', 'Kantata', 'HaloPSA / ConnectWise', 'Planning / FP&A', 'Other ERP', 'Spreadsheets'];

  function selectedTools(intake) {
    var sys = (intake && intake.systems) || [];
    return CANON.filter(function (t) { return sys.indexOf(t) !== -1; });
  }
  function ctxTags(intake) {
    var tags = [];
    var ind = INDUSTRIES[intake.industry] || INDUSTRIES['Other'];
    tags = tags.concat(ind.tags);
    if (GOALS[intake.goal]) tags = tags.concat(GOALS[intake.goal].tags);
    (intake.kpis || []).forEach(function (k) { tags = tags.concat(KPI_TAGS[k] || []); });
    return tags;
  }
  function scoreTags(itemTags, ctx) {
    var s = 0;
    itemTags.forEach(function (t) {
      var n = 0; ctx.forEach(function (c) { if (c === t) n++; });
      s += n;
    });
    return s;
  }
  function groupsSatisfied(groups, tools) {
    return groups.every(function (g) {
      return g.some(function (t) { return tools.indexOf(t) !== -1; });
    });
  }
  function missingFor(groups, tools) {
    var miss = [];
    groups.forEach(function (g) {
      if (!g.some(function (t) { return tools.indexOf(t) !== -1; })) miss.push(g[0]);
    });
    return miss;
  }
  function activeEdges(tools) {
    return EDGES.filter(function (e) {
      return tools.indexOf(e.pair[0]) !== -1 && tools.indexOf(e.pair[1]) !== -1;
    });
  }
  function industry(intake) { return INDUSTRIES[intake.industry] || INDUSTRIES['Other']; }
  function goalLine(intake) { return (GOALS[intake.goal] || {}).line || 'a stronger finance & ops foundation'; }

  function toolModelSection(tools) {
    return tools.filter(function (t) { return t !== 'Spreadsheets'; }).concat(
      tools.indexOf('Spreadsheets') !== -1 ? ['Spreadsheets'] : []
    ).map(function (t) {
      var T = TOOLS[t];
      return {
        heading: t + ' — ' + T.category,
        body: T.summary,
        list: T.entities.map(function (e) { return '<b>' + e[0] + '</b> — ' + e[1]; })
      };
    });
  }

  /* ------------------------------------------------------------ ANATOMY */
  function buildAnatomy(intake) {
    var tools = selectedTools(intake);
    var ind = industry(intake);
    function firstOf(cands, fallback) {
      for (var i = 0; i < cands.length; i++) { if (tools.indexOf(cands[i]) !== -1) return cands[i]; }
      return fallback;
    }
    var masters = [
      { key: 'customer', name: 'Customer', owner: firstOf(['HubSpot', 'Salesforce', 'Xero', 'MYOB', 'NetSuite'], '—') },
      { key: 'project', name: 'Engagement / Project', owner: firstOf(['Productive', 'Kantata', 'HaloPSA / ConnectWise'], '—') },
      { key: 'invoice', name: 'Invoice & Revenue', owner: firstOf(['Xero', 'MYOB', 'NetSuite', 'Other ERP', 'Stripe'], '—') },
      { key: 'employee', name: 'Employee', owner: firstOf(['Employment Hero', 'Deputy / Tanda'], '—') },
      { key: 'gl', name: 'General Ledger', owner: firstOf(['Xero', 'MYOB', 'NetSuite', 'Other ERP'], '—') }
    ];
    var rows = masters.map(function (m) {
      var feeders = tools.filter(function (t) { return TOOLS[t].feeds[m.key]; })
        .map(function (t) { return t + ' (' + TOOLS[t].feeds[m.key] + ')'; });
      return { entity: m.name, owner: m.owner, fedBy: feeders.length ? feeders.join('; ') : 'Not covered by your current stack' };
    });
    var moves = activeEdges(tools).slice(0, 3);
    var diagram = {
      tools: tools.filter(function (t) { return Object.keys(TOOLS[t].feeds).length > 0; }),
      masters: masters.map(function (m) {
        return {
          name: m.name, owner: m.owner,
          feeders: tools.filter(function (t) { return TOOLS[t].feeds[m.key]; })
        };
      })
    };
    return {
      service: 'anatomy',
      diagram: diagram,
      benchmarks: BENCHMARKS.anatomy,
      title: 'Your business spine, drafted',
      subtitle: 'A unified data model for ' + (intake.company || 'your business') + ' — built from your stack selection.',
      intro: ind.anatomy + ' Below: what each of your systems contributes, which system should own each master record, and the first integration moves.',
      toolModels: toolModelSection(tools),
      masterTable: rows,
      moves: moves.map(function (m) { return { heading: m.pair.join(' ↔ '), body: m.text }; }),
      gaps: rows.filter(function (r) { return r.fedBy.indexOf('Not covered') === 0 || r.owner === '—'; })
        .map(function (r) { return r.entity; }),
      cta: 'This is the generic version of your spine — drawn from your stack, not your data. The systems review connects to your actual instances, maps real field-level lineage, and produces the target-state architecture.'
    };
  }

  /* ------------------------------------------------------------- AURORA */
  function buildAurora(intake) {
    var tools = selectedTools(intake);
    var ctx = ctxTags(intake);
    var avail = [], gaps = [];
    METRICS.forEach(function (m) {
      var item = { name: m.name, formula: m.formula, why: m.why, score: scoreTags(m.tags, ctx) };
      if (groupsSatisfied(m.sources, tools)) avail.push(item);
      else { item.missing = missingFor(m.sources, tools); gaps.push(item); }
    });
    avail.sort(function (a, b) { return b.score - a.score; });
    gaps.sort(function (a, b) { return b.score - a.score; });
    var bms = BENCHMARKS.aurora.slice();
    if (tools.indexOf('Productive') !== -1 || tools.indexOf('Kantata') !== -1) bms.splice(2, 0, BENCHMARKS.auroraPSA);
    return {
      service: 'aurora',
      diagram: { tools: tools, outputs: ['Board pack', 'Unit economics', 'Forecasts & scenarios'] },
      benchmarks: bms,
      title: 'Decision intelligence: your metrics catalogue',
      subtitle: 'The metrics ' + (intake.company || 'your business') + ' can derive from its current stack — and the ones it can’t, yet.',
      intro: 'Aimed at ' + goalLine(intake) + '. Every metric below names its source objects and formula sketch — derivable from the systems you selected, before any new tooling.',
      toolModels: toolModelSection(tools),
      metrics: avail.slice(0, 10),
      gaps: gaps.slice(0, 3),
      cta: 'These are formula sketches, not your numbers. Step 1 connects your actual data, reconciles the definitions, and builds the board pack these metrics belong in.'
    };
  }

  /* ------------------------------------------------------------ ALCHEMY */
  function buildAlchemy(intake) {
    var tools = selectedTools(intake);
    var ctx = ctxTags(intake);
    var avail = [];
    PROCESSES.forEach(function (p) {
      if (groupsSatisfied(p.requires, tools)) {
        avail.push({ name: p.name, desc: p.desc, hours: p.hours, complexity: p.complexity, value: valueLine(p.hours), score: scoreTags(p.tags, ctx) });
      }
    });
    avail.sort(function (a, b) { return b.score - a.score; });
    return {
      service: 'alchemy',
      diagram: { processes: avail.slice(0, 10) },
      benchmarks: BENCHMARKS.alchemy,
      title: 'Your top automation use cases',
      subtitle: 'The ' + Math.min(avail.length, 10) + ' processes most worth automating for ' + (intake.company || 'your business') + ', ranked for your stack and goals.',
      intro: 'Ranked against ' + goalLine(intake) + ' and the systems you run. Hours are typical ranges for companies your size — the audit replaces them with your measured numbers.',
      toolModels: toolModelSection(tools),
      processes: avail.slice(0, 10),
      cta: 'Generic effort ranges, not your measurements. The Ops Audit times these processes in your business, scores ROI, and hands you a prioritised roadmap.'
    };
  }

  /* ------------------------------------------- Step 1 sample deliverables */
  function buildSample(type, intake, disc) {
    intake = intake || {}; disc = disc || {};
    var an = buildAnatomy(intake);
    var tools = selectedTools(intake);
    var edges = activeEdges(tools);
    var breaks = (disc.breaks && disc.breaks.length) ? disc.breaks : anatomyBreakCandidates(intake).slice(0, 5);
    var co = intake.company || 'your company';
    var asAt = new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
    var crmName = tools.indexOf('HubSpot') !== -1 ? 'HubSpot' : (tools.indexOf('Salesforce') !== -1 ? 'Salesforce' : null);
    var accName = tools.filter(function (t) { return ['Xero', 'MYOB', 'NetSuite', 'Other ERP'].indexOf(t) !== -1; })[0] || null;
    var SENS = { customer: 'Internal', invoice: 'Internal', gl: 'Sensitive', employee: 'Regulated (PII)', project: 'Internal' };

    if (type === 'sysmap') {
      // attribute inventory preview: first entities per tool, measured columns deferred to M1
      var attrPreview = [];
      tools.slice(0, 5).forEach(function (t) {
        TOOLS[t].entities.slice(0, 2).forEach(function (e) {
          attrPreview.push({ system: t, attribute: e[0], note: e[1], fill: 'M1', fresh: 'M1' });
        });
      });
      // duplicate systems: master-record keys fed by >1 system
      var dups = [];
      ['customer', 'invoice', 'project', 'employee', 'gl'].forEach(function (k) {
        var feeders = tools.filter(function (t) { return TOOLS[t].feeds[k]; });
        if (feeders.length > 1) dups.push({ capability: { customer: 'Customer records', invoice: 'Invoices / billing', project: 'Projects & work', employee: 'People data', gl: 'Ledger postings' }[k], systems: feeders.join(' + '), call: 'Keep / merge / kill — decided in the survivorship workshop' });
      });
      var pairA = crmName || tools[0] || 'System A', pairB = accName || tools[1] || 'System B';
      return {
        service: 'sample', sampleType: 'sysmap', asAt: asAt,
        title: 'Current-state systems map',
        subtitle: 'Every system touching finance & ops at ' + co + ' — attribute-level: what it holds, how fresh it is, who can touch it, where it breaks.',
        intro: 'Illustrative sample built from your stack selection and discovery answers. Columns marked M1 are measured during the connection phase — fill rates, freshness and access are extracted, not asked.',
        diagram: an.diagram,
        inventory: tools.map(function (t) {
          var T = TOOLS[t];
          var owns = Object.keys(T.feeds).map(function (k) { return T.feeds[k]; }).join('; ') || 'Consumer of the spine';
          return { tool: t, category: T.category, owner: (disc.toolOwners || {})[t] || 'TBC in workshop', owns: owns };
        }),
        attrPreview: attrPreview,
        dups: dups,
        resolvedSample: crmName && accName ? {
          entity: 'Northbridge Consulting Pty Ltd',
          rows: [
            [crmName, '“Northbridge Consulting”', 'domain: northbridge.com.au'],
            [accName, '“NORTHBRIDGE CONSULTING PTY LTD”', 'ABN present'],
            ['Resolved', 'Canonical: Northbridge Consulting Pty Ltd', 'confidence: high (0.93 — domain + invoice refs)']
          ]
        } : null,
        hitl: [
          { entity: 'Customer · Northbridge', attribute: 'Payment terms', conflict: (accName || 'Accounting') + ': 14 days · ' + (crmName || 'CRM') + ' deal: 30 days', action: 'Human-in-the-loop — finance ratifies' },
          { entity: 'Customer · Northbridge', attribute: 'Billing email', conflict: 'Two values, one stale 14 months', action: 'Auto — survivorship rule (freshest from billing system)' },
          { entity: 'Employee · 3 records', attribute: 'Cost rate', conflict: 'Payroll vs PSA differ by 4–8%', action: 'Human-in-the-loop — affects margin reporting' }
        ],
        accessFindings: [
          'Admin-level access counts per system — extracted in M1; discovery flags: ' + (tools.map(function (t) { return (disc.toolOwners || {})[t] ? null : t; }).filter(Boolean).join(', ') || 'all owners named') + (tools.some(function (t) { return !(disc.toolOwners || {})[t]; }) ? ' have no named owner yet' : ''),
          'Ex-staff and shared-login review — measured in M1, resolved before any write-back',
          'Attribute sensitivity classes assigned (Internal / Sensitive / Regulated-PII) — drives the access model in the target architecture'
        ],
        breaks: breaks,
        masterTable: an.masterTable,
        cta: 'The full map is extracted, not asked: every attribute with measured fill and freshness, every access grant listed, every mismatch queued for a decision.'
      };
    }
    if (type === 'target') {
      var waves = [];
      for (var i = 0; i < edges.length; i += 2) waves.push(edges.slice(i, i + 2));
      var theirWord = disc.entityWord || 'Clients';
      var IND_TERM = { 'Professional services': ['Engagement', 'Job / matter / project — three words, one concept'], 'Tech services / MSP': ['Agreement', 'Contract / managed service / retainer'], 'SaaS / software': ['Subscription', 'Deal / account / plan'], 'Construction': ['Job', 'Project / site / contract'], 'Healthcare': ['Service episode', 'Booking / appointment / claim'], 'Retail & ecommerce': ['Order', 'Sale / transaction / basket'] };
      var indTerm = IND_TERM[intake.industry] || ['Engagement', 'Project / job — used interchangeably'];
      var CHAIN_TAG = { customer: 'Sell', project: 'Deliver', invoice: 'Bill & collect', employee: 'Pay people', gl: 'Record & close' };
      return {
        service: 'sample', sampleType: 'target', asAt: asAt,
        title: 'Target architecture, ontology & integration plan',
        subtitle: 'The spine ' + co + ' needs — defined in your language, with survivorship rules and a sequenced path.',
        intro: 'Illustrative sample built from your stack selection. The real deliverable is ratified in two workshops — glossary and survivorship — and versioned from day one.',
        glossary: [
          { term: theirWord, theirs: 'Your word for the people you sell to (from discovery)', suggested: 'Customer — canonical master record', note: 'All systems map to it; your teams keep their word' },
          { term: indTerm[0], theirs: indTerm[1], suggested: indTerm[0] + ' — one definition, one owner', note: 'Ends the synonym drift between systems' },
          { term: 'Revenue', theirs: 'Currently: invoiced? collected? recognised? — varies by report', suggested: 'Three explicit terms: Invoiced / Collected / Recognised', note: 'The most expensive ambiguity in most reports' }
        ],
        principles: [
          'One owner per master record — every other system subscribes, never competes',
          'Write once, sync everywhere — re-keying is a defect, not a process',
          'Read-only connections first; write-back only after reconciliation proves clean',
          'Spreadsheets consume the spine — they never own master data'
        ],
        diagram: an.diagram,
        ontology: an.masterTable.map(function (row) {
          var key = { 'Customer': 'customer', 'Engagement / Project': 'project', 'Invoice & Revenue': 'invoice', 'Employee': 'employee', 'General Ledger': 'gl' }[row.entity] || 'customer';
          return { entity: row.entity, owner: row.owner, chain: CHAIN_TAG[key] || '—', sens: SENS[key] || 'Internal', surv: row.owner !== '—' ? row.owner + ' wins · freshest-on-tie' : 'TBC — no owner in current stack' };
        }),
        waves: waves.map(function (w, j) {
          return { name: 'Wave ' + (j + 1) + (j === 0 ? ' — highest leverage, lowest risk' : (j === waves.length - 1 && j > 0 ? ' — completion' : '')), moves: w };
        }),
        lineageNote: 'Every canonical attribute carries: source field(s) → survivorship rule → consumers (reports, metrics, automations) → value-chain link. The graph ships machine-readable alongside the document.',
        cta: 'The full plan adds the attribute-level survivorship matrix (ratified), effort estimates per wave, and a migration sequence that never breaks a live process.'
      };
    }
    // readout
    var brief = buildBrief(intake, { focus: 'anatomy', breaks: breaks });
    var au = buildAurora(intake);
    var al = buildAlchemy(intake);
    return {
      service: 'sample', sampleType: 'readout', asAt: asAt,
      title: 'Executive readout',
      subtitle: 'The audit findings for ' + co + ', presented for a leadership decision — one page per question.',
      intro: 'Illustrative sample built from your stack selection. The real readout carries measured numbers — attribute fill rates counted, mismatches queued, owners named.',
      slides: [
        { h: '1 · Situation', list: [
          (intake.industry || 'Your industry') + ' · ' + (intake.headcount || '—') + ' staff · goal: ' + (intake.goal || '—'),
          'Stack: ' + (tools.join(', ') || '—'),
          'Finance/ops team: ' + (disc.teamSize ? disc.teamSize + ' people' : 'TBC') ] },
        { h: '2 · What we found', list: breaks.concat(['Mismatch queue: N attribute conflicts — M auto-resolvable by survivorship rule, the rest need a human decision (measured in M1)']) },
        { h: '3 · What it costs', list: BENCHMARKS.anatomy.map(function (b) { return b.stat + ' — ' + b.label + ' (' + b.source + ')'; }) },
        { h: '4 · Recommendation', list: brief.scope },
        { h: '5 · The deliverable you sign off', list: [
          'Attribute inventory — fill, freshness, sensitivity per field',
          'Resolved-entity register + human-in-the-loop mismatch queue',
          'Ratified survivorship matrix + company glossary & ontology',
          'Lineage & value-chain graph · access model · duplicate-system decisions',
          'Versioned and as-at dated — this sample is v0.1, ' + asAt ] },
        { h: '6 · Ready for what’s next', list: [
          'Aurora: ' + au.metrics.length + ' metrics computable from this stack once the spine is ratified' + (au.gaps.length ? ' (' + au.gaps.length + ' blocked today)' : ''),
          'Alchemy: top automation candidates — ' + al.processes.slice(0, 3).map(function (p) { return p.name; }).join('; '),
          'Both readiness appendices ship inside this deliverable — the next phase arrives pre-scoped' ] },
        { h: '7 · Next 30 days', list: [
          'Sign-off on master-record ownership (one meeting)',
          'Read-only connections to ' + (tools.slice(0, 3).join(', ') || 'core systems'),
          'Wave 1 integration moves scoped and priced',
          'Step 2 proposal — audit fee credits 100% within 90 days' ] }
      ],
      cta: 'The full deck is presented live to your leadership — every number measured in your business, every recommendation priced.'
    };
  }

  /* ------------------------------------------- operator runbooks (condensed) */
  var OPERATOR_RUNBOOKS = {
    anatomy: [
      { name: 'A · Setup (days 0–2)', steps: [['A1', 'Re-read brief: systems, owners, join keys, volumes'], ['A2', 'Collect read-only access per system → access register'], ['A3', 'Sub-processor consent / security questionnaire'], ['A4', 'Sandbox vs production decision per system'], ['A5', 'Book glossary + survivorship workshops now']] },
      { name: 'B · Connect & profile (wk 1 → M1)', steps: [['B1', 'Connect read-only; log granted scopes'], ['B2', 'Pull schema + sampled records per object'], ['B3', 'Attribute inventory: fill, distincts, examples (masked)'], ['B4', 'Freshness analysis — last-update dates per attribute'], ['B5', 'Access-control extract: roles, sprawl, ex-staff'], ['B6', 'Duplicate-systems matrix: keep / merge / kill'], ['B7', 'PII / sensitivity classification per attribute']] },
      { name: 'C · Resolve entities (wk 2)', steps: [['C1', 'Entity resolution: deterministic → fuzzy, confidence tiers'], ['C2', 'Mismatch catalogue at attribute level'], ['C3', 'Split: auto-resolvable vs human-in-the-loop queue'], ['C4', 'Draft survivorship matrix per attribute'], ['C5', 'Owner reviews of low-confidence matches']] },
      { name: 'D · Define & ratify (wk 2–3)', steps: [['D1', 'Glossary workshop: company definitions harvested'], ['D2', 'Suggested canonical glossary mapped to synonyms'], ['D3', 'Ontology draft: entities, attributes, owners, relations'], ['D4', 'Lineage & value-chain graph'], ['D5', 'Access-control recommendations'], ['D6', 'Survivorship ratification workshop + decision log']] },
      { name: 'E · Package & bridge (wk 3 → M2)', steps: [['E1', 'Assemble deliverable, version + as-at date'], ['E2', 'Aurora readiness appendix (metric computability)'], ['E3', 'Alchemy readiness appendix (automation safety + HITL)'], ['E4', 'Leadership readout; decisions captured'], ['E5', 'Feed appendices into next-phase proposal']] }
    ],
    aurora: [
      { name: 'A · Setup (days 0–2)', steps: [['A1', 'Re-read brief: unanswerable metrics, reports today, hours'], ['A2', 'Access per system + copy of current board pack'], ['A3', 'Consent; confirm BI licences owned'], ['A4', 'Harvest definition conflicts — both versions in writing'], ['A5', 'Book definitions workshop + readout']] },
      { name: 'B · Connect & inventory (wk 1 → M1)', steps: [['B1', 'Connect read-only; log scopes'], ['B2', 'Metric-source inventory: KPI × attribute matrix'], ['B3', 'Input quality & freshness per KPI input'], ['B4', 'Reporting inventory: every recurring report, hours, owner'], ['B5', 'Computability triage: now / after fixes / not yet']] },
      { name: 'C · Define & reconcile (wk 2)', steps: [['C1', 'Metric definition catalogue: formula, grain, owner, cadence'], ['C2', 'Two-way reconciliation of every headline metric'], ['C3', 'Settle definition conflicts with computed evidence'], ['C4', 'Definitions workshop — catalogue ratified'], ['C5', 'Benchmark targets per KPI']] },
      { name: 'D · Build decision view (wk 2–3 → M2)', steps: [['D1', 'Dashboards in staging on their BI stack'], ['D2', 'Lineage per tile: number → metric → source fields'], ['D3', 'Commentary workflow SOP'], ['D4', 'Access model: board / exec / team views'], ['D5', 'Parallel-run one cycle vs old pack; reconcile divergence']] },
      { name: 'E · Readout & bridge (wk 3)', steps: [['E1', 'Assemble deliverable, version + as-at date'], ['E2', 'Anatomy readiness appendix (spine gaps surfaced)'], ['E3', 'Alchemy readiness appendix (report register, priced)'], ['E4', 'Readout with live reconciled numbers'], ['E5', 'Feed appendices into next-phase proposal']] }
    ],
    alchemy: [
      { name: 'A · Setup (days 0–2)', steps: [['A1', 'Re-read brief: processes, hours, autonomy appetite'], ['A2', 'Access per system; AI policy status (template if none)'], ['A3', 'Consent: agentic layer + LLM provider; residency check'], ['A4', 'Collect approval matrix in writing'], ['A5', 'Book process walkthroughs with the doers, not managers']] },
      { name: 'B · Connect & observe (wk 1 → M1)', steps: [['B1', 'Connect read-only; log scopes'], ['B2', 'Measure processes from timestamps: volumes, cycle times'], ['B3', 'Exception-rate measurement + top 5 deviations'], ['B4', 'Attribute touchpoint map per process'], ['B5', 'Current-automation inventory (Zapier etc.)'], ['B6', 'Walkthroughs: capture undocumented judgement calls']] },
      { name: 'C · Specify (wk 2)', steps: [['C1', 'Automation spec per process: trigger, guardrails, rollback'], ['C2', 'Autonomy tiering — never above client appetite in v1'], ['C3', 'HITL checkpoint design from judgement log + approvals'], ['C4', 'Measured ROI per automation (baseline hours × cost)'], ['C5', 'Prioritised build order signed']] },
      { name: 'D · Build in staging (wk 2–3 → M2)', steps: [['D1', 'Build agentic workflows; replay historical data'], ['D2', 'Acceptance tests: happy path + top 5 exceptions'], ['D3', 'Exception playbooks per automation'], ['D4', 'Monitoring, alerting, health metrics'], ['D5', 'Demo on their data; acceptance signed']] },
      { name: 'E · Cutover & bridge (wk 3–4 → M3)', steps: [['E1', 'Production cutover, one at a time, supervised week'], ['E2', 'Runbooks + training; ownership named'], ['E3', 'Baseline care-plan metrics (hours saved, health)'], ['E4', 'Anatomy readiness appendix (integration debt)'], ['E5', 'Aurora readiness appendix (newly feedable metrics)']] }
    ]
  };
  OPERATOR_RUNBOOKS.unsure = OPERATOR_RUNBOOKS.alchemy;

  var api = {
    buildSample: buildSample,
    OPERATOR_RUNBOOKS: OPERATOR_RUNBOOKS,
    TOOLS: TOOLS, METRICS: METRICS, PROCESSES: PROCESSES, EDGES: EDGES,
    BENCHMARKS: BENCHMARKS, hoursRange: hoursRange,
    DISCOVERY_TOOL_QS: DISCOVERY_TOOL_QS, DISCOVERY_CONSTANTS: DISCOVERY_CONSTANTS, buildBrief: buildBrief,
    DISCOVERY_CONNECT: DISCOVERY_CONNECT, FOCUS_EXTRA: FOCUS_EXTRA, STEP2_PATH: STEP2_PATH,
    PRICING: PRICING, DELIVERABLES: DELIVERABLES, ENGAGEMENT_STATES: ENGAGEMENT_STATES,
    auditPrice: auditPrice, step2Price: step2Price, money: money, stateRank: stateRank,
    FOCUS_META: FOCUS_META, auroraCandidates: auroraCandidates, anatomyBreakCandidates: anatomyBreakCandidates,
    valueChain: valueChain,
    CANON: CANON, INDUSTRIES: INDUSTRIES, GOALS: GOALS,
    selectedTools: selectedTools,
    buildAnatomy: buildAnatomy, buildAurora: buildAurora, buildAlchemy: buildAlchemy,
    build: function (service, intake) {
      if (service === 'anatomy') return buildAnatomy(intake);
      if (service === 'aurora') return buildAurora(intake);
      return buildAlchemy(intake);
    }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ArboledaReports = api;
})(typeof window !== 'undefined' ? window : this);

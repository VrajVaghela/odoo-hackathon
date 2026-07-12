# TransitOps - 8-Hour Build Plan and Team Division

## Shared operating rule

Prioritise one flawless end-to-end dispatch workflow over a wide but shallow product. A feature is complete only when its database write, validation, UI feedback, role permission, and demo seed state work together.

## Ownership

| Teammate | Role | File/module ownership | Primary judge criteria covered |
| --- | --- | --- | --- |
| 1 | Data and API Foundation Lead | db/, API auth, vehicles, drivers, dashboard modules | Database design, security, performance, scalability |
| 2 | Frontend and UX Lead | Web shell, tokens, reusable components, login, dashboard, vehicles, drivers | Frontend design, usability, coding standards |
| 3 | Operations Workflow Lead | API/web trip and maintenance feature modules | Logic, modularity, debugging |
| 4 | Finance, Reporting, and Quality Lead | API/web finance and report modules, seeds, test suite, demo assets | Performance, analytics, QA, presentation |

Use separate branches. Do not edit another owner's files without agreeing first. The only shared integration files are API route registration and web route registration; Teammate 1 applies agreed changes to those during scheduled integrations.

## Phase timeline

| Time | Phase | Goal | Exit gate |
| --- | --- | --- | --- |
| 00:00-00:25 | 0. Alignment | Lock scope, schema, API contract, visual tokens, and demo story. | Everyone can explain the six-step demo. |
| 00:25-01:35 | 1. Foundation | Runnable web/API/MySQL stack, schema, seed, auth shell, component shell. | Fresh seed plus login works. |
| 01:35-03:50 | 2. Operational core | Vehicle/driver CRUD and transaction-safe trip dispatch. | Invalid dispatch rejects; valid dispatch changes both statuses. |
| 03:50-05:35 | 3. Lifecycle and insight | Maintenance, fuel, expense, dashboard, analytics, CSV. | Completion and maintenance update availability and metrics. |
| 05:35-06:45 | 4. Hardening | RBAC, rule tests, responsiveness, empty/error/loading states, indexes. | Rule test matrix green and no role bypass. |
| 06:45-08:00 | 5. Demo lock | Seed reset, rehearsal, bug triage, screenshots, explanation. | Two full rehearsals without manual database edits. |

## Phase 0 - Alignment (00:00-00:25)

All teammates:

- [ ] Read project_overview.md, architecture.md, ui_tokens.md, and this file.
- [ ] Agree that no external API, BaaS, cloud database, map, email, AI, or chatbot will be added.
- [ ] Confirm one local command path for MySQL, API, web, migration, seed, and tests.
- [ ] Freeze the demo personas, sample users, sample vehicles, drivers, trips, and one planned invalid scenario.
- [ ] Put the provided UI mockup beside the team while implementing; use it as visual direction, not as a screenshot to copy.

## Phase 1 - Foundation (00:25-01:35)

| Owner | Deliverable |
| --- | --- |
| Teammate 1 | Migrations, seed, MySQL pool, API health check, auth/session/RBAC middleware, vehicle/driver route contracts. |
| Teammate 2 | App shell, dark token CSS, navigation, route guard shell, login form, standard table/form/badge components. |
| Teammate 3 | Trip and maintenance module interfaces, shared state-machine constants, dispatch validation test cases before implementation. |
| Teammate 4 | Finance/report interfaces, deterministic demo dataset specification, test runner setup, demo script skeleton. |

Integration checkpoint at 01:25:

- [ ] Fresh database migration and seed run.
- [ ] Dispatcher login reaches the shell.
- [ ] All four roles can be selected from seeded local accounts.

## Phase 2 - Operational core (01:35-03:50)

| Owner | Deliverable |
| --- | --- |
| Teammate 1 | Vehicle and driver CRUD, filter queries, available-resource query, dashboard KPI query. |
| Teammate 2 | Dashboard, vehicle registry, driver/safety screens, responsive table-to-card fallback, validation presentation. |
| Teammate 3 | Trip draft/create/dispatch/cancel transactions and the capacity, licence, and double-assignment rules. |
| Teammate 4 | Seed six purposeful scenarios and write API tests for all dispatch acceptance/rejection cases. |

Integration checkpoint at 03:40:

- [ ] Vehicle registration duplicate returns 409 with a specific message.
- [ ] Expired/suspended driver cannot dispatch.
- [ ] In-shop/retired/on-trip vehicle cannot dispatch.
- [ ] Cargo overflow cannot dispatch.
- [ ] Valid dispatch changes trip, vehicle, and driver state atomically.

## Phase 3 - Lifecycle and insight (03:50-05:35)

| Owner | Deliverable |
| --- | --- |
| Teammate 1 | Dashboard aggregation optimisation, vehicle status counts, audit-log support for operational actions. |
| Teammate 2 | Trip dispatcher and maintenance UX using shared form, modal, status, and alert components. |
| Teammate 3 | Complete/cancel trip transactions; open/close maintenance transactions and UI. |
| Teammate 4 | Fuel and expense logging, analytic aggregation, visual reports, local CSV export. |

Integration checkpoint at 05:25:

- [ ] Complete trip returns driver and vehicle to Available and records actual distance.
- [ ] Maintenance creates In Shop state and closes safely.
- [ ] Fuel/expense rows alter operational cost and fuel-efficiency outputs.
- [ ] Every state-changing request writes an audit entry.

## Phase 4 - Hardening (05:35-06:45)

All teammates work on bugs only after running their module checklist.

- [ ] Teammate 1 checks indexes, parameterised SQL, session expiry, role middleware, and API error consistency.
- [ ] Teammate 2 checks 320 px mobile, keyboard navigation, focus visibility, contrast, empty states, loading states, and error language.
- [ ] Teammate 3 runs the complete mandatory-rule test matrix and fixes transaction/status edge cases.
- [ ] Teammate 4 resets seed, runs CSV export, checks numbers against known expected values, and records demo evidence.
- [ ] Everyone tests each other’s owned screen once and files concise reproduction steps for bugs.

## Phase 5 - Demo lock (06:45-08:00)

- [ ] Freeze scope. New features require unanimous approval and a direct scoring benefit.
- [ ] Rebuild from fresh migration and seed.
- [ ] Run the complete demo twice with no manual SQL correction.
- [ ] Assign exact speaking ownership: database, logic, UX, reporting/QA.
- [ ] Keep one teammate as live navigator and one as backup debugger.
- [ ] Capture final screenshots and the local start commands.

## Scoring-to-evidence matrix

| Criterion | What reviewers should see |
| --- | --- |
| Coding standards | Typed module boundaries, small functions, no duplicate business rule code, meaningful errors. |
| Logic | Invalid dispatch is blocked server-side; valid dispatch automatically updates statuses. |
| Modularity | Trip, maintenance, finance, reporting, and UI components are independently owned modules. |
| Frontend design | Dense but readable dark command centre, responsive layouts, clear status colour and hierarchy. |
| Performance | Indexed filters, pool, pagination, aggregates in SQL, no N+1 query pattern. |
| Scalability | Transactional domain actions, stateless API sessions, clean module boundaries. |
| Security | Hashed password, HttpOnly session, RBAC, validation, parameterised SQL, safe errors. |
| Usability | Role-relevant navigation, immediate validation, disabled invalid actions, empty/loading/error states. |
| Debugging skill | Reproducible test matrix, audit log, deterministic seed/reset, clear error codes. |
| Database design | Normalised MySQL relationships, constraints, indexes, transaction plan, auditable writes. |

## Cut order if time is tight

Never cut authentication, RBAC, vehicle/driver CRUD, dispatch rules, state transitions, maintenance, fuel/expense persistence, dashboard KPIs, or the test/demo flow.

Cut in this order:

1. Advanced charts and visual polish beyond the supplied mockup direction.
2. CSV export niceties beyond a correct download.
3. Fine-grained settings UI.
4. Bonus PDF export, email reminders, vehicle-document upload, and dark-mode toggle.

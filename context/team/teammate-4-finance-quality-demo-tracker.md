# Teammate 4 - Finance, Quality, and Demo Tracker

Owner name: ____________________  
Branch: feat/finance-reports  
Status: In progress
Primary responsibility: fuel/expense/reporting modules, analytics UI, deterministic scenarios, test evidence, and demo readiness.

## Definition of done

- All finance metrics are calculated from MySQL records, with known values verified against seed data.
- CSV export matches the on-screen report query.
- The demo can reset and run twice without manual database edits.
- The team has a concise explanation for database, logic, UX, and quality evidence.

## Current Phase 2 evidence - 2026-07-12

- Purposeful reset scenarios now include an off-duty driver, an exact-capacity draft (`TRP-104`), and a one-kilogram-over-capacity draft (`TRP-105`).
- The dispatch-rule test stubs have been replaced with typed API checks for capacity rollback, boundary acceptance, atomic resource/audit updates, invalid trip status, vehicle conflicts, and driver compliance conflicts.
- Independently calculated fresh-seed baseline: 2 available, 1 on-trip, 1 in-shop, and 1 retired vehicle; backend active-fleet utilisation is 25%; 2 drivers are dispatch-eligible; 3 trips are pending dispatch; fuel cost is INR 4,500 and toll expense is INR 350.
- Static type checks and production builds pass. Fresh reset succeeded, the complete API suite passed 16/16 checks, and the live dashboard read model matched the calculated baseline; see `teammate-4-phase2-defects.md` for the integration defect recorded so far.

## Current Phase 3 integration note - 2026-07-12

- Finance and reporting modules, their tokenised UI feature modules, and reusable `CostSummary`/`SimpleBarChart` components are in progress and compile successfully.
- Direct MySQL service verification confirmed fuel/expense persistence, audit-backed writes, operational-cost aggregation, fuel efficiency, ROI, and CSV generation.
- Shared registration remains intentionally pending with Teammate 1: mount `finance/routes.ts` at `/api/v1/finance`, mount `reports/routes.ts` at `/api/v1/reports`, and replace the `finance`/`reports` placeholders in `App.tsx` with `FinancePage`/`ReportsPage`.

## Phase 0 - 00:00-00:25

- [x] Define exact seeded scenarios: available, on-trip, in-shop, retired, expired licence, suspended, capacity failure, completed trip, and finance records.
- [x] Define expected KPI, fuel-efficiency, operational-cost, and ROI values.
- [x] Draft demo narrative and evidence checklist.

## Phase 1 - 00:25-01:35

- [x] Create finance/report endpoint contract with Teammate 1.
- [x] Set up built-in test runner and test naming convention.
- [x] Prepare seed/reset verification checklist.
- [x] Draft analytics component requirements with Teammate 2.

## Phase 2 - 01:35-03:50

- [x] Implement deterministic seed/reset script with purposeful records.
- [x] Write dispatch API tests for happy path and each rejection from Teammate 3 rule matrix.
- [x] Verify dashboard values against direct expected seed totals.
- [x] Record concise defect reports with reproduction steps during integration.

## Phase 3 - 03:50-05:35

- [ ] Implement fuel log create/list validation.
- [ ] Implement expense create/list validation.
- [ ] Implement report aggregation for fuel efficiency, fleet utilisation, operational cost, and ROI.
- [ ] Implement server-side CSV export from report data.
- [ ] Build finance and analytics screens using shared components.
- [ ] Build tokenised simple bar/cost visuals and accessible text summaries.

## Phase 4 - 05:35-06:45

- [ ] Verify every metric with independently calculated expected result.
- [ ] Test CSV escaping and totals.
- [ ] Run complete test suite after integration.
- [ ] Run fresh migration/seed/reset and record exact start commands.
- [ ] Prepare two concise debugging examples: failed dispatch and maintenance conflict resolved through logs/tests.

## Phase 5 - 06:45-08:00

- [ ] Lead two timed demo rehearsals.
- [ ] Time each speaker and remove dead clicks/loading waits.
- [ ] Prepare fallback path if a seeded record is unexpectedly changed.
- [ ] Capture screenshots/evidence if submission asks for it.
- [ ] Update shared progress tracker and announce final quality-gate state.

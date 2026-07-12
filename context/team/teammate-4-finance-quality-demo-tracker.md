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

- Finance and reporting modules, their tokenised UI feature modules, and reusable `CostSummary`/`SimpleBarChart` components are complete and compile successfully.
- End-to-end Financial Analyst verification confirmed authenticated fuel/expense writes, audit-backed persistence, operational-cost aggregation, fuel efficiency, ROI, report CSV export, and refreshed finance/report views.
- Shared routes are mounted at `/api/v1/finance` and `/api/v1/reports`; Financial Analyst navigation now renders `FinancePage` and `ReportsPage`.

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

- [x] Implement fuel log create/list validation.
- [x] Implement expense create/list validation.
- [x] Implement report aggregation for fuel efficiency, fleet utilisation, operational cost, and ROI.
- [x] Implement server-side CSV export from report data.
- [x] Build finance and analytics screens using shared components.
- [x] Build tokenised simple bar/cost visuals and accessible text summaries.

## Phase 4 - 05:35-06:45

- [x] Verify every metric with independently calculated expected result.
- [x] Test CSV escaping and totals.
- [x] Run complete test suite after integration.
- [x] Run fresh migration/seed/reset and record exact start commands.
- [x] Prepare two concise debugging examples: failed dispatch and maintenance conflict resolved through logs/tests.

## Current Phase 4 evidence - 2026-07-12

- Fresh seed validation is encoded in `apps/api/test/finance-reports.test.ts`: fleet utilisation is 25%, completed revenue INR 1,200, fuel INR 4,500, maintenance INR 0, expenses INR 350, operational cost INR 4,850, fleet ROI -3.06%; `KA-01-AA-1111` has 500 completed km, 50 L, 10 km/L, INR 4,850 cost, and -22% ROI.
- The same regression test changes a vehicle name only within its test transaction window and proves CSV escaping for commas, quotes, and a newline; it also asserts the `FLEET TOTAL` CSV row matches the summary totals. The original name is restored in `finally`.
- Verified from a fresh reset: `npm.cmd run db:reset`, then `npm.cmd run test` passed 23/23 API tests. `npm.cmd run build:api` and `npm.cmd run build:web` both pass; use `npm.cmd run dev` to start the API and web clients for the local demo.
- Debug example — failed dispatch: reset, sign in as Dispatcher, and attempt `POST /api/v1/trips/{TRP-105 id}/dispatch` with `KA-01-AA-1111` and an available driver. Cargo is 801 kg against the van's 800 kg capacity; the dispatch rule test asserts the capacity error and verifies the trip/resource state was rolled back. Evidence: `apps/api/test/trips-dispatch.test.ts` (“rejects cargo above capacity and rolls back the attempted dispatch”).
- Debug example — maintenance conflict: reset, sign in as Fleet Manager, open maintenance for an available vehicle, then repeat the same open request. The first request changes the vehicle to `IN_SHOP` and records audit rows; the second returns `VEHICLE_ALREADY_IN_MAINTENANCE` without another active record. Evidence: `apps/api/test/phase2.test.ts` (“Maintenance: Open and Close Maintenance workflow”) and the row-lock/audit transaction in `apps/api/src/modules/maintenance/service.ts`.

## Phase 5 - 06:45-08:00

- [ ] Lead two timed demo rehearsals.
- [ ] Time each speaker and remove dead clicks/loading waits.
- [ ] Prepare fallback path if a seeded record is unexpectedly changed.
- [ ] Capture screenshots/evidence if submission asks for it.
- [ ] Update shared progress tracker and announce final quality-gate state.

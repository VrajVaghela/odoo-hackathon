# Teammate 4 - Finance, Quality, and Demo Tracker

Owner name: ____________________  
Branch: feat/finance-reports  
Status: Not started / In progress / Blocked / Ready for integration  
Primary responsibility: fuel/expense/reporting modules, analytics UI, deterministic scenarios, test evidence, and demo readiness.

## Definition of done

- All finance metrics are calculated from MySQL records, with known values verified against seed data.
- CSV export matches the on-screen report query.
- The demo can reset and run twice without manual database edits.
- The team has a concise explanation for database, logic, UX, and quality evidence.

## Phase 0 - 00:00-00:25

- [ ] Define exact seeded scenarios: available, on-trip, in-shop, retired, expired licence, suspended, capacity failure, completed trip, and finance records.
- [ ] Define expected KPI, fuel-efficiency, operational-cost, and ROI values.
- [ ] Draft demo narrative and evidence checklist.

## Phase 1 - 00:25-01:35

- [ ] Create finance/report endpoint contract with Teammate 1.
- [ ] Set up built-in test runner and test naming convention.
- [ ] Prepare seed/reset verification checklist.
- [ ] Draft analytics component requirements with Teammate 2.

## Phase 2 - 01:35-03:50

- [ ] Implement deterministic seed/reset script with purposeful records.
- [ ] Write dispatch API tests for happy path and each rejection from Teammate 3 rule matrix.
- [ ] Verify dashboard values against direct expected seed totals.
- [ ] Record concise defect reports with reproduction steps during integration.

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

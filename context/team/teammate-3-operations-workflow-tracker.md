# Teammate 3 - Operations Workflow Tracker

Owner name: ____________________  
Branch: feat/trips-maintenance  
Status: In progress  
Primary responsibility: trip state machine, dispatch business rules, maintenance workflow, transaction tests, and trip/maintenance feature UI.

## Definition of done

- Every mandatory trip and maintenance rule is enforced by a transaction-safe service.
- Error responses identify the operational conflict clearly.
- Trip and maintenance screens guide users to legal next actions only.
- The owner can demonstrate and explain race/conflict protection with row locking.

## Phase 0 - 00:00-00:25

- [x] Convert every mandatory rule into a failing/passing test case.
- [x] Agree available-resource contract with Teammate 1.
- [x] Agree trip/maintenance feature component boundaries with Teammate 2.

## Phase 1 - 00:25-01:35

- [x] Define trip and maintenance state constants/types.
- [x] Define validators and typed domain error codes.
- [x] Draft service pseudocode for dispatch, complete, cancel, open maintenance, and close maintenance.
- [x] Prepare test fixtures using agreed seed identifiers.

## Phase 2 - 01:35-03:50

- [x] Implement trip draft/create.
- [x] Implement dispatch transaction with vehicle/driver row locks.
- [x] Reject cargo above capacity.
- [x] Reject retired/in-shop/on-trip vehicle.
- [x] Reject expired/suspended/on-trip/non-available driver.
- [x] Reject vehicle/driver double assignment.
- [x] Update trip, vehicle, and driver status atomically.
- [x] Build trip dispatcher form, eligibility messages, lifecycle component, and live board.

## Phase 3 - 03:50-05:35

- [x] Implement trip completion with actual distance/odometer validation.
- [x] Implement dispatched-trip cancellation and safe availability restore.
- [x] Implement open-maintenance transaction and In Shop transition.
- [x] Implement close-maintenance transaction and conditional Available restore.
- [x] Build maintenance log/form/status experience.
- [x] Add audit events through Teammate 1 helper.

Progress note (2026-07-12): Trip completion/cancellation and both maintenance transactions are implemented with row locks and audit events; the maintenance router is registered at `/api/v1/maintenance` (list, get, open, close). The maintenance feature UI is still outstanding — the frontend Maintenance screen remains a placeholder pending this handoff.

## Phase 4 - 05:35-06:45

- [x] Run every mandatory business-rule test both before and after integration.
- [ ] Test repeat submit, stale UI, rapid double dispatch, and illegal lifecycle actions.
- [ ] Fix root service logic and add regression coverage for every discovered defect.
- [ ] Rehearse invalid capacity and maintenance scenarios with Teammate 4.

Verification note (2026-07-12): Reset the deterministic MySQL seed and ran the full API mandatory business-rule suite before integration verification: `npm run test --workspace=apps/api` passed 20/20 tests. Reset the seed again and reran the same suite after integration verification: 20/20 tests passed. Covered dispatch capacity overflow rollback, capacity boundary success, invalid trip status, unavailable vehicle states, driver compliance/availability conflicts, trip complete/cancel workflows, maintenance open/close workflow, and audit assertions.

## Handoff checklist

- [ ] Share all error codes and messages with Teammate 2.
- [ ] Share state-change events/dashboard refresh needs with Teammates 1 and 4.
- [ ] Update shared progress tracker.

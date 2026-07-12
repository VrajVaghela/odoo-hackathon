# Teammate 3 - Operations Workflow Tracker

Owner name: ____________________  
Branch: feat/trips-maintenance  
Status: Not started / In progress / Blocked / Ready for integration  
Primary responsibility: trip state machine, dispatch business rules, maintenance workflow, transaction tests, and trip/maintenance feature UI.

## Definition of done

- Every mandatory trip and maintenance rule is enforced by a transaction-safe service.
- Error responses identify the operational conflict clearly.
- Trip and maintenance screens guide users to legal next actions only.
- The owner can demonstrate and explain race/conflict protection with row locking.

## Phase 0 - 00:00-00:25

- [ ] Convert every mandatory rule into a failing/passing test case.
- [ ] Agree available-resource contract with Teammate 1.
- [ ] Agree trip/maintenance feature component boundaries with Teammate 2.

## Phase 1 - 00:25-01:35

- [ ] Define trip and maintenance state constants/types.
- [ ] Define validators and typed domain error codes.
- [ ] Draft service pseudocode for dispatch, complete, cancel, open maintenance, and close maintenance.
- [ ] Prepare test fixtures using agreed seed identifiers.

## Phase 2 - 01:35-03:50

- [ ] Implement trip draft/create.
- [ ] Implement dispatch transaction with vehicle/driver row locks.
- [ ] Reject cargo above capacity.
- [ ] Reject retired/in-shop/on-trip vehicle.
- [ ] Reject expired/suspended/on-trip/non-available driver.
- [ ] Reject vehicle/driver double assignment.
- [ ] Update trip, vehicle, and driver status atomically.
- [ ] Build trip dispatcher form, eligibility messages, lifecycle component, and live board.

## Phase 3 - 03:50-05:35

- [ ] Implement trip completion with actual distance/odometer validation.
- [ ] Implement dispatched-trip cancellation and safe availability restore.
- [ ] Implement open-maintenance transaction and In Shop transition.
- [ ] Implement close-maintenance transaction and conditional Available restore.
- [ ] Build maintenance log/form/status experience.
- [ ] Add audit events through Teammate 1 helper.

## Phase 4 - 05:35-06:45

- [ ] Run every mandatory business-rule test both before and after integration.
- [ ] Test repeat submit, stale UI, rapid double dispatch, and illegal lifecycle actions.
- [ ] Fix root service logic and add regression coverage for every discovered defect.
- [ ] Rehearse invalid capacity and maintenance scenarios with Teammate 4.

## Handoff checklist

- [ ] Share all error codes and messages with Teammate 2.
- [ ] Share state-change events/dashboard refresh needs with Teammates 1 and 4.
- [ ] Update shared progress tracker.

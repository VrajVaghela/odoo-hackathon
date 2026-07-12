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

Progress note (2026-07-12): Trip completion/cancellation and both maintenance transactions are implemented with row locks and audit events; the maintenance router is registered at `/api/v1/maintenance` (list, get, open, close). The frontend Maintenance screen is implemented with log listing, open-maintenance form, active/closed filters, close workflow, loading/empty/error states, and success feedback.

## Phase 4 - 05:35-06:45

- [x] Run every mandatory business-rule test both before and after integration.
- [x] Test repeat submit, stale UI, rapid double dispatch, and illegal lifecycle actions.
- [x] Fix root service logic and add regression coverage for every discovered defect.
- [x] Rehearse invalid capacity and maintenance scenarios with Teammate 4.

Verification note (2026-07-12): Reset the deterministic MySQL seed and ran the full API mandatory business-rule suite before integration verification: `npm run test --workspace=apps/api` passed 20/20 tests. Reset the seed again and reran the same suite after integration verification: 22/22 tests passed. Covered dispatch capacity overflow rollback, capacity boundary success, invalid trip status, unavailable vehicle states, driver compliance/availability conflicts, rapid double-dispatch rejection, lifecycle drift rejection on completion/cancellation, and maintenance open/close workflow plus audit assertions.

## Handoff checklist

- [x] Share all error codes and messages with Teammate 2.
- [x] Share state-change events/dashboard refresh needs with Teammates 1 and 4.
- [x] Update shared progress tracker.

### Trip/maintenance error codes (for Teammate 2 frontend integration)

All errors are `DomainError` subclasses returned as `{ code, message, field? }` by the central error middleware. `code` is stable and safe to switch on in the UI; `message` is human-readable and safe to render as-is.

| HTTP | code | field | Raised by |
|---|---|---|---|
| 404 | `NOT_FOUND` | - | any missing trip/vehicle/driver/maintenance log id |
| 422 | `INVALID_TRIP_STATUS` | - | dispatch requires DRAFT; complete requires DISPATCHED |
| 422 | `VEHICLE_RETIRED` | `vehicle_id` | dispatch, open maintenance |
| 422 | `VEHICLE_IN_SHOP` | `vehicle_id` | dispatch |
| 422 | `VEHICLE_ON_TRIP` | `vehicle_id` | dispatch, open maintenance |
| 422 | `VEHICLE_NOT_AVAILABLE` | `vehicle_id` | dispatch (catch-all status guard) |
| 422 | `VEHICLE_NOT_ON_TRIP` | `vehicle_id` | complete/cancel (vehicle state drifted since dispatch) |
| 422 | `VEHICLE_ALREADY_IN_MAINTENANCE` | `vehicle_id` | open maintenance |
| 422 | `DRIVER_SUSPENDED` | `driver_id` | dispatch |
| 422 | `DRIVER_OFF_DUTY` | `driver_id` | dispatch |
| 422 | `DRIVER_ON_TRIP` | `driver_id` | dispatch |
| 422 | `DRIVER_NOT_AVAILABLE` | `driver_id` | dispatch (catch-all status guard) |
| 422 | `DRIVER_NOT_ON_TRIP` | `driver_id` | complete/cancel (driver state drifted since dispatch) |
| 422 | `DRIVER_LICENCE_EXPIRED` | `driver_id` | dispatch |
| 422 | `CARGO_EXCEEDS_CAPACITY` | `cargo_weight_kg` | dispatch |
| 422 | `DISTANCE_EXCEEDS_LIMIT` | `actual_distance_km` | complete (actual > 3x planned) |
| 422 | `TRIP_NOT_ASSIGNED` | - | complete, if trip somehow has no vehicle/driver |
| 422 | `TRIP_ALREADY_COMPLETED` | - | cancel |
| 422 | `TRIP_ALREADY_CANCELLED` | - | cancel |
| 422 | `MAINTENANCE_LOG_NOT_ACTIVE` | - | close maintenance on an already-closed log |
| 400 | `VALIDATION_ERROR` | varies | missing/invalid `service_type`, `description`, `cost` on maintenance |

All of the above are surfaced through row-locked, re-checked transactions, so a rapid double-submit (double dispatch, double close, etc.) always resolves to exactly one success and one of these codes for the loser — never a partial state.

### State-change/audit events (for Teammates 1 and 4)

Every mutation writes an audit row via the shared `logAuditEvent` helper, in this order per transaction:

- Dispatch: `trip:TRIP_DISPATCHED`, `vehicle:VEHICLE_STATUS_CHANGED` (→ ON_TRIP), `driver:DRIVER_STATUS_CHANGED` (→ ON_TRIP)
- Complete: `trip:TRIP_COMPLETED`, `vehicle:VEHICLE_STATUS_CHANGED` (→ AVAILABLE, includes `odometer_increment_km`), `driver:DRIVER_STATUS_CHANGED` (→ AVAILABLE)
- Cancel: `trip:TRIP_CANCELLED`, and only if it was DISPATCHED: `vehicle:VEHICLE_STATUS_CHANGED` (→ AVAILABLE), `driver:DRIVER_STATUS_CHANGED` (→ AVAILABLE)
- Open maintenance: `vehicle:VEHICLE_STATUS_CHANGED` (→ IN_SHOP), `maintenance_log:MAINTENANCE_OPENED`
- Close maintenance: `maintenance_log:MAINTENANCE_CLOSED`, and `vehicle:VEHICLE_STATUS_CHANGED` (→ AVAILABLE) unless the vehicle was independently retired while in the shop, in which case it stays RETIRED and no vehicle audit row is written

Dashboard refresh implication for Teammate 1: any of the vehicle/driver status changes above can move the KPI cards (total/available vehicles, available drivers, active dispatches, fleet utilisation, in-shop, retired) and the vehicle-status donut. There is no push/event bus — the dashboard should re-query `/api/v1/dashboard` after any trip or maintenance mutation completes, the same way the Trips and Maintenance screens already refetch their own lists on success.

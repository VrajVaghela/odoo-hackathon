# TransitOps - Shared Progress Tracker

Rule: update this file and the relevant individual tracker immediately after a feature is verified. A checkbox means built, tested against MySQL, and ready for the scripted demo - not merely started.

## Phase 0 - Alignment

- [x] Scope locked to the MVP and cut list agreed.
- [x] Demo script and seeded scenarios agreed.
- [x] MySQL schema and transaction plan reviewed by all four teammates.
- [x] API input/output contract agreed.
- [x] UI tokens and reusable component plan agreed.

## Phase 1 - Foundation

- [x] Monorepo/app structure created.
- [x] Local MySQL connection configuration documented.
- [x] Ordered migrations created and run successfully.
- [x] Deterministic seed/reset script created.
- [x] Health endpoint responds.
- [x] Local login/session flow works.
- [x] RBAC middleware and role-aware navigation work.
- [x] App shell, token CSS, and reusable primitives render.

## Phase 2 - Operational core

- [x] Vehicle registry create/list/filter/edit works.
- [x] Registration uniqueness is enforced by MySQL and API.
- [x] Driver registry create/list/filter/edit works.
- [x] Licence expiry/suspended statuses are visible.
- [x] Dashboard KPI query and filters work.
- [x] Trip draft/create works.
- [x] Capacity validation blocks invalid dispatch.
- [x] Expired/suspended/unavailable driver validation blocks dispatch.
- [x] Retired/in-shop/on-trip vehicle validation blocks dispatch.
- [x] Dispatch transaction updates trip, vehicle, and driver atomically.
- [x] Dispatch conflicts return clear, testable error codes.

Verification note (2026-07-12): Teammate 4 reset the local database successfully, verified the seeded dashboard baseline against the live read model, and ran the complete API suite successfully (16/16 passing).

## Phase 3 - Lifecycle and insight

- [x] Trip completion updates availability and actual trip data.
- [x] Trip cancellation restores availability safely.
- [x] Open maintenance sets vehicle to In Shop.
- [x] Close maintenance restores vehicle to Available unless retired.
- [x] Fuel logging persists liters, cost, date, vehicle, and optional trip.
- [x] Expense logging persists category, amount, date, vehicle/trip.
- [x] Dashboard refreshes after domain mutations.
- [x] Fuel efficiency report derives from persisted data.
- [x] Operational cost report derives from fuel, maintenance, and expense data.
- [x] ROI report derives from revenue, fuel, maintenance, and acquisition cost.
- [x] CSV export is correct and downloaded locally.
- [x] State-changing actions create audit records.

Verification note (2026-07-12): Maintenance open/close transactions are implemented with vehicle row locks, IN_SHOP/AVAILABLE/RETIRED transitions, and audit events; the maintenance router is registered at `/api/v1/maintenance`. Teammate 4 finance/reporting is complete: fuel and expense persistence, fuel-efficiency/operational-cost/ROI reporting, CSV export, and Financial Analyst fuel/expense and analytics screens are live at `/api/v1/finance` and `/api/v1/reports`. Teammate 2 Phase 3 frontend integration is verified: the dashboard client uses `/api/v1/dashboard` for Dispatcher-safe data, the trip workflow remains integrated, and the Maintenance screen consumes the live API with shared form, status, error, empty, loading, and confirmation primitives. Defect D4-P2-001 is fixed. Verified with `npm.cmd run build --workspace=apps/web`.

## Phase 4 - Quality gates

- [ ] Required role is checked at every sensitive API route.
- [ ] Password/session/token data is not logged or exposed.
- [ ] All SQL uses parameters.
- [ ] Dispatch and maintenance transactions use row locking/re-checks.
- [ ] Essential query indexes exist and are documented.
- [x] Registry screens handle loading, empty, error, and no-results states.
- [x] Desktop, tablet, and mobile layouts are reviewed.
- [x] Keyboard, focus, label, and contrast checks pass.
- [x] Mandatory business-rule tests pass.
- [ ] Fresh migration + seed + complete demo flow pass.

Verification note (2026-07-12): Teammate 3 Phase 4 mandatory business-rule matrix was run against a reset MySQL seed before and after integration verification. `npm run test --workspace=apps/api` passed 20/20 both times, covering dispatch rejection/success rules, lifecycle completion/cancellation, maintenance open/close, RBAC-adjacent integration checks, and audit assertions.

Frontend verification note (2026-07-12): Teammate 2 hardened the app shell, login quick-select, dashboard, vehicle/driver forms, trip panels, and shared loading grids for token-aligned responsive behaviour at mobile/tablet/desktop widths. Focus visibility remains covered by the global `:focus-visible` rule, labels and alert live regions are present on owner forms, and owner registry screens expose loading, empty/no-results, and error states. Verified with `npm.cmd run build --workspace=apps/web`, `npm.cmd run build --workspace=apps/api`, `npm.cmd run db:reset`, and `npm.cmd run test` passing 20/20.

## Phase 5 - Submission and demo

- [ ] README has local setup, reset, test, and demo commands.
- [ ] Demo seed accounts and story are documented without real secrets.
- [ ] Each teammate can explain their owned module.
- [ ] Two full demo rehearsals pass.
- [ ] Screenshots/video evidence captured if required.
- [ ] Scope freeze observed; no untested bonus feature remains.

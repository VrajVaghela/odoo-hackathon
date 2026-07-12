# TransitOps - Shared Progress Tracker

Rule: update this file and the relevant individual tracker immediately after a feature is verified. A checkbox means built, tested against MySQL, and ready for the scripted demo - not merely started.

## Phase 0 - Alignment

- [ ] Scope locked to the MVP and cut list agreed.
- [ ] Demo script and seeded scenarios agreed.
- [ ] MySQL schema and transaction plan reviewed by all four teammates.
- [ ] API input/output contract agreed.
- [ ] UI tokens and reusable component plan agreed.

## Phase 1 - Foundation

- [ ] Monorepo/app structure created.
- [ ] Local MySQL connection configuration documented.
- [ ] Ordered migrations created and run successfully.
- [ ] Deterministic seed/reset script created.
- [ ] Health endpoint responds.
- [ ] Local login/session flow works.
- [ ] RBAC middleware and role-aware navigation work.
- [ ] App shell, token CSS, and reusable primitives render.

## Phase 2 - Operational core

- [ ] Vehicle registry create/list/filter/edit works.
- [ ] Registration uniqueness is enforced by MySQL and API.
- [ ] Driver registry create/list/filter/edit works.
- [ ] Licence expiry/suspended statuses are visible.
- [ ] Dashboard KPI query and filters work.
- [ ] Trip draft/create works.
- [ ] Capacity validation blocks invalid dispatch.
- [ ] Expired/suspended/unavailable driver validation blocks dispatch.
- [ ] Retired/in-shop/on-trip vehicle validation blocks dispatch.
- [ ] Dispatch transaction updates trip, vehicle, and driver atomically.
- [ ] Dispatch conflicts return clear, testable error codes.

## Phase 3 - Lifecycle and insight

- [ ] Trip completion updates availability and actual trip data.
- [ ] Trip cancellation restores availability safely.
- [ ] Open maintenance sets vehicle to In Shop.
- [ ] Close maintenance restores vehicle to Available unless retired.
- [ ] Fuel logging persists liters, cost, date, vehicle, and optional trip.
- [ ] Expense logging persists category, amount, date, vehicle/trip.
- [ ] Dashboard refreshes after domain mutations.
- [ ] Fuel efficiency report derives from persisted data.
- [ ] Operational cost report derives from fuel, maintenance, and expense data.
- [ ] ROI report derives from revenue, fuel, maintenance, and acquisition cost.
- [ ] CSV export is correct and downloaded locally.
- [ ] State-changing actions create audit records.

## Phase 4 - Quality gates

- [ ] Required role is checked at every sensitive API route.
- [ ] Password/session/token data is not logged or exposed.
- [ ] All SQL uses parameters.
- [ ] Dispatch and maintenance transactions use row locking/re-checks.
- [ ] Essential query indexes exist and are documented.
- [ ] Registry screens handle loading, empty, error, and no-results states.
- [ ] Desktop, tablet, and mobile layouts are reviewed.
- [ ] Keyboard, focus, label, and contrast checks pass.
- [ ] Mandatory business-rule tests pass.
- [ ] Fresh migration + seed + complete demo flow pass.

## Phase 5 - Submission and demo

- [ ] README has local setup, reset, test, and demo commands.
- [ ] Demo seed accounts and story are documented without real secrets.
- [ ] Each teammate can explain their owned module.
- [ ] Two full demo rehearsals pass.
- [ ] Screenshots/video evidence captured if required.
- [ ] Scope freeze observed; no untested bonus feature remains.

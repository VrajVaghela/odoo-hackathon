# Teammate 1 - Data and API Foundation Tracker

Owner name: Antigravity (Teammate 1)  
Branch: feat/data-api  
Status: Ready for integration  
Primary responsibility: MySQL schema, local auth, vehicle/driver APIs, dashboard read model, and integration of shared route registration.

## Definition of done

- Fresh migration and seed work on another teammate machine.
- API returns typed, safe, consistent errors.
- All owned writes are parameterised, indexed where needed, and auditable.
- Handoff includes endpoint contract, seed assumptions, test result, and tracker update.

## Phase 0 - 00:00-00:25

- [x] Review project data model with all teammates.
- [x] Decide migration numbering and local environment variable names.
- [x] Publish Vehicle, Driver, Dashboard, and Auth request/response contracts.
- [x] Agree seeded account roles and safe local demo password process.

## Phase 1 - 00:25-01:35

- [x] Create MySQL connection pool and transaction helper.
- [x] Create migrations for roles, users, sessions, vehicles, drivers, trips, maintenance logs, fuel logs, expenses, and audit logs.
- [x] Add foreign keys, unique constraints, checks, and the documented indexes.
- [x] Create deterministic seeds for roles, accounts, fleet assets, and drivers.
- [x] Implement health endpoint and central error middleware.
- [x] Implement password hash/verify, opaque session create/validate/destroy, and login attempt limiting.
- [x] Implement role middleware and current-user endpoint.

## Phase 2 - 01:35-03:50

- [x] Implement vehicle repository/service/controller/routes.
- [x] Enforce unique normalised registration number and valid lifecycle changes.
- [x] Implement vehicle filters and paginated list query.
- [x] Implement driver repository/service/controller/routes.
- [x] Enforce unique licence number, score range, and valid status values.
- [x] Implement available-resource query contract for Teammate 3.
- [x] Implement dashboard KPI and filtered status queries for Teammate 2.

## Phase 3 - 03:50-05:35

- [ ] Add audit-log helper usable by all state-changing services.
- [ ] Validate dashboard query count and index use.
- [ ] Integrate agreed route registrations from Teammates 3 and 4.
- [ ] Support dashboard refresh data after trip, maintenance, and finance mutations.

## Phase 4 - 05:35-06:45

- [ ] Confirm every SQL query uses placeholders.
- [ ] Confirm sensitive routes use authentication and correct role middleware.
- [ ] Review session expiry, cookie flags, and safe error responses.
- [ ] Check dashboard/registry queries against index plan.
- [ ] Help reproduce and fix integration blockers without changing another owner's rule logic.

## Handoff checklist

- [ ] Share migration/seed command.
- [ ] Share seed data IDs/codes that frontend uses only through API.
- [ ] Share endpoint examples and errors with Teammates 2, 3, and 4.
- [ ] Update shared progress tracker.

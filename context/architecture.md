# TransitOps - Architecture

## Stack decision

| Layer | Choice | Why it is right for this hackathon |
| --- | --- | --- |
| Web client | React + Vite + TypeScript | Fast local iteration and a responsive, component-driven operations UI. |
| API | Node.js + Express + TypeScript | A small, explicit modular monolith that is easy to demo and debug. |
| Database | Local MySQL 8 | Relational constraints, transactions, indexed reporting, and a design judges can inspect. |
| Data access | mysql2 promise pool with parameterised SQL | Keeps SQL visible and avoids ORM magic during a database-focused evaluation. |
| Auth | Local opaque session stored in MySQL; Node crypto password hashing | No external auth provider or third-party service. |
| Charts and export | Native SVG/CSS charts and generated CSV | No external charting, analytics, or export API. |
| Tests | Node built-in test runner plus API integration checks | Demonstrates debugging discipline with minimal tooling overhead. |

No third-party API, BaaS, remote database, browser extension, or cloud integration is permitted in the MVP.

## System boundary

    React web app
        -> same-origin JSON API
        -> service layer
        -> repository layer
        -> MySQL transaction / indexed queries

The browser never connects to MySQL. Controllers never contain business rules or inline SQL. A service owns a business action; repositories own SQL; controllers translate HTTP input/output.

## Recommended repository structure

    apps/
      api/
        src/
          config/
          db/
            pool.ts
            transaction.ts
          middleware/
          modules/
            auth/
            dashboard/
            drivers/
            vehicles/
            trips/
            maintenance/
            finance/
            reports/
          shared/
            errors/
            validation/
            types/
          app.ts
          server.ts
        test/
      web/
        src/
          app/
          components/
          features/
            auth/
            dashboard/
            vehicles/
            drivers/
            trips/
            maintenance/
            finance/
            reports/
          lib/
          styles/
          main.tsx
    db/
      migrations/
      seeds/
    scripts/
    context/

## Module contract

Every API module contains route, controller, service, repository, validator, and types files when needed. A new module may depend on shared utilities but not reach into another module's repository.

| Module | Owns | Key actions |
| --- | --- | --- |
| auth | Login, logout, session, RBAC | Sign in, rate-limit failed attempts, attach current user |
| vehicles | Fleet assets | Create, list, update, retire, dispatch eligibility |
| drivers | Driver profiles and compliance | Create, list, availability, licence validity |
| trips | Dispatch lifecycle | Draft, validate, dispatch, complete, cancel |
| maintenance | Vehicle service workflow | Open/close maintenance and state sync |
| finance | Fuel and other costs | Log fuel, log expense, per-vehicle cost |
| dashboard | Operational read model | KPI summary and filtered operational lists |
| reports | Analytics read model | Efficiency, utilisation, cost, ROI, CSV |

## MySQL data model

Use UTC timestamps, DECIMAL for money and measurements that must remain exact, and InnoDB foreign keys. IDs can be BIGINT UNSIGNED AUTO_INCREMENT for speed and easy inspection.

| Table | Core columns | Rules and purpose |
| --- | --- | --- |
| roles | id, code unique, label | Seed FLEET_MANAGER, DISPATCHER, SAFETY_OFFICER, FINANCIAL_ANALYST. |
| users | id, role_id FK, email unique, password_hash, is_active, failed_login_count, lock_until, created_at | A user has exactly one MVP role. Email is normalised to lowercase. |
| sessions | id, user_id FK, token_hash unique, expires_at, created_at | Store only a hash of a random opaque browser session token. |
| vehicles | id, registration_number unique, name, model, vehicle_type, max_capacity_kg, odometer_km, acquisition_cost, status, region, retired_at | Status: AVAILABLE, ON_TRIP, IN_SHOP, RETIRED. Capacity, odometer, and cost are non-negative. |
| drivers | id, full_name, licence_number unique, licence_category, licence_expiry_date, contact_number, safety_score, status | Status: AVAILABLE, ON_TRIP, OFF_DUTY, SUSPENDED. Safety score is 0 to 100. |
| trips | id, trip_code unique, source, destination, vehicle_id FK nullable for draft, driver_id FK nullable for draft, cargo_weight_kg, planned_distance_km, actual_distance_km, status, revenue, dispatched_at, completed_at | Status: DRAFT, DISPATCHED, COMPLETED, CANCELLED. A non-draft trip requires vehicle and driver. |
| maintenance_logs | id, vehicle_id FK, service_type, description, opened_at, closed_at, cost, status | Status: ACTIVE, CLOSED. Only one active maintenance record per vehicle is allowed by application transaction check. |
| fuel_logs | id, vehicle_id FK, trip_id FK nullable, logged_at, liters, cost, odometer_km | Liters and cost are positive; an attached trip must belong to the same vehicle. |
| expenses | id, vehicle_id FK nullable, trip_id FK nullable, category, amount, occurred_at, note | Category: TOLL, PARKING, OTHER, MAINTENANCE_ADJUSTMENT. Amount is positive. |
| audit_logs | id, actor_user_id FK nullable, entity_type, entity_id, action, before_json, after_json, created_at | Append-only operational trace for judge walkthrough and debugging. |

## Essential relationships

    roles 1--* users 1--* sessions
    vehicles 1--* trips
    drivers 1--* trips
    vehicles 1--* maintenance_logs
    vehicles 1--* fuel_logs
    trips 1--* fuel_logs
    vehicles 1--* expenses
    trips 1--* expenses
    users 1--* audit_logs

## Business-rule enforcement

Do not rely on disabled UI controls alone. Dispatch, completion, cancellation, opening maintenance, and closing maintenance each run inside one database transaction.

Dispatch transaction:

1. Lock the requested vehicle and driver rows with SELECT FOR UPDATE.
2. Re-read their statuses and licence expiry inside the transaction.
3. Reject retired/in-shop/on-trip vehicle, unavailable/suspended/on-trip driver, expired licence, invalid trip state, or cargo over capacity.
4. Update the trip to DISPATCHED and set both resource statuses to ON_TRIP.
5. Insert audit records and commit. Roll back every partial change on error.

Completion/cancellation reverses resource availability only when it is safe to do so. Opening active maintenance locks the vehicle, rejects an on-trip vehicle, writes the log, and sets IN_SHOP. Closing maintenance restores AVAILABLE unless the vehicle is RETIRED.

## Index plan

| Index | Reason |
| --- | --- |
| unique vehicles(registration_number) | Required uniqueness and fast registration lookup. |
| unique drivers(licence_number) | Prevent duplicate compliance identities. |
| vehicles(status, vehicle_type, region) | Dashboard/filter and dispatch eligibility query. |
| drivers(status, licence_expiry_date) | Availability and compliance query. |
| trips(status, vehicle_id, driver_id, dispatched_at) | Live-board, state checks, and report filtering. |
| maintenance_logs(vehicle_id, status, opened_at) | Fast active-maintenance lookup. |
| fuel_logs(vehicle_id, logged_at) | Efficiency and cost aggregation. |
| expenses(vehicle_id, occurred_at) | Vehicle cost aggregation. |
| audit_logs(entity_type, entity_id, created_at) | Fast trace during debugging. |

## API shape

Use versioned, predictable JSON endpoints. Return 201 for creates, 204 for successful deletes/logouts, 409 for state conflict, 422 for semantic validation failure, and one stable error shape:

    {
      "error": {
        "code": "CARGO_EXCEEDS_CAPACITY",
        "message": "Cargo is 200 kg over VAN-05's 500 kg capacity.",
        "field": "cargoWeightKg"
      }
    }

Example actions:

    POST /api/v1/auth/login
    GET  /api/v1/dashboard?vehicleType=&status=&region=
    GET  /api/v1/vehicles
    POST /api/v1/vehicles
    GET  /api/v1/drivers
    POST /api/v1/trips
    POST /api/v1/trips/:id/dispatch
    POST /api/v1/trips/:id/complete
    POST /api/v1/trips/:id/cancel
    POST /api/v1/maintenance
    POST /api/v1/maintenance/:id/close
    POST /api/v1/fuel-logs
    POST /api/v1/expenses
    GET  /api/v1/reports/summary
    GET  /api/v1/reports/export.csv

## Security and resilience

- Hash passwords with Node crypto scrypt and a unique random salt; never seed a plaintext password in output or logs.
- Generate opaque session tokens with crypto random bytes, store only their hash, send them in Secure, HttpOnly, SameSite=Strict cookies in production.
- Validate all input on the server and use parameterised SQL exclusively.
- Centralise authorisation middleware per route/action. A hidden page is not authorisation.
- Return safe error messages; log technical stack traces only server-side.
- Add a small in-memory login attempt limiter keyed by email/IP for the hackathon demo.
- Use a MySQL connection pool, query pagination, explicit selected columns, indexes, and aggregate queries instead of loading tables into memory.

## Scalability story for judges

TransitOps is intentionally a modular monolith: simple to ship in eight hours, but its module boundaries, transaction-safe state changes, indexed tables, stateless API sessions, and isolated report queries allow future extraction or horizontal API scaling without changing domain rules.

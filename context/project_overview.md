# TransitOps - Project Overview

## Product

TransitOps is a local-first transport operations command centre for fleet teams. It replaces spreadsheet-driven vehicle, driver, dispatch, maintenance, fuel, and expense workflows with one auditable system that prevents invalid operational decisions before they happen.

The winning story is not "we made CRUD screens." It is: "TransitOps protects a dispatcher from a costly conflict, keeps the fleet state accurate automatically, and immediately shows the financial result."

## Users and outcomes

| Role | Primary outcome | MVP permissions |
| --- | --- | --- |
| Fleet Manager | Keep the fleet available, maintained, and efficiently used. | Vehicles, maintenance, dashboard |
| Dispatcher | Create only safe, feasible trips. | Dashboard, trips |
| Safety Officer | Ensure only compliant drivers can be assigned. | Drivers and compliance view |
| Financial Analyst | Understand fuel, maintenance, and operating cost. | Fuel, expenses, analytics |

## Primary demo flow

1. Sign in as Dispatcher and open the dashboard.
2. Show that retired, in-shop, and on-trip vehicles are absent from the available-dispatch selector.
3. Attempt a trip with cargo above the selected vehicle capacity. Show the exact validation reason and disabled dispatch action.
4. Correct the cargo, dispatch the trip, and show vehicle and driver change to On Trip everywhere.
5. Complete the trip with final odometer and fuel usage. Show both records return to Available and analytics change.
6. Create an active maintenance record. Show the vehicle move to In Shop and disappear from dispatch availability.
7. Switch to Financial Analyst and show vehicle cost, fuel efficiency, fleet utilisation, and ROI backed by real MySQL rows.

This one narrative proves logic, usability, data integrity, RBAC, modularity, analytics, and database design.

## MVP scope

- Email/password authentication and four-role RBAC.
- Responsive dark operations UI based on the supplied mockups.
- Dashboard KPIs, filters, recent trips, and vehicle-status breakdown.
- Vehicle registry with unique registration number and lifecycle statuses.
- Driver registry with licence expiry, safety score, and status.
- Trip creation, dispatch, completion, and cancellation with enforced state transitions.
- Maintenance workflow that removes a vehicle from dispatch eligibility.
- Fuel logs, operational expenses, automatic cost metrics, and CSV export.
- Local MySQL database, migrations, deterministic seed data, validation, audit trail, and a short automated rule test suite.

## Explicitly out of scope

- Live GPS, maps, route optimisation, IoT ingestion, SMS/email delivery, payment systems, document storage, and real notifications.
- External APIs, BaaS products, cloud databases, analytics services, AI services, chatbots, or blockchain.
- PDF export, dark-mode toggle, document management, and email reminders unless all MVP quality gates are green with at least 45 minutes remaining.
- A microservice split. Use one modular monolith for speed and reliability.

## Constraints and non-negotiables

- Hackathon duration: 8 hours, four teammates.
- MySQL is the source of truth. All shown dashboard and report values must derive from persisted rows, never hard-coded fixtures.
- The demo must run locally without internet access after dependencies are installed.
- Server validation is authoritative; client validation exists only for fast feedback.
- Every status change must be traceable in an audit log.

## Definition of done

The MVP is done only when:

- The full demo flow works against a fresh migration and seed.
- Every mandatory business rule is enforced by API/service tests.
- At least two invalid actions visibly fail with specific human-readable reasons.
- Every role sees only permitted pages/actions.
- No secret, password, database URL, or mock data is committed outside the local example configuration.
- The team can explain each table, foreign key, index, and state transition in under two minutes.

# Teammate 4 - Phase 2 Integration Defects

## D4-P2-001 - Dispatcher dashboard aggregates inaccessible registry endpoints

- **Status:** Open - assign to Teammate 2 / Teammate 1 integration.
- **Precondition:** Sign in as the seeded Dispatcher account and navigate to Dashboard.
- **Steps:**
  1. Load the dashboard as `dispatcher@transitops.com`.
  2. Observe requests made by `apps/web/src/features/dashboard/dashboardApi.ts`.
  3. The client requests `GET /api/v1/vehicles` and `GET /api/v1/drivers` to calculate KPIs.
- **Expected:** The dashboard shows MySQL-backed vehicle, driver, trip, and utilisation metrics for an authorised Dispatcher.
- **Actual:** Both registry endpoints reject the Dispatcher with `403 FORBIDDEN`; the client catches and replaces each response with an empty list. The dashboard therefore derives zero vehicle/driver metrics instead of calling the authorised `GET /api/v1/dashboard` read model.
- **Impact:** The Phase 2 dashboard is misleading for the primary Dispatcher demo persona and does not meet the MySQL-backed KPI requirement.
- **Suggested fix:** Have the dashboard API client consume the existing `/api/v1/dashboard` endpoint (or agree a dedicated dashboard DTO with Teammate 1) rather than aggregating role-restricted registry routes client-side.

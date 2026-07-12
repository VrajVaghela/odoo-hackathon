# TransitOps Phase 5 Demo Runbook

Owner: Teammate 4 (quality and demo lead)
Starting state: run `npm.cmd run db:reset` from the repository root, then `npm.cmd run dev` and open `http://localhost:5173`.

## Scope freeze

Only fixes for a reproducible demo blocker are allowed during Phase 5. Record the endpoint/screen, exact steps, expected result, actual result, and a regression check before changing code. Do not add features, dependencies, or schema changes.

## Timed rehearsal script (target: 6 minutes)

| Target time | Speaker/owner | Screen and action | Evidence to say aloud |
| --- | --- | --- | --- |
| 0:00-0:30 | Teammate 1 | Explain the local MySQL reset, seeded roles, and login. | MySQL is the source of truth; reset recreates all purposeful scenarios. |
| 0:30-1:35 | Teammate 3 | Sign in as Dispatcher. Attempt `TRP-105` with `KA-01-AA-1111`. | 801 kg exceeds the van's 800 kg capacity; the server rejects it and leaves resources unchanged. |
| 1:35-2:20 | Teammate 3 | Dispatch the exact-capacity `TRP-104`, then complete it. | The transaction changes trip, vehicle, and driver together; completion restores availability. |
| 2:20-3:10 | Teammate 3 | Sign in as Fleet Manager; open maintenance for an available vehicle and show its `IN_SHOP` state. | Active maintenance removes a vehicle from dispatch eligibility; retrying the open action is rejected. |
| 3:10-4:30 | Teammate 4 | Sign in as Financial Analyst; open Fuel & Expenses, then Analytics. | The report reads persisted MySQL fuel/expense/trip data: 25% utilisation, INR 4,850 operational cost, 10 km/L for `KA-01-AA-1111`, and -3.06% fleet ROI. |
| 4:30-5:00 | Teammate 4 | Export CSV. | The export uses the same report query and escapes commas, quotes, and newlines. |
| 5:00-6:00 | Teammate 2 | Point out role-aware navigation, responsive layout, labels, focus, and feedback states. | Users only see their permitted workflow; server RBAC remains authoritative. |

## Two rehearsal record

Do not mark a rehearsal as passed until it is run in the browser from a fresh reset.

| Run | Reset before start | Target/actual time | Result | Blocker or follow-up |
| --- | --- | --- | --- | --- |
| 1 | Pending | Pending | Pending | Pending |
| 2 | Pending | Pending | Pending | Pending |

## Fallback path

1. Stop the local dev servers with `Ctrl+C`.
2. Run `npm.cmd run db:reset` at the repository root.
3. Start again with `npm.cmd run dev` and refresh `http://localhost:5173`.
4. Use the seeded accounts above; do not repair data with manual SQL during a demo.
5. If the UI is unavailable, show the deterministic checks with `npm.cmd run test`; the finance/report suite verifies the same seeded report values and CSV totals.

## Evidence checklist

- Screenshot the capacity rejection with its specific server message.
- Screenshot the maintenance `IN_SHOP` state and the Analytics summary/vehicle row.
- Save the downloaded CSV if the submission requires an artifact.
- Record the two rehearsal durations and any dead click/loading wait in the table above.

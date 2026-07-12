# TransitOps - Library and Local-Service Rules

## Local-only policy

TransitOps may use local runtime packages, but it must not call a third-party service or external API. No Firebase, Supabase, Auth0, MongoDB Atlas, Google Maps, email provider, analytics SDK, cloud storage, AI API, chatbot, payment gateway, or hosted database.

Pin exact package versions in the lockfile at the beginning of the event. Do not upgrade dependencies during the demo window.

## React and Vite

- Use React function components and TypeScript props.
- Keep feature API calls in feature-level client files, not directly inside presentational components.
- Build one reusable AppShell, DataTable, FormField, StatusBadge, EmptyState, LoadingState, ErrorAlert, ConfirmDialog, and MetricCard before creating duplicate variants.
- Use native browser fetch with a small wrapper that handles JSON, 401 redirect/logout, error-code parsing, and request cancellation.
- Do not use a remote UI kit, template, icon CDN, analytics library, or charting service.

## Express and Node

- Use Express only as the HTTP composition layer. All domain logic lives in service modules.
- Add one terminal error middleware that translates typed application errors into the documented JSON error format.
- Use built-in Node crypto for passwords, opaque session tokens, and secure random values.
- Use built-in Node test for the mandatory business-rule suite.
- Explicitly set JSON body limits and avoid returning raw database rows when a response DTO is clearer.

## MySQL 8 and mysql2 promise

- Use a single connection pool configured from environment variables.
- Use parameterised prepared queries for every dynamic value. Whitelist optional sort columns and directions.
- Run dispatch, completion, cancellation, maintenance open, and maintenance close inside one transaction.
- Use SELECT FOR UPDATE to lock involved vehicle, driver, and trip rows before a state transition.
- Use DECIMAL for currency and capacity-related numeric fields where precision matters. Convert deliberately at API boundaries.
- Keep migration SQL in db/migrations and seeded demo records in db/seeds. A fresh machine must be able to recreate the demo state from them.

## Native visual analytics and CSV

- Create simple bar/line/ratio visuals with semantic HTML plus CSS or inline SVG. Data must be received from the report API.
- CSV export is generated server-side from the same report query that powers the screen. Escape commas, quotes, and newlines correctly.
- Do not add an external export or chart API to save time.

## Permitted and prohibited dependency decisions

| Decision | Status | Reason |
| --- | --- | --- |
| React, Vite, Express, TypeScript, mysql2 | Permitted local runtime dependency | They run in the project and do not outsource product capability. |
| Native browser fetch, CSS, SVG, Node crypto, Node test | Preferred | Fewer moving parts and easy explanation. |
| ORM | Avoid for MVP | Visible SQL and migrations better demonstrate MySQL design. |
| Charting/icon/UI service | Avoid | Build simple local components using the supplied mockup as direction. |
| Any hosted API/BaaS | Prohibited | Violates local-first constraint and weakens database/security evidence. |

## Dependency approval rule

Before adding any package, the owner must answer:

1. Is this a local implementation dependency rather than a service/API?
2. Can the team explain why it is necessary in the demo?
3. Does it replace code that can be written safely in less than 30 minutes?
4. Does it introduce credentials, network dependency, or evaluation risk?

If the answer to 2 or 3 is no, do not add it.

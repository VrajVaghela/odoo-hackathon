# TransitOps - Code Standards

## TypeScript and naming

- Use TypeScript strict mode. Do not introduce any, implicit any, or unchecked JSON casts.
- Use PascalCase for React components and TypeScript types; camelCase for values/functions; SCREAMING_SNAKE_CASE for fixed status/role constants; kebab-case for filenames.
- One public responsibility per file. Split a file before it becomes hard to scan, not after it becomes a conflict hotspot.
- Use named exports except for page route entry points where a default export is required by the router.
- Represent money and measurements as Decimal-compatible strings/numbers at API edges; never use floating-point arithmetic for stored money.

## Backend rules

- Route: URL, method, middleware list only.
- Controller: parse request, call service, translate response; no SQL and no business decisions.
- Service: owns one domain action and transaction boundary.
- Repository: contains parameterised SQL only; never reads request objects.
- Validator: parses/normalises input before service execution.
- Middleware: authentication, authorisation, error handling, correlation id, and rate limit only.

Do not duplicate a business rule in multiple routes. The client may predict a rule for usability, but the service is the only authority.

## Frontend rules

- Build from feature modules and reusable primitives. A page composes components; it does not contain duplicated table, modal, or form logic.
- Use ui_tokens.md values through CSS custom properties or token classes. Do not insert arbitrary colours, spaces, shadows, or breakpoints inside components.
- Keep server state and UI state separate. Server data is fetched/mutated through a feature API client; local modal/filter/input state stays local.
- Every mutation shows pending, success, and failure feedback. Preserve user input after a failed validation.
- Use semantic buttons, labels, tables, headings, and live regions for dynamic errors.

## Errors and validation

- Validate shape, required fields, range, enum values, and cross-field rules on the server.
- Return a stable code plus a clear human message. Never expose SQL, stack traces, hash values, or environment details.
- Use 401 for missing/expired session, 403 for authenticated but forbidden, 404 for absent resource, 409 for conflict, and 422 for a valid request shape that violates a domain rule.
- Use custom typed DomainError values; do not scatter raw Error strings through services.

## Database rules

- Every schema change is an ordered migration; never edit a previously applied migration.
- Seed data must be deterministic and idempotent or reset-safe.
- Use foreign keys, unique constraints, check constraints, indexes, and transactions intentionally. Explain each in the schema notes.
- SQL must always use placeholders. Do not concatenate input into SQL, even for sorting or filters; whitelist sortable columns.
- Lock rows and re-check eligibility inside the dispatch/maintenance transaction.

## Security rules

- Secrets belong only in local environment files excluded from Git. Commit a redacted example environment file, never real values.
- Do not log passwords, session tokens, complete request bodies, or database credentials.
- Hash passwords with a salted memory-hard algorithm available through Node crypto; compare safely.
- Authorise the action, not merely the screen. Validate record ownership/scope where relevant.
- Keep CORS restricted to the local frontend origin during development and same-origin in production.

## Performance rules

- Select only required columns; paginate registry screens; filter/aggregate in MySQL.
- Add an index only for an observed query path and document its purpose.
- Use one connection pool. Do not open a connection per request.
- Avoid N+1 API/database calls. Dashboard uses a bounded number of aggregate queries.
- Debounce non-critical text search on the client and cancel obsolete requests.

## Test and debugging rules

- Each mandatory rule has at least one passing and one failing test/seed scenario.
- A bug report states precondition, steps, expected result, actual result, endpoint/screen, and screenshot or error code.
- Fix the root rule/service, then add a regression case. Never patch only the visible screen.
- Audit logs must identify the actor, action, entity, before state where practical, and after state.

## Collaboration rules

- Keep commits small and scoped: feat(trips), fix(dispatch), test(maintenance), docs(schema).
- Before handoff, run the owner’s relevant tests and update both shared and personal trackers.
- Do not reformat or move unrelated files. Resolve conflicts with the owner, not by overwriting their work.
- No copy-pasted code that a teammate cannot explain. Be ready to justify every dependency and schema choice.

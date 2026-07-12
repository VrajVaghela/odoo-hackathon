# TransitOps Agent Instructions

## Required context-loading order

Before implementation, read these files in this exact order:

1. context/project_overview.md
2. context/architecture.md
3. context/build_plan.md
4. context/code_standards.md
5. context/library_docs.md
6. context/ui_tokens.md
7. context/ui_rules.md
8. context/ui_registry.md
9. context/progress_tracker.md

Then read the relevant teammate tracker in context/team before changing files owned by that role.

## Product guardrails

- Build TransitOps as a local-first, MySQL-backed modular monolith.
- Do not call external APIs or services. Do not add BaaS, hosted auth, cloud database, map, email, AI, analytics, chatbot, payment, or storage integration.
- Keep the MVP to vehicles, drivers, dispatch lifecycle, maintenance, fuel/expenses, dashboard, reports, authentication, and RBAC.
- Treat database state and server-side service validation as authoritative. Client checks are usability enhancements only.
- Do not substitute a hard-coded dashboard or fake status transition for real MySQL-backed behaviour.

## Architecture rules

- Follow module ownership and boundaries in architecture.md.
- Controllers contain no SQL or business rules. Services own domain actions and transactions. Repositories own parameterised SQL.
- Use typed inputs/outputs, stable error codes, and central error middleware.
- Any dispatch, completion, cancellation, or maintenance state transition must use the documented transaction and re-check eligibility under lock.
- Do not create a migration that edits an existing applied migration.

## UI rules

- Never use hard-coded visual values in components. Use tokens from ui_tokens.md.
- Reuse the UI registry before adding a new component. Update ui_registry.md after every reusable component or material change.
- Implement loading, empty, error, disabled, keyboard, and mobile behaviour for every user-facing feature.

## Progress and quality rules

- Update context/progress_tracker.md and the owner tracker after every feature is fully verified.
- A completed checkbox requires a tested, demo-ready result; do not mark partial implementation complete.
- Run relevant tests before handoff. Add a regression case when fixing a business-rule bug.
- Preserve existing work. Do not reformat, revert, or overwrite another teammate's files without agreement.

## Decision rule

Stop and ask for clarification when a request conflicts with project_overview.md, architecture.md, the local-only policy, or the agreed MVP scope. For a scoring improvement that does not conflict, prefer the smallest reliable implementation that strengthens the end-to-end demo.

# TransitOps - UI and Interaction Rules

## Overall interface

- Use a dark command-centre shell: persistent left navigation on desktop, slim top bar with search and role/account affordance, generous information density without visual clutter.
- The current page is indicated by an amber outline or surface treatment, not colour alone.
- Maintain a stable content grid with page title, primary action, filters, content, and feedback states in that order.
- Prefer real operational data over decorative graphics. Every metric card should link conceptually to a table or report value.

## Navigation and permissions

- Navigation only shows pages allowed for the current role, but the API independently checks every action.
- Fleet Manager: dashboard, fleet, maintenance.
- Dispatcher: dashboard, trips.
- Safety Officer: drivers/compliance.
- Financial Analyst: fuel/expenses and analytics.
- Show an accessible role label in the account control so reviewers immediately understand the RBAC context.

## Cards and KPI blocks

- MetricCard contains a small uppercase label, a large tabular number, optional trend/helper text, and a 4px semantic accent border.
- Do not overload cards with actions. Place high-risk actions in an adjacent table, form, or modal.
- Dashboard cards respond to active filters and show an empty zero state rather than stale figures.

## Tables and registries

- Use sticky table headers only when it improves a long list; preserve horizontal scroll on narrow screens.
- Put immutable identifiers early: registration number, driver licence, trip code.
- Put status in a labelled chip, not plain coloured text.
- Provide loading skeleton, empty result, error retry, and no-permission states for every registry.
- On mobile, either expose the essential columns as stacked cards or allow clear horizontal scrolling. Never compress unreadable columns.

## Forms and validation

- Place a visible label above every input; placeholders never replace labels.
- Show units in labels or input adornments: kg, km, L, INR.
- Disable a destructive/invalid submit only when client-side input is clearly incomplete; still show a server error if a business rule blocks it.
- Place field errors below the field, state the correction, and move keyboard focus to the first failing field after submit.
- Preserve entered values if server validation fails.
- Use confirmation dialogs for retire, cancel dispatched trip, and close maintenance. State the operational effect in the confirmation.

## Operational feedback

- A dispatch error must name the exact conflict: expired licence, driver already on trip, vehicle in shop, or cargo excess.
- A successful state transition states what changed: "TRP-014 dispatched. VAN-05 and Alex are now On Trip."
- Show toast feedback for success, inline feedback for field/action error, and a persistent banner only for session or system-wide issues.
- After a mutation, refresh the affected registry, dashboard KPIs, and live board using the server response; do not optimistic-update a critical workflow before the transaction succeeds.

## Status and lifecycle views

- Use a compact lifecycle stepper on the trip screen: Draft, Dispatched, Completed, Cancelled.
- Only show legal next actions. A Completed or Cancelled trip cannot dispatch again.
- Maintenance screen visually explains that active maintenance changes availability and removes the vehicle from dispatch.
- Give analytics formula help in plain language: fuel efficiency equals distance divided by fuel; ROI equals revenue minus fuel and maintenance, divided by acquisition cost.

## Accessibility and quality

- Meet WCAG AA contrast for text and interactive controls.
- All interactive elements must work by keyboard and have visible focus using --color-focus.
- Respect reduced-motion preference. Keep transition durations short and non-essential.
- Use aria-live polite for non-blocking success; use assertive only for urgent action failure.
- Never use a generic "Something went wrong" where the system knows a useful corrective reason.

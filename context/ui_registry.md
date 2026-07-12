# TransitOps - Reusable UI Registry

This is a living catalogue. Before adding a UI element, check whether an existing component can support it through props. After adding a reusable component or materially changing one, add it below with its owner and supported states.

## Registry rules

- Components use ui_tokens.md, not local visual literals.
- Feature-specific composition belongs in features; cross-feature primitives belong in components.
- Components must expose loading, empty, error, disabled, and responsive states where relevant.
- An owner updates this file before handing off the feature.

## Initial registry

| Component | Owner | Purpose | Required states |
| --- | --- | --- | --- |
| AppShell | Teammate 2 | Sidebar, top bar, page container, mobile navigation. | desktop, mobile, role-filtered nav |
| PageHeader | Teammate 2 | Page title, description, primary action slot. | compact/mobile action layout |
| MetricCard | Teammate 2 | Dashboard/report metric with semantic accent. | loading, zero, normal |
| StatusBadge | Teammate 2 | Textual vehicle, driver, trip, maintenance states. | all semantic statuses |
| DataTable | Teammate 2 | Searchable/filterable registry table. | loading, empty, error, horizontal overflow |
| FilterBar | Teammate 2 | Select/search/date controls used above registries. | reset, mobile wrap |
| FormField | Teammate 2 | Label, control, unit/help, error presentation. | required, disabled, error |
| ErrorAlert | Teammate 2 | Actionable inline/system error. | field, form, page |
| EmptyState | Teammate 2 | Clear no-data/no-results placeholder. | filtered, initial |
| ConfirmDialog | Teammate 2 | Explain and confirm high-impact action. | pending, cancel, destructive |
| TripLifecycle | Teammate 3 | Trip state stepper and legal action area. | draft, dispatched, completed, cancelled |
| DispatchEligibilityNotice | Teammate 3 | Explains why a vehicle/driver cannot dispatch. | capacity, licence, status conflict |
| CostSummary | Teammate 4 | Fuel, maintenance, expense, and total operational cost. | loading, zero, populated |
| SimpleBarChart | Teammate 4 | Tokenised local SVG/CSS reporting chart. | empty, populated, accessible summary |

## Additions log

| Date/time | Component | Change | Owner | Consumers |
| --- | --- | --- | --- | --- |
| 2026-07-12 | CostSummary, SimpleBarChart | Phase 3 finance metrics and accessible local bar chart | Teammate 4 | FinancePage, ReportsPage |
| 2026-07-12 | AppShell, StatusBadge, MetricCard, FormField, ErrorAlert, ConfirmDialog | Initialized reusable primitives & layout | Teammate 2 | Auth, Dashboard, Vehicles, Drivers, Trips, Maintenance, Finance |
| 2026-07-12 | TripLifecycle, DispatchEligibilityNotice | Phase 2 — trip lifecycle stepper and dispatch conflict notice components | Teammate 3 | TripsPage |

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
| LoadingState | Teammate 2 | Shimmer placeholder layouts for loading states. | table, cards, kpi variants |

## Additions log

| Date/time | Component | Change | Owner | Consumers |
| --- | --- | --- | --- | --- |
| 2026-07-12 | LoadingState | Registered missing loading state shimmer component | Teammate 2 | DashboardPage, MaintenancePage, FinancePage, ReportsPage |
| 2026-07-12 | CostSummary, SimpleBarChart | Phase 3 finance metrics and accessible local bar chart | Teammate 4 | FinancePage, ReportsPage |
| 2026-07-12 | AppShell, StatusBadge, MetricCard, FormField, ErrorAlert, ConfirmDialog | Initialized reusable primitives & layout | Teammate 2 | Auth, Dashboard, Vehicles, Drivers, Trips, Maintenance, Finance |
| 2026-07-12 | TripLifecycle, DispatchEligibilityNotice | Phase 2 — trip lifecycle stepper and dispatch conflict notice components | Teammate 3 | TripsPage |

## Component Props & Usage Guide

Below are the TypeScript definitions and typical usage patterns for all registered components.

### 1. [AppShell](file:///d:/Development/Projects/TransitOps/odoo-hackathon/apps/web/src/components/AppShell.tsx)
Provides the responsive outer layout with role-aware sidebar navigation, header, and logout control.
```typescript
interface AppShellProps {
  user: { email: string; role: 'FLEET_MANAGER' | 'DISPATCHER' | 'SAFETY_OFFICER' | 'FINANCIAL_ANALYST' | string };
  onLogout: () => void;
  currentPage: string;
  onPageChange: (pageId: string) => void;
  children: React.ReactNode;
}
```

### 2. [PageHeader](file:///d:/Development/Projects/TransitOps/odoo-hackathon/apps/web/src/components/PageHeader.tsx)
Displays a standard header with title, description, and an optional action slot on the right.
```typescript
interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}
```

### 3. [MetricCard](file:///d:/Development/Projects/TransitOps/odoo-hackathon/apps/web/src/components/MetricCard.tsx)
Represents a dashboard or report KPI with a left-accent border matching the status color.
```typescript
interface MetricCardProps {
  label: string;
  value: string | number;
  helperText?: string;
  statusToken?: string; // CSS color custom property e.g. '--color-success'
  loading?: boolean;
}
```

### 4. [StatusBadge](file:///d:/Development/Projects/TransitOps/odoo-hackathon/apps/web/src/components/StatusBadge.tsx)
Renders status codes as color-coded pills conforming to UI token guidelines.
```typescript
interface StatusBadgeProps {
  status: 'AVAILABLE' | 'COMPLETED' | 'ON_TRIP' | 'DISPATCHED' | 'IN_SHOP' | 'RETIRED' | 'SUSPENDED' | 'CANCELLED' | 'DRAFT' | 'OFF_DUTY' | string;
}
```

### 5. [DataTable](file:///d:/Development/Projects/TransitOps/odoo-hackathon/apps/web/src/components/DataTable.tsx)
A generic table component supporting loading state, empty state placeholders, custom column renderers, and row click callbacks.
```typescript
export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}
interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T;
  loading?: boolean;
  emptyIcon?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (row: T) => void;
}
```

### 6. [FilterBar](file:///d:/Development/Projects/TransitOps/odoo-hackathon/apps/web/src/components/FilterBar.tsx)
A unified filter component with support for text searches and selection lists, including a dynamic Reset button.
```typescript
export interface FilterOption { value: string; label: string; }
export interface FilterConfig {
  id: string;
  label: string;
  type: 'select' | 'search';
  options?: FilterOption[];
  placeholder?: string;
  value: string;
}
interface FilterBarProps {
  filters: FilterConfig[];
  onFilterChange: (filterId: string, value: string) => void;
  onReset: () => void;
}
```

### 7. [FormField](file:///d:/Development/Projects/TransitOps/odoo-hackathon/apps/web/src/components/FormField.tsx)
A wrapper to present labels, inputs, required asterisks, units, and errors consistently.
```typescript
interface FormFieldProps {
  label: string;
  id: string;
  error?: string;
  helpText?: string;
  unit?: string;
  required?: boolean;
  children: React.ReactNode;
}
```

### 8. [ErrorAlert](file:///d:/Development/Projects/TransitOps/odoo-hackathon/apps/web/src/components/ErrorAlert.tsx)
Surfaces validation or API failures in an assertive role="alert" banner, with optional manual dismissal.
```typescript
interface ErrorAlertProps {
  message: string;
  code?: string;
  onDismiss?: () => void;
}
```

### 9. [EmptyState](file:///d:/Development/Projects/TransitOps/odoo-hackathon/apps/web/src/components/EmptyState.tsx)
Placeholder shown when registries are empty or when query results return nothing.
```typescript
interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}
```

### 10. [ConfirmDialog](file:///d:/Development/Projects/TransitOps/odoo-hackathon/apps/web/src/components/ConfirmDialog.tsx)
A modal prompt asking the user to confirm high-impact actions like retiring a vehicle or cancelling a dispatch.
```typescript
interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  pending?: boolean;
}
```

### 11. [TripLifecycle](file:///d:/Development/Projects/TransitOps/odoo-hackathon/apps/web/src/components/TripLifecycle.tsx)
Visual timeline stepper highlighting current status of a dispatch trip (Draft, Dispatched, Completed/Cancelled).
```typescript
interface TripLifecycleProps {
  status: 'DRAFT' | 'DISPATCHED' | 'COMPLETED' | 'CANCELLED' | string;
  tripCode?: string;
}
```

### 12. [DispatchEligibilityNotice](file:///d:/Development/Projects/TransitOps/odoo-hackathon/apps/web/src/components/DispatchEligibilityNotice.tsx)
Accessible panel mapping specific backend operational conflicts (cargo limits, licensing, status collisions) into helpful tips.
```typescript
interface DispatchEligibilityNoticeProps {
  conflict: EligibilityConflict | null;
}
```

### 13. [CostSummary](file:///d:/Development/Projects/TransitOps/odoo-hackathon/apps/web/src/components/CostSummary.tsx)
Renders a structured grid of operational cost types (Fuel, Maintenance, Expenses, and Total).
```typescript
interface CostSummaryProps {
  fuelCost: number;
  maintenanceCost: number;
  expenseCost: number;
  totalCost: number;
  loading?: boolean;
}
```

### 14. [SimpleBarChart](file:///d:/Development/Projects/TransitOps/odoo-hackathon/apps/web/src/components/SimpleBarChart.tsx)
A simple CSS/SVG bar chart showing top operational cost categories by vehicle.
```typescript
interface BarDatum { label: string; value: number; }
interface SimpleBarChartProps {
  title: string;
  data: BarDatum[];
  valueLabel: (value: number) => string;
}
```

### 15. [LoadingState](file:///d:/Development/Projects/TransitOps/odoo-hackathon/apps/web/src/components/LoadingState.tsx)
Reusable shimmer placeholder supporting table grids, detail cards, or KPI layout variants.
```typescript
interface LoadingStateProps {
  rows?: number;
  variant?: 'table' | 'cards' | 'kpi';
}
```

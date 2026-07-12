# TransitOps - UI Tokens

The supplied mockup is the visual source of truth: a compact dark operations console with amber primary actions, blue operational accents, and clear coloured status chips. Define values once and consume tokens only.

## Colour tokens

| Token | Value | Use |
| --- | --- | --- |
| --color-canvas | #0B0E11 | Page background |
| --color-surface | #11161B | Navigation and raised surface |
| --color-surface-raised | #171D24 | Cards, forms, modal panels |
| --color-surface-hover | #202832 | Table row and control hover |
| --color-border | #35404D | Default outline and divider |
| --color-border-strong | #53606F | Focus-adjacent neutral outline |
| --color-text | #F2F5F7 | Primary copy |
| --color-text-muted | #A8B2BE | Labels, helper copy, inactive navigation |
| --color-primary | #C47A00 | Primary button and active navigation |
| --color-primary-hover | #E09100 | Primary hover |
| --color-primary-contrast | #17120A | Text on primary |
| --color-info | #4D9DE0 | Dispatch/on-trip/informational state |
| --color-success | #43B568 | Available/completed/success state |
| --color-warning | #F0A11A | In-shop/warning state |
| --color-danger | #E96A6A | Retired/error/cancelled state |
| --color-neutral | #7C8794 | Draft/off-duty/secondary state |
| --color-focus | #8BC1F7 | Keyboard focus ring |

## Semantic status mapping

| Status | Token |
| --- | --- |
| AVAILABLE, COMPLETED | --color-success |
| ON_TRIP, DISPATCHED | --color-info |
| IN_SHOP, licence-near-expiry | --color-warning |
| RETIRED, SUSPENDED, CANCELLED, validation error | --color-danger |
| DRAFT, OFF_DUTY, pending | --color-neutral |

Never use status colour as the only signal. Include an explicit text label and an icon or pattern where space permits.

## Typography

| Token | Value | Use |
| --- | --- | --- |
| --font-sans | Inter, ui-sans-serif, system-ui, sans-serif | All UI copy |
| --font-mono | ui-monospace, SFMono-Regular, Menlo, monospace | IDs, numbers, technical values |
| --text-xs | 0.75rem | Helper and table labels |
| --text-sm | 0.875rem | Body and controls |
| --text-base | 1rem | Body emphasis |
| --text-lg | 1.125rem | Section titles |
| --text-xl | 1.5rem | Page title |
| --text-2xl | 2rem | Dashboard key value only |
| --leading-tight | 1.2 | Headings and metric values |
| --leading-normal | 1.5 | Body copy |

Use tabular numerals for KPI and finance values so tables do not visually jump.

## Spacing, sizing, and shape

| Token | Value |
| --- | --- |
| --space-1 | 0.25rem |
| --space-2 | 0.5rem |
| --space-3 | 0.75rem |
| --space-4 | 1rem |
| --space-5 | 1.25rem |
| --space-6 | 1.5rem |
| --space-8 | 2rem |
| --space-10 | 2.5rem |
| --radius-sm | 0.375rem |
| --radius-md | 0.5rem |
| --radius-lg | 0.75rem |
| --control-height | 2.75rem |
| --touch-target | 2.75rem |
| --sidebar-width | 15rem |
| --content-max-width | 96rem |
| --shadow-panel | 0 12px 32px rgba(0, 0, 0, 0.28) |

## Layout and responsive tokens

| Token | Value | Behaviour |
| --- | --- | --- |
| --breakpoint-mobile | 40rem | Navigation becomes a compact drawer; tables use cards/scroll. |
| --breakpoint-tablet | 64rem | Two-column details and denser dashboard grid allowed. |
| --breakpoint-desktop | 80rem | Persistent sidebar and six/seven-column KPI grid where space permits. |

Use an 8px spacing rhythm. Controls have at least a 44px hit area. Never hard-code an unapproved pixel value outside the token layer.

/**
 * The status palette as typed `var()` references.
 *
 * Tailwind utilities (`bg-status-success`, `text-status-warning-foreground`)
 * cover markup, and they stay the default. This is for the places a class
 * cannot reach — an inline `style`, a chart series color, a canvas fill, an SVG
 * `stroke` — so nothing hand-types a variable name that a rename would silently
 * break.
 *
 * Every value carries the same fallback chain the `@theme` mappings use, so a
 * consumer theme that never installed the variables degrades to foreground /
 * destructive / muted instead of rendering invisible.
 *
 * One color, one meaning: success is healthy, warning is recoverable and needs
 * attention, danger is a failure the user must act on, neutral is absence. The
 * `-foreground` companion is ink on the solid fill; the `-surface` companion is
 * a soft background that always carries the plain `-status-*` ink, never the
 * `-foreground` ink.
 */

export const statusCssVars = {
  success: 'var(--status-success, var(--foreground))',
  successForeground: 'var(--status-success-foreground, var(--background))',
  successSurface: 'var(--status-success-surface, var(--muted))',
  warning: 'var(--status-warning, var(--foreground))',
  warningForeground: 'var(--status-warning-foreground, var(--background))',
  warningSurface: 'var(--status-warning-surface, var(--muted))',
  danger: 'var(--status-danger, var(--destructive))',
  dangerForeground: 'var(--status-danger-foreground, var(--background))',
  dangerSurface: 'var(--status-danger-surface, var(--muted))',
  neutral: 'var(--status-neutral, var(--muted-foreground))',
  neutralForeground: 'var(--status-neutral-foreground, var(--background))',
  neutralSurface: 'var(--status-neutral-surface, var(--muted))',
} as const

/** The twelve token names, e.g. for a `Record<StatusCssVar, ...>` lookup. */
export type StatusCssVar = keyof typeof statusCssVars

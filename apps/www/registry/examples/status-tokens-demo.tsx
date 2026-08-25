import { statusCssVars } from '@/lib/status-tokens'

const tones = [
  {
    name: 'success',
    meaning: 'Healthy. A live grant that needs nothing.',
    solid: 'bg-status-success text-status-success-foreground',
    surface: 'bg-status-success-surface text-status-success',
    swatch: statusCssVars.success,
  },
  {
    name: 'warning',
    meaning: 'Recoverable, needs attention. Expiring soon and expired both live here.',
    solid: 'bg-status-warning text-status-warning-foreground',
    surface: 'bg-status-warning-surface text-status-warning',
    swatch: statusCssVars.warning,
  },
  {
    name: 'danger',
    meaning: 'A failure the user must act on — a revoked grant, a rejected scope.',
    solid: 'bg-status-danger text-status-danger-foreground',
    surface: 'bg-status-danger-surface text-status-danger',
    swatch: statusCssVars.danger,
  },
  {
    name: 'neutral',
    meaning: 'Absence. Never connected, nothing to report.',
    solid: 'bg-status-neutral text-status-neutral-foreground',
    surface: 'bg-status-neutral-surface text-status-neutral',
    swatch: statusCssVars.neutral,
  },
]

export function StatusTokensDemo() {
  return (
    <div className="flex w-full flex-col gap-4">
      {tones.map((tone) => (
        <div key={tone.name} className="flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-3">
          <div className="flex min-w-0 flex-col justify-center gap-0.5 sm:w-56">
            <span className="flex items-center gap-2 font-mono text-sm">
              <span
                aria-hidden
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: tone.swatch }}
              />
              --status-{tone.name}
            </span>
            <span className="text-muted-foreground text-xs">{tone.meaning}</span>
          </div>
          <div className={`flex flex-1 items-center rounded-md px-3 py-2 text-sm ${tone.solid}`}>
            Solid fill, -foreground ink
          </div>
          <div className={`flex flex-1 items-center rounded-md px-3 py-2 text-sm ${tone.surface}`}>
            -surface, text-status ink
          </div>
        </div>
      ))}
    </div>
  )
}

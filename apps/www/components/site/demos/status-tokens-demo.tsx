'use client'

import { type StatusTone, statusInkClasses, statusToneClasses } from '@/components/ui/token-status'
import { cn } from '@/lib/utils'

interface ToneSample {
  tone: StatusTone
  meaning: string
  surface: string
}

const toneSamples: ToneSample[] = [
  {
    tone: 'success',
    meaning: 'Healthy. A live grant that needs nothing.',
    surface: 'bg-status-success-surface text-status-success',
  },
  {
    tone: 'warning',
    meaning: 'Recoverable, needs attention. Expiring soon and expired both live here.',
    surface: 'bg-status-warning-surface text-status-warning',
  },
  {
    tone: 'danger',
    meaning: 'A failure the user must act on — a revoked grant, a rejected scope.',
    surface: 'bg-status-danger-surface text-status-danger',
  },
  {
    tone: 'neutral',
    meaning: 'Absence. Never connected, nothing to report.',
    surface: 'bg-status-neutral-surface text-status-neutral',
  },
]

export function StatusTokensDemo() {
  return (
    <div className="flex w-full flex-col gap-4">
      {toneSamples.map((sample) => (
        <div
          key={sample.tone}
          className="flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-3"
        >
          <div className="flex min-w-0 flex-col justify-center gap-0.5 sm:w-56">
            <span className="font-mono text-code">--status-{sample.tone}</span>
            <span className="text-muted-foreground text-xs">{sample.meaning}</span>
          </div>
          <div
            className={cn(
              'flex flex-1 items-center rounded-md px-3 py-2 font-medium text-sm',
              statusToneClasses[sample.tone],
            )}
          >
            Solid fill, -foreground ink
          </div>
          <div
            className={cn('flex flex-1 items-center rounded-md px-3 py-2 text-sm', sample.surface)}
          >
            -surface, text-status ink
          </div>
          <div className="flex flex-1 items-center px-3 py-2 text-sm">
            <span className={statusInkClasses[sample.tone]}>Ink on the page</span>
          </div>
        </div>
      ))}
    </div>
  )
}

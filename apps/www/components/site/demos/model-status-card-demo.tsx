'use client'

import { useState } from 'react'
import { delay } from '@/components/site/demos/support'
import { ModelStatusCard } from '@/components/ui/model-status-card'
import type { ModelTranslation } from '@/lib/project-types'

const demoTranslations: ModelTranslation[] = [
  {
    urn: 'dXJuOmFkc2sud2lwcHJvZDpkbS5saW5lYWdlOnN1bW1pdA',
    name: 'summit-tower.rvt',
    status: 'success',
    outputs: ['svf2', 'thumbnail'],
  },
  {
    urn: 'dXJuOmFkc2sud2lwcHJvZDpkbS5saW5lYWdlOmNlZGFy',
    name: 'cedar-mill-site.nwd',
    status: 'inprogress',
    progress: '42% complete',
  },
  {
    urn: 'dXJuOmFkc2sud2lwcHJvZDpkbS5saW5lYWdlOmRvY2s',
    name: 'dockside-mep.ifc',
    status: 'timeout',
    error: 'Translation gave up after 60 minutes.',
  },
  {
    urn: 'dXJuOmFkc2sud2lwcHJvZDpkbS5saW5lYWdlOmhhcmJvcg',
    name: 'harbor-point.dwg',
    status: 'failed',
    error: 'Derivative "harbor-point.dwg" failed to translate.',
  },
]

export function ModelStatusCardDemo() {
  // Retrying flips the card through the real sequence — translating, then
  // ready — so the whole vocabulary is reachable from the demo.
  const [retried, setRetried] = useState<Record<string, ModelTranslation['status']>>({})

  return (
    <div className="flex w-full flex-col gap-3">
      {demoTranslations.map((translation) => {
        const status = retried[translation.urn] ?? translation.status
        const current: ModelTranslation =
          status === translation.status
            ? translation
            : {
                ...translation,
                status,
                error: undefined,
                progress: status === 'inprogress' ? 'restarting…' : undefined,
                outputs: status === 'success' ? ['svf2', 'thumbnail'] : undefined,
              }
        return (
          <ModelStatusCard
            key={translation.urn}
            translation={current}
            onRetry={async () => {
              await delay()
              setRetried((all) => ({ ...all, [translation.urn]: 'inprogress' }))
              await delay(1600)
              setRetried((all) => ({ ...all, [translation.urn]: 'success' }))
            }}
          />
        )
      })}
    </div>
  )
}

'use client'

import { ModelStatusCard } from '@/components/ui/model-status-card'
import type { ModelTranslation } from '@/lib/project-types'

const translations: ModelTranslation[] = [
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
  return (
    <div className="flex w-full flex-col gap-3">
      {translations.map((translation) => (
        <ModelStatusCard
          key={translation.urn}
          translation={translation}
          onRetry={
            translation.status === 'failed' || translation.status === 'timeout'
              ? async () => {
                  await new Promise((resolve) => {
                    setTimeout(resolve, 900)
                  })
                }
              : undefined
          }
        />
      ))}
    </div>
  )
}

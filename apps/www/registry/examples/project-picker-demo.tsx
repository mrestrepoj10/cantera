'use client'

import { useState } from 'react'

import { ProjectPicker } from '@/components/ui/project-picker'
import type { Hub, Project } from '@/lib/project-types'

const hubs: Hub[] = [
  { id: 'b.ridgeline-us', name: 'Ridgeline Builders', region: 'US' },
  { id: 'b.ridgeline-emea', name: 'Ridgeline Europe', region: 'EMEA' },
]

const projects: Project[] = [
  { id: 'b.summit-tower', name: 'Summit Tower', hubId: 'b.ridgeline-us' },
  { id: 'b.cedar-mill', name: 'Cedar Mill Campus', hubId: 'b.ridgeline-us' },
  { id: 'b.dockside', name: 'Dockside Renovation', hubId: 'b.ridgeline-us' },
  { id: 'b.harbor-point', name: 'Harbor Point Garage', hubId: 'b.ridgeline-emea' },
  { id: 'b.kanal-west', name: 'Kanalhaus West', hubId: 'b.ridgeline-emea' },
]

type ListState = 'ready' | 'loading' | 'error'

const listStates: { id: ListState; label: string }[] = [
  { id: 'ready', label: 'Ready' },
  { id: 'loading', label: 'Loading' },
  { id: 'error', label: 'Error' },
]

/** Selection is uncontrolled here — pass `value` to control it. */
export function ProjectPickerDemo() {
  const [state, setState] = useState<ListState>('ready')
  const [projectId, setProjectId] = useState<string>()

  return (
    <div className="flex w-full flex-col gap-4">
      <fieldset className="flex flex-wrap gap-2">
        <legend className="sr-only">Project list state</legend>
        {listStates.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={state === option.id}
            onClick={() => setState(option.id)}
            className="flex min-h-9 items-center rounded-md border border-border px-2.5 text-xs transition-colors hover:bg-muted aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:hover:bg-primary"
          >
            {option.label}
          </button>
        ))}
      </fieldset>
      <ProjectPicker
        hubs={hubs}
        projects={state === 'ready' ? projects : []}
        onValueChange={setProjectId}
        status={state}
        error="Projects could not be loaded."
        onRetry={async () => {
          await new Promise((resolve) => {
            setTimeout(resolve, 900)
          })
          setState('ready')
        }}
      />
      <p className="text-muted-foreground text-sm">
        {projectId ? (
          <>
            Working against <span className="font-mono text-code">{projectId}</span>
          </>
        ) : (
          'No project selected yet.'
        )}
      </p>
    </div>
  )
}

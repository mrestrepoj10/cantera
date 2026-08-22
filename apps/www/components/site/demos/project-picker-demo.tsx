'use client'

import { useState } from 'react'
import { delay, demoHubs, demoProjects, StateSwitcher } from '@/components/site/demos/support'
import { ProjectPicker } from '@/components/ui/project-picker'

type PickerDemoState = 'ready' | 'loading' | 'error'

const pickerDemoStates: { id: PickerDemoState; label: string }[] = [
  { id: 'ready', label: 'Ready' },
  { id: 'loading', label: 'Loading' },
  { id: 'error', label: 'Error' },
]

export function ProjectPickerDemo() {
  const [state, setState] = useState<PickerDemoState>('ready')
  const [projectId, setProjectId] = useState<string>()

  return (
    <div className="flex w-full flex-col gap-4">
      <StateSwitcher
        value={state}
        onChange={setState}
        label="Project list state"
        states={pickerDemoStates}
      />
      <ProjectPicker
        hubs={demoHubs}
        projects={state === 'ready' ? demoProjects : []}
        value={projectId}
        onValueChange={setProjectId}
        status={state}
        error="Projects could not be loaded."
        onRetry={async () => {
          await delay()
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

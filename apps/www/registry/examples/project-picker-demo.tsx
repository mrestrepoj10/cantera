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

/**
 * A picker over two hubs' projects. Selection is uncontrolled here —
 * `defaultValue` seeds it and the picker owns the rest; pass `value` to
 * control it. The chosen id surfaces below the picker.
 */
export function ProjectPickerDemo() {
  const [projectId, setProjectId] = useState<string>()

  return (
    <div className="flex w-full flex-col gap-3">
      <ProjectPicker hubs={hubs} projects={projects} onValueChange={setProjectId} />
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

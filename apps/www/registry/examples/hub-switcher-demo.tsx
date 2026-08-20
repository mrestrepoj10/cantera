'use client'

import { useState } from 'react'

import { HubSwitcher } from '@/components/ui/hub-switcher'
import type { Hub } from '@/lib/project-types'

const hubs: Hub[] = [
  { id: 'b.ridgeline-us', name: 'Ridgeline Builders', region: 'US' },
  { id: 'b.ridgeline-emea', name: 'Ridgeline Europe', region: 'EMEA' },
  { id: 'b.summit-jv', name: 'Summit Tower JV', region: 'US' },
]

/**
 * A hub switch that takes a beat, like a real context change: the handler
 * returns a promise, and the switcher drives its own pending state — the
 * trigger keeps the current hub's name and crossfades in a spinner.
 */
export function HubSwitcherDemo() {
  const [hubId, setHubId] = useState('b.ridgeline-us')

  return (
    <HubSwitcher
      hubs={hubs}
      value={hubId}
      onValueChange={async (next) => {
        await new Promise((resolve) => {
          setTimeout(resolve, 900)
        })
        setHubId(next)
      }}
    />
  )
}

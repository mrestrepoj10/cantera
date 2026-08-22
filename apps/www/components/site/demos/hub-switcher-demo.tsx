'use client'

import { useState } from 'react'
import { delay, demoHubs } from '@/components/site/demos/support'
import { HubSwitcher } from '@/components/ui/hub-switcher'

export function HubSwitcherDemo() {
  const [hubId, setHubId] = useState('b.ridgeline-us')

  return (
    <HubSwitcher
      hubs={[...demoHubs, { id: 'b.summit-jv', name: 'Summit Tower JV', region: 'US' }]}
      value={hubId}
      // The promise drives the pending state: the trigger keeps the current
      // hub's name and crossfades in a spinner for the round trip.
      onValueChange={async (next) => {
        await delay()
        setHubId(next)
      }}
    />
  )
}

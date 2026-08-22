'use client'

import { useState } from 'react'
import {
  type DemoState,
  delay,
  demoStates,
  StateSwitcher,
  useDemoConnection,
} from '@/components/site/demos/support'
import { ConnectionCard } from '@/components/ui/connection-card'

export function ConnectionCardDemo() {
  const [state, setState] = useState<DemoState>('connected')
  const connection = useDemoConnection(state)

  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <StateSwitcher
        value={state}
        onChange={setState}
        label="Connection state"
        states={demoStates}
      />
      <ConnectionCard
        connection={connection}
        // Both handlers return a promise, so the card drives its own pending
        // state: the button keeps its label, spins, and stays put.
        onDisconnect={async () => {
          await delay()
          setState('disconnected')
        }}
        onReconnect={async () => {
          await delay()
          setState('connected')
        }}
      />
    </div>
  )
}

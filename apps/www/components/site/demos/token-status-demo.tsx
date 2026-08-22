'use client'

import { useState } from 'react'
import {
  type DemoState,
  demoStates,
  StateSwitcher,
  useDemoConnection,
} from '@/components/site/demos/support'
import { TokenStatus } from '@/components/ui/token-status'

export function TokenStatusDemo() {
  const [state, setState] = useState<DemoState>('connected')
  const connection = useDemoConnection(state)

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <StateSwitcher
        value={state}
        onChange={setState}
        label="Connection state"
        states={demoStates}
      />
      <div className="rounded-lg border border-border p-4">
        <TokenStatus connection={connection} showScopes />
      </div>
      <p className="text-muted-foreground text-xs">
        Expiring soon and expired are the same tone — warning, because both are a refresh away. Only
        a real failure takes danger.
      </p>
    </div>
  )
}

'use client'

import { useState } from 'react'

import { AccConnectionPanel } from '@/components/acc-connection-panel'
import { StateSwitcher, useDemoExpiry } from '@/components/site/demos/support'
import { sampleAccount } from '@/components/site/sample-data'
import { apsProvider } from '@/lib/aps-oauth-preset'
import type { OAuthConnection } from '@/lib/oauth-types'

type AccConnectionPanelDemoState = 'connected' | 'expired'

const accConnectionPanelDemoStates: { id: AccConnectionPanelDemoState; label: string }[] = [
  { id: 'connected', label: 'Connected' },
  { id: 'expired', label: 'Consent lost' },
]

export function AccConnectionPanelDemo({ titleAs = 'h3' }: { titleAs?: 'h1' | 'h2' | 'h3' } = {}) {
  const Heading = titleAs
  const [state, setState] = useState<AccConnectionPanelDemoState>('connected')
  const expiresAt = useDemoExpiry(52)

  const connection: OAuthConnection =
    state === 'expired'
      ? {
          provider: apsProvider,
          status: 'expired',
          account: sampleAccount,
          scopes: ['data:read', 'account:read'],
          error: 'Grant lost — reconnect to continue.',
        }
      : {
          provider: apsProvider,
          status: 'connected',
          account: sampleAccount,
          scopes: ['data:read', 'account:read', 'viewables:read'],
          expiresAt,
        }

  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <Heading className="font-heading font-medium text-2xl tracking-tight">
        Autodesk connection
      </Heading>
      <StateSwitcher
        value={state}
        onChange={setState}
        label="Session state"
        states={accConnectionPanelDemoStates}
      />
      {/* Both hrefs lead to the emulator-backed demo instead of a real route. */}
      <AccConnectionPanel connection={connection} signOutHref="/demo" signInHref="/demo" />
    </div>
  )
}

'use client'

import { useState } from 'react'

import { AccConnectionPanel } from '@/components/acc-connection-panel'
import { StateSwitcher, useDemoExpiry } from '@/components/site/demos/support'
import { sampleAccount } from '@/components/site/sample-data'
import { SignInCard } from '@/components/ui/sign-in-card'
import { apsProvider } from '@/lib/aps-oauth-preset'
import type { OAuthConnection } from '@/lib/oauth-types'

/**
 * The acc-sign-in block in the states its server page resolves to: no session,
 * a live grant, and a grant whose consent was lost. The real flow — consent
 * redirect, code exchange, vault refresh — runs against the emulator on /demo;
 * this preview renders the same two surfaces without a session.
 */
type AccSignInDemoState = 'signed-out' | 'connected' | 'expired'

const accSignInDemoStates: { id: AccSignInDemoState; label: string }[] = [
  { id: 'signed-out', label: 'Signed out' },
  { id: 'connected', label: 'Connected' },
  { id: 'expired', label: 'Consent lost' },
]

export function AccSignInDemo() {
  const [state, setState] = useState<AccSignInDemoState>('signed-out')
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
    <div className="flex w-full flex-col items-center gap-6">
      <StateSwitcher
        value={state}
        onChange={setState}
        label="Session state"
        states={accSignInDemoStates}
      />
      {state === 'signed-out' ? (
        <SignInCard
          providers={[apsProvider]}
          // The docs page is not the app: the button leads to the emulator-backed
          // demo rather than starting a real consent redirect from here.
          hrefTemplate="/demo"
          title="Sign in"
          titleAs="h3"
          description="Connect your Autodesk account to continue."
        />
      ) : (
        <div className="flex w-full max-w-sm flex-col gap-4">
          <h3 className="font-heading font-medium text-2xl tracking-tight">Autodesk connection</h3>
          <AccConnectionPanel connection={connection} signOutHref="/demo" signInHref="/demo" />
        </div>
      )}
    </div>
  )
}

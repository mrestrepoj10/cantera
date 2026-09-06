'use client'

import { ProviderSignInButton } from '@/components/ui/provider-sign-in-button'
import { apsProvider } from '@/lib/aps-oauth-preset'
import type { OAuthProvider } from '@/lib/oauth-types'

/** A provider with no brand mark: `icon` is optional, and every surface renders one without. */
const procoreProvider: OAuthProvider = { id: 'procore', name: 'Procore' }

/** In a real app this is usually a navigation to the auth route instead —
 * `<ProviderSignInLink provider={apsProvider} href="/api/auth/aps" />`. */
function startSignIn(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 1200)
  })
}

export function ProviderSignInButtonDemo() {
  return (
    <div className="flex w-full flex-col gap-3">
      <ProviderSignInButton provider={apsProvider} onSignIn={startSignIn} />
      <ProviderSignInButton provider={procoreProvider} variant="secondary" onSignIn={startSignIn} />
    </div>
  )
}

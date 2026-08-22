'use client'

import { useState } from 'react'
import { procoreProvider } from '@/components/site/sample-data'
import { ProviderSignInButton } from '@/components/ui/provider-sign-in-button'
import { apsProvider } from '@/lib/aps-oauth-preset'

export function ProviderSignInButtonDemo() {
  const [loadingId, setLoadingId] = useState<string>()

  function signIn(id: string) {
    setLoadingId(id)
    window.setTimeout(() => setLoadingId(undefined), 1400)
  }

  return (
    <div className="flex w-full max-w-xs flex-col gap-3">
      <ProviderSignInButton
        provider={apsProvider}
        onSignIn={() => signIn(apsProvider.id)}
        loading={loadingId === apsProvider.id}
      />
      <ProviderSignInButton
        provider={procoreProvider}
        variant="secondary"
        size="default"
        onSignIn={() => signIn(procoreProvider.id)}
        loading={loadingId === procoreProvider.id}
      />
    </div>
  )
}

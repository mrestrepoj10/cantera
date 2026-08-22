'use client'

import { useState } from 'react'
import { procoreProvider } from '@/components/site/sample-data'
import { SignInCard } from '@/components/ui/sign-in-card'
import { apsProvider } from '@/lib/aps-oauth-preset'

export function SignInCardDemo() {
  const [loadingProvider, setLoadingProvider] = useState<string>()

  function signIn(providerId: string) {
    setLoadingProvider(providerId)
    window.setTimeout(() => setLoadingProvider(undefined), 1400)
  }

  return (
    <SignInCard
      providers={[apsProvider, procoreProvider]}
      onSignIn={signIn}
      loadingProvider={loadingProvider}
      title="Sign in to Ridgeline"
      // The pages this demo appears on already own h1 and h2, so the card's
      // heading slots in one level down rather than restarting the outline.
      titleAs="h3"
      description="Connect a data source for the Summit Tower project."
      footer="Demo only — no real OAuth flow starts."
    />
  )
}

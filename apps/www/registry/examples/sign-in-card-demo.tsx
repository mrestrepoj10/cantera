'use client'

import { SignInCard } from '@/components/ui/sign-in-card'
import { apsProvider } from '@/lib/aps-oauth-preset'
import type { OAuthProvider } from '@/lib/oauth-types'

const procoreProvider: OAuthProvider = { id: 'procore', name: 'Procore' }

/** Stand-in for the redirect. A returned promise drives the pressed button's pending state. */
function signIn(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 1200)
  })
}

export function SignInCardDemo() {
  return (
    <SignInCard
      providers={[apsProvider, procoreProvider]}
      onSignIn={signIn}
      title="Connect a data source"
      description="Sign in to pull drawings, issues, and models into Summit Tower."
      footer="You can disconnect any source later from Connections."
    />
  )
}

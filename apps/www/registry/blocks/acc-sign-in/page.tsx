import { TokenError } from 'aec-auth'
import { cookies, headers } from 'next/headers'

import { AccConnectionPanel } from '@/components/acc-connection-panel'
import { SignInCard } from '@/components/ui/sign-in-card'
import { APS_PROVIDER_ID, getSessionToken, openSession, SESSION_COOKIE } from '@/lib/acc-auth'
import { apsProvider } from '@/lib/aps-oauth-preset'
import type { OAuthConnection } from '@/lib/oauth-types'

/** Render <AccSignIn nextPath="/your-page" /> from any server page; the
 * default export is a ready-made /sign-in page. */
async function requestOrigin(): Promise<string> {
  const headerList = await headers()
  const host = headerList.get('x-forwarded-host') ?? headerList.get('host') ?? 'localhost:3000'
  const proto = headerList.get('x-forwarded-proto') ?? 'http'
  return `${proto}://${host}`
}

export async function AccSignIn({
  nextPath = '/sign-in',
  headingLevel = 'h1',
}: {
  nextPath?: string
  /** Heading level for the block's title. Drop to h2 when embedding under one. */
  headingLevel?: 'h1' | 'h2' | 'h3'
}) {
  const Heading = headingLevel
  const cookieStore = await cookies()
  const session = await openSession(cookieStore.get(SESSION_COOKIE)?.value)
  const signInHref = `/api/auth/${APS_PROVIDER_ID}?next=${encodeURIComponent(nextPath)}`

  if (!session) {
    return (
      <SignInCard
        providers={[apsProvider]}
        hrefTemplate={`/api/auth/{provider}?next=${encodeURIComponent(nextPath)}`}
        title="Sign in"
        titleAs={headingLevel}
        description="Connect your Autodesk account to continue."
      />
    )
  }

  const account = { name: session.name, email: session.email, avatarUrl: session.avatarUrl }
  let connection: OAuthConnection
  try {
    const origin = await requestOrigin()
    const token = await getSessionToken(origin, session)
    connection = {
      provider: apsProvider,
      status: 'connected',
      account,
      scopes: token.scopes ? [...token.scopes] : session.scopes,
      expiresAt: token.expiresAt,
    }
  } catch (error) {
    connection = {
      provider: apsProvider,
      status:
        error instanceof TokenError && error.code === 'consent_required' ? 'expired' : 'error',
      account,
      scopes: session.scopes,
      error:
        error instanceof TokenError && error.code === 'consent_required'
          ? 'Grant lost — reconnect to continue.'
          : 'Could not refresh the token.',
    }
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <Heading className="font-heading font-medium text-2xl tracking-tight">
        Autodesk connection
      </Heading>
      <AccConnectionPanel
        connection={connection}
        signOutHref={`/api/auth/signout?next=${encodeURIComponent(nextPath)}`}
        signInHref={signInHref}
      />
    </div>
  )
}

export default function SignInPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <AccSignIn />
    </main>
  )
}

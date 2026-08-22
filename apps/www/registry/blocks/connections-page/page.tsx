import { TokenError } from 'aec-auth'
import { cookies, headers } from 'next/headers'

import { ConnectionsManager } from '@/components/connections-manager'
import { APS_PROVIDER_ID, getTokenSource, openSession, SESSION_COOKIE } from '@/lib/acc-auth'
import { apsProvider } from '@/lib/aps-oauth-preset'
import type { OAuthAccount, OAuthConnection, OAuthProvider } from '@/lib/oauth-types'

/**
 * The connections-page block: every provider grant this app holds, on one
 * page, with connect, reconnect, and disconnect per provider.
 *
 * Server-rendered on the same aec-auth wiring the acc-sign-in block installs —
 * `lib/acc-auth.ts` and the `/api/auth/*` route handlers come from that item,
 * so this block adds a page and its client wiring, and nothing token-shaped.
 *
 * Reusable inner component: render <AccConnections /> from any server page;
 * the default export is a ready-made /connections page, and the sibling
 * loading.tsx is its skeleton.
 *
 * Autodesk is the wired provider. Extra entries in `providers` render as "not
 * connected" and their Connect button hits `/api/auth/<id>`, which 404s until
 * you teach `lib/acc-auth.ts` about that provider — deliberate, so an unwired
 * provider fails loudly at the route rather than quietly in the UI.
 */

async function requestOrigin(): Promise<string> {
  const headerList = await headers()
  const host = headerList.get('x-forwarded-host') ?? headerList.get('host') ?? 'localhost:3000'
  const proto = headerList.get('x-forwarded-proto') ?? 'http'
  return `${proto}://${host}`
}

/**
 * Row-level failures stay on the row. Only a backend that cannot answer at all
 * — no client id, no provider configured — throws to the page-level state,
 * because then there is nothing to render a row about.
 */
function connectionFromError(
  error: unknown,
  account: OAuthAccount,
  scopes: string[] | undefined,
): OAuthConnection {
  if (error instanceof TokenError && error.code === 'not_configured') throw error

  // Recoverable states are warning, not danger: a lost or revoked grant is one
  // consent away. Only a provider that actually failed takes the error status.
  const recoverable =
    error instanceof TokenError &&
    (error.code === 'consent_required' || error.code === 'grant_invalid')

  return {
    provider: apsProvider,
    status: recoverable ? 'expired' : 'error',
    account,
    scopes,
    error: recoverable ? undefined : 'Could not refresh the token.',
  }
}

export async function AccConnections({
  providers = [apsProvider],
  nextPath = '/connections',
  headingLevel = 'h1',
}: {
  /** Providers to list, in display order. Autodesk is the wired one. */
  providers?: OAuthProvider[]
  /** Where the consent flow returns to. */
  nextPath?: string
  /** Heading level for the block's title. Drop to h2 when embedding under one. */
  headingLevel?: 'h1' | 'h2' | 'h3'
}) {
  const cookieStore = await cookies()
  const session = await openSession(cookieStore.get(SESSION_COOKIE)?.value)
  const account = session
    ? { name: session.name, email: session.email, avatarUrl: session.avatarUrl }
    : undefined

  let connections: OAuthConnection[] = []
  let error: string | undefined

  if (session && account) {
    try {
      const origin = await requestOrigin()
      try {
        const token = await getTokenSource(origin).getToken({
          provider: APS_PROVIDER_ID,
          subject: { type: 'user', id: session.userId },
          scopes: session.scopes,
        })
        connections = [
          {
            provider: apsProvider,
            status: 'connected',
            account,
            scopes: token.scopes ? [...token.scopes] : session.scopes,
            expiresAt: token.expiresAt,
          },
        ]
      } catch (tokenError) {
        connections = [connectionFromError(tokenError, account, session.scopes)]
      }
    } catch (fatal) {
      error = fatal instanceof Error ? fatal.message : 'The connection service is unavailable.'
    }
  }

  const next = encodeURIComponent(nextPath)

  return (
    <ConnectionsManager
      providers={providers}
      connections={connections}
      account={account}
      status={error ? 'error' : 'ready'}
      error={error}
      titleAs={headingLevel}
      connectHrefTemplate={`/api/auth/{provider}?next=${next}`}
      disconnectHrefTemplate={`/api/auth/signout?next=${next}`}
    />
  )
}

export default function ConnectionsPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col p-6 sm:py-12">
      <AccConnections />
    </main>
  )
}

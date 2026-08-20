import { TokenStatus } from '@/components/ui/token-status'
import { apsProvider } from '@/lib/aps-oauth-preset'
import type { OAuthConnection } from '@/lib/oauth-types'

const scopes = ['data:read', 'viewables:read']

/**
 * The whole status vocabulary at once. "Expiring soon" is not a separate status
 * — it is a connected grant near its expiry, and the component derives the
 * warning tone itself. Expired is warning too: a refresh away, not a failure.
 */
function demoConnections(): { label: string; connection: OAuthConnection }[] {
  const now = Date.now()
  return [
    {
      label: 'healthy',
      connection: {
        provider: apsProvider,
        status: 'connected',
        scopes,
        expiresAt: now + 42 * 60_000,
      },
    },
    {
      label: 'expiring soon',
      connection: {
        provider: apsProvider,
        status: 'connected',
        scopes,
        expiresAt: now + 3 * 60_000,
      },
    },
    { label: 'expired', connection: { provider: apsProvider, status: 'expired', scopes } },
    {
      label: 'failed',
      connection: {
        provider: apsProvider,
        status: 'error',
        error: 'Refresh token was revoked.',
      },
    },
    { label: 'never connected', connection: { provider: apsProvider, status: 'disconnected' } },
  ]
}

/** Server-safe: no state, no effects, nothing to hydrate. */
export function TokenStatusDemo() {
  return (
    <div className="flex w-full flex-col gap-3">
      {demoConnections().map(({ label, connection }) => (
        <div key={label} className="rounded-lg border border-border p-4">
          <TokenStatus connection={connection} showScopes />
        </div>
      ))}
    </div>
  )
}

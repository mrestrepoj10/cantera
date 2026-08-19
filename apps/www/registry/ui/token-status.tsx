import type * as React from 'react'

import { Badge } from '@/components/ui/badge'
import {
  connectionExpiry,
  isExpiringSoon,
  type OAuthConnection,
  type OAuthConnectionStatus,
} from '@/lib/oauth-types'
import { cn } from '@/lib/utils'

const statusVariant: Record<OAuthConnectionStatus, React.ComponentProps<typeof Badge>['variant']> =
  {
    connected: 'secondary',
    expired: 'destructive',
    error: 'destructive',
    disconnected: 'outline',
  }

const statusLabel: Record<OAuthConnectionStatus, string> = {
  connected: 'Connected',
  expired: 'Expired',
  error: 'Error',
  disconnected: 'Not connected',
}

function formatExpiry(expiry: Date): string {
  const deltaMs = expiry.getTime() - Date.now()
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'always', style: 'narrow' })
  const minutes = Math.round(deltaMs / 60_000)
  if (Math.abs(minutes) < 60) return rtf.format(minutes, 'minute')
  const hours = Math.round(minutes / 60)
  if (Math.abs(hours) < 48) return rtf.format(hours, 'hour')
  return rtf.format(Math.round(hours / 24), 'day')
}

interface TokenStatusProps extends React.ComponentProps<'div'> {
  connection: OAuthConnection
  showExpiry?: boolean
  showScopes?: boolean
}

/**
 * Status line for an OAuth grant: connection state, token expiry, and the
 * scopes it holds. Server-safe.
 */
function TokenStatus({
  connection,
  showExpiry = true,
  showScopes = false,
  className,
  ...props
}: TokenStatusProps) {
  const expiry = connectionExpiry(connection)
  const expiringSoon = connection.status === 'connected' && isExpiringSoon(connection)

  return (
    <div
      data-slot="token-status"
      className={cn('flex flex-wrap items-center gap-x-2 gap-y-1.5', className)}
      {...props}
    >
      <Badge variant={statusVariant[connection.status]}>{statusLabel[connection.status]}</Badge>
      {showExpiry && expiry && connection.status === 'connected' && (
        <span
          className={cn('text-xs', expiringSoon ? 'text-destructive' : 'text-muted-foreground')}
        >
          expires {formatExpiry(expiry)}
        </span>
      )}
      {connection.status === 'error' && connection.error && (
        <span className="text-xs text-destructive">{connection.error}</span>
      )}
      {showScopes &&
        connection.scopes?.map((scope) => (
          <Badge key={scope} variant="outline" className="font-mono text-[0.7rem]">
            {scope}
          </Badge>
        ))}
    </div>
  )
}

export { TokenStatus, type TokenStatusProps }

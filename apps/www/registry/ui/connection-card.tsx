'use client'

import type * as React from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { TokenStatus } from '@/components/ui/token-status'
import { UserAccountBadge } from '@/components/ui/user-account-badge'
import type { OAuthConnection } from '@/lib/oauth-types'
import { cn } from '@/lib/utils'

interface ConnectionCardProps extends React.ComponentProps<typeof Card> {
  connection: OAuthConnection
  onDisconnect?: () => void | Promise<void>
  onReconnect?: () => void | Promise<void>
  showScopes?: boolean
}

/**
 * A provider connection at a glance: who is connected, grant status, scopes,
 * and disconnect / reconnect actions. One card per provider grant.
 */
function ConnectionCard({
  connection,
  onDisconnect,
  onReconnect,
  showScopes = true,
  className,
  ...props
}: ConnectionCardProps) {
  const { provider, account, status } = connection
  const needsReconnect = status === 'expired' || status === 'error' || status === 'disconnected'

  return (
    <Card data-slot="connection-card" className={cn('w-full', className)} {...props}>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          {provider.icon && (
            <span aria-hidden className="flex [&_svg]:size-5 [&_svg]:shrink-0">
              {provider.icon}
            </span>
          )}
          <span className="font-medium">{provider.name}</span>
          <div className="ml-auto flex gap-2">
            {needsReconnect && onReconnect && (
              <Button size="sm" onClick={() => void onReconnect()}>
                {status === 'disconnected' ? 'Connect' : 'Reconnect'}
              </Button>
            )}
            {status === 'connected' && onDisconnect && (
              <Button size="sm" variant="outline" onClick={() => void onDisconnect()}>
                Disconnect
              </Button>
            )}
          </div>
        </div>
        {account && <UserAccountBadge account={account} size="sm" />}
        <TokenStatus connection={connection} showScopes={showScopes} />
      </CardContent>
    </Card>
  )
}

export { ConnectionCard, type ConnectionCardProps }

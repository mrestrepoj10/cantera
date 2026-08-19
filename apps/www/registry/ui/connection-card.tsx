'use client'

import { LoaderCircleIcon } from 'lucide-react'
import type * as React from 'react'
import { useState } from 'react'

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
  /**
   * Pending state for the disconnect action. The button stays mounted, keeps
   * its label, and shows a spinner — never pass `undefined` for the handler to
   * express "busy", that unmounts the control under the user's cursor.
   */
  disconnectPending?: boolean
  /** Pending state for the connect / reconnect action. */
  reconnectPending?: boolean
  showScopes?: boolean
}

interface ConnectionActionProps {
  pending: boolean
  onAction: () => void | Promise<void>
  variant?: React.ComponentProps<typeof Button>['variant']
  children: React.ReactNode
}

/**
 * An action that follows the async-pending contract: disabled with a spinner
 * while it keeps its label, focusable throughout (`focusableWhenDisabled`
 * renders aria-disabled, not the native attribute), and never unmounted
 * mid-request. The spinner slot is always reserved so the label never shifts.
 */
function ConnectionAction({ pending, onAction, variant, children }: ConnectionActionProps) {
  const [asyncPending, setAsyncPending] = useState(false)
  const busy = pending || asyncPending

  return (
    <Button
      size="lg"
      variant={variant}
      disabled={busy}
      focusableWhenDisabled
      aria-busy={busy || undefined}
      className="min-h-11 gap-2 px-4"
      onClick={() => {
        const result = onAction()
        if (!(result instanceof Promise)) return
        setAsyncPending(true)
        result.then(
          () => setAsyncPending(false),
          () => setAsyncPending(false),
        )
      }}
    >
      <span aria-hidden className="grid size-4 shrink-0 place-items-center">
        <LoaderCircleIcon
          className={cn(
            'col-start-1 row-start-1 size-4 animate-spin transition-opacity duration-150 ease-out',
            busy ? 'opacity-100' : 'opacity-0',
          )}
        />
      </span>
      {children}
    </Button>
  )
}

/**
 * A provider connection at a glance: who is connected, grant status, scopes,
 * and disconnect / reconnect actions. One card per provider grant.
 */
function ConnectionCard({
  connection,
  onDisconnect,
  onReconnect,
  disconnectPending = false,
  reconnectPending = false,
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
            <span aria-hidden className="flex shrink-0 [&_svg]:size-5 [&_svg]:shrink-0">
              {provider.icon}
            </span>
          )}
          <span className="min-w-0 flex-1 truncate font-medium">{provider.name}</span>
          <div className="flex shrink-0 items-center gap-2 whitespace-nowrap">
            {needsReconnect && onReconnect && (
              <ConnectionAction pending={reconnectPending} onAction={onReconnect}>
                {status === 'disconnected' ? 'Connect' : 'Reconnect'}
              </ConnectionAction>
            )}
            {status === 'connected' && onDisconnect && (
              // Disconnecting revokes a grant — destructive, not a neutral outline.
              <ConnectionAction
                pending={disconnectPending}
                onAction={onDisconnect}
                variant="destructive"
              >
                Disconnect
              </ConnectionAction>
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

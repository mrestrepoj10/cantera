'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import { ConnectionsView, type ConnectionsViewProps } from '@/components/connections-view'

interface ConnectionsManagerProps
  extends Omit<ConnectionsViewProps, 'onConnect' | 'onDisconnect' | 'onRetry' | 'pending' | 'ref'> {
  /**
   * GET target that starts consent for one provider. "{provider}" is replaced
   * with the provider id, e.g. "/api/auth/{provider}?next=/connections".
   */
  connectHrefTemplate: string
  /**
   * POST target that revokes a grant. "{provider}" is replaced with the
   * provider id when the template carries it — the acc-sign-in signout route
   * takes no provider, so the default template is a plain path.
   */
  disconnectHrefTemplate: string
}

/** Point the templates at your own routes, or replace this file entirely —
 * ConnectionsView does not change. Both actions settle by re-rendering the
 * server page: the server view is the truth, never local optimistic state. */
function ConnectionsManager({
  connectHrefTemplate,
  disconnectHrefTemplate,
  ...viewProps
}: ConnectionsManagerProps) {
  const router = useRouter()
  const [connecting, setConnecting] = useState<string>()
  const [disconnecting, setDisconnecting] = useState<string>()
  const [retrying, startRefresh] = useTransition()

  function connect(providerId: string) {
    // Never cleared: this page is navigating away to the consent screen.
    setConnecting(providerId)
    window.location.href = connectHrefTemplate.replaceAll('{provider}', providerId)
  }

  async function disconnect(providerId: string) {
    setDisconnecting(providerId)
    try {
      await fetch(disconnectHrefTemplate.replaceAll('{provider}', providerId), {
        method: 'POST',
        redirect: 'manual',
      })
    } finally {
      // Pending clears inside the transition so the button keeps its spinner
      // until the re-rendered server page commits; refresh runs on failure too.
      startRefresh(() => {
        router.refresh()
        setDisconnecting(undefined)
      })
    }
  }

  return (
    <ConnectionsView
      {...viewProps}
      // The handlers are always passed: pending is a prop, never an absent
      // callback, so a pressed button stays mounted through the request.
      onConnect={connect}
      onDisconnect={disconnect}
      onRetry={() =>
        startRefresh(() => {
          router.refresh()
        })
      }
      pending={{ connecting, disconnecting, retrying }}
    />
  )
}

export { ConnectionsManager, type ConnectionsManagerProps }

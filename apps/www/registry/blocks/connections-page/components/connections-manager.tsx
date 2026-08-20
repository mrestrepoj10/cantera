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

/**
 * Client wiring for the connections-page block: connect navigates to the
 * consent route, disconnect posts to the revoke route, and both settle by
 * re-rendering the server page — the server view is the truth, never local
 * optimistic state about a token.
 *
 * The page component next door stays presentational; point this at your own
 * routes, or replace it entirely, and ConnectionsView does not change.
 */
function ConnectionsManager({
  connectHrefTemplate,
  disconnectHrefTemplate,
  ...viewProps
}: ConnectionsManagerProps) {
  const router = useRouter()
  const [connecting, setConnecting] = useState<string>()
  const [disconnecting, setDisconnecting] = useState<string>()
  // A transition keeps the retry pending until the server page has actually
  // re-rendered, rather than for the length of a fire-and-forget call.
  const [retrying, startRefresh] = useTransition()

  function connect(providerId: string) {
    // A full navigation to the provider's consent screen: the spinner stays up
    // because this page is on its way out, which is exactly right.
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
      // Clearing pending is part of the same transition as the refresh, so the
      // Disconnect control keeps its spinner until the re-rendered server page
      // commits — never actionable again beside a stale connected row. The
      // refresh runs on failure too: the server view is the truth either way.
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

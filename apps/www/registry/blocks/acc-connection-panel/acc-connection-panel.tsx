'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import { ConnectionCard } from '@/components/ui/connection-card'
import type { OAuthConnection } from '@/lib/oauth-types'

interface AccConnectionPanelProps {
  connection: OAuthConnection
  /** POST target that clears the grant and session, e.g. "/api/auth/signout?next=/sign-in". */
  signOutHref: string
  /** GET target that restarts consent, e.g. "/api/auth/aps?next=/sign-in". */
  signInHref: string
}

function AccConnectionPanel({ connection, signOutHref, signInHref }: AccConnectionPanelProps) {
  const router = useRouter()
  const [disconnecting, setDisconnecting] = useState(false)
  const [reconnecting, setReconnecting] = useState(false)
  const [, startRefresh] = useTransition()

  async function disconnect() {
    setDisconnecting(true)
    try {
      await fetch(signOutHref, { method: 'POST', redirect: 'manual' })
    } finally {
      // Pending clears inside the transition so the button keeps its spinner
      // until the re-rendered server page commits; refresh runs on failure too.
      startRefresh(() => {
        router.refresh()
        setDisconnecting(false)
      })
    }
  }

  return (
    <ConnectionCard
      connection={connection}
      // The handler is always passed: pending is a prop, never an absent
      // callback, so the pressed button stays mounted through the request.
      onDisconnect={disconnect}
      disconnectPending={disconnecting}
      onReconnect={() => {
        setReconnecting(true)
        window.location.href = signInHref
      }}
      reconnectPending={reconnecting}
    />
  )
}

export { AccConnectionPanel, type AccConnectionPanelProps }

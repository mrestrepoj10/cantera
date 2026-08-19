'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { ConnectionCard } from '@/components/ui/connection-card'
import type { OAuthConnection } from '@/lib/oauth-types'

interface AccConnectionPanelProps {
  connection: OAuthConnection
  /** POST target that clears the grant and session, e.g. "/api/auth/signout?next=/sign-in". */
  signOutHref: string
  /** GET target that restarts consent, e.g. "/api/auth/aps?next=/sign-in". */
  signInHref: string
}

/**
 * Client wrapper around ConnectionCard for the acc-sign-in block: disconnect
 * posts to the signout route, reconnect restarts the consent flow.
 */
function AccConnectionPanel({ connection, signOutHref, signInHref }: AccConnectionPanelProps) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function disconnect() {
    setBusy(true)
    try {
      await fetch(signOutHref, { method: 'POST', redirect: 'manual' })
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <ConnectionCard
      connection={connection}
      onDisconnect={busy ? undefined : disconnect}
      onReconnect={() => {
        window.location.href = signInHref
      }}
    />
  )
}

export { AccConnectionPanel, type AccConnectionPanelProps }

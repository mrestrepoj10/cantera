'use client'

import { LoaderCircleIcon, RotateCwIcon } from 'lucide-react'
import type * as React from 'react'
import { useId, useState } from 'react'

import { Button } from '@/components/ui/button'
import { ConnectionCard } from '@/components/ui/connection-card'
import { ProviderSignInButton } from '@/components/ui/provider-sign-in-button'
import { statusInkClasses } from '@/components/ui/token-status'
import { UserAccountBadge } from '@/components/ui/user-account-badge'
import {
  isExpiringSoon,
  type OAuthAccount,
  type OAuthConnection,
  type OAuthProvider,
} from '@/lib/oauth-types'
import { cn } from '@/lib/utils'

/** Presentational only — connections in, callbacks out. The wiring lives in
 * ConnectionsManager next door; swap it for your own backend and this file
 * does not change. */

/** "ready" with nothing connected renders the empty state. */
type ConnectionsStatus = 'ready' | 'loading' | 'error'

/** Thenable check, not `instanceof Promise`: a polyfilled or cross-realm
 * promise is still a pending round trip the retry must reflect. */
function isPromiseLike(value: void | Promise<void>): value is Promise<void> {
  return value != null && typeof (value as Promise<void>).then === 'function'
}

/** One provider id, not a set: a second consent redirect would race the first. */
interface ConnectionsPending {
  /** Provider id whose connect / reconnect is in flight. */
  connecting?: string
  /** Provider id whose disconnect is in flight. */
  disconnecting?: string
  retrying?: boolean
}

/** One row per provider in catalog order; grants for providers outside the
 * catalog are appended rather than silently dropped. */
function resolveConnections(
  providers: OAuthProvider[],
  connections: OAuthConnection[] = [],
): OAuthConnection[] {
  const held = new Map(connections.map((connection) => [connection.provider.id, connection]))
  const rows: OAuthConnection[] = providers.map(
    (provider) => held.get(provider.id) ?? { provider, status: 'disconnected' },
  )
  const known = new Set(providers.map((provider) => provider.id))
  return [...rows, ...connections.filter((connection) => !known.has(connection.provider.id))]
}

interface ConnectionsLoadingProps extends React.ComponentProps<'div'> {
  /** How many skeleton rows to draw. Match the provider count when you know it. */
  rows?: number
}

/** Deliberately still — no shimmer; the single spinner carries the
 * announcement. Rows share ConnectionCard's box model so the real cards land
 * exactly where the placeholders stood. */
function ConnectionsLoading({ rows = 3, className, ...props }: ConnectionsLoadingProps) {
  const placeholders = Array.from({ length: Math.max(rows, 1) }, (_, index) => `skeleton-${index}`)

  return (
    <div
      data-slot="connections-loading"
      className={cn('flex flex-col gap-3', className)}
      {...props}
    >
      {/* <output> is implicitly role="status" aria-live="polite" — the skeleton
          itself is decorative and hidden, so this is the only thing announced. */}
      <output className="flex items-center gap-2 text-muted-foreground text-sm">
        {/* The spin lives on a wrapper: transform animations on the <svg>
            itself skip the compositor in some engines. */}
        <span aria-hidden className="grid size-3.5 shrink-0 animate-spin place-items-center">
          <LoaderCircleIcon className="size-3.5" />
        </span>
        Loading connections
      </output>
      {placeholders.map((id) => (
        <div
          key={id}
          aria-hidden
          // Same box as Card: rounded-xl, ring-1, py-(--card-spacing) at 4.
          className="rounded-xl bg-card py-4 ring-1 ring-foreground/10"
        >
          <div className="flex flex-col gap-3 px-4">
            <div className="flex items-center gap-3">
              <div className="size-5 shrink-0 rounded bg-muted" />
              <div className="h-4 w-28 rounded bg-muted" />
              <div className="ml-auto h-7 w-24 shrink-0 rounded-lg bg-muted" />
            </div>
            <div className="flex items-center gap-2">
              <div className="size-7 shrink-0 rounded-full bg-muted" />
              <div className="flex flex-col gap-1">
                <div className="h-3.5 w-24 rounded bg-muted" />
                <div className="h-3.5 w-40 rounded bg-muted" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-6 w-24 shrink-0 rounded-md bg-muted" />
              <div className="h-3 w-20 rounded bg-muted" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

interface ConnectionsErrorProps extends React.ComponentProps<'div'> {
  message?: string
  onRetry?: () => void | Promise<void>
  retryPending?: boolean
}

function RetryButton({
  onRetry,
  pending = false,
  describedBy,
}: {
  onRetry: () => void | Promise<void>
  pending?: boolean
  describedBy?: string
}) {
  const [asyncPending, setAsyncPending] = useState(false)
  const busy = pending || asyncPending

  return (
    <Button
      type="button"
      size="lg"
      variant="outline"
      disabled={busy}
      focusableWhenDisabled
      aria-busy={busy || undefined}
      aria-describedby={describedBy}
      // Retrying a failed page is the primary action here, so it carries the
      // 44px field-density floor rather than the compact card-action size.
      className="min-h-11 gap-2 px-4 aria-disabled:pointer-events-none"
      onClick={() => {
        const result = onRetry()
        if (!isPromiseLike(result)) return
        setAsyncPending(true)
        result.then(
          () => setAsyncPending(false),
          () => setAsyncPending(false),
        )
      }}
    >
      <span aria-hidden className="grid size-4 shrink-0 place-items-center">
        {/* The spin lives on a wrapper: transform animations on the <svg>
            itself skip the compositor in some engines. */}
        <span className="col-start-1 row-start-1 grid size-4 animate-spin place-items-center">
          <LoaderCircleIcon
            className={cn(
              'size-4 transition-opacity duration-150 ease-out',
              busy ? 'opacity-100' : 'opacity-0',
            )}
          />
        </span>
        <RotateCwIcon
          className={cn(
            'col-start-1 row-start-1 size-4 transition-opacity duration-150 ease-out',
            busy ? 'opacity-0' : 'opacity-100',
          )}
        />
      </span>
      Try again
    </Button>
  )
}

/** Page-level only: a single provider that errored keeps its row and its siblings. */
function ConnectionsError({
  message,
  onRetry,
  retryPending,
  className,
  ...props
}: ConnectionsErrorProps) {
  const messageId = useId()
  const detail = message ?? 'The connection service did not respond.'

  return (
    <div
      data-slot="connections-error"
      role="alert"
      className={cn(
        'flex flex-col items-start gap-3 rounded-xl border border-border p-6',
        className,
      )}
      {...props}
    >
      <div className="flex flex-col gap-1">
        <p className="font-medium text-sm">Could not load your connections</p>
        {/* Status-palette danger ink, not the theme's destructive — one color,
            one meaning, contrast-verified in both appearances. */}
        <p id={messageId} className={cn('text-sm', statusInkClasses.danger)}>
          {detail}
        </p>
      </div>
      {onRetry && <RetryButton onRetry={onRetry} pending={retryPending} describedBy={messageId} />}
    </div>
  )
}

interface ConnectionsEmptyProps extends React.ComponentProps<'div'> {
  providers: OAuthProvider[]
  onConnect?: (providerId: string) => void | Promise<void>
  /** Provider id whose consent flow is in flight. */
  connecting?: string
}

function ConnectionsEmpty({
  providers,
  onConnect,
  connecting,
  className,
  ...props
}: ConnectionsEmptyProps) {
  const hintId = useId()

  return (
    <div
      data-slot="connections-empty"
      className={cn(
        'flex flex-col gap-4 rounded-xl border border-border border-dashed p-6',
        className,
      )}
      {...props}
    >
      <div className="flex flex-col gap-1">
        <p className="font-medium text-sm">No connections yet</p>
        <p id={hintId} className="max-w-prose text-muted-foreground text-sm">
          Connect a provider to pull its projects, documents, and models into this app. You pick the
          scopes during consent, and you can disconnect from this page at any time.
        </p>
      </div>
      {providers.length > 0 && (
        <div className="flex w-full flex-col gap-3 sm:max-w-xs">
          {providers.map((provider) => (
            <ProviderSignInButton
              key={provider.id}
              provider={provider}
              aria-describedby={hintId}
              onSignIn={onConnect ? () => onConnect(provider.id) : undefined}
              loading={connecting === provider.id}
              // One consent flow at a time: a second redirect races the first.
              disabled={connecting !== undefined && connecting !== provider.id}
            >
              Connect {provider.name}
            </ProviderSignInButton>
          ))}
        </div>
      )}
    </div>
  )
}

interface ConnectionsListProps extends React.ComponentProps<'ul'> {
  connections: OAuthConnection[]
  onConnect?: (providerId: string) => void | Promise<void>
  onDisconnect?: (providerId: string) => void | Promise<void>
  pending?: ConnectionsPending
  showScopes?: boolean
}

function ConnectionsList({
  connections,
  onConnect,
  onDisconnect,
  pending,
  showScopes = true,
  className,
  ...props
}: ConnectionsListProps) {
  return (
    <ul data-slot="connections-list" className={cn('flex flex-col gap-3', className)} {...props}>
      {connections.map((connection) => {
        const providerId = connection.provider.id
        return (
          <li key={providerId}>
            <ConnectionCard
              connection={connection}
              // Connect and reconnect are the same act — restart consent for
              // this provider — so the page hands the card one callback.
              onReconnect={onConnect ? () => onConnect(providerId) : undefined}
              onDisconnect={onDisconnect ? () => onDisconnect(providerId) : undefined}
              reconnectPending={pending?.connecting === providerId}
              disconnectPending={pending?.disconnecting === providerId}
              showScopes={showScopes}
            />
          </li>
        )
      })}
    </ul>
  )
}

interface ConnectionsViewProps extends Omit<React.ComponentProps<'section'>, 'title'> {
  providers: OAuthProvider[]
  /** The grants that exist, matched to providers by `connection.provider.id`. */
  connections?: OAuthConnection[]
  status?: ConnectionsStatus
  error?: string
  account?: OAuthAccount
  onConnect?: (providerId: string) => void | Promise<void>
  onDisconnect?: (providerId: string) => void | Promise<void>
  onRetry?: () => void | Promise<void>
  pending?: ConnectionsPending
  title?: React.ReactNode
  /** Heading level for the page title. Drop to h2 when embedding under one. */
  titleAs?: 'h1' | 'h2' | 'h3'
  description?: React.ReactNode
  showScopes?: boolean
}

function ConnectionsView({
  providers,
  connections,
  status = 'ready',
  error,
  account,
  onConnect,
  onDisconnect,
  onRetry,
  pending,
  title = 'Connections',
  titleAs: Heading = 'h1',
  description = 'The accounts this app can read from. Grant only what a job needs, and revoke it here when it is done.',
  showScopes = true,
  className,
  ...props
}: ConnectionsViewProps) {
  const rows = resolveConnections(providers, connections)
  // isExpiringSoon is the same predicate TokenStatus renders "Expiring soon"
  // from, so the count can never disagree with a warning on a card below it.
  let connected = 0
  let expired = 0
  let failed = 0
  let expiring = 0
  for (const row of rows) {
    if (row.status === 'connected') {
      connected += 1
      if (isExpiringSoon(row)) expiring += 1
    } else if (row.status === 'expired') {
      expired += 1
    } else if (row.status === 'error') {
      failed += 1
    }
  }
  const attention = expired + failed + expiring
  const isEmpty = connected + expired + failed === 0

  let body: React.ReactNode
  if (status === 'loading') {
    body = <ConnectionsLoading rows={providers.length > 0 ? providers.length : 3} />
  } else if (status === 'error') {
    body = <ConnectionsError message={error} onRetry={onRetry} retryPending={pending?.retrying} />
  } else if (isEmpty) {
    body = (
      <ConnectionsEmpty
        providers={providers}
        onConnect={onConnect}
        connecting={pending?.connecting}
      />
    )
  } else {
    body = (
      <ConnectionsList
        connections={rows}
        onConnect={onConnect}
        onDisconnect={onDisconnect}
        pending={pending}
        showScopes={showScopes}
      />
    )
  }

  return (
    <section
      data-slot="connections-view"
      data-status={status}
      className={cn('flex w-full max-w-2xl flex-col gap-6', className)}
      {...props}
    >
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <Heading className="font-heading font-medium text-2xl tracking-tight">{title}</Heading>
          {account && <UserAccountBadge account={account} size="sm" className="shrink-0" />}
        </div>
        {description && <p className="max-w-prose text-muted-foreground text-sm">{description}</p>}
        {status === 'ready' && !isEmpty && (
          <p className="pt-1 text-muted-foreground text-sm">
            <span className="tabular-nums">
              {connected} of {rows.length} connected
            </span>
            {attention > 0 && (
              <>
                {' · '}
                {/* The worst row sets the tone: failure is danger, expiry is
                    recoverable and stays warning. */}
                <span className={failed > 0 ? statusInkClasses.danger : statusInkClasses.warning}>
                  <span className="tabular-nums">{attention}</span>{' '}
                  {attention === 1 ? 'needs' : 'need'} attention
                </span>
              </>
            )}
          </p>
        )}
      </header>
      {body}
    </section>
  )
}

export {
  ConnectionsEmpty,
  type ConnectionsEmptyProps,
  ConnectionsError,
  type ConnectionsErrorProps,
  ConnectionsList,
  type ConnectionsListProps,
  ConnectionsLoading,
  type ConnectionsLoadingProps,
  type ConnectionsPending,
  type ConnectionsStatus,
  ConnectionsView,
  type ConnectionsViewProps,
  resolveConnections,
}

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

/**
 * The presentational half of the connections-page block: every grant this app
 * holds, on one page, with connect / reconnect / disconnect per provider.
 *
 * Data-agnostic on purpose — connections in, callbacks out, no fetching. The
 * wiring lives in ConnectionsManager next door; swap it for your own backend
 * and this file does not change.
 *
 * Four states, all shipped and all exported so they survive being adapted:
 * - loading — the initial fetch. Static skeleton rows at the real row
 *   geometry, so nothing shifts when the data lands, plus one live spinner.
 * - error   — the whole fetch failed. Message plus a retry on the
 *   async-pending contract. A single provider that failed is not this state:
 *   it is a row with status "error", which keeps its healthy siblings visible.
 * - empty   — nothing connected yet. The provider chooser IS the empty state.
 * - ready   — the mixed dashboard: connected, expiring, expired, errored, and
 *   not-yet-connected providers in one list.
 */

/** What the page is showing. "ready" with nothing connected renders the empty state. */
type ConnectionsStatus = 'ready' | 'loading' | 'error'

/** Thenable check, not `instanceof Promise`: a polyfilled or cross-realm
 * promise is still a pending round trip the retry must reflect. */
function isPromiseLike(value: void | Promise<void>): value is Promise<void> {
  return value != null && typeof (value as Promise<void>).then === 'function'
}

/**
 * Consumer-driven pending, for wiring where no promise comes back (a server
 * action, or a navigation that never resolves). A callback that returns a
 * promise drives the same states on its own.
 *
 * One provider id, not a set: a second consent redirect would race the first,
 * the same reason SignInCard takes a single `loadingProvider`.
 */
interface ConnectionsPending {
  /** Provider id whose connect / reconnect is in flight. */
  connecting?: string
  /** Provider id whose disconnect is in flight. */
  disconnecting?: string
  /** The page-level retry, shown only in the error state. */
  retrying?: boolean
}

/**
 * One row per provider, in catalog order: the grant where one exists, a
 * "disconnected" placeholder where it does not, and any grant for a provider
 * outside the catalog appended rather than silently dropped.
 *
 * Exported because it is the whole data model — an adapter feeding this page
 * from another backend reimplements nothing.
 */
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

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------

interface ConnectionsLoadingProps extends React.ComponentProps<'div'> {
  /** How many skeleton rows to draw. Match the provider count when you know it. */
  rows?: number
}

/**
 * The initial fetch. Deliberately still: the motion grammar is four moves and
 * a looping shimmer is not one of them — on a list of rows it is an attention
 * magnet with nothing to say, and it reads as activity where there is none.
 * The single spinner is the sanctioned move, and it carries the announcement.
 *
 * The skeleton's job is geometry, not entertainment: these rows are built from
 * the same box model as ConnectionCard, so the real cards land exactly where
 * the placeholders stood. No stagger, no entrance — the data is dense.
 */
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
            {/* Provider row: mark, name, action — matches the card's header line. */}
            <div className="flex items-center gap-3">
              <div className="size-5 shrink-0 rounded bg-muted" />
              <div className="h-4 w-28 rounded bg-muted" />
              <div className="ml-auto h-7 w-24 shrink-0 rounded-lg bg-muted" />
            </div>
            {/* Account badge row: avatar plus the name-over-email stack, whose
                two 16px lines are what sets a full card's height. */}
            <div className="flex items-center gap-2">
              <div className="size-7 shrink-0 rounded-full bg-muted" />
              <div className="flex flex-col gap-1">
                <div className="h-3.5 w-24 rounded bg-muted" />
                <div className="h-3.5 w-40 rounded bg-muted" />
              </div>
            </div>
            {/* Status line: one badge plus the expiry text. */}
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

// ---------------------------------------------------------------------------
// Error
// ---------------------------------------------------------------------------

interface ConnectionsErrorProps extends React.ComponentProps<'div'> {
  /** What failed, in the user's words. Falls back to a generic sentence. */
  message?: string
  onRetry?: () => void | Promise<void>
  /** Consumer-driven pending for the retry. A returned promise drives it too. */
  retryPending?: boolean
}

/**
 * The retry, on the async-pending contract: stays mounted, keeps its label,
 * crossfades its icon to a spinner, and blocks activation through
 * aria-disabled so focus is never dropped mid-request.
 */
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

/**
 * The whole fetch failed, so there is no list to show. Page-level only — a
 * single provider that errored keeps its row and its siblings.
 */
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
        {/* Danger ink from the status palette, not the theme's own destructive:
            one color, one meaning, and it is contrast-verified in both
            appearances against the page background. */}
        <p id={messageId} className={cn('text-sm', statusInkClasses.danger)}>
          {detail}
        </p>
      </div>
      {onRetry && <RetryButton onRetry={onRetry} pending={retryPending} describedBy={messageId} />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Empty
// ---------------------------------------------------------------------------

interface ConnectionsEmptyProps extends React.ComponentProps<'div'> {
  providers: OAuthProvider[]
  onConnect?: (providerId: string) => void | Promise<void>
  /** Provider id whose consent flow is in flight. */
  connecting?: string
}

/**
 * Nothing connected yet. The provider chooser IS the empty state: the page
 * says what a connection buys and offers the one action worth taking, rather
 * than narrating the absence and making the user hunt for the button. No
 * illustration — the system is monochrome, and a drawing would be the loudest
 * thing on a page whose job is data.
 */
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

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------

interface ConnectionsListProps extends React.ComponentProps<'ul'> {
  connections: OAuthConnection[]
  onConnect?: (providerId: string) => void | Promise<void>
  onDisconnect?: (providerId: string) => void | Promise<void>
  pending?: ConnectionsPending
  showScopes?: boolean
}

/**
 * The mixed dashboard. One ConnectionCard per row, which is where the whole
 * status vocabulary shows up at once: connected, expiring soon, expired,
 * errored, and never-connected all sit in the same list.
 */
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

// ---------------------------------------------------------------------------
// The page
// ---------------------------------------------------------------------------

interface ConnectionsViewProps extends Omit<React.ComponentProps<'section'>, 'title'> {
  /** Every provider this app can connect to, in display order. */
  providers: OAuthProvider[]
  /** The grants that exist, matched to providers by `connection.provider.id`. */
  connections?: OAuthConnection[]
  /** Fetch state. Loading and error take over the list; the heading stays put. */
  status?: ConnectionsStatus
  /** Page-level failure detail, shown when status is "error". */
  error?: string
  /** Who these grants belong to. Rendered beside the heading when set. */
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

/**
 * The connections page: a real heading, an at-a-glance summary, and one row
 * per provider — or the empty, loading, or error state that replaces the list.
 */
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
  // One pass for every summary number. The expiring predicate is the same one
  // TokenStatus renders "Expiring soon" from, so the count can never disagree
  // with a warning shown on a card below it.
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
        {/* The identity sits on the heading line rather than under the prose:
            whose grants these are is a fact about the page, not a caption. */}
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
                {/* The worst row sets the tone: an outright failure is danger,
                    an expiry is recoverable and stays warning. */}
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

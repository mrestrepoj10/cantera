import type { ReactNode } from 'react'

/**
 * cantera oauth types — the lingua franca for OAuth UI components.
 *
 * Components take these shapes as props and never fetch data themselves.
 * Adapters (e.g. the aps-oauth-preset) translate provider-specific payloads
 * into them, so any OAuth provider — Autodesk, Procore, or your own — renders
 * with the same components.
 */

export interface OAuthProvider {
  /** Stable identifier, e.g. "aps", "procore", "github". */
  id: string
  /** Human-readable name shown on buttons and cards, e.g. "Autodesk". */
  name: string
  /**
   * Brand mark rendered alongside the name. Any ReactNode; usually an SVG.
   *
   * Sizing contract: a mark carries its own default size (the presets ship
   * `className="size-4"`), so it renders correctly wherever it is dropped. A
   * surface that wants a different size wraps it in a `[&_svg]:size-*`
   * container, which wins on specificity.
   */
  icon?: ReactNode
  /** Optional link to the provider's developer or account documentation. */
  docsUrl?: string
}

export interface OAuthScope {
  /** The literal scope string sent to the provider, e.g. "data:read". */
  id: string
  /** Short label, e.g. "Read project data". */
  label: string
  /** One-sentence explanation of what granting this scope allows. */
  description?: string
  /** Required scopes are always selected and cannot be deselected. */
  required?: boolean
}

/** A named bundle of scopes for a common task, e.g. "Viewer" or "Account admin". */
export interface OAuthScopePreset {
  id: string
  label: string
  description?: string
  scopes: string[]
}

export type OAuthConnectionStatus = 'connected' | 'expired' | 'error' | 'disconnected'

export interface OAuthAccount {
  name?: string
  email?: string
  avatarUrl?: string
}

export interface OAuthConnection {
  provider: OAuthProvider
  status: OAuthConnectionStatus
  /** The account this grant belongs to, when known. */
  account?: OAuthAccount
  /** Scope strings held by the current grant. */
  scopes?: string[]
  /** When the current access token expires. */
  expiresAt?: Date | string | number
  /** Human-readable error, shown when status is "error". */
  error?: string
}

/** Normalize an OAuthConnection expiry into a Date, or null when absent. */
export function connectionExpiry(connection: OAuthConnection): Date | null {
  if (connection.expiresAt == null) return null
  const date = new Date(connection.expiresAt)
  return Number.isNaN(date.getTime()) ? null : date
}

/** True when the connection expires within `withinMs` (default five minutes). */
export function isExpiringSoon(connection: OAuthConnection, withinMs = 5 * 60_000): boolean {
  const expiry = connectionExpiry(connection)
  if (!expiry) return false
  return expiry.getTime() - Date.now() <= withinMs
}

const EMAIL_DOMAIN = /@.*$/
const NAME_SEPARATORS = /[\s._-]+/

/** Initials for an account, for avatar fallbacks: "Maria Renteria" -> "MR". */
export function accountInitials(account: OAuthAccount | undefined): string {
  const source = account?.name ?? account?.email ?? ''
  const parts = source.replace(EMAIL_DOMAIN, '').split(NAME_SEPARATORS).filter(Boolean)
  if (parts.length === 0) return '?'
  const first = parts[0][0] ?? ''
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? '') : ''
  return `${first}${last}`.toUpperCase() || '?'
}

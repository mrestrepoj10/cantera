import { APS_AUTH, TokenError, type TokenSource } from 'aec-auth'
import {
  apsOAuth,
  deleteUserGrant,
  memoryVaultStore,
  saveUserGrant,
  type VaultStore,
  vaultTokenSource,
} from 'aec-auth/vault'
import { cache } from 'react'

/**
 * Server-side auth wiring for the acc-sign-in block, on aec-auth's vault:
 * OAuth endpoints, grant storage, and a signed session cookie.
 *
 * Environment:
 * - APS_CLIENT_ID / APS_CLIENT_SECRET — your APS app credentials.
 * - APS_AUTH_BASE_URL — optional auth origin override. Absolute
 *   ("http://localhost:4014") or relative ("/emulate/aps", resolved against
 *   the request origin) for the @emulators/aps emulator. Unset = real APS.
 * - SESSION_SECRET — HMAC key for the session cookie. Set it in production.
 *
 * The default vault store is in-memory: fine for demos and a single dev
 * server, wrong for production. Swap in a durable VaultStore (e.g.
 * `upstashVaultStore()` wrapped in `encryptedVaultStore`) — see the aec-auth
 * README.
 */

export const APS_PROVIDER_ID = 'aps'

/** Scopes requested when the sign-in flow starts, unless overridden. */
export const DEFAULT_SIGN_IN_SCOPES = ['user-profile:read', 'data:read', 'viewables:read']

const globalStore = globalThis as { __accVaultStore?: VaultStore }

export function getVaultStore(): VaultStore {
  globalStore.__accVaultStore ??= memoryVaultStore()
  return globalStore.__accVaultStore
}

function resolveAuthBase(origin: string): string | undefined {
  const configured = process.env.APS_AUTH_BASE_URL
  if (!configured) return undefined
  return configured.startsWith('/') ? `${origin}${configured}` : configured
}

export function getApsOAuth(origin: string) {
  const clientId = process.env.APS_CLIENT_ID
  if (!clientId) {
    throw new TokenError('not_configured', 'aps', 'APS_CLIENT_ID is not set')
  }
  return apsOAuth({
    clientId,
    clientSecret: process.env.APS_CLIENT_SECRET,
    baseUrl: resolveAuthBase(origin),
  })
}

export function getTokenSource(origin: string): TokenSource {
  return vaultTokenSource({
    store: getVaultStore(),
    providers: { aps: getApsOAuth(origin) },
  })
}

/**
 * One vault read per request for a session's token, however many server
 * components ask for it. React.cache dedupes by argument identity, so pass
 * the session object `openSession` returned — it is per-request stable for
 * the same reason. Outside a React request scope the call runs uncached.
 */
export const getSessionToken = cache((origin: string, session: AccSession) =>
  getTokenSource(origin).getToken({
    provider: APS_PROVIDER_ID,
    subject: { type: 'user', id: session.userId },
    scopes: session.scopes,
  }),
)

export function userInfoUrl(origin: string): string {
  const base = resolveAuthBase(origin)
  return base ? `${base}/userinfo` : APS_AUTH.userInfoUrl
}

export { deleteUserGrant, saveUserGrant }

// ---------------------------------------------------------------------------
// Session cookie — HMAC-SHA256-signed JSON. No secrets inside, only identity.
// ---------------------------------------------------------------------------

export interface AccSession {
  userId: string
  name?: string
  email?: string
  avatarUrl?: string
  scopes?: string[]
}

export const SESSION_COOKIE = 'acc-session'
const STATE_COOKIE = 'acc-oauth-state'

function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET
  if (secret) return secret
  // A publicly known fallback is only tolerable where forged sessions do not
  // matter: local development, or a deployment that explicitly opts into demo
  // mode (ACC_AUTH_DEMO=1, e.g. an emulator-backed showcase). Everywhere else,
  // fail closed — a shared default key lets anyone mint a session for any user.
  if (process.env.NODE_ENV !== 'production' || process.env.ACC_AUTH_DEMO === '1') {
    return 'cantera-demo-insecure-secret'
  }
  throw new Error(
    'SESSION_SECRET is not set. Generate one (e.g. `openssl rand -base64 32`) and set it in production.',
  )
}

const encoder = new TextEncoder()

function toBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replaceAll('-', '+').replaceAll('_', '/')
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0))
}

/** The imported key is cached for the process: WebCrypto key import is the
 * expensive half of an HMAC, and the secret never changes between requests. */
let importedHmacKey: { secret: string; key: Promise<CryptoKey> } | undefined

function hmacKey(): Promise<CryptoKey> {
  const secret = sessionSecret()
  if (importedHmacKey?.secret !== secret) {
    importedHmacKey = {
      secret,
      key: crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign'],
      ),
    }
  }
  return importedHmacKey.key
}

async function hmac(payload: string): Promise<string> {
  const signature = await crypto.subtle.sign('HMAC', await hmacKey(), encoder.encode(payload))
  return toBase64Url(new Uint8Array(signature))
}

export async function sealSession(session: AccSession): Promise<string> {
  const payload = toBase64Url(encoder.encode(JSON.stringify(session)))
  return `${payload}.${await hmac(payload)}`
}

/**
 * Verify and open the session cookie. Wrapped in React.cache so composable
 * server components — a page plus the panels it mounts — verify one HMAC per
 * request instead of one each; route handlers run it uncached.
 */
export const openSession = cache(
  async (cookieValue: string | undefined): Promise<AccSession | null> => {
    if (!cookieValue) return null
    const [payload, signature] = cookieValue.split('.')
    if (!payload || !signature) return null
    if ((await hmac(payload)) !== signature) return null
    try {
      return JSON.parse(new TextDecoder().decode(fromBase64Url(payload))) as AccSession
    } catch {
      return null
    }
  },
)

/** `Secure` for HTTPS requests; local plain-HTTP development stays usable. */
export function cookieSecurity(requestUrl: URL | string): string {
  const url = typeof requestUrl === 'string' ? new URL(requestUrl) : requestUrl
  return url.protocol === 'https:' ? '; Secure' : ''
}

export function sessionCookie(
  value: string,
  secure: string,
  maxAgeSeconds = 60 * 60 * 24 * 14,
): string {
  return `${SESSION_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${secure}`
}

export function clearSessionCookie(secure: string): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`
}

// ---------------------------------------------------------------------------
// OAuth state cookie — CSRF token plus the post-sign-in return path.
// ---------------------------------------------------------------------------

export interface OAuthState {
  state: string
  next: string
  /** Scopes requested at the start of the flow, kept for providers (and
   * emulators) whose token response omits the granted scope list. */
  scopes?: string[]
}

export function newState(next: string, scopes?: string[]): OAuthState {
  const bytes = crypto.getRandomValues(new Uint8Array(24))
  return { state: toBase64Url(bytes), next, scopes }
}

export function stateCookie(oauthState: OAuthState, secure: string): string {
  const value = toBase64Url(encoder.encode(JSON.stringify(oauthState)))
  return `${STATE_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600${secure}`
}

export function clearStateCookie(secure: string): string {
  return `${STATE_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`
}

const STATE_COOKIE_PATTERN = new RegExp(`(?:^|;\\s*)${STATE_COOKIE}=([^;]+)`)

export function readStateCookie(cookieHeader: string | null): OAuthState | null {
  const match = cookieHeader?.match(STATE_COOKIE_PATTERN)
  if (!match) return null
  try {
    return JSON.parse(new TextDecoder().decode(fromBase64Url(match[1]))) as OAuthState
  } catch {
    return null
  }
}

/** Only allow same-origin relative return paths. */
export function safeNext(next: string | null | undefined, fallback: string): string {
  // Same-origin relative paths only. `//` is protocol-relative, and browsers
  // normalize backslashes in a Location header ("/\\evil.com" -> "//evil.com"),
  // so both are external redirects in disguise.
  if (next?.startsWith('/') && !next.startsWith('//') && !next.includes('\\')) return next
  return fallback
}

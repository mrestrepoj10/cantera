import { APS_AUTH, TokenError, type TokenSource } from 'aec-auth'
import {
  apsOAuth,
  deleteUserGrant,
  encryptedVaultStore,
  memoryVaultStore,
  saveUserGrant,
  type VaultStore,
  vaultTokenSource,
} from 'aec-auth/vault'
import { upstashVaultStore } from 'aec-auth/vault/upstash'
import { cache } from 'react'

/**
 * Environment: APS_CLIENT_ID / APS_CLIENT_SECRET, optional APS_AUTH_BASE_URL
 * (absolute, or relative like "/emulate/aps" for the emulator; unset = real
 * APS), APP_ORIGIN and SESSION_SECRET — required in production.
 *
 * The vault store is in-memory until UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN,
 * and VAULT_KEY are all set; then grants persist in Upstash Redis, encrypted at rest.
 */

export const APS_PROVIDER_ID = 'aps'

export const DEFAULT_SIGN_IN_SCOPES = ['user-profile:read', 'data:read', 'viewables:read']
export const ALLOWED_SIGN_IN_SCOPES = new Set([
  ...DEFAULT_SIGN_IN_SCOPES,
  'data:write',
  'data:create',
  'account:read',
  'account:write',
])

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 14

const globalStore = globalThis as { __accVaultStore?: VaultStore }

// Serverless hosts run many instances and recycle them, and the memory store
// forgets a grant the moment another instance answers. Durable storage is
// opt-in through the environment so a first deploy still boots without it.
function createVaultStore(): VaultStore {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  const key = process.env.VAULT_KEY
  if (url && token && key) return encryptedVaultStore(upstashVaultStore({ url, token }), { key })
  return memoryVaultStore()
}

export function getVaultStore(): VaultStore {
  globalStore.__accVaultStore ??= createVaultStore()
  return globalStore.__accVaultStore
}

// Vercel sets VERCEL_PROJECT_PRODUCTION_URL on every deployment, so a one-click
// deploy has a trusted origin before its owner knows the URL.
function deploymentOrigin(): string | undefined {
  if (process.env.APP_ORIGIN) return process.env.APP_ORIGIN
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL
  return vercel ? `https://${vercel}` : undefined
}

export function appOrigin(requestOrigin: string): string {
  const configured = deploymentOrigin()
  if (!configured) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('APP_ORIGIN is required in production')
    }
    return new URL(requestOrigin).origin
  }
  const url = new URL(configured)
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  ) {
    throw new Error('APP_ORIGIN must be an HTTP(S) origin without a path, query, or fragment')
  }
  return url.origin
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

// React.cache dedupes by argument identity: pass the session object
// `openSession` returned, which is per-request stable for the same reason.
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

export interface AccSession {
  userId: string
  name?: string
  email?: string
  avatarUrl?: string
  scopes?: string[]
}

interface SessionPayload extends AccSession {
  expiresAt: number
}

export const SESSION_COOKIE = 'acc-session'
const STATE_COOKIE = 'acc-oauth-state'

function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET
  if (secret) return secret
  // The known fallback is tolerable only where forged sessions do not matter:
  // local development, or ACC_AUTH_DEMO=1 (an emulator-backed showcase).
  // Everywhere else fail closed — a shared key lets anyone mint any session.
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
        ['sign', 'verify'],
      ),
    }
  }
  return importedHmacKey.key
}

async function hmac(payload: string): Promise<string> {
  const signature = await crypto.subtle.sign('HMAC', await hmacKey(), encoder.encode(payload))
  return toBase64Url(new Uint8Array(signature))
}

export async function sealSession(
  session: AccSession,
  maxAgeSeconds = SESSION_MAX_AGE_SECONDS,
): Promise<string> {
  const payload = toBase64Url(
    encoder.encode(JSON.stringify({ ...session, expiresAt: Date.now() + maxAgeSeconds * 1000 })),
  )
  return `${payload}.${await hmac(payload)}`
}

async function verifyHmac(payload: string, signature: string): Promise<boolean> {
  try {
    const decoded = fromBase64Url(signature)
    const signatureBytes = new Uint8Array(decoded.byteLength)
    signatureBytes.set(decoded)
    return await crypto.subtle.verify(
      'HMAC',
      await hmacKey(),
      signatureBytes,
      encoder.encode(payload),
    )
  } catch {
    return false
  }
}

export async function verifySealedSession(
  cookieValue: string | undefined,
): Promise<AccSession | null> {
  if (!cookieValue) return null
  const [payload, signature] = cookieValue.split('.')
  if (!payload || !signature || !(await verifyHmac(payload, signature))) return null
  try {
    const session = JSON.parse(new TextDecoder().decode(fromBase64Url(payload))) as SessionPayload
    if (
      typeof session.userId !== 'string' ||
      session.userId.length === 0 ||
      !Number.isFinite(session.expiresAt) ||
      session.expiresAt <= Date.now()
    ) {
      return null
    }
    const account: AccSession = { userId: session.userId }
    if (typeof session.name === 'string') account.name = session.name
    if (typeof session.email === 'string') account.email = session.email
    if (typeof session.avatarUrl === 'string') account.avatarUrl = session.avatarUrl
    if (
      Array.isArray(session.scopes) &&
      session.scopes.every((scope) => typeof scope === 'string')
    ) {
      account.scopes = session.scopes
    }
    return account
  } catch {
    return null
  }
}

// React.cache: a page plus the panels it mounts verify one HMAC per request
// instead of one each.
export const openSession = cache(
  async (cookieValue: string | undefined): Promise<AccSession | null> =>
    verifySealedSession(cookieValue),
)

/** `Secure` only for HTTPS requests, so local plain-HTTP development stays usable. */
export function cookieSecurity(requestUrl: URL | string): string {
  const url = typeof requestUrl === 'string' ? new URL(requestUrl) : requestUrl
  return url.protocol === 'https:' ? '; Secure' : ''
}

export function sessionCookie(
  value: string,
  secure: string,
  maxAgeSeconds = SESSION_MAX_AGE_SECONDS,
): string {
  return `${SESSION_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${secure}`
}

export function clearSessionCookie(secure: string): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`
}

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

export function safeNext(next: string | null | undefined, fallback: string): string {
  // Same-origin relative paths only. `//` is protocol-relative, and browsers
  // normalize backslashes in a Location header ("/\\evil.com" -> "//evil.com"),
  // so both are external redirects in disguise.
  if (next?.startsWith('/') && !next.startsWith('//') && !next.includes('\\')) return next
  return fallback
}

export function allowedSignInScopes(scopesParam: string | null): string[] {
  const requested = scopesParam?.split(/[\s,]+/).filter(Boolean) ?? []
  return [...new Set([...DEFAULT_SIGN_IN_SCOPES, ...requested])].filter((scope) =>
    ALLOWED_SIGN_IN_SCOPES.has(scope),
  )
}

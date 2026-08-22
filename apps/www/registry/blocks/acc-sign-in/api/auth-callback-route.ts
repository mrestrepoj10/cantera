import {
  APS_PROVIDER_ID,
  clearStateCookie,
  cookieSecurity,
  getApsOAuth,
  getVaultStore,
  readStateCookie,
  safeNext,
  saveUserGrant,
  sealSession,
  sessionCookie,
  userInfoUrl,
} from '@/lib/acc-auth'

/**
 * Completes the sign-in: verifies state, exchanges the code, hands the
 * refresh token to the vault (the single owner of refresh from here on),
 * and seals the session cookie.
 * Install target: app/api/auth/callback/[provider]/route.ts
 */
export async function GET(request: Request, ctx: { params: Promise<{ provider: string }> }) {
  const { provider } = await ctx.params
  if (provider !== APS_PROVIDER_ID) {
    return new Response(`Unknown provider: ${provider}`, { status: 404 })
  }

  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const stored = readStateCookie(request.headers.get('cookie'))

  const secure = cookieSecurity(url)
  if (!code || !state || !stored || stored.state !== state) {
    return new Response('Invalid OAuth state', {
      status: 400,
      headers: { 'Set-Cookie': clearStateCookie(secure) },
    })
  }

  const oauth = getApsOAuth(url.origin)
  const result = await oauth.exchangeCode({
    code,
    redirectUri: `${url.origin}/api/auth/callback/${APS_PROVIDER_ID}`,
  })

  const infoResponse = await fetch(userInfoUrl(url.origin), {
    headers: { Authorization: `Bearer ${result.accessToken.token}` },
  })
  if (!infoResponse.ok) {
    return new Response('Failed to load the user profile', { status: 502 })
  }
  const info = (await infoResponse.json()) as {
    sub?: string
    name?: string
    email?: string
    picture?: string
  }
  const userId = info.sub
  if (!userId) {
    return new Response('User profile has no subject id', { status: 502 })
  }

  // Providers (and emulators) may omit the granted scope list from the token
  // response; fall back to what the flow requested, kept in the state cookie.
  const scopes = result.accessToken.scopes ? [...result.accessToken.scopes] : stored.scopes
  // Sealing the session and persisting the grant are independent; run them in
  // parallel rather than serializing an HMAC behind a vault write.
  const [session] = await Promise.all([
    sealSession({
      userId,
      name: info.name,
      email: info.email,
      avatarUrl: info.picture,
      scopes,
    }),
    result.refreshToken
      ? saveUserGrant(getVaultStore(), APS_PROVIDER_ID, userId, {
          refreshToken: result.refreshToken,
          scopes,
          obtainedAt: Date.now(),
        })
      : undefined,
  ])

  // The start route sanitizes `next`, but this cookie is still client-side
  // state: re-validate on the return leg so an injected cookie can never turn
  // a successful sign-in into an open redirect.
  const headers = new Headers({ Location: safeNext(stored.next, '/sign-in') })
  headers.append('Set-Cookie', sessionCookie(session, secure))
  headers.append('Set-Cookie', clearStateCookie(secure))
  return new Response(null, { status: 302, headers })
}

import {
  APS_PROVIDER_ID,
  appOrigin,
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

/** Install target: app/api/auth/callback/[provider]/route.ts */
export async function GET(request: Request, ctx: { params: Promise<{ provider: string }> }) {
  const { provider } = await ctx.params
  if (provider !== APS_PROVIDER_ID) {
    return new Response(`Unknown provider: ${provider}`, { status: 404 })
  }

  const url = new URL(request.url)
  const origin = appOrigin(url.origin)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const stored = readStateCookie(request.headers.get('cookie'))

  const secure = cookieSecurity(origin)
  if (!code || !state || !stored || stored.state !== state) {
    return new Response('Invalid OAuth state', {
      status: 400,
      headers: { 'Set-Cookie': clearStateCookie(secure) },
    })
  }

  const oauth = getApsOAuth(origin)
  const result = await oauth.exchangeCode({
    code,
    redirectUri: `${origin}/api/auth/callback/${APS_PROVIDER_ID}`,
  })

  const infoResponse = await fetch(userInfoUrl(origin), {
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

  const scopes = result.accessToken.scopes ? [...result.accessToken.scopes] : stored.scopes
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

  // The state cookie is client-side state: re-validate `next` on the return leg
  // so an injected cookie can never turn a sign-in into an open redirect.
  const headers = new Headers({ Location: safeNext(stored.next, '/sign-in') })
  headers.append('Set-Cookie', sessionCookie(session, secure))
  headers.append('Set-Cookie', clearStateCookie(secure))
  return new Response(null, { status: 302, headers })
}

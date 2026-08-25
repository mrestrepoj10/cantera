import {
  APS_PROVIDER_ID,
  cookieSecurity,
  DEFAULT_SIGN_IN_SCOPES,
  getApsOAuth,
  newState,
  safeNext,
  stateCookie,
} from '@/lib/acc-auth'

/** Install target: app/api/auth/[provider]/route.ts */
export async function GET(request: Request, ctx: { params: Promise<{ provider: string }> }) {
  const { provider } = await ctx.params
  if (provider !== APS_PROVIDER_ID) {
    return new Response(`Unknown provider: ${provider}`, { status: 404 })
  }

  const url = new URL(request.url)
  const scopesParam = url.searchParams.get('scopes')
  const scopes = scopesParam ? scopesParam.split(/[\s,]+/).filter(Boolean) : DEFAULT_SIGN_IN_SCOPES
  const oauthState = newState(safeNext(url.searchParams.get('next'), '/sign-in'), scopes)

  const oauth = getApsOAuth(url.origin)
  const authorizeUrl = oauth.authorizeUrl({
    redirectUri: `${url.origin}/api/auth/callback/${APS_PROVIDER_ID}`,
    scopes,
    state: oauthState.state,
  })

  return new Response(null, {
    status: 302,
    headers: {
      Location: authorizeUrl,
      'Set-Cookie': stateCookie(oauthState, cookieSecurity(url)),
    },
  })
}

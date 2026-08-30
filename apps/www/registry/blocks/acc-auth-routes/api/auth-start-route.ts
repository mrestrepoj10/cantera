import {
  APS_PROVIDER_ID,
  allowedSignInScopes,
  appOrigin,
  cookieSecurity,
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
  const origin = appOrigin(url.origin)
  const scopes = allowedSignInScopes(url.searchParams.get('scopes'))
  const oauthState = newState(safeNext(url.searchParams.get('next'), '/sign-in'), scopes)

  const oauth = getApsOAuth(origin)
  const authorizeUrl = oauth.authorizeUrl({
    redirectUri: `${origin}/api/auth/callback/${APS_PROVIDER_ID}`,
    scopes,
    state: oauthState.state,
  })

  return new Response(null, {
    status: 302,
    headers: {
      Location: authorizeUrl,
      'Set-Cookie': stateCookie(oauthState, cookieSecurity(origin)),
    },
  })
}

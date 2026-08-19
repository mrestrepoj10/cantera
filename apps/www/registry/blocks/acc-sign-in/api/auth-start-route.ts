import {
  APS_PROVIDER_ID,
  cookieSecurity,
  DEFAULT_SIGN_IN_SCOPES,
  getApsOAuth,
  newState,
  safeNext,
  stateCookie,
} from '@/lib/acc-auth'

/**
 * Starts the 3-legged APS sign-in: builds the consent URL and redirects.
 * Install target: app/api/auth/[provider]/route.ts
 *
 * Query params:
 * - next   — same-origin path to return to after sign-in (default /sign-in).
 * - scopes — space- or comma-separated scope override.
 */
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

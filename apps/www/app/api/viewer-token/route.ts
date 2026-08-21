import type { TokenSource } from 'aec-auth'
import { apsOAuth, memoryVaultStore, vaultTokenSource } from 'aec-auth/vault'

export const dynamic = 'force-dynamic'

const VIEWER_SCOPES = ['viewables:read'] as const
let tokenSource: TokenSource | undefined

function getTokenSource(): TokenSource {
  if (tokenSource) return tokenSource
  const clientId = process.env.APS_CLIENT_ID
  const clientSecret = process.env.APS_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error('APS viewer credentials are not configured')
  }
  tokenSource = vaultTokenSource({
    store: memoryVaultStore(),
    providers: { aps: apsOAuth({ clientId, clientSecret }) },
  })
  return tokenSource
}

export async function GET(): Promise<Response> {
  try {
    const token = await getTokenSource().getToken({
      provider: 'aps',
      subject: { type: 'app' },
      scopes: VIEWER_SCOPES,
    })
    return Response.json(
      {
        accessToken: token.token,
        expiresInSeconds: Math.max(1, Math.floor((token.expiresAt - Date.now()) / 1000)),
      },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    console.error('Viewer token request failed', error)
    return Response.json(
      { error: 'The viewer token is unavailable.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}

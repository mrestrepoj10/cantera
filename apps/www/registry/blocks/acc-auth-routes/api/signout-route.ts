import {
  APS_PROVIDER_ID,
  clearSessionCookie,
  cookieSecurity,
  deleteUserGrant,
  getVaultStore,
  openSession,
  SESSION_COOKIE,
  safeNext,
} from '@/lib/acc-auth'

const SESSION_COOKIE_PATTERN = new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`)

/** Install target: app/api/auth/signout/route.ts */
export async function POST(request: Request) {
  const cookieHeader = request.headers.get('cookie')
  const match = cookieHeader?.match(SESSION_COOKIE_PATTERN)
  const session = await openSession(match?.[1])
  if (session) {
    await deleteUserGrant(getVaultStore(), APS_PROVIDER_ID, session.userId)
  }

  const url = new URL(request.url)
  const next = safeNext(url.searchParams.get('next'), '/sign-in')
  return new Response(null, {
    status: 303,
    headers: { Location: next, 'Set-Cookie': clearSessionCookie(cookieSecurity(url)) },
  })
}

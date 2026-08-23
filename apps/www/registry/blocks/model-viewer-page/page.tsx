import { cookies } from 'next/headers'

import { ModelBrowser } from '@/components/model-browser'
import { SignInCard } from '@/components/ui/sign-in-card'
import { openSession, SESSION_COOKIE } from '@/lib/acc-auth'
import { apsProvider } from '@/lib/aps-oauth-preset'

export default async function ModelViewerPage() {
  const cookieStore = await cookies()
  const session = await openSession(cookieStore.get(SESSION_COOKIE)?.value)

  if (!session) {
    return (
      <main className="flex min-h-svh items-center justify-center p-6">
        <SignInCard
          providers={[apsProvider]}
          hrefTemplate="/api/auth/{provider}?next=/models"
          title="Sign in"
          description="Connect your Autodesk account to browse project models."
        />
      </main>
    )
  }

  return (
    <ModelBrowser
      account={{ name: session.name, email: session.email, avatarUrl: session.avatarUrl }}
    />
  )
}

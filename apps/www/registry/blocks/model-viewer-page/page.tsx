import { cookies } from 'next/headers'

import { ModelBrowser } from '@/components/model-browser'
import { ScopedAutodeskSignIn } from '@/components/scoped-autodesk-sign-in'
import { openSession, SESSION_COOKIE } from '@/lib/acc-auth'

export default async function ModelViewerPage() {
  const cookieStore = await cookies()
  const session = await openSession(cookieStore.get(SESSION_COOKIE)?.value)

  if (!session) {
    return (
      <main className="flex min-h-svh items-center justify-center p-6">
        <ScopedAutodeskSignIn
          nextPath="/models"
          title="Browse models"
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

import { cookies } from 'next/headers'

import { ModelBrowser } from '@/components/model-browser'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { openSession, SESSION_COOKIE } from '@/lib/acc-auth'

export default async function ModelViewerPage() {
  const cookieStore = await cookies()
  const session = await openSession(cookieStore.get(SESSION_COOKIE)?.value)

  if (!session) {
    return (
      <main className="flex min-h-svh items-center justify-center p-6">
        <Card className="w-full max-w-sm text-center">
          <CardHeader>
            <CardTitle className="text-2xl">
              <h1>Browse models</h1>
            </CardTitle>
            <CardDescription>
              Sign in with Autodesk to browse project models. You choose what access to grant on the
              sign-in page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              nativeButton={false}
              // A navigation, so keep the link role the anchor earns from href.
              role="link"
              render={<a href="/sign-in?next=/models" />}
              className="min-h-11 w-full"
            >
              Sign in with Autodesk
            </Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <ModelBrowser
      account={{ name: session.name, email: session.email, avatarUrl: session.avatarUrl }}
    />
  )
}

import { cookies } from 'next/headers'

import { ModelUpload } from '@/components/model-upload'
import { ScopedAutodeskSignIn } from '@/components/scoped-autodesk-sign-in'
import { openSession, SESSION_COOKIE } from '@/lib/acc-auth'

const WRITE_SCOPES = ['data:write', 'data:create']

export default async function ModelUploadPage() {
  const cookieStore = await cookies()
  const session = await openSession(cookieStore.get(SESSION_COOKIE)?.value)

  // A session without the write scopes re-consents instead of failing uploads.
  const canWrite =
    session?.scopes === undefined || WRITE_SCOPES.every((scope) => session.scopes?.includes(scope))

  if (!session || !canWrite) {
    return (
      <main className="flex min-h-svh items-center justify-center p-6">
        <ScopedAutodeskSignIn
          nextPath="/upload"
          defaultPresetId="data-write"
          title="Upload models"
          description={
            session
              ? 'Uploads need the Manage files access level — reconnect to grant it.'
              : 'Connect your Autodesk account to upload project files.'
          }
        />
      </main>
    )
  }

  return (
    <ModelUpload
      account={{ name: session.name, email: session.email, avatarUrl: session.avatarUrl }}
    />
  )
}

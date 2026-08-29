'use client'

import { LoaderCircleIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

import { ModelUpload } from '@/components/model-upload'
import { ScopedAutodeskSignIn } from '@/components/scoped-autodesk-sign-in'

type DemoState = 'loading' | 'signed-out' | 'ready' | 'error'

// The first read distinguishes a real session from signed-out without
// exposing session data to the client.
export function ModelUploadPageDemo({
  nextPath = '/components/model-upload-page',
  titleAs = 'h3',
}: {
  nextPath?: string
  titleAs?: 'h1' | 'h2' | 'h3'
} = {}) {
  const [state, setState] = useState<DemoState>('loading')
  const [message, setMessage] = useState<string>()

  useEffect(() => {
    const controller = new AbortController()
    void fetch('/api/models/upload?kind=hubs', { cache: 'no-store', signal: controller.signal })
      .then(async (response) => {
        if (response.status === 401) {
          setState('signed-out')
          return
        }
        if (!response.ok) {
          const body = (await response.json()) as { error?: string }
          setMessage(body.error ?? 'The upload endpoint is unavailable.')
          setState('error')
          return
        }
        setState('ready')
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setMessage('The upload endpoint is unavailable.')
        setState('error')
      })
    return () => controller.abort()
  }, [])

  if (state === 'loading') {
    return (
      <output className="flex min-h-[36rem] w-full items-center justify-center gap-2 text-muted-foreground text-sm">
        <span aria-hidden className="grid size-4 animate-spin place-items-center">
          <LoaderCircleIcon className="size-4" />
        </span>
        Checking your Autodesk connection
      </output>
    )
  }

  if (state === 'signed-out') {
    return (
      <div className="flex min-h-[36rem] w-full items-center justify-center p-6">
        <ScopedAutodeskSignIn
          nextPath={nextPath}
          defaultPresetId="data-write"
          title="Upload models"
          titleAs={titleAs}
          description="Connect the credential-free Autodesk emulator to upload into the live project tree."
        />
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="flex min-h-[36rem] w-full items-center justify-center p-6">
        <p role="status" className="max-w-md text-center text-sm text-status-danger">
          {message}
        </p>
      </div>
    )
  }

  return (
    <ModelUpload
      account={{ name: 'Autodesk account' }}
      signOutHref={`/api/auth/signout?next=${encodeURIComponent(nextPath)}`}
      embedded
    />
  )
}

'use client'

import { LoaderCircleIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

import { ModelUpload } from '@/components/model-upload'

type DemoState = 'loading' | 'ready' | 'error'

// Two-legged: no sign-in — the first read only proves the route is configured.
export function ModelUploadPageDemo() {
  const [state, setState] = useState<DemoState>('loading')
  const [message, setMessage] = useState<string>()

  useEffect(() => {
    const controller = new AbortController()
    void fetch('/api/models/upload?kind=models', { cache: 'no-store', signal: controller.signal })
      .then(async (response) => {
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
        Checking the upload endpoint
      </output>
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

  return <ModelUpload embedded />
}

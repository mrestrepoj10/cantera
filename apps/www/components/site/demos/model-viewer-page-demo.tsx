'use client'

import { LoaderCircleIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

import { ModelBrowser } from '@/components/model-browser'
import type { HubTreeNode } from '@/components/ui/hub-tree'
import { SignInCard } from '@/components/ui/sign-in-card'
import { apsProvider } from '@/lib/aps-oauth-preset'

type DemoState =
  | { status: 'loading' }
  | { status: 'signed-out' }
  | { status: 'ready'; nodes: HubTreeNode[] }
  | { status: 'error'; message: string }

interface TreeResponse {
  nodes?: HubTreeNode[]
  error?: string
}

/**
 * Docs preview for the wired block. Its first read also distinguishes a real
 * acc-sign-in session from the signed-out state without exposing session data
 * to the client; after that, ModelBrowser owns the same lazy endpoint.
 */
export function ModelViewerPageDemo({
  nextPath = '/components/model-viewer-page',
  titleAs = 'h3',
}: {
  nextPath?: string
  titleAs?: 'h1' | 'h2' | 'h3'
} = {}) {
  const [state, setState] = useState<DemoState>({ status: 'loading' })

  useEffect(() => {
    const controller = new AbortController()
    void fetch('/api/models/tree?kind=hubs', {
      cache: 'no-store',
      signal: controller.signal,
    })
      .then(async (response) => {
        const body = (await response.json()) as TreeResponse
        if (response.status === 401) {
          setState({ status: 'signed-out' })
          return
        }
        if (!response.ok || !body.nodes) {
          setState({
            status: 'error',
            message: body.error ?? 'The model tree could not be loaded.',
          })
          return
        }
        setState({ status: 'ready', nodes: body.nodes })
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setState({ status: 'error', message: 'The model tree could not be loaded.' })
      })
    return () => controller.abort()
  }, [])

  if (state.status === 'loading') {
    return (
      <output className="flex min-h-[36rem] w-full items-center justify-center gap-2 text-muted-foreground text-sm">
        <span aria-hidden className="grid size-4 animate-spin place-items-center">
          <LoaderCircleIcon className="size-4" />
        </span>
        Checking your Autodesk connection
      </output>
    )
  }

  if (state.status === 'signed-out') {
    return (
      <div className="flex min-h-[36rem] w-full items-center justify-center p-6">
        <SignInCard
          providers={[apsProvider]}
          hrefTemplate={`/api/auth/{provider}?next=${encodeURIComponent(nextPath)}`}
          title="Browse models"
          titleAs={titleAs}
          description="Connect the credential-free Autodesk emulator to browse the live project tree."
        />
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div className="flex min-h-[36rem] w-full items-center justify-center p-6">
        <p role="status" className="max-w-md text-center text-sm text-status-danger">
          {state.message}
        </p>
      </div>
    )
  }

  return (
    <ModelBrowser
      account={{ name: 'Autodesk account' }}
      initialNodes={state.nodes}
      signOutHref={`/api/auth/signout?next=${encodeURIComponent(nextPath)}`}
    />
  )
}

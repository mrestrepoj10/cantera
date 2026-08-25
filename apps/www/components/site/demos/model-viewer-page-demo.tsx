'use client'

import { LoaderCircleIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

import { ModelBrowser } from '@/components/model-browser'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { HubTreeNode } from '@/components/ui/hub-tree'

type DemoState =
  | { status: 'loading' }
  | { status: 'signed-out' }
  | { status: 'ready'; nodes: HubTreeNode[] }
  | { status: 'error'; message: string }

interface TreeResponse {
  nodes?: HubTreeNode[]
  error?: string
}

// The first read also distinguishes a real session from signed-out without
// exposing session data to the client.
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
    const Title = titleAs
    return (
      <div className="flex min-h-[36rem] w-full items-center justify-center p-6">
        {/* The installed page routes to /sign-in?next=/models; the showcase has
            no /sign-in, so the demo's prompt starts the emulator flow directly. */}
        <Card className="w-full max-w-sm text-center">
          <CardHeader>
            <CardTitle className="text-2xl">
              <Title>Browse models</Title>
            </CardTitle>
            <CardDescription>
              Sign in with the credential-free Autodesk emulator to browse the live project tree.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              nativeButton={false}
              // A navigation, so keep the link role the anchor earns from href.
              role="link"
              render={<a href={`/api/auth/aps?next=${encodeURIComponent(nextPath)}`} />}
              className="min-h-11 w-full"
            >
              Sign in with Autodesk
            </Button>
          </CardContent>
        </Card>
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
      embedded
    />
  )
}

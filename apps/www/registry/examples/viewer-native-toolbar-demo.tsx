'use client'

import { APSViewer } from '@/components/ui/aps-viewer/aps-viewer'
import { ViewerNativeToolbar } from '@/components/ui/viewer-native-toolbar'
import type { GetAccessToken } from '@/lib/viewer-types'

const getAccessToken: GetAccessToken = async () => {
  const response = await fetch('/api/viewer-token', { cache: 'no-store' })
  if (!response.ok) throw new Error('Viewer token unavailable')
  return response.json()
}

export function ViewerNativeToolbarDemo() {
  const urn = process.env.NEXT_PUBLIC_APS_VIEWER_DEMO_URN

  if (!urn) {
    return (
      <section className="rounded-lg border border-border bg-muted p-6">
        <h1 className="font-semibold text-xl">Viewer Native Toolbar</h1>
        <p className="mt-2 text-muted-foreground text-sm">
          Set NEXT_PUBLIC_APS_VIEWER_DEMO_URN and provide /api/viewer-token to load a model.
        </p>
      </section>
    )
  }

  return (
    <main>
      <h1 className="sr-only">Viewer native toolbar example</h1>
      <APSViewer urn={urn} getAccessToken={getAccessToken} className="min-h-[32rem] w-full">
        <ViewerNativeToolbar position="left" scale="lg" />
      </APSViewer>
    </main>
  )
}

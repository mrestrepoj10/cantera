'use client'

import { useState } from 'react'
import { APSViewer as APSViewerCanvas } from '@/components/ui/aps-viewer/aps-viewer'
import {
  APSViewerSettings,
  type APSViewerSettingsValue,
  apsViewerPropsFor,
  DEFAULT_APS_VIEWER_SETTINGS,
} from '@/components/ui/aps-viewer/settings'
import type { GetAccessToken } from '@/lib/viewer-types'

const getAccessToken: GetAccessToken = async () => {
  const response = await fetch('/api/viewer-token', { cache: 'no-store' })
  if (!response.ok) throw new Error('Viewer token unavailable')
  return response.json()
}

export function ApsViewerDemo() {
  const urn = process.env.NEXT_PUBLIC_APS_VIEWER_DEMO_URN
  const [settings, setSettings] = useState<APSViewerSettingsValue>(DEFAULT_APS_VIEWER_SETTINGS)

  if (!urn) {
    return (
      <section className="rounded-lg border border-border bg-muted p-6">
        <h1 className="font-semibold text-xl">APS Viewer</h1>
        <p className="mt-2 text-muted-foreground text-sm">
          Set NEXT_PUBLIC_APS_VIEWER_DEMO_URN and provide /api/viewer-token to load a model.
        </p>
      </section>
    )
  }

  return (
    <main>
      <h1 className="sr-only">APS Viewer example</h1>
      <APSViewerCanvas
        urn={urn}
        getAccessToken={getAccessToken}
        {...apsViewerPropsFor(settings)}
        className="min-h-[32rem] w-full"
      >
        <APSViewerSettings value={settings} onValueChange={setSettings} />
      </APSViewerCanvas>
    </main>
  )
}

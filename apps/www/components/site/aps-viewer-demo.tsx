'use client'

import { Leva, useControls } from 'leva'
import { LoaderCircle } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { APSViewer } from '@/components/ui/aps-viewer/aps-viewer'
import { useAPSModelLoaded } from '@/components/ui/aps-viewer/hooks'
import {
  ViewerNativeToolbar,
  type ViewerNativeToolbarPosition,
  type ViewerNativeToolbarScale,
} from '@/components/ui/viewer-native-toolbar'
import type { GetAccessToken } from '@/lib/viewer-types'

type ViewerTheme = 'system' | 'light' | 'dark'

interface ViewerDemoSettings {
  position: ViewerNativeToolbarPosition
  scale: ViewerNativeToolbarScale
  toolbar: boolean
  theme: ViewerTheme
}

const DEFAULT_SETTINGS: ViewerDemoSettings = {
  position: 'bottom',
  scale: 'md',
  toolbar: true,
  theme: 'system',
}

const LEVA_THEME = {
  colors: {
    elevation1: '#18181b',
    elevation2: '#09090b',
    elevation3: '#27272a',
    accent1: '#2563eb',
    accent2: '#3b82f6',
    accent3: '#93c5fd',
    highlight1: '#d4d4d8',
    highlight2: '#e4e4e7',
    highlight3: '#ffffff',
  },
  fontSizes: { root: '12px', toolTip: '12px' },
  sizes: { rowHeight: '32px' },
}

function ViewerLoadStatus({ error }: { error: string | null }) {
  const modelLoaded = useAPSModelLoaded()
  if (modelLoaded && !error) return null
  return (
    <div
      className="pointer-events-none absolute top-3 left-3 z-10 flex min-h-11 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm shadow-sm"
      role="status"
      aria-live="polite"
    >
      {!error && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}
      <span>{error ?? 'Loading model'}</span>
    </div>
  )
}

function readTestSettings(): Partial<ViewerDemoSettings> | null {
  const query = new URLSearchParams(window.location.search)
  const position = query.get('viewerPosition')
  const scale = query.get('viewerScale')
  if (!position && !scale) return null
  return {
    ...(position && ['bottom', 'top', 'left', 'right'].includes(position)
      ? { position: position as ViewerNativeToolbarPosition }
      : {}),
    ...(scale && ['md', 'lg'].includes(scale) ? { scale: scale as ViewerNativeToolbarScale } : {}),
  }
}

export function APSViewerDemo({ urn }: { urn?: string }) {
  const controls = useControls('Viewer', {
    position: { value: DEFAULT_SETTINGS.position, options: ['bottom', 'top', 'left', 'right'] },
    scale: { value: DEFAULT_SETTINGS.scale, options: ['md', 'lg'] },
    toolbar: DEFAULT_SETTINGS.toolbar,
    theme: { value: DEFAULT_SETTINGS.theme, options: ['system', 'light', 'dark'] },
  })
  const [testSettings, setTestSettings] = useState<Partial<ViewerDemoSettings> | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setTestSettings(readTestSettings())
  }, [])

  const settings: ViewerDemoSettings = {
    position: (testSettings?.position ?? controls.position) as ViewerNativeToolbarPosition,
    scale: (testSettings?.scale ?? controls.scale) as ViewerNativeToolbarScale,
    toolbar: controls.toolbar,
    theme: controls.theme as ViewerTheme,
  }

  const getAccessToken = useCallback<GetAccessToken>(async () => {
    const response = await fetch('/api/viewer-token', { cache: 'no-store' })
    if (!response.ok) throw new Error('The showcase token endpoint is unavailable.')
    return (await response.json()) as Awaited<ReturnType<GetAccessToken>>
  }, [])

  if (!urn) {
    return (
      <div className="flex min-h-[36rem] w-full items-center justify-center bg-muted p-6">
        <div className="max-w-md rounded-lg border border-status-warning bg-status-warning-surface p-5 text-status-warning">
          <h3 className="font-medium text-foreground">Viewer demo is not configured</h3>
          <p className="mt-2 text-sm">
            Set APS_CLIENT_ID, APS_CLIENT_SECRET, and APS_VIEWER_DEMO_URN to load the live model.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid min-h-[36rem] w-full grid-rows-[auto_1fr] bg-background sm:grid-cols-[15rem_1fr] sm:grid-rows-1">
      <aside className="min-h-48 border-border border-b sm:border-r sm:border-b-0">
        <Leva
          fill
          flat
          hideCopyButton
          theme={LEVA_THEME}
          titleBar={{ title: 'Viewer controls', drag: false, filter: false }}
        />
      </aside>
      <APSViewer
        urn={urn}
        getAccessToken={getAccessToken}
        toolbar={settings.toolbar ? 'native' : 'none'}
        theme={settings.theme === 'system' ? undefined : settings.theme}
        className="min-h-[28rem] w-full"
        onError={(nextError) => setError(nextError.message)}
      >
        {settings.toolbar && (
          <ViewerNativeToolbar position={settings.position} scale={settings.scale} />
        )}
        <ViewerLoadStatus error={error} />
        <output
          className="sr-only"
          data-viewer-demo=""
          data-toolbar-position={settings.position}
          data-toolbar-scale={settings.scale}
        >
          Toolbar {settings.position}, {settings.scale}
        </output>
      </APSViewer>
    </div>
  )
}

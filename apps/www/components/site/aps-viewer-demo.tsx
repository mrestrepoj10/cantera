'use client'

import { LoaderCircle, SlidersHorizontalIcon } from 'lucide-react'
import { useCallback, useEffect, useId, useState } from 'react'
import { APSViewer } from '@/components/ui/aps-viewer/aps-viewer'
import { useAPSModelLoaded } from '@/components/ui/aps-viewer/hooks'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  ViewerNativeToolbar,
  type ViewerNativeToolbarPosition,
  type ViewerNativeToolbarScale,
} from '@/components/ui/viewer-native-toolbar'
import { cn } from '@/lib/utils'
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

const positionOptions: { value: ViewerNativeToolbarPosition; label: string }[] = [
  { value: 'bottom', label: 'Bottom' },
  { value: 'top', label: 'Top' },
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
]

const scaleOptions: { value: ViewerNativeToolbarScale; label: string }[] = [
  { value: 'md', label: 'Comfortable' },
  { value: 'lg', label: 'Gloved' },
]

const themeOptions: { value: ViewerTheme; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

function ViewerLoadStatus({ error }: { error: string | null }) {
  const modelLoaded = useAPSModelLoaded()
  if (modelLoaded && !error) return null
  return (
    <div
      className="pointer-events-none absolute top-3 left-3 z-10 flex min-h-11 max-w-[calc(100%-1.5rem)] items-center gap-2 rounded-md border border-border bg-background px-3 text-sm shadow-sm"
      role="status"
      aria-live="polite"
    >
      {!error && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}
      <span>{error ?? 'Loading model'}</span>
    </div>
  )
}

const columnClasses: Record<1 | 2 | 3, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
}

interface ControlGroupProps<T extends string> {
  label: string
  value: T
  options: { value: T; label: string }[]
  columns?: 1 | 2 | 3
  /** Reason the group does not apply right now, shown next to the label. */
  inactiveNote?: string
  onChange: (value: T) => void
}

/**
 * A segmented group of real buttons — `aria-pressed` carries the selection, so
 * the state is exposed without a custom widget role to get wrong.
 */
function ControlGroup<T extends string>({
  label,
  value,
  options,
  columns = 2,
  inactiveNote,
  onChange,
}: ControlGroupProps<T>) {
  return (
    <fieldset>
      <legend className="mb-2 flex flex-wrap items-baseline gap-x-2 font-medium text-muted-foreground text-xs">
        {label}
        {inactiveNote && <span className="font-normal">{inactiveNote}</span>}
      </legend>
      <div className={cn('grid gap-1.5', columnClasses[columns])}>
        {options.map((option) => {
          const selected = option.value === value
          return (
            <Button
              key={option.value}
              type="button"
              variant={selected ? 'default' : 'outline'}
              className="min-h-11 justify-center px-2 text-sm focus-visible:border-ring aria-disabled:opacity-50"
              aria-pressed={selected}
              disabled={Boolean(inactiveNote)}
              focusableWhenDisabled
              onClick={() => onChange(option.value)}
            >
              {option.label}
            </Button>
          )
        })}
      </div>
    </fieldset>
  )
}

/**
 * The e2e toolbar baselines drive the demo from the URL so one page covers
 * every position and scale. Applied after mount: the page is statically
 * rendered, and the server has no query string to render from.
 */
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
  const headingId = useId()
  const toolbarFieldId = useId()
  const toolbarLabelId = `${toolbarFieldId}-label`
  const [settings, setSettings] = useState<ViewerDemoSettings>(DEFAULT_SETTINGS)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fromUrl = readTestSettings()
    if (fromUrl) setSettings((previous) => ({ ...previous, ...fromUrl }))
  }, [])

  const getAccessToken = useCallback<GetAccessToken>(async () => {
    const response = await fetch('/api/viewer-token', { cache: 'no-store' })
    if (!response.ok) throw new Error('The showcase token endpoint is unavailable.')
    return (await response.json()) as Awaited<ReturnType<GetAccessToken>>
  }, [])

  if (!urn) {
    return (
      <div
        className="flex min-h-[36rem] w-full items-center justify-center bg-muted p-6"
        data-viewer-demo="unconfigured"
      >
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
      <aside
        aria-labelledby={headingId}
        className="flex flex-col border-border border-b bg-muted/40 sm:border-r sm:border-b-0"
      >
        <div className="flex items-center gap-2 border-border border-b px-4 py-3">
          <SlidersHorizontalIcon aria-hidden className="size-4 text-muted-foreground" />
          <h3 id={headingId} className="font-medium text-sm">
            Viewer controls
          </h3>
        </div>
        <div className="flex flex-1 flex-col gap-5 p-4">
          <div className="flex flex-col gap-2">
            <span className="font-medium text-muted-foreground text-xs">Toolbar</span>
            <label
              className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-md border border-border px-3 text-sm has-[:focus-visible]:border-ring"
              htmlFor={toolbarFieldId}
            >
              <span id={toolbarLabelId}>Native toolbar</span>
              <Checkbox
                id={toolbarFieldId}
                // The primitive renders a button, so the wrapping label alone
                // does not name it — point at the text explicitly.
                aria-labelledby={toolbarLabelId}
                checked={settings.toolbar}
                onCheckedChange={(checked) =>
                  setSettings((previous) => ({ ...previous, toolbar: checked }))
                }
              />
            </label>
          </div>
          <ControlGroup
            label="Position"
            value={settings.position}
            options={positionOptions}
            inactiveNote={settings.toolbar ? undefined : 'toolbar off'}
            onChange={(position) => setSettings((previous) => ({ ...previous, position }))}
          />
          <ControlGroup
            label="Density"
            value={settings.scale}
            options={scaleOptions}
            columns={1}
            inactiveNote={settings.toolbar ? undefined : 'toolbar off'}
            onChange={(scale) => setSettings((previous) => ({ ...previous, scale }))}
          />
          <ControlGroup
            label="Appearance"
            value={settings.theme}
            options={themeOptions}
            columns={3}
            onChange={(theme) => setSettings((previous) => ({ ...previous, theme }))}
          />
          <p className="mt-auto border-border border-t pt-4 text-muted-foreground text-xs">
            Gloved density raises every toolbar button to a 44px target. Appearance follows the page
            unless you pin it.
          </p>
        </div>
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

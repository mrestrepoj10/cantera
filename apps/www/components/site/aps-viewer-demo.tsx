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
  /** Describes the group; wired with aria-describedby, never left as prose. */
  hint?: string
  /** Inert, because something else in the panel turned it off. */
  disabled?: boolean
  /** Id of the one node explaining why, shared by every group it disables. */
  describedBy?: string
  onChange: (value: T) => void
}

/**
 * A segmented control: one bordered track, a raised thumb for the selection,
 * and real buttons underneath — `aria-pressed` carries the state, so nothing
 * depends on color alone and there is no widget role to get wrong.
 */
function ControlGroup<T extends string>({
  label,
  value,
  options,
  columns = 2,
  hint,
  disabled = false,
  describedBy,
  onChange,
}: ControlGroupProps<T>) {
  const hintId = useId()
  // A disabled group's own hint describes behaviour it does not currently
  // have, so the shared reason takes over — one sentence, referenced by each
  // group it applies to.
  const description = disabled ? undefined : hint
  return (
    <fieldset
      aria-describedby={(disabled ? describedBy : undefined) ?? (hint ? hintId : undefined)}
    >
      <legend className="mb-1.5 font-medium text-muted-foreground text-xs">{label}</legend>
      <div
        className={cn(
          'grid gap-0.5 rounded-lg border border-border bg-muted/60 p-0.5',
          columnClasses[columns],
        )}
      >
        {options.map((option) => {
          const selected = option.value === value
          return (
            <Button
              key={option.value}
              type="button"
              variant="ghost"
              className={cn(
                'h-9 justify-center rounded-md px-1.5 text-muted-foreground text-sm transition-colors hover:bg-background/60 hover:text-foreground focus-visible:border-ring aria-disabled:opacity-50',
                selected &&
                  'bg-background text-foreground shadow-sm hover:bg-background dark:bg-input/70',
              )}
              aria-pressed={selected}
              disabled={disabled}
              focusableWhenDisabled
              onClick={() => onChange(option.value)}
            >
              {option.label}
            </Button>
          )
        })}
      </div>
      {description && (
        <p id={hintId} className="mt-1.5 text-muted-foreground text-xs leading-snug">
          {description}
        </p>
      )}
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
  const toolbarOffId = useId()
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
        <div className="flex items-center gap-2 border-border border-b px-4 py-2.5">
          <SlidersHorizontalIcon aria-hidden className="size-4 text-muted-foreground" />
          <h3 id={headingId} className="font-medium text-sm">
            Viewer controls
          </h3>
        </div>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="flex flex-col gap-1.5">
            <span className="font-medium text-muted-foreground text-xs">Toolbar</span>
            <label
              // The checkbox primitive hooks its focus styles off this group.
              className="group/field-label flex min-h-9 cursor-pointer items-center justify-between gap-3 text-sm"
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
            {!settings.toolbar && (
              <p id={toolbarOffId} className="text-muted-foreground text-xs leading-snug">
                Position and density apply to the native toolbar.
              </p>
            )}
          </div>
          <ControlGroup
            label="Position"
            value={settings.position}
            options={positionOptions}
            disabled={!settings.toolbar}
            describedBy={toolbarOffId}
            onChange={(position) => setSettings((previous) => ({ ...previous, position }))}
          />
          <ControlGroup
            label="Density"
            value={settings.scale}
            options={scaleOptions}
            hint="Gloved raises every toolbar button to a 44px target."
            disabled={!settings.toolbar}
            describedBy={toolbarOffId}
            onChange={(scale) => setSettings((previous) => ({ ...previous, scale }))}
          />
          <ControlGroup
            label="Appearance"
            value={settings.theme}
            options={themeOptions}
            columns={3}
            onChange={(theme) => setSettings((previous) => ({ ...previous, theme }))}
          />
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

'use client'

import { LoaderCircle, SlidersHorizontalIcon } from 'lucide-react'
import { useCallback, useEffect, useId, useState } from 'react'
import { APSViewer } from '@/components/ui/aps-viewer/aps-viewer'
import {
  type APSExtensionResult,
  useAPSExtension,
  useAPSModelLoaded,
} from '@/components/ui/aps-viewer/hooks'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  ViewerNativeToolbar,
  type ViewerNativeToolbarPosition,
  type ViewerNativeToolbarScale,
} from '@/components/ui/viewer-native-toolbar'
import { cn } from '@/lib/utils'
import { VIEWER_EXTENSIONS, type ViewerExtensionInfo } from '@/lib/viewer-extension-types'
import type { GetAccessToken } from '@/lib/viewer-types'

type ViewerTheme = 'system' | 'light' | 'dark'

interface ViewerDemoSettings {
  position: ViewerNativeToolbarPosition
  scale: ViewerNativeToolbarScale
  toolbar: boolean
  theme: ViewerTheme
  /** Extension ids currently checked on. None by default: the stock toolbar
   * is the baseline every screenshot and first impression starts from. */
  extensions: string[]
}

const DEFAULT_SETTINGS: ViewerDemoSettings = {
  position: 'bottom',
  scale: 'md',
  toolbar: true,
  theme: 'system',
  extensions: [],
}

/**
 * The playground renders the `viewer-extension-types` catalog, not a hand
 * list: every 3D-applicable entry that still ships appears, with its
 * description and flags coming straight from the registry item. 2D-only
 * entries are excluded (the demo model is 3D); deprecated and removed ids
 * are excluded because nothing should invite loading them.
 */
const catalogEntries = Object.entries(VIEWER_EXTENSIONS) as [string, ViewerExtensionInfo][]
const applicableEntries = catalogEntries.filter(
  ([, info]) => !info.deprecated && !info.removedIn && info.only !== '2d',
)
const loadableEntries = applicableEntries.filter(([, info]) => !info.autoLoaded)
const autoLoadedEntries = applicableEntries.filter(([, info]) => info.autoLoaded)
const DEMO_EXTENSION_IDS = loadableEntries.map(([id]) => id)

/** Friendly names where splitting the id reads badly. */
const EXTENSION_LABELS: Record<string, string> = {
  'Autodesk.Viewing.MarkupsGui': 'Markups toolbar',
  'Autodesk.Viewing.MarkupsCore': 'Markups core',
  'Autodesk.BimWalk': 'BIM walk',
  'Autodesk.NPR': 'Sketch styles',
  'Autodesk.ViewCubeUi': 'ViewCube',
  'Autodesk.AEC.LevelsExtension': 'Levels',
  'Autodesk.AEC.Minimap3DExtension': 'Minimap',
  'Autodesk.AEC.Hypermodeling': 'Hypermodeling',
  'Autodesk.Viewing.FusionOrbit': 'Fusion orbit',
  'Autodesk.Viewing.ZoomWindow': 'Zoom window',
  'Autodesk.Viewing.PixelCompare': 'Pixel compare',
  'Autodesk.Viewing.SceneBuilder': 'Scene builder',
  'Autodesk.BIM360.Extension.PushPin': 'Push pins',
  'Autodesk.GridsUI': 'Grids UI',
  'Autodesk.DataVisualization': 'Data visualization',
}

function extensionLabel(id: string): string {
  const override = EXTENSION_LABELS[id]
  if (override) return override
  const segment = id.split('.').pop() ?? id
  return segment.replace(/(?<=[a-z0-9])(?=[A-Z])/g, ' ')
}

type DemoExtensionStatus = APSExtensionResult['status']

/**
 * Mounts one live extension load: checking the box mounts this component,
 * `useAPSExtension` fetches and loads the extension, and unchecking unmounts
 * it, which unloads the extension — the viewer keeps its WebGL context
 * throughout. Status is lifted to the playground, which renders outside the
 * viewer's context provider.
 */
function DemoExtension({
  id,
  onStatus,
}: {
  id: string
  onStatus: (id: string, status: DemoExtensionStatus) => void
}) {
  const { status } = useAPSExtension(id)
  useEffect(() => {
    onStatus(id, status)
    return () => onStatus(id, 'idle')
  }, [id, status, onStatus])
  return null
}

const positionOptions: { value: ViewerNativeToolbarPosition; label: string }[] = [
  { value: 'bottom', label: 'Bottom' },
  { value: 'top', label: 'Top' },
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
]

type ViewerDemoScalePreset = 'sm' | 'md' | 'lg'

const scaleOptions: { value: ViewerDemoScalePreset; label: string }[] = [
  { value: 'sm', label: 'Compact' },
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
      <legend className="mb-1 font-medium text-muted-foreground text-xs">{label}</legend>
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
                'h-8 justify-center rounded-md px-1.5 text-muted-foreground text-xs transition-colors hover:bg-background/60 hover:text-foreground focus-visible:border-ring aria-disabled:opacity-50',
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
        <p id={hintId} className="mt-1 text-muted-foreground text-xs leading-snug">
          {description}
        </p>
      )}
    </fieldset>
  )
}

function ExtensionBadge({ children }: { children: string }) {
  return (
    <span className="rounded border border-border px-1.5 py-px text-muted-foreground text-xs">
      {children}
    </span>
  )
}

function extensionBadges(info: ViewerExtensionInfo): string[] {
  const badges: string[] = []
  if (info.autoLoaded) badges.push('built in')
  if (info.addsToolbarButton) badges.push('toolbar button')
  if (info.requiresAecModelData) badges.push('needs AEC data')
  if (info.minViewerVersion) badges.push(`viewer ${info.minViewerVersion}+`)
  return badges
}

interface ExtensionRowProps {
  id: string
  info: ViewerExtensionInfo
  /** Absent for built-in rows: nothing to toggle, the viewer loads them itself. */
  checked?: boolean
  status?: DemoExtensionStatus
  onToggle?: (id: string, checked: boolean) => void
}

function ExtensionRow({ id, info, checked, status = 'idle', onToggle }: ExtensionRowProps) {
  const fieldId = useId()
  const labelId = `${fieldId}-label`
  const errorId = `${fieldId}-error`
  const toggleable = onToggle !== undefined
  const loading = checked === true && status === 'loading'
  const failed = checked === true && status === 'error'
  return (
    <div className="flex items-start justify-between gap-3 py-2">
      <div className="min-w-0">
        <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span id={labelId} className="font-medium text-xs">
            {extensionLabel(id)}
          </span>
          <code className="break-all text-muted-foreground text-xs">{id}</code>
          {extensionBadges(info).map((badge) => (
            <ExtensionBadge key={badge}>{badge}</ExtensionBadge>
          ))}
        </span>
        <p className="mt-0.5 text-muted-foreground text-xs leading-snug">{info.description}</p>
        {failed && (
          // Recoverable — unchecking and rechecking retries the fetch — so
          // this is warning ink, not danger, per the status vocabulary.
          <p id={errorId} role="status" className="mt-0.5 text-status-warning text-xs">
            {extensionLabel(id)} failed to load. Uncheck and check again to retry.
          </p>
        )}
      </div>
      {toggleable && (
        <span className="flex shrink-0 items-center gap-1.5 pt-0.5">
          {loading && (
            <span role="status" className="flex items-center text-muted-foreground">
              <LoaderCircle aria-hidden="true" className="size-3 animate-spin" />
              <span className="sr-only">Loading {extensionLabel(id)}</span>
            </span>
          )}
          <Checkbox
            id={fieldId}
            aria-labelledby={labelId}
            aria-describedby={failed ? errorId : undefined}
            // Pending per the async contract: still focusable and announced,
            // but not actionable until the in-flight load settles.
            aria-disabled={loading || undefined}
            checked={checked ?? false}
            onCheckedChange={(nextChecked) => {
              if (loading) return
              onToggle(id, nextChecked === true)
            }}
          />
        </span>
      )}
    </div>
  )
}

/**
 * The e2e toolbar baselines drive the demo from the URL so one page covers
 * every position and scale. Applied after mount: the page is statically
 * rendered, and the server has no query string to render from.
 */
/** Accepts the presets plus a bare pixel number (e.g. ?viewerScale=48). */
function parseScaleParam(raw: string): { scale: ViewerNativeToolbarScale } | Record<string, never> {
  if (['sm', 'md', 'lg'].includes(raw)) return { scale: raw as ViewerNativeToolbarScale }
  const px = Number(raw)
  return Number.isFinite(px) ? { scale: px } : {}
}

function readTestSettings(): Partial<ViewerDemoSettings> | null {
  const query = new URLSearchParams(window.location.search)
  const position = query.get('viewerPosition')
  const scale = query.get('viewerScale')
  const extensions = query.get('viewerExtensions')
  if (!position && !scale && !extensions) return null
  const extensionIds = (extensions ?? '').split(',').filter((id) => DEMO_EXTENSION_IDS.includes(id))
  return {
    ...(position && ['bottom', 'top', 'left', 'right'].includes(position)
      ? { position: position as ViewerNativeToolbarPosition }
      : {}),
    ...(scale ? parseScaleParam(scale) : {}),
    ...(extensionIds.length > 0 ? { extensions: extensionIds } : {}),
  }
}

export function APSViewerDemo({ urn }: { urn?: string }) {
  const headingId = useId()
  const playgroundHeadingId = useId()
  const toolbarFieldId = useId()
  const toolbarLabelId = `${toolbarFieldId}-label`
  const toolbarOffId = useId()
  const [settings, setSettings] = useState<ViewerDemoSettings>(DEFAULT_SETTINGS)
  const [error, setError] = useState<string | null>(null)
  const [extensionStatus, setExtensionStatus] = useState<Record<string, DemoExtensionStatus>>({})

  const handleExtensionStatus = useCallback((id: string, status: DemoExtensionStatus) => {
    setExtensionStatus((previous) =>
      previous[id] === status ? previous : { ...previous, [id]: status },
    )
  }, [])

  const handleExtensionToggle = useCallback((id: string, checked: boolean) => {
    setSettings((previous) => ({
      ...previous,
      extensions: checked
        ? [...previous.extensions, id]
        : previous.extensions.filter((enabled) => enabled !== id),
    }))
  }, [])

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
    <div className="flex w-full flex-col bg-background">
      <div className="grid grid-rows-[auto_auto] sm:grid-cols-[13rem_1fr] sm:grid-rows-1">
        <aside
          aria-labelledby={headingId}
          className="flex flex-col border-border border-b bg-muted/40 sm:border-r sm:border-b-0"
        >
          <div className="flex items-center gap-2 border-border border-b px-3 py-2">
            <SlidersHorizontalIcon aria-hidden className="size-3.5 text-muted-foreground" />
            <h3 id={headingId} className="font-medium text-xs">
              Viewer controls
            </h3>
          </div>
          <div className="flex flex-1 flex-col gap-3 p-3">
            <div className="flex flex-col gap-1">
              <span className="font-medium text-muted-foreground text-xs">Toolbar</span>
              <label
                // The checkbox primitive hooks its focus styles off this group.
                className="group/field-label flex min-h-8 cursor-pointer items-center justify-between gap-3 text-xs"
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
              value={typeof settings.scale === 'number' ? String(settings.scale) : settings.scale}
              options={scaleOptions}
              hint="Compact is 36px, Comfortable is Autodesk stock, Gloved is a 52px box clearing the 44px field target."
              disabled={!settings.toolbar}
              describedBy={toolbarOffId}
              onChange={(scale) =>
                setSettings((previous) => ({ ...previous, scale: scale as ViewerDemoScalePreset }))
              }
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
        {/* Fixed height on purpose: the captured e2e region must not change
            when the settings panel or the playground below grows. */}
        <APSViewer
          urn={urn}
          getAccessToken={getAccessToken}
          toolbar={settings.toolbar ? 'native' : 'none'}
          theme={settings.theme === 'system' ? undefined : settings.theme}
          className="h-[28rem] w-full sm:h-[36rem]"
          onError={(nextError) => setError(nextError.message)}
        >
          {settings.toolbar && (
            <ViewerNativeToolbar position={settings.position} scale={settings.scale} />
          )}
          {settings.extensions.map((id) => (
            <DemoExtension key={id} id={id} onStatus={handleExtensionStatus} />
          ))}
          <ViewerLoadStatus error={error} />
          <output
            className="sr-only"
            data-viewer-demo=""
            data-toolbar-position={settings.position}
            data-toolbar-scale={settings.scale}
            data-extension-status={settings.extensions
              .map((id) => `${id}:${extensionStatus[id] ?? 'idle'}`)
              .join(' ')}
          >
            Toolbar {settings.position}, {settings.scale}
          </output>
        </APSViewer>
      </div>
      <section
        aria-labelledby={playgroundHeadingId}
        className="border-border border-t px-4 py-4 sm:px-6"
      >
        <h4 id={playgroundHeadingId} className="font-medium text-sm">
          Extensions playground
        </h4>
        <p className="mt-1 max-w-3xl text-muted-foreground text-xs leading-snug">
          Every row is an entry from the viewer-extension-types catalog. Checking one loads it live
          through useAPSExtension; unchecking unloads it without recreating the viewer. Buttons an
          extension adds appear on the native toolbar.
        </p>
        <h5 className="mt-4 font-medium text-muted-foreground text-xs">Load on demand</h5>
        <div className="grid gap-x-8 divide-y divide-border lg:grid-cols-2 lg:divide-y-0">
          {loadableEntries.map(([id, info]) => (
            <ExtensionRow
              key={id}
              id={id}
              info={info}
              checked={settings.extensions.includes(id)}
              status={extensionStatus[id] ?? 'idle'}
              onToggle={handleExtensionToggle}
            />
          ))}
        </div>
        <h5 className="mt-4 font-medium text-muted-foreground text-xs">
          Built in — the viewer loads these itself
        </h5>
        <div className="grid gap-x-8 divide-y divide-border lg:grid-cols-2 lg:divide-y-0">
          {autoLoadedEntries.map(([id, info]) => (
            <ExtensionRow key={id} id={id} info={info} />
          ))}
        </div>
      </section>
    </div>
  )
}

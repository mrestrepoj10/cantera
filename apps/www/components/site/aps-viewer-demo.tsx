'use client'

import { CheckIcon, CopyIcon, LoaderCircle, PlusIcon, XIcon } from 'lucide-react'
import type { KeyboardEvent } from 'react'
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { APSViewer } from '@/components/ui/aps-viewer/aps-viewer'
import { type APSExtensionResult, useAPSExtension } from '@/components/ui/aps-viewer/hooks'
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
  /** Extension ids currently loaded. None by default: the stock toolbar is the
   * baseline every screenshot and first impression starts from. */
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
 * The inspector and the catalog both render the `viewer-extension-types`
 * catalog, not a hand list: every 3D-applicable entry that still ships appears,
 * with its description and flags coming straight from the registry item. 2D-only
 * entries are excluded (the demo model is 3D); deprecated and removed ids are
 * excluded because nothing should invite loading them.
 */
const catalogEntries = Object.entries(VIEWER_EXTENSIONS) as [string, ViewerExtensionInfo][]
const applicableEntries = catalogEntries.filter(
  ([, info]) => !info.deprecated && !info.removedIn && info.only !== '2d',
)
const loadableEntries = applicableEntries.filter(([, info]) => !info.autoLoaded)
const autoLoadedEntries = applicableEntries.filter(([, info]) => info.autoLoaded)
const DEMO_EXTENSION_IDS = loadableEntries.map(([id]) => id)

/**
 * Sections mirror the groups the catalog source is written in. They live here
 * rather than in the registry item because they are a browsing aid for this
 * page, not part of the type contract consumers install.
 */
const EXTENSION_SECTIONS = [
  {
    title: 'Navigation and orientation',
    ids: [
      'Autodesk.ViewCubeUi',
      'Autodesk.BimWalk',
      'Autodesk.Beeline',
      'Autodesk.Viewing.ZoomWindow',
      'Autodesk.Viewing.FusionOrbit',
    ],
  },
  {
    title: 'Model understanding',
    ids: [
      'Autodesk.Measure',
      'Autodesk.Section',
      'Autodesk.Explode',
      'Autodesk.ModelStructure',
      'Autodesk.PropertiesManager',
      'Autodesk.PropertySearch',
      'Autodesk.LayerManager',
      'Autodesk.BoxSelection',
      'Autodesk.VisualClusters',
      'Autodesk.Filter',
    ],
  },
  {
    title: 'Sheets and documents',
    ids: [
      'Autodesk.DocumentBrowser',
      'Autodesk.ModelSheetTransition',
      'Autodesk.Hyperlink',
      'Autodesk.Multipage',
      'Autodesk.StringExtractor',
      'Autodesk.Crop',
    ],
  },
  {
    title: 'AEC',
    ids: [
      'Autodesk.AEC.LevelsExtension',
      'Autodesk.AEC.Minimap3DExtension',
      'Autodesk.AEC.Hypermodeling',
      'Autodesk.Grids',
      'Autodesk.GridsUI',
    ],
  },
  {
    title: 'Markup and authoring',
    ids: [
      'Autodesk.Viewing.MarkupsCore',
      'Autodesk.Viewing.MarkupsGui',
      'Autodesk.Edit2D',
      'Autodesk.Snapping',
    ],
  },
  {
    title: 'Data and comparison',
    ids: [
      'Autodesk.DataVisualization',
      'Autodesk.Viewing.PixelCompare',
      'Autodesk.SplitScreen',
      'Autodesk.ModelsPanel',
      'Autodesk.BIM360.Minimap',
      'Autodesk.BIM360.Extension.PushPin',
      'Autodesk.Geolocation',
      'Autodesk.NPR',
      'Autodesk.Viewing.SceneBuilder',
    ],
  },
] as const

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

/** Catalog order, grouped by section, with anything unlisted kept at the end. */
function groupEntries(entries: [string, ViewerExtensionInfo][]) {
  const byId = new Map(entries)
  const grouped = EXTENSION_SECTIONS.map((section) => ({
    title: section.title,
    entries: section.ids
      .filter((id) => byId.has(id))
      .map((id) => [id, byId.get(id) as ViewerExtensionInfo] as [string, ViewerExtensionInfo]),
  })).filter((section) => section.entries.length > 0)
  const placed = new Set(grouped.flatMap((section) => section.entries.map(([id]) => id)))
  const rest = entries.filter(([id]) => !placed.has(id))
  return rest.length > 0 ? [...grouped, { title: 'Other', entries: rest }] : grouped
}

const loadableSections = groupEntries(loadableEntries)

type DemoExtensionStatus = APSExtensionResult['status']

/**
 * Mounts one live extension load: adding the id mounts this component,
 * `useAPSExtension` fetches and loads the extension, and removing it unmounts,
 * which unloads the extension — the viewer keeps its WebGL context throughout.
 * Status is lifted to the demo, which renders outside the viewer's provider.
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

function extensionBadges(info: ViewerExtensionInfo): string[] {
  const badges: string[] = []
  if (info.autoLoaded) badges.push('built in')
  if (info.addsToolbarButton) badges.push('toolbar button')
  if (info.requiresAecModelData) badges.push('needs AEC data')
  if (info.minViewerVersion) badges.push(`viewer ${info.minViewerVersion}+`)
  return badges
}

function ExtensionBadge({ children }: { children: string }) {
  return (
    <span className="rounded border border-border px-1.5 py-px text-muted-foreground text-xs">
      {children}
    </span>
  )
}

function Spinner({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={cn('grid animate-spin place-items-center', className)}>
      <LoaderCircle className="size-full" />
    </span>
  )
}

/** One clipboard action with the crossfade the motion grammar allows. */
function CopyButton({
  label,
  copiedLabel = 'Copied',
  value,
  className,
}: {
  label: string
  copiedLabel?: string
  value: () => string
  className?: string
}) {
  const [copied, setCopied] = useState(false)
  const timeout = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timeout.current), [])

  async function copy() {
    try {
      await navigator.clipboard.writeText(value())
      setCopied(true)
      window.clearTimeout(timeout.current)
      timeout.current = window.setTimeout(() => setCopied(false), 1600)
    } catch {
      // Clipboard unavailable — the snippet is still selectable on the page.
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn('justify-start gap-1.5', className)}
      onClick={() => void copy()}
    >
      {/* Both icons stay mounted and cross-fade, so the swap animates in
          both directions without a motion dependency. */}
      <span className="relative grid size-3.5 place-items-center">
        <CheckIcon
          aria-hidden="true"
          className={cn(
            'absolute size-3.5 transition-[opacity,scale] duration-150 ease-out',
            copied ? 'scale-100 opacity-100' : 'scale-50 opacity-0',
          )}
        />
        <CopyIcon
          aria-hidden="true"
          className={cn(
            'size-3.5 transition-[opacity,scale] duration-150 ease-out',
            copied ? 'scale-50 opacity-0' : 'scale-100 opacity-100',
          )}
        />
      </span>
      {copied ? copiedLabel : label}
    </Button>
  )
}

interface ExtensionState {
  loaded: string[]
  status: Record<string, DemoExtensionStatus>
  onToggle: (id: string, next: boolean) => void
}

/** A loaded extension, with its live state and a way to unload it. */
function ExtensionChip({
  id,
  status,
  onRemove,
}: {
  id: string
  status: DemoExtensionStatus
  onRemove: (id: string) => void
}) {
  const label = extensionLabel(id)
  const failed = status === 'error'
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border py-0.5 pr-0.5 pl-2 text-xs',
        failed
          ? 'border-status-warning/40 bg-status-warning-surface text-status-warning'
          : 'border-border bg-muted/60 text-foreground',
      )}
    >
      {status === 'loading' && <Spinner className="size-3" />}
      {label}
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        className="rounded-full"
        aria-label={`Unload ${label}`}
        onClick={() => onRemove(id)}
      >
        <XIcon aria-hidden="true" />
      </Button>
    </span>
  )
}

/** Quick add: filter the catalog, toggle an entry, stay in the dock. */
function ExtensionPicker({ loaded, status, onToggle }: ExtensionState) {
  const [query, setQuery] = useState('')
  const fieldId = useId()
  const needle = query.trim().toLowerCase()

  const sections = useMemo(
    () =>
      loadableSections
        .map((section) => ({
          title: section.title,
          entries: section.entries.filter(
            ([id]) =>
              needle.length === 0 ||
              id.toLowerCase().includes(needle) ||
              extensionLabel(id).toLowerCase().includes(needle),
          ),
        }))
        .filter((section) => section.entries.length > 0),
    [needle],
  )

  const matchCount = sections.reduce((total, section) => total + section.entries.length, 0)

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="flex flex-col gap-1">
        <label className="font-medium text-muted-foreground text-xs" htmlFor={fieldId}>
          Find an extension
        </label>
        <input
          id={fieldId}
          type="search"
          value={query}
          placeholder="measure, markup, Autodesk.NPR"
          className="h-8 w-full rounded-md border border-border bg-background px-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1">
        {matchCount === 0 ? (
          <p className="py-6 text-center text-muted-foreground text-xs">
            No extension matches “{query.trim()}”.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {sections.map((section) => (
              <div key={section.title} className="flex flex-col gap-1">
                <h4 className="font-medium text-muted-foreground text-xs">{section.title}</h4>
                <div className="flex flex-col">
                  {section.entries.map(([id, info]) => {
                    const isLoaded = loaded.includes(id)
                    const state = status[id] ?? 'idle'
                    const pending = isLoaded && state === 'loading'
                    return (
                      <button
                        key={id}
                        type="button"
                        aria-pressed={isLoaded}
                        aria-disabled={pending || undefined}
                        className={cn(
                          'flex min-h-8 items-center justify-between gap-2 rounded-md px-2 text-start text-[13px] transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-1',
                          isLoaded && 'text-foreground',
                          !isLoaded && 'text-muted-foreground',
                          pending && 'opacity-60',
                        )}
                        onClick={() => {
                          if (pending) return
                          onToggle(id, !isLoaded)
                        }}
                      >
                        <span className="min-w-0 truncate">{extensionLabel(id)}</span>
                        <span className="flex shrink-0 items-center gap-1.5">
                          {info.addsToolbarButton && (
                            // Decorative here: it would otherwise land inside
                            // the button's accessible name ("Markups toolbar
                            // toolbar"). The catalog table carries the flags.
                            <span aria-hidden="true" className="text-muted-foreground text-xs">
                              toolbar
                            </span>
                          )}
                          {pending ? (
                            <Spinner className="size-3.5 text-muted-foreground" />
                          ) : isLoaded ? (
                            <CheckIcon aria-hidden="true" className="size-3.5" />
                          ) : (
                            <PlusIcon
                              aria-hidden="true"
                              className="size-3.5 text-muted-foreground"
                            />
                          )}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/** The JSX a consumer pastes: the props form, not this demo's children form. */
function buildSnippet(settings: ViewerDemoSettings): string {
  const lines = [
    '<APSViewer',
    '  urn={urn}',
    '  getAccessToken={getAccessToken}',
    `  toolbar="${settings.toolbar ? 'native' : 'none'}"`,
  ]
  if (settings.theme !== 'system') lines.push(`  theme="${settings.theme}"`)
  if (settings.extensions.length === 1) {
    lines.push(`  extensions={['${settings.extensions[0]}']}`)
  } else if (settings.extensions.length > 1) {
    lines.push('  extensions={[')
    for (const id of settings.extensions) lines.push(`    '${id}',`)
    lines.push('  ]}')
  }
  if (!settings.toolbar) {
    lines.push('/>')
    return lines.join('\n')
  }
  lines.push('>')
  const scale = typeof settings.scale === 'number' ? `{${settings.scale}}` : `"${settings.scale}"`
  lines.push(`  <ViewerNativeToolbar position="${settings.position}" scale=${scale} />`)
  lines.push('</APSViewer>')
  return lines.join('\n')
}

/** The same query string the e2e specs drive the demo with, now shareable. */
function buildShareParams(settings: ViewerDemoSettings): string {
  const params = new URLSearchParams()
  params.set('viewerToolbar', settings.toolbar ? 'native' : 'none')
  if (settings.toolbar) {
    params.set('viewerPosition', settings.position)
    params.set('viewerScale', String(settings.scale))
  }
  if (settings.theme !== 'system') params.set('viewerTheme', settings.theme)
  if (settings.extensions.length > 0) {
    params.set('viewerExtensions', settings.extensions.join(','))
  }
  return params.toString()
}

/** Accepts the presets plus a bare pixel number (e.g. ?viewerScale=48). */
function parseScaleParam(raw: string): { scale: ViewerNativeToolbarScale } | Record<string, never> {
  if (['sm', 'md', 'lg'].includes(raw)) return { scale: raw as ViewerNativeToolbarScale }
  const px = Number(raw)
  return Number.isFinite(px) ? { scale: px } : {}
}

/**
 * A shared link — and the e2e toolbar baselines, which drive the demo from the
 * URL so one page covers every position and scale — restores the setup on
 * mount. Applied after mount: the page is statically rendered, and the server
 * has no query string to render from.
 */
function readSharedSettings(): Partial<ViewerDemoSettings> | null {
  const query = new URLSearchParams(window.location.search)
  const position = query.get('viewerPosition')
  const scale = query.get('viewerScale')
  const extensions = query.get('viewerExtensions')
  const toolbar = query.get('viewerToolbar')
  const theme = query.get('viewerTheme')
  if (!position && !scale && !extensions && !toolbar && !theme) return null
  const extensionIds = (extensions ?? '').split(',').filter((id) => DEMO_EXTENSION_IDS.includes(id))
  return {
    ...(position && ['bottom', 'top', 'left', 'right'].includes(position)
      ? { position: position as ViewerNativeToolbarPosition }
      : {}),
    ...(scale ? parseScaleParam(scale) : {}),
    ...(toolbar === 'none' ? { toolbar: false } : toolbar === 'native' ? { toolbar: true } : {}),
    ...(theme === 'light' || theme === 'dark' ? { theme } : {}),
    ...(extensionIds.length > 0 ? { extensions: extensionIds } : {}),
  }
}

const TABS = [
  { id: 'setup', label: 'Setup' },
  { id: 'extensions', label: 'Extensions' },
  { id: 'code', label: 'Code' },
] as const

type TabId = (typeof TABS)[number]['id']

export function APSViewerDemo({ urn }: { urn?: string }) {
  const dockHeadingId = useId()
  const catalogHeadingId = useId()
  const toolbarFieldId = useId()
  const toolbarLabelId = `${toolbarFieldId}-label`
  const toolbarOffId = useId()
  const tabsId = useId()

  const [settings, setSettings] = useState<ViewerDemoSettings>(DEFAULT_SETTINGS)
  const [tab, setTab] = useState<TabId>('setup')
  const [error, setError] = useState<string | null>(null)
  const [modelLoaded, setModelLoaded] = useState(false)
  const [extensionStatus, setExtensionStatus] = useState<Record<string, DemoExtensionStatus>>({})
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  const handleExtensionStatus = useCallback((id: string, status: DemoExtensionStatus) => {
    setExtensionStatus((previous) =>
      previous[id] === status ? previous : { ...previous, [id]: status },
    )
  }, [])

  const handleExtensionToggle = useCallback((id: string, next: boolean) => {
    setSettings((previous) => ({
      ...previous,
      extensions: next
        ? previous.extensions.includes(id)
          ? previous.extensions
          : [...previous.extensions, id]
        : previous.extensions.filter((enabled) => enabled !== id),
    }))
  }, [])

  const handleExtensionRemove = useCallback(
    (id: string) => handleExtensionToggle(id, false),
    [handleExtensionToggle],
  )

  useEffect(() => {
    const fromUrl = readSharedSettings()
    if (fromUrl) setSettings((previous) => ({ ...previous, ...fromUrl }))
  }, [])

  const getAccessToken = useCallback<GetAccessToken>(async () => {
    const response = await fetch('/api/viewer-token', { cache: 'no-store' })
    if (!response.ok) throw new Error('The showcase token endpoint is unavailable.')
    return (await response.json()) as Awaited<ReturnType<GetAccessToken>>
  }, [])

  const snippet = useMemo(() => buildSnippet(settings), [settings])
  const isDefault = useMemo(
    () =>
      settings.toolbar === DEFAULT_SETTINGS.toolbar &&
      settings.position === DEFAULT_SETTINGS.position &&
      settings.scale === DEFAULT_SETTINGS.scale &&
      settings.theme === DEFAULT_SETTINGS.theme &&
      settings.extensions.length === 0,
    [settings],
  )

  // One sentence for the one live region: model first, then anything the
  // extensions are doing. Rebuilt on every change, announced politely.
  const liveMessage = useMemo(() => {
    const parts: string[] = []
    parts.push(error ? error : modelLoaded ? 'Model loaded.' : 'Loading model.')
    for (const id of settings.extensions) {
      const status = extensionStatus[id] ?? 'idle'
      const label = extensionLabel(id)
      if (status === 'loading') parts.push(`${label} loading.`)
      if (status === 'ready') parts.push(`${label} loaded.`)
      if (status === 'error') parts.push(`${label} failed to load.`)
    }
    return parts.join(' ')
  }, [error, modelLoaded, settings.extensions, extensionStatus])

  function onTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = TABS.length - 1
    let next = index
    if (event.key === 'ArrowRight') next = index === last ? 0 : index + 1
    else if (event.key === 'ArrowLeft') next = index === 0 ? last : index - 1
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = last
    else return
    event.preventDefault()
    const nextTab = TABS[next]
    setTab(nextTab.id)
    tabRefs.current[nextTab.id]?.focus()
  }

  if (!urn) {
    return (
      <div
        className="flex min-h-[36rem] w-full items-center justify-center bg-muted p-6"
        data-viewer-demo="unconfigured"
      >
        <div className="max-w-md rounded-lg border border-status-warning bg-status-warning-surface p-5">
          <h3 className="font-medium text-foreground">Viewer demo is not configured</h3>
          <p className="mt-2 text-foreground/80 text-sm">
            Set APS_CLIENT_ID, APS_CLIENT_SECRET, and APS_VIEWER_DEMO_URN to load the live model.
          </p>
        </div>
      </div>
    )
  }

  const loadedCount = settings.extensions.length

  return (
    <div className="flex w-full flex-col bg-background">
      <div className="grid lg:grid-cols-[minmax(0,1fr)_20rem]">
        {/* The canvas is the subject of the page, so it leads on wide screens
            and the dock leads on narrow ones, where it reads as a tab strip. */}
        <div className="order-2 flex min-w-0 flex-col lg:order-1">
          <APSViewer
            urn={urn}
            getAccessToken={getAccessToken}
            toolbar={settings.toolbar ? 'native' : 'none'}
            theme={settings.theme === 'system' ? undefined : settings.theme}
            // min-height rather than height: the viewer is a flex item with
            // a zero basis, so a fixed height would collapse it wherever the
            // column is not stretched by the dock beside it.
            className="min-h-[28rem] w-full flex-1 sm:min-h-[34rem]"
            onModelLoaded={() => setModelLoaded(true)}
            onError={(nextError) => setError(nextError.message)}
          >
            {settings.toolbar && (
              <ViewerNativeToolbar position={settings.position} scale={settings.scale} />
            )}
            {settings.extensions.map((id) => (
              <DemoExtension key={id} id={id} onStatus={handleExtensionStatus} />
            ))}
          </APSViewer>
          {/* Status sits under the canvas, not on it: one strip for the model
              and every extension, so nothing overlaps the viewer or the
              captured region. */}
          <div className="relative flex min-h-11 flex-wrap items-center gap-x-3 gap-y-1.5 border-border border-t px-3 py-2">
            <span className="flex items-center gap-1.5 text-xs">
              {!modelLoaded && !error && <Spinner className="size-3.5 text-muted-foreground" />}
              <span className={error ? 'text-status-warning' : 'text-muted-foreground'}>
                {error ?? (modelLoaded ? 'Model loaded' : 'Loading model')}
              </span>
            </span>
            {settings.extensions.map((id) => {
              const status = extensionStatus[id] ?? 'idle'
              if (status === 'error') {
                return (
                  <span key={id} className="flex items-center gap-1.5 text-xs">
                    {/* Recoverable — reloading retries the fetch — so this is
                        warning ink, not danger, per the status vocabulary. */}
                    <span className="text-status-warning">{extensionLabel(id)} failed to load</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      onClick={() => {
                        handleExtensionToggle(id, false)
                        // Remount on the next frame so the loader runs again.
                        window.requestAnimationFrame(() => handleExtensionToggle(id, true))
                      }}
                    >
                      Retry
                    </Button>
                  </span>
                )
              }
              return (
                <span key={id} className="flex items-center gap-1.5 text-muted-foreground text-xs">
                  {status === 'loading' && <Spinner className="size-3" />}
                  {extensionLabel(id)}
                  {status === 'ready' && <CheckIcon aria-hidden="true" className="size-3" />}
                </span>
              )
            })}
            {/* The one stable live region: rendered from the start, its text
                replaced as state changes, so polite announcements are
                reliable. The data attributes are the e2e contract. */}
            <output
              className="sr-only"
              data-viewer-demo=""
              data-toolbar-position={settings.position}
              data-toolbar-scale={settings.scale}
              data-extension-status={settings.extensions
                .map((id) => `${id}:${extensionStatus[id] ?? 'idle'}`)
                .join(' ')}
            >
              {liveMessage}
            </output>
          </div>
        </div>

        <aside
          aria-labelledby={dockHeadingId}
          className="relative order-1 flex min-h-0 flex-col border-border border-b bg-muted/40 lg:order-2 lg:border-b-0 lg:border-l"
        >
          <h3 id={dockHeadingId} className="sr-only">
            Viewer inspector
          </h3>
          <div
            role="tablist"
            aria-labelledby={dockHeadingId}
            className="flex gap-1 border-border border-b px-2 pt-2"
          >
            {TABS.map((entry, index) => {
              const selected = entry.id === tab
              return (
                <button
                  key={entry.id}
                  ref={(node) => {
                    tabRefs.current[entry.id] = node
                  }}
                  type="button"
                  role="tab"
                  id={`${tabsId}-${entry.id}-tab`}
                  aria-selected={selected}
                  aria-controls={`${tabsId}-${entry.id}-panel`}
                  tabIndex={selected ? 0 : -1}
                  className={cn(
                    'min-h-8 rounded-t-md px-2.5 pb-1.5 font-medium text-xs transition-colors focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-1',
                    selected
                      ? 'bg-background text-foreground shadow-[inset_0_-2px_0_0_var(--color-foreground)]'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                  onClick={() => setTab(entry.id)}
                  onKeyDown={(event) => onTabKeyDown(event, index)}
                >
                  {entry.label}
                  {entry.id === 'extensions' && loadedCount > 0 && (
                    <span className="ms-1 text-muted-foreground tabular-nums">{loadedCount}</span>
                  )}
                </button>
              )
            })}
          </div>

          <div className="flex min-h-0 flex-1 flex-col p-3 lg:max-h-[34rem]">
            {tab === 'setup' && (
              <div
                role="tabpanel"
                id={`${tabsId}-setup-panel`}
                aria-labelledby={`${tabsId}-setup-tab`}
                className="flex flex-col gap-3"
              >
                <fieldset>
                  <legend className="mb-1 font-medium text-muted-foreground text-xs">
                    Toolbar
                  </legend>
                  <label
                    // The checkbox primitive hooks its focus styles off this group.
                    className="group/field-label flex min-h-8 cursor-pointer items-center justify-between gap-3 text-[13px]"
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
                </fieldset>
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
                  value={
                    typeof settings.scale === 'number' ? String(settings.scale) : settings.scale
                  }
                  options={scaleOptions}
                  hint="Compact is 36px, Comfortable is Autodesk stock, Gloved is a 52px box clearing the 44px field target."
                  disabled={!settings.toolbar}
                  describedBy={toolbarOffId}
                  onChange={(scale) =>
                    setSettings((previous) => ({
                      ...previous,
                      scale: scale as ViewerDemoScalePreset,
                    }))
                  }
                />
                <ControlGroup
                  label="Appearance"
                  value={settings.theme}
                  options={themeOptions}
                  columns={3}
                  hint="Forces the viewer's appearance. System follows the site theme live."
                  onChange={(theme) => setSettings((previous) => ({ ...previous, theme }))}
                />
              </div>
            )}

            {tab === 'extensions' && (
              <div
                role="tabpanel"
                id={`${tabsId}-extensions-panel`}
                aria-labelledby={`${tabsId}-extensions-tab`}
                className="flex min-h-0 flex-1 flex-col gap-3"
              >
                {loadedCount > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {settings.extensions.map((id) => (
                      <ExtensionChip
                        key={id}
                        id={id}
                        status={extensionStatus[id] ?? 'idle'}
                        onRemove={handleExtensionRemove}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-xs leading-snug">
                    Nothing loaded yet — the viewer is running its stock toolbar. Pick an extension
                    and it loads live, without recreating the viewer.
                  </p>
                )}
                <ExtensionPicker
                  loaded={settings.extensions}
                  status={extensionStatus}
                  onToggle={handleExtensionToggle}
                />
              </div>
            )}

            {tab === 'code' && (
              <div
                role="tabpanel"
                id={`${tabsId}-code-panel`}
                aria-labelledby={`${tabsId}-code-tab`}
                className="flex min-h-0 flex-1 flex-col gap-2"
              >
                <p className="text-muted-foreground text-xs leading-snug">
                  This is the current setup as you would write it. Extensions are the{' '}
                  <code className="text-foreground">extensions</code> prop here; the demo mounts
                  them as children so it can unload one in place.
                </p>
                <pre className="min-h-0 flex-1 overflow-auto rounded-md border border-border bg-background p-2.5 font-mono text-code leading-relaxed">
                  {snippet}
                </pre>
                <div className="grid gap-1.5">
                  <CopyButton label="Copy code" value={() => snippet} />
                  <CopyButton
                    label="Copy link to this setup"
                    value={() =>
                      `${window.location.origin}${window.location.pathname}?${buildShareParams(settings)}`
                    }
                  />
                  <CopyButton
                    label="Copy install command"
                    value={() => 'npx shadcn@latest add @cantera/aps-viewer'}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex min-h-11 items-center justify-between gap-2 border-border border-t px-3 py-2">
            <span className="text-muted-foreground text-xs tabular-nums">
              {loadedCount === 0
                ? 'No extensions loaded'
                : `${loadedCount} extension${loadedCount === 1 ? '' : 's'} loaded`}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              disabled={isDefault}
              onClick={() => setSettings(DEFAULT_SETTINGS)}
            >
              Reset
            </Button>
          </div>
        </aside>
      </div>

      <section
        aria-labelledby={catalogHeadingId}
        className="border-border border-t px-4 py-5 sm:px-6"
      >
        <h3 id={catalogHeadingId} className="font-medium text-sm">
          Extension catalog
        </h3>
        <p className="mt-1 max-w-2xl text-[13px] text-muted-foreground leading-snug">
          Every 3D-applicable entry in the viewer-extension-types catalog. Loading one here is the
          same live load the inspector does — the flags come straight from the registry item.
        </p>
        <div className="mt-3 overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[48rem] border-collapse text-sm">
            <thead>
              <tr className="border-border border-b bg-muted/40 text-left">
                <th className="px-4 py-2 font-medium text-muted-foreground text-xs">Extension</th>
                <th className="px-4 py-2 font-medium text-muted-foreground text-xs">Description</th>
                <th className="w-20 px-4 py-2 text-right font-medium text-muted-foreground text-xs">
                  Load
                </th>
              </tr>
            </thead>
            <tbody>
              {loadableSections.map((section) => (
                <ExtensionCatalogSection
                  key={section.title}
                  title={section.title}
                  entries={section.entries}
                  loaded={settings.extensions}
                  status={extensionStatus}
                  onToggle={handleExtensionToggle}
                />
              ))}
              <ExtensionCatalogSection
                title="Built in — the viewer loads these itself"
                entries={autoLoadedEntries}
                loaded={settings.extensions}
                status={extensionStatus}
              />
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function ExtensionCatalogSection({
  title,
  entries,
  loaded,
  status,
  onToggle,
}: {
  title: string
  entries: [string, ViewerExtensionInfo][]
  loaded: string[]
  status: Record<string, DemoExtensionStatus>
  onToggle?: (id: string, next: boolean) => void
}) {
  return (
    <>
      <tr className="border-border border-b bg-muted/20">
        <th
          colSpan={3}
          className="px-4 py-1.5 text-left font-medium text-muted-foreground text-xs"
          scope="colgroup"
        >
          {title}
        </th>
      </tr>
      {entries.map(([id, info]) => (
        <ExtensionCatalogRow
          key={id}
          id={id}
          info={info}
          checked={onToggle ? loaded.includes(id) : undefined}
          status={status[id] ?? 'idle'}
          onToggle={onToggle}
        />
      ))}
    </>
  )
}

function ExtensionCatalogRow({
  id,
  info,
  checked,
  status,
  onToggle,
}: {
  id: string
  info: ViewerExtensionInfo
  /** Absent for built-in rows: nothing to toggle, the viewer loads them itself. */
  checked?: boolean
  status: DemoExtensionStatus
  onToggle?: (id: string, next: boolean) => void
}) {
  const fieldId = useId()
  const labelId = `${fieldId}-label`
  const loading = checked === true && status === 'loading'
  return (
    <tr className="border-border border-b last:border-b-0">
      <td className="px-4 py-2.5 align-top">
        <span className="flex flex-col gap-0.5">
          <span id={labelId} className="font-medium text-[13px]">
            {extensionLabel(id)}
          </span>
          <code className="break-words font-mono text-code text-muted-foreground">{id}</code>
          {extensionBadges(info).length > 0 && (
            <span className="mt-0.5 flex flex-wrap gap-1">
              {extensionBadges(info).map((badge) => (
                <ExtensionBadge key={badge}>{badge}</ExtensionBadge>
              ))}
            </span>
          )}
        </span>
      </td>
      <td className="px-4 py-2.5 align-top text-[13px] text-muted-foreground leading-snug">
        {info.description}
      </td>
      <td className="px-4 py-2.5 text-right align-top">
        {onToggle ? (
          // The label and the control share one hit target; the inspector's
          // picker drives the same state from the dock.
          <label
            className="group/field-label inline-flex min-h-8 cursor-pointer items-center justify-end gap-2"
            htmlFor={fieldId}
          >
            {loading && <Spinner className="size-3 text-muted-foreground" />}
            <Checkbox
              id={fieldId}
              aria-labelledby={labelId}
              // Pending per the async contract: still focusable and announced,
              // but not actionable until the in-flight load settles.
              aria-disabled={loading || undefined}
              className={cn(loading && 'opacity-50')}
              checked={checked ?? false}
              onCheckedChange={(next) => {
                if (loading) return
                onToggle(id, next === true)
              }}
            />
          </label>
        ) : (
          <span className="text-muted-foreground text-xs">always</span>
        )}
      </td>
    </tr>
  )
}

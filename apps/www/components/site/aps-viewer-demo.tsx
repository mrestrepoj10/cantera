'use client'

import {
  CheckIcon,
  CopyIcon,
  LoaderCircle,
  PlusIcon,
  SlidersHorizontalIcon,
  XIcon,
} from 'lucide-react'
import type { KeyboardEvent } from 'react'
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import {
  APSViewer,
  type APSViewerToolbarPosition,
  type APSViewerToolbarScale,
} from '@/components/ui/aps-viewer/aps-viewer'
import { type APSExtensionResult, useAPSExtension } from '@/components/ui/aps-viewer/hooks'
import { APSViewerSettingsTrigger } from '@/components/ui/aps-viewer/settings'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { VIEWER_EXTENSIONS, type ViewerExtensionInfo } from '@/lib/viewer-extension-types'
import type { GetAccessToken } from '@/lib/viewer-types'

type ViewerTheme = 'system' | 'light' | 'dark'

interface ViewerDemoSettings {
  position: APSViewerToolbarPosition
  scale: APSViewerToolbarScale
  radius: number
  toolbar: boolean
  viewCube: boolean
  theme: ViewerTheme
  extensions: string[]
}

const DEFAULT_SETTINGS: ViewerDemoSettings = {
  position: 'bottom',
  scale: 'md',
  radius: 12,
  toolbar: true,
  viewCube: true,
  theme: 'system',
  extensions: [],
}

const catalogEntries = Object.entries(VIEWER_EXTENSIONS) as [string, ViewerExtensionInfo][]
const applicableEntries = catalogEntries.filter(
  ([, info]) => !info.deprecated && !info.removedIn && info.only !== '2d',
)
const loadableEntries = applicableEntries.filter(
  ([id, info]) => !info.autoLoaded && id !== 'Autodesk.ViewCubeUi',
)
const DEMO_EXTENSION_IDS = loadableEntries.map(([id]) => id)

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

interface ExtensionLabelById {
  [extensionId: string]: string
}

const EXTENSION_LABELS: ExtensionLabelById = {
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

const positionOptions: { value: APSViewerToolbarPosition; label: string }[] = [
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

const columnClasses = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
} satisfies Record<1 | 2 | 3 | 4, string>

interface ControlGroupProps<T extends string> {
  label: string
  value: T
  options: { value: T; label: string }[]
  columns?: 1 | 2 | 3 | 4
  hint?: string
  disabled?: boolean
  describedBy?: string
  onChange: (value: T) => void
}

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
  // A disabled group's own hint describes behaviour it lacks; the shared reason takes over.
  const description = disabled ? undefined : hint
  return (
    <fieldset
      className="min-w-0"
      aria-describedby={(disabled ? describedBy : undefined) ?? (hint ? hintId : undefined)}
    >
      <legend className="mb-1.5 font-medium text-[13px] text-foreground">{label}</legend>
      <div className={cn('grid rounded-lg bg-muted/60', columnClasses[columns])}>
        {options.map((option) => {
          const selected = option.value === value
          return (
            <Button
              key={option.value}
              type="button"
              variant="ghost"
              className={cn(
                'relative isolate h-11 justify-center rounded-lg bg-transparent px-1 text-[13px] text-muted-foreground transition-colors duration-150 before:absolute before:inset-1 before:-z-10 before:rounded-md before:transition-[background-color,box-shadow] before:duration-150 hover:bg-transparent hover:text-foreground hover:before:bg-background/60 focus-visible:border-ring aria-disabled:opacity-50',
                selected &&
                  'text-foreground before:bg-background before:shadow-xs hover:before:bg-background dark:before:bg-input/70',
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
        <p id={hintId} className="mt-1.5 text-pretty text-muted-foreground text-xs leading-relaxed">
          {description}
        </p>
      )}
    </fieldset>
  )
}

function RangeControl({
  label,
  value,
  min,
  max,
  disabled = false,
  describedBy,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  disabled?: boolean
  describedBy?: string
  onChange: (value: number) => void
}) {
  const id = useId()
  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="font-medium text-[13px] text-foreground">
          {label}
        </label>
        <output htmlFor={id} className="font-mono text-muted-foreground text-xs tabular-nums">
          {value}px
        </output>
      </div>
      <div className="min-w-0 px-1">
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step="1"
          value={value}
          aria-disabled={disabled}
          aria-describedby={disabled ? describedBy : undefined}
          onChange={(event) => {
            if (!disabled) onChange(Number(event.currentTarget.value))
          }}
          onKeyDown={(event) => {
            if (disabled) event.preventDefault()
          }}
          onPointerDown={(event) => {
            if (disabled) event.preventDefault()
          }}
          className="h-11 w-full min-w-0 max-w-full cursor-pointer accent-foreground aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
        />
      </div>
    </div>
  )
}

function extensionBadges(info: ViewerExtensionInfo): string[] {
  const badges: string[] = []
  if (info.addsToolbarButton) badges.push('toolbar button')
  if (info.requiresAecModelData) badges.push('needs AEC data')
  if (info.minViewerVersion) badges.push(`viewer ${info.minViewerVersion}+`)
  return badges
}

function ExtensionBadge({ children }: { children: string }) {
  return (
    <span className="whitespace-nowrap rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
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
      <span className="relative grid size-3.5 place-items-center">
        <CheckIcon
          aria-hidden="true"
          className={cn(
            'absolute size-3.5 transition-opacity duration-150 ease-out',
            copied ? 'opacity-100' : 'opacity-0',
          )}
        />
        <CopyIcon
          aria-hidden="true"
          className={cn(
            'size-3.5 transition-opacity duration-150 ease-out',
            copied ? 'opacity-0' : 'opacity-100',
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
            ([id, info]) =>
              needle.length === 0 ||
              id.toLowerCase().includes(needle) ||
              extensionLabel(id).toLowerCase().includes(needle) ||
              info.description.toLowerCase().includes(needle),
          ),
        }))
        .filter((section) => section.entries.length > 0),
    [needle],
  )

  const matchCount = sections.reduce((total, section) => total + section.entries.length, 0)

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-3">
          <label className="font-medium text-[13px] text-foreground" htmlFor={fieldId}>
            Find an extension
          </label>
          <span className="text-muted-foreground text-xs tabular-nums">
            {matchCount} {matchCount === 1 ? 'result' : 'results'}
          </span>
        </div>
        <input
          id={fieldId}
          type="search"
          value={query}
          placeholder="measure, markup, Autodesk.NPR"
          className="h-11 w-full rounded-md border border-border bg-background px-3 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:text-sm"
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1">
        {matchCount === 0 ? (
          <p className="py-6 text-center text-muted-foreground text-xs">
            No extension matches “{query.trim()}”.
          </p>
        ) : (
          <div className="flex flex-col gap-5">
            {sections.map((section) => (
              <section key={section.title} className="flex flex-col gap-1.5">
                <h4 className="font-semibold text-sm text-foreground">{section.title}</h4>
                <div className="flex flex-col gap-1">
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
                          'group flex min-h-11 items-start justify-between gap-3 rounded-lg px-2.5 py-2 text-start transition-colors duration-150 hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-1',
                          isLoaded && 'bg-muted/70 text-foreground',
                          !isLoaded && 'text-foreground',
                          pending && 'opacity-60',
                        )}
                        onClick={() => {
                          if (pending) return
                          onToggle(id, !isLoaded)
                        }}
                      >
                        <span className="min-w-0">
                          <span className="block font-medium text-sm leading-snug">
                            {extensionLabel(id)}
                          </span>
                          <span className="mt-0.5 line-clamp-2 block text-pretty text-[13px] text-muted-foreground leading-relaxed">
                            {info.description}
                          </span>
                          {extensionBadges(info).length > 0 && (
                            <span aria-hidden="true" className="mt-1.5 flex flex-wrap gap-1">
                              {extensionBadges(info).map((badge) => (
                                <ExtensionBadge key={badge}>{badge}</ExtensionBadge>
                              ))}
                            </span>
                          )}
                        </span>
                        <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground group-hover:text-foreground">
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
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function buildSnippet(settings: ViewerDemoSettings): string {
  const lines = [
    '<APSViewer',
    '  urn={urn}',
    '  getAccessToken={getAccessToken}',
    `  toolbar="${settings.toolbar ? 'native' : 'none'}"`,
    `  radius={${settings.radius}}`,
  ]
  if (!settings.viewCube) lines.push('  viewCube={false}')
  if (settings.theme !== 'system') lines.push(`  theme="${settings.theme}"`)
  if (settings.extensions.length === 1) {
    lines.push(`  extensions={['${settings.extensions[0]}']}`)
  } else if (settings.extensions.length > 1) {
    lines.push('  extensions={[')
    for (const id of settings.extensions) lines.push(`    '${id}',`)
    lines.push('  ]}')
  }
  if (settings.toolbar) {
    lines.push(`  toolbarPosition="${settings.position}"`)
    const scale = typeof settings.scale === 'number' ? `{${settings.scale}}` : `"${settings.scale}"`
    lines.push(`  toolbarScale=${scale}`)
  }
  lines.push('/>')
  return lines.join('\n')
}

/** The same query string the e2e specs drive the demo with, now shareable. */
function buildShareParams(settings: ViewerDemoSettings): string {
  const params = new URLSearchParams()
  params.set('viewerToolbar', settings.toolbar ? 'native' : 'none')
  params.set('viewerViewCube', settings.viewCube ? 'on' : 'off')
  params.set('viewerRadius', String(settings.radius))
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

function parseScaleParam(raw: string): APSViewerToolbarScale | null {
  if (raw === 'sm' || raw === 'md' || raw === 'lg') return raw
  const px = Number(raw)
  return Number.isFinite(px) ? px : null
}

function parseClampedPixels(raw: string | null, min: number, max: number): number | null {
  if (raw === null) return null
  const value = Number(raw)
  if (!Number.isFinite(value)) return null
  return Math.min(max, Math.max(min, value))
}

// Applied after mount: the page is statically rendered, so the server has no
// query string. The e2e toolbar specs drive the demo through these params.
function readSharedSettings(): Partial<ViewerDemoSettings> | null {
  const query = new URLSearchParams(window.location.search)
  const position = query.get('viewerPosition')
  const scale = query.get('viewerScale')
  const extensions = query.get('viewerExtensions')
  const toolbar = query.get('viewerToolbar')
  const viewCube = query.get('viewerViewCube')
  const radius = query.get('viewerRadius')
  const theme = query.get('viewerTheme')
  if (!position && !scale && !extensions && !toolbar && !viewCube && !radius && !theme) {
    return null
  }
  const extensionIds = (extensions ?? '').split(',').filter((id) => DEMO_EXTENSION_IDS.includes(id))
  const parsedRadius = parseClampedPixels(radius, 0, 32)
  // Empty string too: `?viewerScale=` must keep the default, not parse to 0.
  const parsedScale = scale ? parseScaleParam(scale) : null
  const settings: Partial<ViewerDemoSettings> = {}
  if (position === 'bottom' || position === 'top' || position === 'left' || position === 'right') {
    settings.position = position
  }
  if (parsedScale !== null) settings.scale = parsedScale
  if (parsedRadius !== null) settings.radius = parsedRadius
  if (toolbar === 'none' || toolbar === 'native') settings.toolbar = toolbar === 'native'
  if (viewCube === 'off' || viewCube === 'on') settings.viewCube = viewCube === 'on'
  if (theme === 'light' || theme === 'dark') settings.theme = theme
  if (extensionIds.length > 0) settings.extensions = extensionIds
  return settings
}

const TABS = [
  { id: 'setup', label: 'Setup' },
  { id: 'extensions', label: 'Extensions' },
  { id: 'code', label: 'Code' },
] as const

type TabId = (typeof TABS)[number]['id']

export function APSViewerDemo({ urn }: { urn?: string }) {
  const dockHeadingId = useId()
  const toolbarFieldId = useId()
  const toolbarLabelId = `${toolbarFieldId}-label`
  const viewCubeFieldId = useId()
  const viewCubeLabelId = `${viewCubeFieldId}-label`
  const toolbarOffId = useId()
  const tabsId = useId()

  const [settings, setSettings] = useState<ViewerDemoSettings>(DEFAULT_SETTINGS)
  // Open on the showcase so the inspector is discoverable; a consumer wiring
  // this pattern into their own app would start it collapsed.
  const [inspectorOpen, setInspectorOpen] = useState(true)
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

  const handleExtensionRetry = useCallback(
    (id: string) => {
      handleExtensionToggle(id, false)
      // Remount on the next frame so the loader runs again.
      window.requestAnimationFrame(() => handleExtensionToggle(id, true))
    },
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
      settings.viewCube === DEFAULT_SETTINGS.viewCube &&
      settings.position === DEFAULT_SETTINGS.position &&
      settings.scale === DEFAULT_SETTINGS.scale &&
      settings.radius === DEFAULT_SETTINGS.radius &&
      settings.theme === DEFAULT_SETTINGS.theme &&
      settings.extensions.length === 0,
    [settings],
  )

  const liveMessage = useMemo(() => {
    const parts: string[] = []
    parts.push(error ? error : modelLoaded ? 'Model loaded' : 'Loading model')
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
  const failedExtensionId = settings.extensions.find((id) => extensionStatus[id] === 'error')

  return (
    <div className="flex w-full flex-col bg-background">
      <div
        className="relative overflow-hidden border border-border"
        data-viewer-workbench=""
        style={{ borderRadius: settings.radius }}
      >
        <div className="relative flex min-w-0 flex-col">
          <APSViewer
            urn={urn}
            getAccessToken={getAccessToken}
            toolbar={settings.toolbar ? 'native' : 'none'}
            toolbarPosition={settings.position}
            toolbarScale={settings.scale}
            viewCube={settings.viewCube}
            radius={settings.radius}
            theme={settings.theme === 'system' ? undefined : settings.theme}
            className="min-h-[28rem] w-full flex-1 sm:min-h-[36rem]"
            onModelLoaded={() => setModelLoaded(true)}
            onError={(nextError) => setError(nextError.message)}
          >
            {settings.extensions.map((id) => (
              <DemoExtension key={id} id={id} onStatus={handleExtensionStatus} />
            ))}
            {settings.toolbar && (
              <APSViewerSettingsTrigger
                open={inspectorOpen}
                onToggle={() => setInspectorOpen((open) => !open)}
              />
            )}
            {!inspectorOpen && !settings.toolbar && (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      aria-label="Viewer settings"
                      variant="ghost"
                      onClick={() => setInspectorOpen(true)}
                      className={cn(
                        'absolute top-4 left-4 z-10 size-11 rounded-xl bg-popover/90 shadow-md ring-1 ring-foreground/10 backdrop-blur',
                        settings.theme !== 'system' && settings.theme,
                      )}
                    />
                  }
                >
                  <SlidersHorizontalIcon className="size-5" />
                </TooltipTrigger>
                <TooltipContent side="right">Viewer settings</TooltipContent>
              </Tooltip>
            )}
          </APSViewer>
          {/* sr-only: state stays available to AT and e2e without a visual strip. */}
          <output
            className="sr-only"
            data-viewer-demo=""
            data-viewer-model-status=""
            data-toolbar-position={settings.position}
            data-toolbar-scale={settings.scale}
            data-viewer-radius={settings.radius}
            data-view-cube={settings.viewCube ? 'on' : 'off'}
            data-extension-status={settings.extensions
              .map((id) => `${id}:${extensionStatus[id] ?? 'idle'}`)
              .join(' ')}
          >
            {liveMessage}
          </output>
        </div>

        {inspectorOpen && (
          <aside
            aria-labelledby={dockHeadingId}
            className={cn(
              'absolute top-4 left-4 z-10 flex max-h-[calc(100%-2rem)] w-80 max-w-[calc(100%-2rem)] flex-col overflow-hidden rounded-lg bg-popover/95 text-popover-foreground shadow-lg ring-1 ring-foreground/10 backdrop-blur',
              // A forced viewer appearance re-scopes the site palette, so the
              // panel reads as part of the canvas it floats over.
              settings.theme !== 'system' && settings.theme,
            )}
          >
            <div className="flex items-center gap-1.5 border-border/60 border-b px-2.5 py-1.5">
              <h3
                id={dockHeadingId}
                className="font-medium font-mono text-[11px] uppercase tracking-[0.12em]"
              >
                Viewer inspector
              </h3>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label="Collapse viewer settings"
                className="relative ml-auto after:absolute after:-inset-2.5"
                onClick={() => setInspectorOpen(false)}
              >
                <XIcon />
              </Button>
            </div>
            <div
              role="tablist"
              aria-labelledby={dockHeadingId}
              className="grid grid-cols-3 border-border border-b px-2 pt-2"
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
                      'min-h-11 rounded-t-md px-2 pb-1 font-medium text-[13px] transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-1',
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

            <div className="flex min-h-0 flex-1 flex-col p-3">
              {tab === 'setup' && (
                <div
                  role="tabpanel"
                  id={`${tabsId}-setup-panel`}
                  aria-labelledby={`${tabsId}-setup-tab`}
                  className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-x-hidden overflow-y-auto"
                >
                  <fieldset className="min-w-0">
                    <legend className="mb-1.5 font-medium text-[13px] text-foreground">
                      Chrome
                    </legend>
                    <label
                      // The checkbox primitive hooks its focus styles off this group.
                      className="group/field-label flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-md px-1 text-sm"
                      htmlFor={toolbarFieldId}
                    >
                      <span id={toolbarLabelId}>Native toolbar</span>
                      <Checkbox
                        id={toolbarFieldId}
                        // The primitive renders a button, so the wrapping label alone
                        // does not name it — point at the text explicitly.
                        aria-labelledby={toolbarLabelId}
                        checked={settings.toolbar}
                        onCheckedChange={(checked) => {
                          setModelLoaded(false)
                          setError(null)
                          setSettings((previous) => ({ ...previous, toolbar: checked }))
                        }}
                      />
                    </label>
                    <label
                      className="group/field-label flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-md px-1 text-sm"
                      htmlFor={viewCubeFieldId}
                    >
                      <span id={viewCubeLabelId}>ViewCube</span>
                      <Checkbox
                        id={viewCubeFieldId}
                        aria-labelledby={viewCubeLabelId}
                        checked={settings.viewCube}
                        onCheckedChange={(viewCube) =>
                          setSettings((previous) => ({ ...previous, viewCube }))
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
                    columns={4}
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
                    columns={3}
                    hint="Compact is 36px, Comfortable is 44px, and Gloved is 52px."
                    disabled={!settings.toolbar}
                    describedBy={toolbarOffId}
                    onChange={(scale) =>
                      setSettings((previous) => ({
                        ...previous,
                        scale: scale as ViewerDemoScalePreset,
                      }))
                    }
                  />
                  <RangeControl
                    label="Viewer radius"
                    value={settings.radius}
                    min={0}
                    max={32}
                    onChange={(radius) => setSettings((previous) => ({ ...previous, radius }))}
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
                    <p className="text-pretty text-[13px] text-muted-foreground leading-relaxed">
                      Add extensions live—no viewer restart.
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
              <span
                className={cn(
                  'min-w-0 text-xs tabular-nums',
                  error || failedExtensionId ? 'text-status-warning' : 'text-muted-foreground',
                )}
              >
                {error ??
                  (failedExtensionId
                    ? `${extensionLabel(failedExtensionId)} failed to load`
                    : loadedCount === 0
                      ? 'No extensions loaded'
                      : `${loadedCount} extension${loadedCount === 1 ? '' : 's'} loaded`)}
              </span>
              <div className="flex shrink-0 items-center gap-1">
                {failedExtensionId && (
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={() => handleExtensionRetry(failedExtensionId)}
                  >
                    Retry
                  </Button>
                )}
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
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}

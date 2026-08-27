'use client'

import {
  BoxesIcon,
  FilesIcon,
  FootprintsIcon,
  LayersIcon,
  MapIcon,
  MousePointer2Icon,
  PencilLineIcon,
  RulerIcon,
  ScissorsIcon,
  TablePropertiesIcon,
} from 'lucide-react'
import type { ComponentType, ReactNode } from 'react'
import { useId } from 'react'
import { cn } from '@/lib/utils'

export type ViewerTheme = 'system' | 'light' | 'dark'
export type ToolbarPosition = 'bottom' | 'top' | 'left' | 'right'
export type ToolbarScale = 'sm' | 'md' | 'lg'
export type ViewerProfile = 'aec' | 'default' | 'fluent' | 'navis'

export interface ViewerConfig {
  profile: ViewerProfile
  toolbar: boolean
  toolbarPosition: ToolbarPosition
  toolbarScale: ToolbarScale
  viewCube: boolean
  theme: ViewerTheme
  radius: number
  autoResize: boolean
  extensions: string[]
}

export const DEFAULT_CONFIG: ViewerConfig = {
  profile: 'aec',
  toolbar: true,
  toolbarPosition: 'bottom',
  toolbarScale: 'md',
  viewCube: true,
  theme: 'dark',
  radius: 12,
  autoResize: true,
  extensions: ['Autodesk.Measure', 'Autodesk.AEC.LevelsExtension', 'Autodesk.Section'],
}

export interface ExtensionInfo {
  id: string
  label: string
  group: 'Navigation' | 'Inspect' | 'Collaborate'
  icon: ComponentType<{ className?: string }>
}

export const EXTENSIONS: ExtensionInfo[] = [
  { id: 'Autodesk.AEC.LevelsExtension', label: 'Levels', group: 'Navigation', icon: LayersIcon },
  { id: 'Autodesk.BimWalk', label: 'BIM Walk', group: 'Navigation', icon: FootprintsIcon },
  { id: 'Autodesk.AEC.Minimap3DExtension', label: 'Minimap', group: 'Navigation', icon: MapIcon },
  { id: 'Autodesk.Measure', label: 'Measure', group: 'Inspect', icon: RulerIcon },
  { id: 'Autodesk.Section', label: 'Section', group: 'Inspect', icon: ScissorsIcon },
  { id: 'Autodesk.Explode', label: 'Explode', group: 'Inspect', icon: BoxesIcon },
  {
    id: 'Autodesk.PropertiesManager',
    label: 'Properties',
    group: 'Inspect',
    icon: TablePropertiesIcon,
  },
  {
    id: 'Autodesk.Viewing.MarkupsGui',
    label: 'Markup',
    group: 'Collaborate',
    icon: PencilLineIcon,
  },
  { id: 'Autodesk.DocumentBrowser', label: 'Sheets', group: 'Collaborate', icon: FilesIcon },
]

export const EXTENSION_GROUPS = ['Navigation', 'Inspect', 'Collaborate'] as const

export const PROFILE_OPTIONS: { value: ViewerProfile; label: string }[] = [
  { value: 'aec', label: 'AEC' },
  { value: 'default', label: 'Default' },
  { value: 'fluent', label: 'Fluent' },
  { value: 'navis', label: 'Navis' },
]

export const THEME_OPTIONS: { value: ViewerTheme; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

export const POSITION_OPTIONS: { value: ToolbarPosition; label: string }[] = [
  { value: 'top', label: 'Top' },
  { value: 'bottom', label: 'Bottom' },
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
]

export const SCALE_OPTIONS: { value: ToolbarScale; label: string }[] = [
  { value: 'sm', label: 'S' },
  { value: 'md', label: 'M' },
  { value: 'lg', label: 'L' },
]

export function toggleExtension(config: ViewerConfig, id: string): ViewerConfig {
  const extensions = config.extensions.includes(id)
    ? config.extensions.filter((entry) => entry !== id)
    : [...config.extensions, id]
  return { ...config, extensions }
}

const SCALE_PX = { sm: 36, md: 44, lg: 52 } satisfies Record<ToolbarScale, number>

const TOOLBAR_ANCHOR = {
  bottom: 'inset-x-0 bottom-4 flex-row justify-center',
  top: 'inset-x-0 top-4 flex-row justify-center',
  left: 'inset-y-0 left-4 flex-col justify-center',
  right: 'inset-y-0 right-4 flex-col justify-center',
} satisfies Record<ToolbarPosition, string>

/** The stand-in for the SDK's own toolbar, so the mockups can be judged on how
 * they sit next to it rather than in isolation. */
function NativeToolbar({ config, trailing }: { config: ViewerConfig; trailing?: ReactNode }) {
  const box = SCALE_PX[config.toolbarScale]
  const active = EXTENSIONS.filter((extension) => config.extensions.includes(extension.id))
  const vertical = config.toolbarPosition === 'left' || config.toolbarPosition === 'right'
  return (
    <div
      className={cn('pointer-events-none absolute flex', TOOLBAR_ANCHOR[config.toolbarPosition])}
    >
      <div
        className={cn(
          'flex items-center gap-0.5 rounded-lg bg-black/55 p-1 ring-1 ring-white/15 backdrop-blur',
          vertical && 'flex-col',
        )}
      >
        <div aria-hidden className={cn('flex items-center gap-0.5', vertical && 'flex-col')}>
          <div
            className="grid place-items-center rounded-md bg-white/15 text-white"
            style={{ width: box, height: box }}
          >
            <MousePointer2Icon className="size-4" />
          </div>
          {active.map((extension) => (
            <div
              key={extension.id}
              className="grid place-items-center rounded-md text-white/70"
              style={{ width: box, height: box }}
            >
              <extension.icon className="size-4" />
            </div>
          ))}
        </div>
        {trailing && (
          <div
            className={cn(
              'pointer-events-auto flex items-center gap-0.5 border-white/20',
              vertical ? 'mt-1 flex-col border-t pt-1' : 'ml-1 border-l pl-1',
            )}
            style={vertical ? { width: box } : { height: box }}
          >
            {trailing}
          </div>
        )}
      </div>
    </div>
  )
}

/** The pixel box the SDK toolbar renders its buttons at, so an injected
 * control can match it exactly. */
export function nativeToolbarBox(config: ViewerConfig): number {
  return SCALE_PX[config.toolbarScale]
}

function ViewCube() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 100 100"
      className="absolute top-4 right-4 size-16 text-white/70 drop-shadow"
    >
      <title>View cube</title>
      <path d="M50 12 84 30 50 48 16 30Z" fill="currentColor" opacity="0.85" />
      <path d="M16 30 50 48v40L16 70Z" fill="currentColor" opacity="0.45" />
      <path d="M84 30 50 48v40l34-18Z" fill="currentColor" opacity="0.6" />
      <path
        d="M50 12 84 30 50 48 16 30Z M16 30v40l34 18 34-18V30"
        fill="none"
        stroke="white"
        strokeOpacity="0.5"
        strokeWidth="2"
      />
    </svg>
  )
}

function Massing() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 800 460"
      preserveAspectRatio="xMidYMid meet"
      className="absolute inset-0 size-full"
    >
      <title>Placeholder model</title>
      <g stroke="currentColor" strokeOpacity="0.16" strokeWidth="1">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((step) => (
          <line
            key={`h-${step}`}
            x1={90 - step * 10}
            y1={300 + step * 20}
            x2={710 + step * 10}
            y2={300 + step * 20}
          />
        ))}
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((step) => (
          <line key={`v-${step}`} x1={150 + step * 50} y1={300} x2={90 + step * 62} y2={460} />
        ))}
      </g>
      <g>
        <path d="M250 250 400 175 550 250 400 325Z" fill="currentColor" fillOpacity="0.34" />
        <path d="M250 250v90l150 75v-90Z" fill="currentColor" fillOpacity="0.2" />
        <path d="M550 250v90l-150 75v-90Z" fill="currentColor" fillOpacity="0.26" />
        <path d="M310 105 400 60 490 105 400 150Z" fill="currentColor" fillOpacity="0.4" />
        <path d="M310 105v100l90 45v-100Z" fill="currentColor" fillOpacity="0.24" />
        <path d="M490 105v100l-90 45v-100Z" fill="currentColor" fillOpacity="0.3" />
        <path
          d="M250 250 400 175 550 250 400 325Z M250 250v90l150 75 150-75v-90 M310 105 400 60 490 105 400 150Z M310 105v100l90 45 90-45v-100"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.5"
          strokeWidth="1.5"
        />
      </g>
    </svg>
  )
}

export function MockCanvas({
  config,
  children,
  className,
  toolbarTrailing,
}: {
  config: ViewerConfig
  children?: ReactNode
  className?: string
  toolbarTrailing?: ReactNode
}) {
  const dark = config.theme !== 'light'
  return (
    <div
      className={cn(
        'relative isolate min-h-[26rem] flex-1 overflow-hidden ring-1 ring-inset',
        dark
          ? 'bg-[#171a1f] text-white ring-white/10'
          : 'bg-[#eef1f5] text-slate-800 ring-black/10',
        className,
      )}
      style={{ borderRadius: config.radius }}
    >
      <Massing />
      {config.viewCube && <ViewCube />}
      {config.toolbar && <NativeToolbar config={config} trailing={toolbarTrailing} />}
      <span
        className={cn(
          'absolute bottom-3 left-4 font-mono text-[11px] uppercase tracking-[0.14em]',
          dark ? 'text-white/40' : 'text-black/40',
        )}
      >
        profile: {config.profile} — mockup, not a live viewer
      </span>
      {children}
    </div>
  )
}

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  size = 'default',
  className,
}: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
  size?: 'default' | 'compact'
  className?: string
}) {
  return (
    <fieldset className={cn('min-w-0', className)}>
      <legend className="mb-1.5 font-medium text-[13px] text-foreground">{label}</legend>
      <div
        className="grid rounded-lg bg-muted/60 p-0.5"
        style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      >
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={option.value === value}
            onClick={() => onChange(option.value)}
            className={cn(
              'rounded-md text-[13px] text-muted-foreground transition-colors focus-ring hover:text-foreground',
              size === 'default' ? 'h-10' : 'h-7',
              option.value === value && 'bg-background text-foreground shadow-xs',
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

export function ToggleRow({
  label,
  hint,
  checked,
  onChange,
  size = 'default',
}: {
  label: string
  hint?: string
  checked: boolean
  onChange: (checked: boolean) => void
  size?: 'default' | 'compact'
}) {
  const hintId = useId()
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3',
        size === 'default' ? 'min-h-11' : 'min-h-7',
      )}
    >
      <span className="min-w-0">
        <span className="block font-medium text-[13px] text-foreground">{label}</span>
        {hint && (
          <span id={hintId} className="block text-muted-foreground text-xs">
            {hint}
          </span>
        )}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={hint ? hintId : undefined}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative shrink-0 rounded-full transition-colors focus-ring',
          size === 'default' ? 'h-6 w-11' : 'h-4 w-7',
          checked ? 'bg-foreground' : 'bg-muted-foreground/35',
        )}
      >
        <span className="sr-only">{label}</span>
        <span
          className={cn(
            'absolute top-0.5 rounded-full bg-background transition-[left] duration-150',
            size === 'default' ? 'size-5' : 'size-3',
            checked ? (size === 'default' ? 'left-[1.375rem]' : 'left-[0.875rem]') : 'left-0.5',
          )}
        />
      </button>
    </div>
  )
}

export function SliderRow({
  label,
  value,
  min,
  max,
  unit = 'px',
  onChange,
  size = 'default',
}: {
  label: string
  value: number
  min: number
  max: number
  unit?: string
  onChange: (value: number) => void
  size?: 'default' | 'compact'
}) {
  const id = useId()
  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="font-medium text-[13px] text-foreground">
          {label}
        </label>
        <output htmlFor={id} className="font-mono text-muted-foreground text-xs tabular-nums">
          {value}
          {unit}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step="1"
        value={value}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
        className={cn(
          'w-full cursor-pointer accent-foreground',
          size === 'default' ? 'h-11' : 'h-6',
        )}
      />
    </div>
  )
}

export function PanelSection({
  title,
  children,
  className,
}: {
  title: string
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('flex flex-col gap-3', className)}>
      <h3 className="font-medium font-mono text-[11px] text-muted-foreground uppercase tracking-[0.14em]">
        {title}
      </h3>
      {children}
    </section>
  )
}

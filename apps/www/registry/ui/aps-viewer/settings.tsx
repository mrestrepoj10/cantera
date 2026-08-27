'use client'

import { SlidersHorizontalIcon, XIcon } from 'lucide-react'
import { type ReactNode, useEffect, useId, useRef, useState } from 'react'
import type { APSViewerProps } from '@/components/ui/aps-viewer/aps-viewer'
import { useAPSViewer } from '@/components/ui/aps-viewer/hooks'
import type {
  APSViewerToolbarPosition,
  APSViewerToolbarScale,
} from '@/components/ui/aps-viewer/toolbar'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

export type APSViewerSettingsTheme = 'system' | 'light' | 'dark'
export type APSViewerSettingsScale = Extract<APSViewerToolbarScale, string>

export interface APSViewerSettingsValue {
  toolbar: boolean
  toolbarPosition: APSViewerToolbarPosition
  toolbarScale: APSViewerSettingsScale
  viewCube: boolean
  theme: APSViewerSettingsTheme
}

export const DEFAULT_APS_VIEWER_SETTINGS: APSViewerSettingsValue = {
  toolbar: true,
  toolbarPosition: 'bottom',
  toolbarScale: 'md',
  viewCube: true,
  theme: 'system',
}

/** Spread onto APSViewer: `<APSViewer {...apsViewerPropsFor(value)} />`. */
export function apsViewerPropsFor(
  value: APSViewerSettingsValue,
): Pick<APSViewerProps, 'toolbar' | 'toolbarPosition' | 'toolbarScale' | 'viewCube' | 'theme'> {
  return {
    toolbar: value.toolbar ? 'native' : 'none',
    toolbarPosition: value.toolbarPosition,
    toolbarScale: value.toolbarScale,
    viewCube: value.viewCube,
    theme: value.theme === 'system' ? undefined : value.theme,
  }
}

const GROUP_ID = 'cantera-viewer-settings-group'
const BUTTON_ID = 'cantera-viewer-settings-button'
const STYLE_ATTRIBUTE = 'data-cantera-aps-viewer-settings'

const SETTINGS_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;display:block" aria-hidden="true"><line x1="21" x2="14" y1="4" y2="4"/><line x1="10" x2="3" y1="4" y2="4"/><line x1="21" x2="12" y1="12" y2="12"/><line x1="8" x2="3" y1="12" y2="12"/><line x1="21" x2="16" y1="20" y2="20"/><line x1="12" x2="3" y1="20" y2="20"/><line x1="14" x2="14" y1="2" y2="6"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="16" x2="16" y1="18" y2="22"/></svg>`

// Mid-gray divider before our control group, legible on both LMV themes; the
// orientation follows the cantera-toolbar-- classes the toolbar item applies.
const SETTINGS_TRIGGER_CSS = `
.adsk-control-group.cantera-viewer-settings-group {
  border-inline-start: 1px solid rgb(128 128 128 / 40%);
}

.cantera-toolbar--left .cantera-viewer-settings-group,
.cantera-toolbar--right .cantera-viewer-settings-group {
  border-inline-start: 0;
  border-top: 1px solid rgb(128 128 128 / 40%);
}
`

let stylesheetConsumers = 0

function retainStylesheet(): void {
  stylesheetConsumers += 1
  if (document.head.querySelector(`style[${STYLE_ATTRIBUTE}]`)) return
  const style = document.createElement('style')
  style.setAttribute(STYLE_ATTRIBUTE, '')
  style.textContent = SETTINGS_TRIGGER_CSS
  document.head.appendChild(style)
}

function releaseStylesheet(): void {
  stylesheetConsumers = Math.max(0, stylesheetConsumers - 1)
  if (stylesheetConsumers === 0) {
    document.head.querySelector(`style[${STYLE_ATTRIBUTE}]`)?.remove()
  }
}

type ToolbarButton = Autodesk.Viewing.UI.Button & { container: HTMLElement }

export interface APSViewerSettingsTriggerProps {
  open: boolean
  onToggle: () => void
  label?: string
}

/** Appends a settings button to the SDK's own toolbar, the way an APS
 * extension would: our control group after a divider, inheriting the
 * toolbar's position and scale. Renders nothing itself. */
export function APSViewerSettingsTrigger({
  open,
  onToggle,
  label = 'Viewer settings',
}: APSViewerSettingsTriggerProps) {
  const { viewer } = useAPSViewer()
  const buttonRef = useRef<ToolbarButton | null>(null)
  const openRef = useRef(open)
  const toggleRef = useRef(onToggle)
  const labelRef = useRef(label)
  // Synced after commit, not during render: a render React discards must
  // never leave its callbacks behind.
  useEffect(() => {
    openRef.current = open
    toggleRef.current = onToggle
    labelRef.current = label
  })

  useEffect(() => {
    if (!viewer) return
    const viewing = window.Autodesk?.Viewing
    if (!viewing) return
    retainStylesheet()

    const mount = () => {
      const toolbar = viewer.toolbar
      if (!toolbar || toolbar.getControl(GROUP_ID) || buttonRef.current) return
      const button = new viewing.UI.Button(BUTTON_ID) as ToolbarButton
      button.setToolTip(labelRef.current)
      button.icon.innerHTML = SETTINGS_ICON_SVG
      button.onClick = () => toggleRef.current()
      // LMV buttons are divs with mouse handlers only; wire up the keyboard
      // and name/role/state ourselves.
      const node = button.container
      node.setAttribute('role', 'button')
      node.setAttribute('aria-label', labelRef.current)
      node.tabIndex = 0
      node.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return
        event.preventDefault()
        toggleRef.current()
      })
      button.setState(
        openRef.current ? viewing.UI.Button.State.ACTIVE : viewing.UI.Button.State.INACTIVE,
      )
      node.setAttribute('aria-pressed', String(openRef.current))
      const group = new viewing.UI.ControlGroup(GROUP_ID)
      group.addClass('cantera-viewer-settings-group')
      group.addControl(button)
      toolbar.addControl(group)
      buttonRef.current = button
    }

    mount()
    viewer.addEventListener(viewing.TOOLBAR_CREATED_EVENT, mount)
    return () => {
      viewer.removeEventListener(viewing.TOOLBAR_CREATED_EVENT, mount)
      buttonRef.current = null
      try {
        viewer.toolbar?.removeControl(GROUP_ID)
      } catch {
        // the viewer may already be finished
      }
      releaseStylesheet()
    }
  }, [viewer])

  useEffect(() => {
    const viewing = window.Autodesk?.Viewing
    const button = buttonRef.current
    if (!viewing || !button) return
    button.setState(open ? viewing.UI.Button.State.ACTIVE : viewing.UI.Button.State.INACTIVE)
    button.container.setAttribute('aria-pressed', String(open))
  }, [open])

  return null
}

const POSITION_OPTIONS: { value: APSViewerToolbarPosition; label: string }[] = [
  { value: 'bottom', label: 'Bottom' },
  { value: 'top', label: 'Top' },
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
]

const SCALE_OPTIONS: { value: APSViewerSettingsScale; label: string }[] = [
  { value: 'sm', label: 'Compact' },
  { value: 'md', label: 'Comfortable' },
  { value: 'lg', label: 'Gloved' },
]

const THEME_OPTIONS: { value: APSViewerSettingsTheme; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

function SegmentedControl<T extends string>({
  label,
  value,
  options,
  columns,
  disabled = false,
  describedBy,
  onChange,
}: {
  label: string
  value: T
  options: { value: T; label: string }[]
  columns: 3 | 4
  disabled?: boolean
  describedBy?: string
  onChange: (value: T) => void
}) {
  return (
    <fieldset className="min-w-0" aria-describedby={disabled ? describedBy : undefined}>
      <legend className="mb-1.5 font-medium text-[13px] text-foreground">{label}</legend>
      <div
        className={cn('grid rounded-lg bg-muted/60', columns === 3 ? 'grid-cols-3' : 'grid-cols-4')}
      >
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
    </fieldset>
  )
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  const fieldId = useId()
  const labelId = `${fieldId}-label`
  return (
    <label
      className="group/field-label flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-md px-1 text-sm"
      htmlFor={fieldId}
    >
      <span id={labelId}>{label}</span>
      <Checkbox
        id={fieldId}
        // The primitive renders a button, so the wrapping label alone does
        // not name it — point at the text explicitly.
        aria-labelledby={labelId}
        checked={checked}
        onCheckedChange={onChange}
      />
    </label>
  )
}

export interface APSViewerSettingsProps {
  value: APSViewerSettingsValue
  onValueChange: (value: APSViewerSettingsValue) => void
  /** Omit for uncontrolled open state (collapsed by default). */
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  label?: string
  className?: string
  /** Extra sections appended below the built-in controls. */
  children?: ReactNode
}

/** Render inside APSViewer. The trigger lives in the SDK toolbar (a corner
 * button stands in when the native toolbar is off); the panel floats over
 * the canvas and starts collapsed. */
export function APSViewerSettings({
  value,
  onValueChange,
  open,
  defaultOpen = false,
  onOpenChange,
  label = 'Viewer settings',
  className,
  children,
}: APSViewerSettingsProps) {
  const headingId = useId()
  const toolbarOffId = useId()
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen)
  const isOpen = open ?? uncontrolledOpen
  const setOpen = (next: boolean) => {
    if (open === undefined) setUncontrolledOpen(next)
    onOpenChange?.(next)
  }

  return (
    <>
      {value.toolbar && (
        <APSViewerSettingsTrigger open={isOpen} onToggle={() => setOpen(!isOpen)} label={label} />
      )}
      {!isOpen && !value.toolbar && (
        <Button
          aria-label={label}
          variant="ghost"
          onClick={() => setOpen(true)}
          className="absolute top-4 left-4 z-10 size-11 rounded-xl bg-popover/90 shadow-md ring-1 ring-foreground/10 backdrop-blur"
        >
          <SlidersHorizontalIcon className="size-5" />
        </Button>
      )}
      {isOpen && (
        <section
          aria-labelledby={headingId}
          className={cn(
            'absolute top-4 left-4 z-10 flex max-h-[calc(100%-2rem)] w-72 max-w-[calc(100%-2rem)] flex-col overflow-hidden rounded-lg bg-popover/95 text-popover-foreground shadow-lg ring-1 ring-foreground/10 backdrop-blur',
            className,
          )}
        >
          <div className="flex items-center gap-1.5 border-border/60 border-b px-2.5 py-1.5">
            <h3
              id={headingId}
              className="font-medium font-mono text-[11px] uppercase tracking-[0.12em]"
            >
              {label}
            </h3>
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={`Collapse ${label.toLowerCase()}`}
              className="relative ml-auto after:absolute after:-inset-2.5"
              onClick={() => setOpen(false)}
            >
              <XIcon />
            </Button>
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
            <fieldset className="min-w-0">
              <legend className="mb-1.5 font-medium text-[13px] text-foreground">Chrome</legend>
              <ToggleRow
                label="Native toolbar"
                checked={value.toolbar}
                onChange={(toolbar) => onValueChange({ ...value, toolbar })}
              />
              <ToggleRow
                label="View cube"
                checked={value.viewCube}
                onChange={(viewCube) => onValueChange({ ...value, viewCube })}
              />
              {!value.toolbar && (
                <p id={toolbarOffId} className="text-muted-foreground text-xs leading-snug">
                  Position and density apply to the native toolbar.
                </p>
              )}
            </fieldset>
            <SegmentedControl
              label="Position"
              value={value.toolbarPosition}
              options={POSITION_OPTIONS}
              columns={4}
              disabled={!value.toolbar}
              describedBy={toolbarOffId}
              onChange={(toolbarPosition) => onValueChange({ ...value, toolbarPosition })}
            />
            <SegmentedControl
              label="Density"
              value={value.toolbarScale}
              options={SCALE_OPTIONS}
              columns={3}
              disabled={!value.toolbar}
              describedBy={toolbarOffId}
              onChange={(toolbarScale) => onValueChange({ ...value, toolbarScale })}
            />
            <SegmentedControl
              label="Appearance"
              value={value.theme}
              options={THEME_OPTIONS}
              columns={3}
              onChange={(theme) => onValueChange({ ...value, theme })}
            />
            {children}
          </div>
        </section>
      )}
    </>
  )
}

'use client'

import { ChevronRightIcon, GripHorizontalIcon, SlidersHorizontalIcon } from 'lucide-react'
import { InspectorPanel } from '@/components/mockups/viewer-config/inspector'
import type { ControlProps } from '@/components/mockups/viewer-config/settings-body'
import { MockCanvas, nativeToolbarBox } from '@/components/mockups/viewer-config/shared'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export interface TriggerProps extends ControlProps {
  open: boolean
  setOpen: (open: boolean) => void
}

const PANEL_ANCHOR = 'absolute top-4 left-4'

/** Our own control group appended to the SDK toolbar, the way an APS
 * extension adds one: `viewer.toolbar.addControl(group)`. */
export function TriggerNativeButton({ config, setConfig, open, setOpen }: TriggerProps) {
  const box = nativeToolbarBox(config)
  return (
    <MockCanvas
      config={config}
      toolbarTrailing={
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                type="button"
                aria-label="Viewer settings"
                aria-pressed={open}
                onClick={() => setOpen(!open)}
                className={cn(
                  'grid place-items-center rounded-md text-white/70 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/70',
                  open && 'bg-white/15 text-white',
                )}
                style={{ width: box, height: box }}
              />
            }
          >
            <SlidersHorizontalIcon className="size-4" />
          </TooltipTrigger>
          <TooltipContent side="top">Viewer settings</TooltipContent>
        </Tooltip>
      }
    >
      {open && (
        <InspectorPanel
          config={config}
          setConfig={setConfig}
          onCollapse={() => setOpen(false)}
          className={PANEL_ANCHOR}
        />
      )}
    </MockCanvas>
  )
}

export function TriggerCornerButton({ config, setConfig, open, setOpen }: TriggerProps) {
  return (
    <MockCanvas config={config}>
      {open ? (
        <InspectorPanel
          config={config}
          setConfig={setConfig}
          onCollapse={() => setOpen(false)}
          className={PANEL_ANCHOR}
        />
      ) : (
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                aria-label="Viewer settings"
                variant="ghost"
                onClick={() => setOpen(true)}
                className="absolute top-4 left-4 size-11 rounded-xl bg-popover/90 shadow-md ring-1 ring-foreground/10 backdrop-blur"
              />
            }
          >
            <SlidersHorizontalIcon className="size-5" />
          </TooltipTrigger>
          <TooltipContent side="right">Viewer settings</TooltipContent>
        </Tooltip>
      )}
    </MockCanvas>
  )
}

export function TriggerSelfCollapsing({ config, setConfig, open, setOpen }: TriggerProps) {
  return (
    <MockCanvas config={config}>
      {open ? (
        <InspectorPanel
          config={config}
          setConfig={setConfig}
          onCollapse={() => setOpen(false)}
          className={PANEL_ANCHOR}
        />
      ) : (
        <button
          type="button"
          aria-expanded={false}
          onClick={() => setOpen(true)}
          className="absolute top-4 left-4 flex h-11 items-center gap-1.5 rounded-lg bg-popover/95 px-2.5 text-popover-foreground shadow-lg ring-1 ring-foreground/10 backdrop-blur focus-ring hover:bg-popover"
        >
          <GripHorizontalIcon aria-hidden className="size-3.5 text-muted-foreground" />
          <span className="font-medium font-mono text-[11px] uppercase tracking-[0.12em]">
            Viewer
          </span>
          <ChevronRightIcon aria-hidden className="size-3 text-muted-foreground" />
        </button>
      )}
    </MockCanvas>
  )
}

const RAIL_TOOLS = [
  { id: 'settings', label: 'Viewer settings', icon: SlidersHorizontalIcon },
] as const

export function TriggerEdgeRail({ config, setConfig, open, setOpen }: TriggerProps) {
  return (
    <MockCanvas config={config}>
      <div className="absolute top-4 left-4 flex flex-col gap-0.5 rounded-xl bg-popover/90 p-1 shadow-md ring-1 ring-foreground/10 backdrop-blur">
        {RAIL_TOOLS.map((tool) => (
          <Tooltip key={tool.id}>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  aria-label={tool.label}
                  aria-pressed={open}
                  onClick={() => setOpen(!open)}
                  className={cn('size-11 rounded-lg', open && 'bg-muted text-foreground')}
                />
              }
            >
              <tool.icon className="size-5" />
            </TooltipTrigger>
            <TooltipContent side="right">{tool.label}</TooltipContent>
          </Tooltip>
        ))}
      </div>
      {open && (
        <InspectorPanel
          config={config}
          setConfig={setConfig}
          onCollapse={() => setOpen(false)}
          className="absolute top-4 left-[4.25rem]"
        />
      )}
    </MockCanvas>
  )
}

export function TriggerEdgeHandle({ config, setConfig, open, setOpen }: TriggerProps) {
  return (
    <MockCanvas config={config}>
      {open ? (
        <InspectorPanel
          config={config}
          setConfig={setConfig}
          onCollapse={() => setOpen(false)}
          className="absolute top-4 left-0"
        />
      ) : (
        <button
          type="button"
          aria-label="Open viewer settings"
          aria-expanded={false}
          onClick={() => setOpen(true)}
          className="absolute top-16 left-0 flex h-16 w-5 items-center justify-center rounded-r-md bg-popover/90 text-muted-foreground shadow-md ring-1 ring-foreground/10 backdrop-blur focus-ring hover:w-6 hover:text-foreground"
        >
          <ChevronRightIcon aria-hidden className="size-3.5" />
        </button>
      )}
    </MockCanvas>
  )
}

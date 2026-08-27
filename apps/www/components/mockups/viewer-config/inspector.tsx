'use client'

import { ChevronDownIcon, GripHorizontalIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { type ControlProps, ExtensionList } from '@/components/mockups/viewer-config/settings-body'
import {
  POSITION_OPTIONS,
  PROFILE_OPTIONS,
  SCALE_OPTIONS,
  Segmented,
  SliderRow,
  THEME_OPTIONS,
  ToggleRow,
} from '@/components/mockups/viewer-config/shared'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function InspectorFolder({
  title,
  children,
  defaultOpen = true,
}: {
  title: string
  children: ReactNode
  defaultOpen?: boolean
}) {
  return (
    <details open={defaultOpen} className="group border-border/60 border-b last:border-b-0">
      <summary className="flex cursor-default list-none items-center gap-1.5 px-2.5 py-1.5 font-mono text-[11px] text-muted-foreground uppercase tracking-[0.12em] marker:content-none hover:text-foreground">
        <ChevronDownIcon className="size-3 transition-transform group-not-open:-rotate-90" />
        {title}
      </summary>
      <div className="flex flex-col gap-2 px-2.5 pt-0.5 pb-2.5">{children}</div>
    </details>
  )
}

export function InspectorPanel({
  config,
  setConfig,
  onCollapse,
  className,
}: ControlProps & { onCollapse?: () => void; className?: string }) {
  return (
    <div
      className={cn(
        'w-64 overflow-hidden rounded-lg bg-popover/95 text-popover-foreground shadow-lg ring-1 ring-foreground/10 backdrop-blur',
        className,
      )}
    >
      <div className="flex items-center gap-1.5 border-border/60 border-b px-2.5 py-1.5">
        <GripHorizontalIcon aria-hidden className="size-3.5 text-muted-foreground" />
        <span className="font-medium font-mono text-[11px] uppercase tracking-[0.12em]">
          Viewer
        </span>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="Collapse viewer settings"
          className="ml-auto"
          onClick={onCollapse}
        >
          <ChevronDownIcon />
        </Button>
      </div>
      <div className="max-h-[17rem] overflow-y-auto">
        <InspectorFolder title="Appearance">
          <Segmented
            size="compact"
            label="Theme"
            value={config.theme}
            options={THEME_OPTIONS}
            onChange={(theme) => setConfig({ ...config, theme })}
          />
          <SliderRow
            size="compact"
            label="Radius"
            value={config.radius}
            min={0}
            max={32}
            onChange={(radius) => setConfig({ ...config, radius })}
          />
        </InspectorFolder>
        <InspectorFolder title="Toolbar">
          <ToggleRow
            size="compact"
            label="Native toolbar"
            checked={config.toolbar}
            onChange={(toolbar) => setConfig({ ...config, toolbar })}
          />
          <Segmented
            size="compact"
            label="Position"
            value={config.toolbarPosition}
            options={POSITION_OPTIONS}
            onChange={(toolbarPosition) => setConfig({ ...config, toolbarPosition })}
          />
          <Segmented
            size="compact"
            label="Scale"
            value={config.toolbarScale}
            options={SCALE_OPTIONS}
            onChange={(toolbarScale) => setConfig({ ...config, toolbarScale })}
          />
          <ToggleRow
            size="compact"
            label="View cube"
            checked={config.viewCube}
            onChange={(viewCube) => setConfig({ ...config, viewCube })}
          />
        </InspectorFolder>
        <InspectorFolder title="Extensions" defaultOpen={false}>
          <ExtensionList config={config} setConfig={setConfig} size="compact" />
        </InspectorFolder>
        <InspectorFolder title="Runtime" defaultOpen={false}>
          <Segmented
            size="compact"
            label="Profile"
            value={config.profile}
            options={PROFILE_OPTIONS}
            onChange={(profile) => setConfig({ ...config, profile })}
          />
        </InspectorFolder>
      </div>
    </div>
  )
}

'use client'

import {
  ChevronDownIcon,
  GripHorizontalIcon,
  Maximize2Icon,
  MousePointer2Icon,
  PaletteIcon,
  PuzzleIcon,
  SettingsIcon,
  SlidersHorizontalIcon,
  SquareDashedIcon,
  WrenchIcon,
} from 'lucide-react'
import { useState } from 'react'
import {
  type ControlProps,
  ExtensionList,
  SettingsBody,
} from '@/components/mockups/viewer-config/settings-body'
import {
  EXTENSION_GROUPS,
  EXTENSIONS,
  MockCanvas,
  PanelSection,
  POSITION_OPTIONS,
  PROFILE_OPTIONS,
  SCALE_OPTIONS,
  Segmented,
  SliderRow,
  THEME_OPTIONS,
  ToggleRow,
  toggleExtension,
} from '@/components/mockups/viewer-config/shared'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export function OptionDock({ config, setConfig }: ControlProps) {
  const active = EXTENSIONS.filter((extension) => config.extensions.includes(extension.id))
  return (
    <MockCanvas config={{ ...config, toolbar: false }}>
      <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center px-4">
        <div className="pointer-events-auto flex items-center gap-1 rounded-2xl bg-popover/90 p-1.5 shadow-lg ring-1 ring-foreground/10 backdrop-blur">
          <DockButton label="Select" active>
            <MousePointer2Icon />
          </DockButton>
          {active.map((extension) => (
            <DockButton key={extension.id} label={extension.label}>
              <extension.icon />
            </DockButton>
          ))}
          <Separator orientation="vertical" className="mx-0.5 h-6" />
          <Popover>
            <PopoverTrigger
              render={
                <Button
                  variant="ghost"
                  className="size-11 rounded-xl"
                  aria-label="Viewer settings"
                />
              }
            >
              <SettingsIcon className="size-5" />
            </PopoverTrigger>
            <PopoverContent
              side="top"
              align="end"
              sideOffset={12}
              className="max-h-[19rem] w-80 overflow-y-auto"
            >
              <SettingsBody config={config} setConfig={setConfig} />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </MockCanvas>
  )
}

function DockButton({
  label,
  active = false,
  children,
}: {
  label: string
  active?: boolean
  children: React.ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            aria-label={label}
            aria-pressed={active}
            className={cn('size-11 rounded-xl', active && 'bg-muted text-foreground')}
          />
        }
      >
        <span className="[&_svg]:size-5">{children}</span>
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  )
}

const DOCK_TABS = [
  { id: 'appearance', label: 'Appearance', icon: PaletteIcon },
  { id: 'toolbar', label: 'Toolbar', icon: WrenchIcon },
  { id: 'extensions', label: 'Extensions', icon: PuzzleIcon },
  { id: 'runtime', label: 'Runtime', icon: SlidersHorizontalIcon },
] as const

export function OptionDockedInspector({ config, setConfig }: ControlProps) {
  const [tab, setTab] = useState<(typeof DOCK_TABS)[number]['id']>('toolbar')
  return (
    <div className="flex min-h-[26rem] gap-3">
      <MockCanvas config={config} />
      <aside className="flex w-72 shrink-0 flex-col rounded-xl border border-border bg-card">
        <div className="flex items-center gap-1 border-border border-b p-1.5">
          {DOCK_TABS.map((entry) => (
            <Tooltip key={entry.id}>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    aria-label={entry.label}
                    aria-pressed={tab === entry.id}
                    onClick={() => setTab(entry.id)}
                    className={cn('h-11 flex-1', tab === entry.id && 'bg-muted text-foreground')}
                  />
                }
              >
                <entry.icon />
              </TooltipTrigger>
              <TooltipContent>{entry.label}</TooltipContent>
            </Tooltip>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <SettingsBody config={config} setConfig={setConfig} sections={[tab]} />
        </div>
      </aside>
    </div>
  )
}

function InspectorFolder({
  title,
  children,
  defaultOpen = true,
}: {
  title: string
  children: React.ReactNode
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

export function OptionFloatingInspector({ config, setConfig }: ControlProps) {
  return (
    <MockCanvas config={config}>
      <div className="absolute top-4 left-4 w-64 overflow-hidden rounded-lg bg-popover/95 text-popover-foreground shadow-lg ring-1 ring-foreground/10 backdrop-blur">
        <div className="flex items-center gap-1.5 border-border/60 border-b px-2.5 py-1.5">
          <GripHorizontalIcon className="size-3.5 text-muted-foreground" />
          <span className="font-medium font-mono text-[11px] uppercase tracking-[0.12em]">
            Viewer
          </span>
          <Button variant="ghost" size="icon-xs" aria-label="Collapse panel" className="ml-auto">
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
    </MockCanvas>
  )
}

export function OptionCommandPalette({ config, setConfig }: ControlProps) {
  const nextTheme = config.theme === 'dark' ? 'light' : 'dark'
  return (
    <MockCanvas config={config}>
      <div className="absolute inset-x-0 top-10 flex justify-center px-4">
        <Command className="w-[30rem] max-w-full rounded-xl shadow-2xl ring-1 ring-foreground/10">
          <CommandInput placeholder="Viewer settings — type to filter" />
          <CommandList className="max-h-[18rem]">
            <CommandEmpty>No matching setting.</CommandEmpty>
            <CommandGroup heading="Appearance">
              <CommandItem onSelect={() => setConfig({ ...config, theme: nextTheme })}>
                <PaletteIcon />
                Switch to {nextTheme} theme
                <CommandShortcut>{config.theme}</CommandShortcut>
              </CommandItem>
              <CommandItem
                onSelect={() => setConfig({ ...config, radius: config.radius === 0 ? 12 : 0 })}
              >
                <SquareDashedIcon />
                Toggle rounded frame
                <CommandShortcut>{config.radius}px</CommandShortcut>
              </CommandItem>
            </CommandGroup>
            <CommandGroup heading="Toolbar">
              <CommandItem onSelect={() => setConfig({ ...config, toolbar: !config.toolbar })}>
                <WrenchIcon />
                {config.toolbar ? 'Hide' : 'Show'} native toolbar
                <CommandShortcut>{config.toolbar ? 'on' : 'off'}</CommandShortcut>
              </CommandItem>
              {POSITION_OPTIONS.map((option) => (
                <CommandItem
                  key={option.value}
                  onSelect={() => setConfig({ ...config, toolbarPosition: option.value })}
                >
                  <Maximize2Icon />
                  Move toolbar to {option.label.toLowerCase()}
                  {config.toolbarPosition === option.value && (
                    <CommandShortcut>current</CommandShortcut>
                  )}
                </CommandItem>
              ))}
              <CommandItem onSelect={() => setConfig({ ...config, viewCube: !config.viewCube })}>
                <SquareDashedIcon />
                {config.viewCube ? 'Hide' : 'Show'} view cube
                <CommandShortcut>{config.viewCube ? 'on' : 'off'}</CommandShortcut>
              </CommandItem>
            </CommandGroup>
            <CommandGroup heading="Extensions">
              {EXTENSIONS.map((extension) => (
                <CommandItem
                  key={extension.id}
                  onSelect={() => setConfig(toggleExtension(config, extension.id))}
                >
                  <extension.icon />
                  {config.extensions.includes(extension.id) ? 'Unload' : 'Load'} {extension.label}
                  <CommandShortcut>{extension.group}</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </div>
      <kbd className="absolute right-4 bottom-4 rounded-md bg-black/50 px-2 py-1 font-mono text-[11px] text-white/70 ring-1 ring-white/15">
        Cmd K
      </kbd>
    </MockCanvas>
  )
}

export function OptionTopStrip({ config, setConfig }: ControlProps) {
  return (
    <div className="flex min-h-[26rem] flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-1.5">
        <Segmented
          size="compact"
          label=""
          value={config.theme}
          options={THEME_OPTIONS}
          onChange={(theme) => setConfig({ ...config, theme })}
          className="[&>legend]:sr-only"
        />
        <Separator orientation="vertical" className="h-6" />
        <Button
          variant="ghost"
          className={cn('h-9', config.toolbar && 'bg-muted text-foreground')}
          aria-pressed={config.toolbar}
          onClick={() => setConfig({ ...config, toolbar: !config.toolbar })}
        >
          <WrenchIcon />
          Toolbar
        </Button>
        <Button
          variant="ghost"
          className={cn('h-9', config.viewCube && 'bg-muted text-foreground')}
          aria-pressed={config.viewCube}
          onClick={() => setConfig({ ...config, viewCube: !config.viewCube })}
        >
          <SquareDashedIcon />
          View cube
        </Button>
        <Popover>
          <PopoverTrigger render={<Button variant="ghost" className="h-9" />}>
            <PuzzleIcon />
            Extensions
            <span className="ml-1 rounded-full bg-muted px-1.5 font-mono text-[11px] tabular-nums">
              {config.extensions.length}
            </span>
            <ChevronDownIcon />
          </PopoverTrigger>
          <PopoverContent align="start" className="w-64">
            {EXTENSION_GROUPS.map((group) => (
              <PanelSection key={group} title={group} className="gap-1">
                {EXTENSIONS.filter((extension) => extension.group === group).map((extension) => (
                  <ToggleRow
                    key={extension.id}
                    label={extension.label}
                    checked={config.extensions.includes(extension.id)}
                    onChange={() => setConfig(toggleExtension(config, extension.id))}
                  />
                ))}
              </PanelSection>
            ))}
          </PopoverContent>
        </Popover>
        <Sheet>
          <SheetTrigger render={<Button variant="outline" className="ml-auto h-9" />}>
            <SettingsIcon />
            All settings
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-sm">
            <SheetHeader>
              <SheetTitle>Viewer settings</SheetTitle>
              <SheetDescription>Applies live — nothing here recreates the viewer.</SheetDescription>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto px-4 pb-6">
              <SettingsBody config={config} setConfig={setConfig} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
      <MockCanvas config={config} className="flex-1" />
    </div>
  )
}

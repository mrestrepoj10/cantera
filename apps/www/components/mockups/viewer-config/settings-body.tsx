'use client'

import {
  EXTENSION_GROUPS,
  EXTENSIONS,
  PanelSection,
  POSITION_OPTIONS,
  PROFILE_OPTIONS,
  SCALE_OPTIONS,
  Segmented,
  SliderRow,
  THEME_OPTIONS,
  ToggleRow,
  toggleExtension,
  type ViewerConfig,
} from '@/components/mockups/viewer-config/shared'
import { cn } from '@/lib/utils'

export interface ControlProps {
  config: ViewerConfig
  setConfig: (config: ViewerConfig) => void
}

type Density = 'default' | 'compact'

export function ExtensionList({
  config,
  setConfig,
  size = 'default',
}: ControlProps & { size?: Density }) {
  return (
    <div className={cn('flex flex-col', size === 'default' ? 'gap-3' : 'gap-2')}>
      {EXTENSION_GROUPS.map((group) => (
        <div key={group} className="flex flex-col">
          <span className="mb-0.5 text-muted-foreground text-xs">{group}</span>
          {EXTENSIONS.filter((extension) => extension.group === group).map((extension) => (
            <ToggleRow
              key={extension.id}
              size={size}
              label={extension.label}
              checked={config.extensions.includes(extension.id)}
              onChange={() => setConfig(toggleExtension(config, extension.id))}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export function SettingsBody({
  config,
  setConfig,
  size = 'default',
  sections = ['appearance', 'toolbar', 'extensions', 'runtime'],
}: ControlProps & {
  size?: Density
  sections?: ('appearance' | 'toolbar' | 'extensions' | 'runtime')[]
}) {
  const gap = size === 'default' ? 'gap-5' : 'gap-3.5'
  const inner = size === 'default' ? 'gap-3' : 'gap-2'
  return (
    <div className={cn('flex flex-col', gap)}>
      {sections.includes('appearance') && (
        <PanelSection title="Appearance" className={inner}>
          <Segmented
            size={size}
            label="Theme"
            value={config.theme}
            options={THEME_OPTIONS}
            onChange={(theme) => setConfig({ ...config, theme })}
          />
          <SliderRow
            size={size}
            label="Corner radius"
            value={config.radius}
            min={0}
            max={32}
            onChange={(radius) => setConfig({ ...config, radius })}
          />
        </PanelSection>
      )}
      {sections.includes('toolbar') && (
        <PanelSection title="Toolbar" className={inner}>
          <ToggleRow
            size={size}
            label="Native toolbar"
            checked={config.toolbar}
            onChange={(toolbar) => setConfig({ ...config, toolbar })}
          />
          <Segmented
            size={size}
            label="Position"
            value={config.toolbarPosition}
            options={POSITION_OPTIONS}
            onChange={(toolbarPosition) => setConfig({ ...config, toolbarPosition })}
          />
          <Segmented
            size={size}
            label="Button size"
            value={config.toolbarScale}
            options={SCALE_OPTIONS}
            onChange={(toolbarScale) => setConfig({ ...config, toolbarScale })}
          />
          <ToggleRow
            size={size}
            label="View cube"
            checked={config.viewCube}
            onChange={(viewCube) => setConfig({ ...config, viewCube })}
          />
        </PanelSection>
      )}
      {sections.includes('extensions') && (
        <PanelSection title="Extensions" className={inner}>
          <ExtensionList config={config} setConfig={setConfig} size={size} />
        </PanelSection>
      )}
      {sections.includes('runtime') && (
        <PanelSection title="Runtime" className={inner}>
          <Segmented
            size={size}
            label="Profile"
            value={config.profile}
            options={PROFILE_OPTIONS}
            onChange={(profile) => setConfig({ ...config, profile })}
          />
          <ToggleRow
            size={size}
            label="Auto resize"
            hint={size === 'default' ? 'Follows the container, not the window' : undefined}
            checked={config.autoResize}
            onChange={(autoResize) => setConfig({ ...config, autoResize })}
          />
        </PanelSection>
      )}
    </div>
  )
}

'use client'

import { RotateCcwIcon } from 'lucide-react'
import { useState } from 'react'
import {
  OptionCommandPalette,
  OptionDock,
  OptionDockedInspector,
  OptionFloatingInspector,
  OptionTopStrip,
} from '@/components/mockups/viewer-config/options'
import type { ControlProps } from '@/components/mockups/viewer-config/settings-body'
import { DEFAULT_CONFIG, type ViewerConfig } from '@/components/mockups/viewer-config/shared'
import { Button } from '@/components/ui/button'
import { TooltipProvider } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface MockupOption {
  id: string
  name: string
  tagline: string
  render: (props: ControlProps) => React.ReactNode
  good: string[]
  bad: string[]
}

const OPTIONS: MockupOption[] = [
  {
    id: 'dock',
    name: 'A — Floating dock',
    tagline: 'One rounded rail over the canvas. Our tools and our settings, native toolbar off.',
    render: (props) => <OptionDock {...props} />,
    good: [
      'Canvas-first: one piece of chrome, nothing competing with the model',
      '44px targets read as a field tool, not a dev panel',
      'Settings hide behind one gear, so the rail stays short',
    ],
    bad: [
      'Only works if we take over the toolbar (toolbar="none") — two bottom rails is a mess',
      'Everything past the first gear is a popover, so deep config feels buried',
      'Icon-only rails need tooltips and still guess wrong on a tablet',
    ],
  },
  {
    id: 'inspector',
    name: 'B — Docked inspector',
    tagline: 'A real dock beside the canvas: icon tabs, one section at a time, no overlay.',
    render: (props) => <OptionDockedInspector {...props} />,
    good: [
      'Never covers the model — the canvas resizes instead of being obscured',
      'Room for every setting at full density, plus whatever comes next',
      'Familiar from Revit and Navisworks, so AEC users already know it',
    ],
    bad: [
      'Costs ~288px of width; a phone has to collapse it to a sheet anyway',
      'Needs autoResize wired up, or the viewer canvas stretches wrong on toggle',
      'Reads heavier — presentation views want it gone entirely',
    ],
  },
  {
    id: 'floating',
    name: 'C — Floating inspector (Leva-style)',
    tagline: 'Dense, draggable, folder-grouped. The control panel a 3D dev expects.',
    render: (props) => <OptionFloatingInspector {...props} />,
    good: [
      'Every parameter visible at once — fastest for tuning a scene',
      'Folders scale to dozens of settings without a tab dance',
      'Cheapest to extend: a new setting is one more row',
    ],
    bad: [
      'Breaks our field-density contract — 24px rows, not 44px, gloves need not apply',
      'Overlays the model in the corner people actually look at',
      'Feels like a debug tool; wrong register for a client-facing viewer',
    ],
  },
  {
    id: 'palette',
    name: 'D — Command palette',
    tagline: 'Zero chrome. Cmd K, type "levels", hit enter.',
    render: (props) => <OptionCommandPalette {...props} />,
    good: [
      'No permanent pixels on the canvas at all',
      'Search beats hierarchy once there are 40+ extensions',
      'cmdk is already a dependency, and finder proves the pattern here',
    ],
    bad: [
      'Undiscoverable on its own — needs a visible affordance regardless',
      'Bad at continuous values: radius and toolbar scale want a slider, not a command',
      'Keyboard-first is the wrong bet for a tablet on site',
    ],
  },
  {
    id: 'strip',
    name: 'E — Top strip + sheet',
    tagline: 'Frequent toggles inline above the canvas, everything else one sheet away.',
    render: (props) => <OptionTopStrip {...props} />,
    good: [
      'The three settings people actually change are one click, always visible',
      'Overflow into a sheet keeps the strip honest as settings grow',
      'Degrades to a single "Settings" button on narrow screens',
    ],
    bad: [
      'Two levels of settings means guessing which tier each new option belongs in',
      'Spends vertical space outside the canvas — awkward when the viewer is the page',
      'The strip is app chrome, so it looks bolted on inside an embedded viewer',
    ],
  },
]

export function ViewerConfigGallery() {
  const [config, setConfig] = useState<ViewerConfig>(DEFAULT_CONFIG)
  const [activeId, setActiveId] = useState(OPTIONS[0].id)
  const active = OPTIONS.find((option) => option.id === activeId) ?? OPTIONS[0]

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-2">
          {OPTIONS.map((option) => (
            <Button
              key={option.id}
              variant="ghost"
              aria-pressed={option.id === activeId}
              onClick={() => setActiveId(option.id)}
              className={cn(
                'h-11 border-border',
                option.id === activeId && 'border bg-muted text-foreground',
              )}
            >
              {option.name}
            </Button>
          ))}
          <Button
            variant="ghost"
            className="ml-auto h-11 text-muted-foreground"
            onClick={() => setConfig(DEFAULT_CONFIG)}
          >
            <RotateCcwIcon />
            Reset settings
          </Button>
        </div>

        <div>
          <h2 className="font-medium text-lg">{active.name}</h2>
          <p className="mt-1 text-muted-foreground text-sm">{active.tagline}</p>
        </div>

        {active.render({ config, setConfig })}

        <div className="grid gap-6 sm:grid-cols-2">
          <TradeoffList title="Works because" items={active.good} />
          <TradeoffList title="Costs us" items={active.bad} />
        </div>
      </div>
    </TooltipProvider>
  )
}

function TradeoffList({ title, items }: { title: string; items: string[] }) {
  return (
    <section>
      <h3 className="font-medium font-mono text-[11px] text-muted-foreground uppercase tracking-[0.14em]">
        {title}
      </h3>
      <ul className="mt-2 flex flex-col gap-1.5 text-sm">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-muted-foreground">
            <span aria-hidden className="text-foreground/40">
              —
            </span>
            <span className="text-pretty">{item}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

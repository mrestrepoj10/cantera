'use client'

import { RotateCcwIcon } from 'lucide-react'
import { type ComponentType, useState } from 'react'
import { DEFAULT_CONFIG, type ViewerConfig } from '@/components/mockups/viewer-config/shared'
import {
  TriggerCornerButton,
  TriggerEdgeHandle,
  TriggerEdgeRail,
  TriggerNativeButton,
  type TriggerProps,
  TriggerSelfCollapsing,
} from '@/components/mockups/viewer-config/triggers'
import { Button } from '@/components/ui/button'
import { TooltipProvider } from '@/components/ui/tooltip'

interface TriggerOption {
  id: string
  name: string
  tagline: string
  Component: ComponentType<TriggerProps>
  good: string[]
  bad: string[]
}

const OPTIONS: TriggerOption[] = [
  {
    id: 'native',
    name: '1 — Button inside the Autodesk toolbar',
    tagline:
      'Our own control group appended to the SDK toolbar — viewer.toolbar.addControl(group) — after a divider.',
    Component: TriggerNativeButton,
    good: [
      'Zero new chrome: the canvas gains nothing, the toolbar gains one button',
      'Users already look at the bottom bar for viewer controls, so it is found without being taught',
      'Follows toolbarPosition and toolbarScale for free — move the bar and the trigger moves with it',
    ],
    bad: [
      'The button lives in Autodesk DOM, so it wears their button styling, not ours',
      '.adsk-* has no stable contract; a viewer release can move the ground under it',
      'A divider plus one foreign-looking icon is the most visible seam between our UI and theirs',
    ],
  },
  {
    id: 'corner',
    name: '2 — Corner icon button',
    tagline: 'A single 44px gear pinned opposite the view cube, expanding into the panel in place.',
    Component: TriggerCornerButton,
    good: [
      'Ours end to end: our button, our focus ring, our tokens',
      'Top-left is the emptiest corner — the view cube owns top-right, the toolbar owns the bottom',
      'Trivial to build and to explain; no SDK coupling at all',
    ],
    bad: [
      'A lone floating icon says nothing about what it opens until hovered',
      'Adds a second control cluster to a canvas that already has two',
      'Trigger and panel occupy the same corner, so the button vanishes while open',
    ],
  },
  {
    id: 'collapsed',
    name: '3 — The panel is its own trigger',
    tagline: 'Collapsed to its title bar, expanded from the same pill. No separate control exists.',
    Component: TriggerSelfCollapsing,
    good: [
      'One object with two states, not a button plus a panel to keep in sync',
      'The label says "Viewer", so it is self-describing where a bare icon is not',
      'Exactly how Leva behaves, which is the model you already liked',
    ],
    bad: [
      'A word-width pill is heavier at rest than an icon; never fully out of the way',
      'Needs a second control anyway if you ever want it hidden entirely',
      'Reads as a dev panel left open — the weakest fit for a client-facing view',
    ],
  },
  {
    id: 'rail',
    name: '4 — Our own edge rail',
    tagline: 'A short vertical rail on the left edge; the panel opens beside it, not over it.',
    Component: TriggerEdgeRail,
    good: [
      'Room to grow: settings today, our own tools tomorrow, without touching the SDK toolbar',
      'The trigger stays visible and pressed while the panel is open',
      'Vertical and left, so it never competes with the horizontal bottom bar',
    ],
    bad: [
      'A one-button rail is chrome without a reason — only earns itself once there is a second tool',
      'Rail plus panel is the widest resting footprint of the five',
      'Two toolbars on one canvas invites the question of why ours is not theirs',
    ],
  },
  {
    id: 'handle',
    name: '5 — Edge handle',
    tagline: 'A thin drawer pull on the frame edge; the panel slides out from it.',
    Component: TriggerEdgeHandle,
    good: [
      'The smallest resting footprint by far — 20px of frame edge',
      'Reads as "there is more this way" rather than as a button with a meaning to learn',
      'Sits on the frame, not over the model, so nothing is ever occluded',
    ],
    bad: [
      'Cheapest to miss entirely; discoverability is the worst of the five',
      'A 20px target fails the 44px field-density bar without a padded hit area',
      'Flush-left panel fights the rounded frame at high radius values',
    ],
  },
]

export function TriggerGallery() {
  const [config, setConfig] = useState<ViewerConfig>(DEFAULT_CONFIG)
  return (
    <TooltipProvider>
      <div className="flex flex-col gap-14">
        <Button
          variant="ghost"
          className="h-11 self-start text-muted-foreground"
          onClick={() => setConfig(DEFAULT_CONFIG)}
        >
          <RotateCcwIcon />
          Reset settings
        </Button>
        {OPTIONS.map((option) => (
          <TriggerSection key={option.id} option={option} config={config} setConfig={setConfig} />
        ))}
      </div>
    </TooltipProvider>
  )
}

function TriggerSection({
  option,
  config,
  setConfig,
}: {
  option: TriggerOption
  config: ViewerConfig
  setConfig: (config: ViewerConfig) => void
}) {
  const [restingOpen, setRestingOpen] = useState(false)
  const [expandedOpen, setExpandedOpen] = useState(true)
  const { Component } = option
  return (
    <section id={option.id} className="flex flex-col gap-4">
      <div>
        <h2 className="font-medium text-lg">{option.name}</h2>
        <p className="mt-1 max-w-3xl text-muted-foreground text-sm">{option.tagline}</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <figure className="flex flex-col gap-2">
          <figcaption className="font-mono text-[11px] text-muted-foreground uppercase tracking-[0.14em]">
            At rest
          </figcaption>
          <Component
            config={config}
            setConfig={setConfig}
            open={restingOpen}
            setOpen={setRestingOpen}
          />
        </figure>
        <figure className="flex flex-col gap-2">
          <figcaption className="font-mono text-[11px] text-muted-foreground uppercase tracking-[0.14em]">
            Open
          </figcaption>
          <Component
            config={config}
            setConfig={setConfig}
            open={expandedOpen}
            setOpen={setExpandedOpen}
          />
        </figure>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <TradeoffList title="Works because" items={option.good} />
        <TradeoffList title="Costs us" items={option.bad} />
      </div>
    </section>
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

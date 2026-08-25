'use client'

import {
  ExternalLinkIcon,
  MonitorIcon,
  RefreshCwIcon,
  SmartphoneIcon,
  TabletIcon,
} from 'lucide-react'
import type { KeyboardEvent, ReactNode } from 'react'
import { useState } from 'react'

import { InstallCommand } from '@/components/site/install-command'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ShowcaseTab = 'preview' | 'code'
type PreviewSize = 'desktop' | 'tablet' | 'mobile'

const previewSizes: Array<{
  id: PreviewSize
  label: string
  maxWidth: string
  icon: typeof MonitorIcon
}> = [
  { id: 'desktop', label: 'Desktop', maxWidth: 'none', icon: MonitorIcon },
  { id: 'tablet', label: 'Tablet', maxWidth: '48rem', icon: TabletIcon },
  { id: 'mobile', label: 'Mobile', maxWidth: '24.375rem', icon: SmartphoneIcon },
]

interface BlockShowcaseProps {
  name: string
  title: string
  description: string
  installCommand: string
  previewHeight: number
  openInV0: ReactNode
}

interface RegistrySourceFile {
  path: string
  target?: string
  content?: string
}

function BlockShowcase({
  name,
  title,
  description,
  installCommand,
  previewHeight,
  openInV0,
}: BlockShowcaseProps) {
  const [tab, setTab] = useState<ShowcaseTab>('preview')
  const [previewSize, setPreviewSize] = useState<PreviewSize>('desktop')
  const [refreshKey, setRefreshKey] = useState(0)
  const [sources, setSources] = useState<RegistrySourceFile[]>()
  const [sourcePending, setSourcePending] = useState(false)
  const [sourceError, setSourceError] = useState<string>()
  const previewUrl = `/view/${name}`
  const previewPanelId = `${name}-preview-panel`
  const codePanelId = `${name}-code-panel`
  const maxWidth = previewSizes.find((size) => size.id === previewSize)?.maxWidth ?? 'none'

  async function loadSources() {
    if (sources || sourcePending) return
    setSourcePending(true)
    setSourceError(undefined)
    try {
      const response = await fetch(`/r/${name}.json`)
      if (!response.ok) throw new Error('The block source could not be loaded.')
      const body = (await response.json()) as { files?: RegistrySourceFile[] }
      setSources((body.files ?? []).filter((file) => typeof file.content === 'string'))
    } catch (error) {
      setSourceError(
        error instanceof Error ? error.message : 'The block source could not be loaded.',
      )
    } finally {
      setSourcePending(false)
    }
  }

  function selectTab(next: ShowcaseTab) {
    setTab(next)
    if (next === 'code') void loadSources()
  }

  function onTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, current: ShowcaseTab) {
    const order: ShowcaseTab[] = ['preview', 'code']
    const index = order.indexOf(current)
    let next: ShowcaseTab | undefined
    if (event.key === 'ArrowRight') next = order[(index + 1) % order.length]
    else if (event.key === 'ArrowLeft') next = order[(index - 1 + order.length) % order.length]
    else if (event.key === 'Home') next = order[0]
    else if (event.key === 'End') next = order.at(-1)
    if (!next) return
    event.preventDefault()
    selectTab(next)
    requestAnimationFrame(() => document.getElementById(`${name}-${next}-tab`)?.focus())
  }

  return (
    <article id={name} className="scroll-mt-24" aria-labelledby={`${name}-title`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <h2 id={`${name}-title`} className="font-medium text-base">
            <a href={`#${name}`} className="focus-ring rounded-md">
              {title}
            </a>
          </h2>
          <p className="mt-1 text-muted-foreground text-sm">{description}</p>
        </div>
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
          <InstallCommand command={installCommand} className="min-w-0 sm:w-[23rem]" />
          {openInV0}
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-xl shadow-[0_0_0_1px_oklch(0_0_0/0.08),0_2px_8px_oklch(0_0_0/0.05)] dark:shadow-[0_0_0_1px_oklch(1_0_0/0.1)]">
        <div className="flex min-h-14 flex-wrap items-center justify-between gap-2 border-border border-b bg-background px-2 py-2 sm:px-3">
          <div role="tablist" aria-label={`${title} view`} className="flex items-center gap-1">
            {(['preview', 'code'] as const).map((value) => (
              <button
                key={value}
                type="button"
                role="tab"
                id={`${name}-${value}-tab`}
                aria-selected={tab === value}
                aria-controls={value === 'preview' ? previewPanelId : codePanelId}
                tabIndex={tab === value ? 0 : -1}
                onClick={() => selectTab(value)}
                onKeyDown={(event) => onTabKeyDown(event, value)}
                className={cn(
                  'focus-ring min-h-9 rounded-md px-3 font-medium text-xs capitalize transition-colors',
                  tab === value
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {value}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <fieldset className="hidden items-center rounded-lg bg-muted p-1 sm:flex">
              <legend className="sr-only">Preview width</legend>
              {previewSizes.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  aria-label={`${label} preview`}
                  aria-pressed={previewSize === id}
                  onClick={() => setPreviewSize(id)}
                  className={cn(
                    'focus-ring grid size-8 place-items-center rounded-md text-muted-foreground transition-colors',
                    previewSize === id
                      ? 'bg-background text-foreground shadow-sm'
                      : 'hover:text-foreground',
                  )}
                >
                  <Icon aria-hidden className="size-4" />
                </button>
              ))}
            </fieldset>
            <Button
              render={<a href={previewUrl} target="_blank" rel="noreferrer" />}
              nativeButton={false}
              role="link"
              variant="ghost"
              size="icon"
              aria-label={`Open ${title} preview in a new tab`}
              className="size-9"
            >
              <ExternalLinkIcon aria-hidden />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Refresh ${title} preview`}
              className="size-9"
              onClick={() => setRefreshKey((current) => current + 1)}
            >
              <RefreshCwIcon aria-hidden />
            </Button>
          </div>
        </div>

        {tab === 'preview' ? (
          <div
            id={previewPanelId}
            role="tabpanel"
            aria-labelledby={`${name}-preview-tab`}
            className="overflow-x-auto bg-muted/40 p-2 sm:p-3"
          >
            <div
              className="mx-auto overflow-hidden rounded-lg bg-background shadow-[0_0_0_1px_oklch(0_0_0/0.08)] dark:shadow-[0_0_0_1px_oklch(1_0_0/0.1)]"
              style={{ width: '100%', maxWidth }}
            >
              <iframe
                key={refreshKey}
                title={`${title} preview`}
                src={previewUrl}
                loading="lazy"
                className="block w-full border-0 bg-background"
                style={{ height: previewHeight }}
              />
            </div>
          </div>
        ) : (
          <div
            id={codePanelId}
            role="tabpanel"
            aria-labelledby={`${name}-code-tab`}
            className="max-h-[48rem] space-y-3 overflow-y-auto bg-muted/20 p-3 sm:p-4"
          >
            {sourcePending ? (
              <output className="flex min-h-32 items-center justify-center text-muted-foreground text-sm">
                Loading source
              </output>
            ) : sourceError ? (
              <p role="alert" className="p-4 text-status-danger text-sm">
                {sourceError}
              </p>
            ) : sources?.length ? (
              sources.map((source) => (
                <div key={source.path} className="overflow-hidden rounded-lg border border-border">
                  <div className="border-border border-b bg-muted/40 px-4 py-2 font-mono text-muted-foreground text-xs">
                    {source.target ?? source.path}
                  </div>
                  <textarea
                    readOnly
                    spellCheck={false}
                    wrap="off"
                    value={source.content}
                    aria-label={`${source.target ?? source.path} source code`}
                    className="focus-ring block h-[32rem] w-full resize-none overflow-auto rounded-lg bg-background p-4 font-mono text-code outline-none"
                  />
                </div>
              ))
            ) : (
              <p className="p-4 text-muted-foreground text-sm">No source files are listed.</p>
            )}
          </div>
        )}
      </div>
    </article>
  )
}

export { BlockShowcase }

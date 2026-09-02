import type { Metadata } from 'next'
import Link from 'next/link'

import { BlocksCatalog, type ShowcaseGroup } from '@/components/site/blocks-catalog'
import { OpenInV0 } from '@/components/site/open-in-v0'
import {
  installCommandFor,
  installSummaryFor,
  previewHeightFor,
  type RegistryItem,
  showcaseGroups,
} from '@/components/site/registry'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { kindLabelFor } from '@/lib/registry-kinds'
import { installPromptFor, issueUrlFor } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Blocks',
  description:
    'Page-sized blocks and wired templates for authentication, provider connections, project browsing, Autodesk model viewing, and model upload.',
}

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`
}

function entryFor(item: RegistryItem): ShowcaseGroup['entries'][number] {
  const summary = installSummaryFor(item.name)
  const parts = [
    `Installs ${plural(summary.files, 'registry file')} across ${plural(summary.items.length, 'cantera item')}`,
  ]
  if (summary.routes > 0) parts.push(plural(summary.routes, 'route handler'))
  if (summary.packages.length > 0) parts.push(plural(summary.packages.length, 'npm package'))
  if (summary.envKeys.length > 0) parts.push(plural(summary.envKeys.length, 'environment key'))

  return {
    name: item.name,
    title: item.title,
    description: item.description,
    kind: kindLabelFor(item),
    categories: item.categories ?? [],
    installCommand: installCommandFor(item.name),
    previewHeight: previewHeightFor(item),
    summary: `${parts.join(', ')}.`,
    composition: {
      items: summary.items.slice(1).map((dependency) => dependency.name),
      primitives: summary.primitives,
    },
    reportHref: issueUrlFor(item.name),
    prompt: installPromptFor(item.name, kindLabelFor(item)),
    openInV0: <OpenInV0 name={item.name} title={item.title} />,
  }
}

export default function BlocksPage() {
  const groups = showcaseGroups.map((group) => ({
    id: group.id,
    title: group.title,
    description: group.description,
    entries: group.items.map(entryFor),
  }))

  return (
    <div className="mx-auto w-full max-w-[90rem] px-4 pb-24 sm:px-6">
      <section className="mx-auto flex max-w-3xl flex-col items-center py-16 text-center sm:py-24">
        <Badge variant="secondary" className="h-6 px-2.5">
          Cantera blocks
        </Badge>
        <h1 className="mt-4 text-balance font-semibold text-4xl tracking-tight sm:text-5xl">
          Blocks and templates for AEC apps
        </h1>
        <p className="mt-4 max-w-2xl text-balance text-muted-foreground sm:text-lg">
          Templates install a working page with its routes and environment keys. Blocks install the
          same screen with no wiring, ready for your own backend. Copy either into your app and own
          every line of the result.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Button
            render={<a href="#templates" />}
            nativeButton={false}
            role="link"
            size="lg"
            className="min-h-11 px-4"
          >
            Browse templates
          </Button>
          <Button
            render={<a href="#blocks" />}
            nativeButton={false}
            role="link"
            variant="outline"
            size="lg"
            className="min-h-11 px-4"
          >
            Browse blocks
          </Button>
          <Button
            render={<Link href="/components" />}
            nativeButton={false}
            role="link"
            variant="ghost"
            size="lg"
            className="min-h-11 px-4"
          >
            View components
          </Button>
        </div>
      </section>

      <div className="border-border border-t pt-12">
        <BlocksCatalog groups={groups} />
      </div>
    </div>
  )
}

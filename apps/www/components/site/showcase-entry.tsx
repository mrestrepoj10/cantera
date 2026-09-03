import type { ShowcaseEntry } from '@/components/site/blocks-catalog'
import { OpenInV0 } from '@/components/site/open-in-v0'
import {
  installCommandFor,
  installSummaryFor,
  previewHeightFor,
  type RegistryItem,
} from '@/components/site/registry'
import { kindLabelFor } from '@/lib/registry-kinds'
import { installPromptFor, issueUrlFor } from '@/lib/site'

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`
}

export function showcaseEntryFor(item: RegistryItem): ShowcaseEntry {
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

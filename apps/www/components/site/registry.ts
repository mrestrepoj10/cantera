import registryJson from '@/registry.json'

export { installCommandFor } from '@/lib/site'

export interface RegistryFile {
  path: string
  type: string
  target?: string
}

export interface RegistryItem {
  name: string
  type:
    | 'registry:lib'
    | 'registry:component'
    | 'registry:block'
    | 'registry:item'
    | 'registry:example'
  title: string
  description: string
  author?: string
  categories?: string[]
  dependencies?: string[]
  registryDependencies?: string[]
  files?: RegistryFile[]
  envVars?: Record<string, string>
  docs?: string
}

const allItems = registryJson.items as RegistryItem[]

// Example items are generated v0 landing pages, excluded from every catalog surface.
export const registryItems = allItems.filter((item) => item.type !== 'registry:example')

const itemsByName = new Map(registryItems.map((item) => [item.name, item]))

export function getRegistryItem(name: string): RegistryItem | undefined {
  return itemsByName.get(name)
}

interface PreviewFrameClassByItem {
  [item: string]: string
}

const previewFrameClasses: PreviewFrameClassByItem = {
  'hub-browser': 'flex min-h-64 items-stretch rounded-lg border border-border p-4 sm:p-6',
  'hub-tree': 'flex min-h-[28rem] items-stretch rounded-lg border border-border p-4 sm:p-6',
  finder:
    'flex min-h-[24rem] items-start justify-center rounded-lg border border-border p-4 sm:p-6',
  'hub-sidebar': 'flex min-h-[28rem] items-stretch overflow-hidden rounded-lg border border-border',
  'model-viewer-page':
    'flex min-h-[36rem] items-stretch overflow-hidden rounded-lg border border-border',
  'model-upload-page':
    'flex min-h-[36rem] items-stretch overflow-hidden rounded-lg border border-border',
  'aps-viewer': 'flex min-h-[36rem] items-stretch',
  'file-drop-zone': 'flex min-h-[26rem] items-start rounded-lg border border-border p-4 sm:p-6',
}

export function getPreviewFrameClassName(name: string): string {
  return (
    previewFrameClasses[name] ??
    'flex min-h-64 items-center justify-center rounded-lg border border-border p-8 sm:p-12'
  )
}

export interface RegistryGroup {
  id: string
  title: string
  description: string
  items: RegistryItem[]
}

// Grouping derives from item `type`, never a hardcoded name list; the one
// name-shaped rule is the `-types` suffix splitting shared shapes from adapters.
type GroupDefinition = Omit<RegistryGroup, 'items'> & {
  match: (item: RegistryItem) => boolean
}

const groupDefinitions: GroupDefinition[] = [
  {
    id: 'blocks',
    title: 'Blocks',
    description:
      'Wired pages — routes, state, and provider calls already connected, ready to mount in an app.',
    match: (item) => item.type === 'registry:block',
  },
  {
    id: 'components',
    title: 'Components',
    description:
      'Data-agnostic UI — plain typed props in, callbacks out, no fetching and no provider knowledge.',
    match: (item) => item.type === 'registry:component',
  },
  {
    id: 'types',
    title: 'Types',
    description: 'The shared prop shapes every cantera component and preset is written against.',
    match: (item) => item.type === 'registry:lib' && item.name.endsWith('-types'),
  },
  {
    id: 'presets',
    title: 'Provider presets',
    description: 'Provider adapters that map a vendor API onto the shared types.',
    match: (item) => item.type === 'registry:lib',
  },
  {
    id: 'tokens',
    title: 'Design tokens',
    description: 'cssVars items — the CSS variables components render their state from.',
    match: (item) => item.type === 'registry:item',
  },
]

const otherGroup: Omit<RegistryGroup, 'items'> = {
  id: 'other',
  title: 'Other items',
  description: 'Registry items that do not belong to one of the kinds above.',
}

function buildGroups(): RegistryGroup[] {
  const remaining = [...registryItems]
  const groups: RegistryGroup[] = []

  for (const { match, ...group } of groupDefinitions) {
    const items: RegistryItem[] = []
    for (let i = remaining.length - 1; i >= 0; i -= 1) {
      const item = remaining[i]
      if (item && match(item)) {
        items.unshift(item)
        remaining.splice(i, 1)
      }
    }
    if (items.length > 0) groups.push({ ...group, items })
  }

  if (remaining.length > 0) groups.push({ ...otherGroup, items: remaining })
  return groups
}

export const registryGroups: RegistryGroup[] = buildGroups()

export const blockItems = registryItems.filter((item) => item.type === 'registry:block')
export const componentRegistryGroups = registryGroups.filter((group) => group.id !== 'blocks')

export const componentSidebarGroups: RegistryGroup[] = [
  ...registryGroups.filter((group) => group.id === 'components'),
  ...registryGroups.filter((group) => group.id === 'blocks'),
  ...registryGroups.filter((group) => group.id !== 'components' && group.id !== 'blocks'),
]

const examplesByName = new Map(
  allItems
    .filter((item) => item.type === 'registry:example')
    .map((item) => [item.name, item] as const),
)

export function getExampleItem(name: string): RegistryItem | undefined {
  return examplesByName.get(`${name}-demo`)
}

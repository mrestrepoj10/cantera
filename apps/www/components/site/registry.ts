import registryJson from '@/registry.json'

// Re-exported so the docs pages keep one import for "the registry", while the
// command itself stays next to the URLs it is paired with in lib/site.
export { installCommandFor } from '@/lib/site'

export interface RegistryFile {
  path: string
  type: string
  target?: string
}

export interface RegistryItem {
  name: string
  /**
   * `registry:item` is the cssVars-led shape (status-tokens); `registry:example`
   * is a generated v0 landing page, not a catalog entry.
   */
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

/**
 * The catalog: every item a consumer browses. Example items are excluded on
 * purpose — they are generated pages that exist so "Open in v0" has something
 * real to open, and listing them would double the grid, the nav, and the docs
 * routes with entries that document nothing.
 */
export const registryItems = allItems.filter((item) => item.type !== 'registry:example')

/** Lookups run per docs render, so they index by name once at module load. */
const itemsByName = new Map(registryItems.map((item) => [item.name, item]))

export function getRegistryItem(name: string): RegistryItem | undefined {
  return itemsByName.get(name)
}

const previewFrameClasses: Record<string, string> = {
  'hub-browser': 'flex min-h-64 items-stretch rounded-lg border border-border p-4 sm:p-6',
  'aps-viewer': 'flex min-h-[36rem] items-stretch overflow-hidden rounded-lg border border-border',
  'viewer-native-toolbar':
    'flex min-h-[36rem] items-stretch overflow-hidden rounded-lg border border-border',
}

/** Docs previews default to centered component scale; canvas-like items opt into a full frame. */
export function getPreviewFrameClassName(name: string): string {
  return (
    previewFrameClasses[name] ??
    'flex min-h-64 items-center justify-center rounded-lg border border-border p-8 sm:p-12'
  )
}

/** A titled section of the catalog: one kind of registry item, in registry.json order. */
export interface RegistryGroup {
  /** Stable slug — used for React keys and heading ids. */
  id: string
  title: string
  /** One sentence on what this kind of item is. */
  description: string
  items: RegistryItem[]
}

/**
 * Grouping is derived from the item `type`, never from a hardcoded list of
 * names — a new item lands in its section the moment registry.json gains it.
 * The one name-shaped rule is the `-types` suffix, which is how the lib items
 * split between shared prop shapes and provider adapters.
 */
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

/** Anything a future `type` introduces lands here rather than dropping out of the catalog. */
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

/** The catalog, split into titled sections by kind. Empty sections are omitted. */
export const registryGroups: RegistryGroup[] = buildGroups()

const examplesByName = new Map(
  allItems
    .filter((item) => item.type === 'registry:example')
    .map((item) => [item.name, item] as const),
)

/** The generated example page for an item, when it has one. */
export function getExampleItem(name: string): RegistryItem | undefined {
  return examplesByName.get(`${name}-demo`)
}

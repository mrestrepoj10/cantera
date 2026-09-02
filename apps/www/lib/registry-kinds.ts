import type { RegistryItem } from './registry-item.ts'

export type ItemKind = 'block' | 'kit'

export type CatalogGroupId = 'blocks' | 'components' | 'foundations'

/** A page ships its route and environment; a screen is the same surface over endpoints you provide. */
export type BlockFlavor = 'page' | 'screen'

type KindSource = Pick<RegistryItem, 'name' | 'type' | 'meta' | 'files'>

const ITEM_KINDS = ['block', 'kit'] as const

export function itemKind(item: KindSource): ItemKind | undefined {
  return ITEM_KINDS.find((kind) => kind === item.meta?.kind)
}

export function blockFlavor(item: KindSource): BlockFlavor | undefined {
  if (itemKind(item) !== 'block') return undefined
  return item.files?.some((file) => file.type === 'registry:page') ? 'page' : 'screen'
}

export function catalogGroupFor(item: KindSource): CatalogGroupId {
  if (itemKind(item) === 'block') return 'blocks'
  if (item.type === 'registry:component') return 'components'
  return 'foundations'
}

/** Kind for blocks, role for foundations: the word that sits next to an item name. */
export function kindLabelFor(item: KindSource): string {
  const kind = itemKind(item)
  if (kind) return kind
  switch (item.type) {
    case 'registry:component':
      return 'component'
    case 'registry:item':
      return 'tokens'
    case 'registry:lib':
      return item.name.endsWith('-types') ? 'types' : 'preset'
    case 'registry:example':
      return 'example'
    default:
      return item.type
  }
}

export interface CatalogGroupDefinition {
  id: CatalogGroupId
  title: string
  description: string
}

export const catalogGroupDefinitions: CatalogGroupDefinition[] = [
  {
    id: 'blocks',
    title: 'Blocks',
    description:
      'Page-sized surfaces. Pages ship their routes and environment keys; screens take your endpoints instead. One command installs either.',
  },
  {
    id: 'components',
    title: 'Components',
    description:
      'Data-agnostic UI — plain typed props in, callbacks out, no fetching and no provider knowledge.',
  },
  {
    id: 'foundations',
    title: 'Foundations',
    description:
      'The shared types, provider presets, design tokens, and auth wiring kit every other item is written against.',
  },
]

export interface BlockFlavorDefinition {
  id: BlockFlavor
  title: string
  description: string
}

export const blockFlavorDefinitions: BlockFlavorDefinition[] = [
  {
    id: 'page',
    title: 'Pages',
    description:
      'A route in your app with its API handlers, environment keys, and the aec-auth glue already wired. Install, fill the keys, open the URL.',
  },
  {
    id: 'screen',
    title: 'Screens',
    description:
      'The same surfaces without the wiring: props, endpoints, or callbacks in, a whole screen out. Mount them over your own backend.',
  },
]

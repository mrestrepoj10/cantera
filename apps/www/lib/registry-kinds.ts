import type { RegistryItem } from './registry-item.ts'

export type ItemKind = 'template' | 'block' | 'kit'

export type CatalogGroupId = 'templates' | 'blocks' | 'components' | 'foundations'

type KindSource = Pick<RegistryItem, 'name' | 'type' | 'meta'>

const ITEM_KINDS = ['template', 'block', 'kit'] as const

export function itemKind(item: KindSource): ItemKind | undefined {
  return ITEM_KINDS.find((kind) => kind === item.meta?.kind)
}

export function catalogGroupFor(item: KindSource): CatalogGroupId {
  const kind = itemKind(item)
  if (kind === 'template') return 'templates'
  if (kind === 'block') return 'blocks'
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
    case 'registry:block':
      return 'block'
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
    id: 'templates',
    title: 'Templates',
    description:
      'Wired pages — routes, environment keys, and provider calls already connected. One command installs a working screen.',
  },
  {
    id: 'blocks',
    title: 'Blocks',
    description:
      'Page-sized compositions with no routes and no environment: props, endpoints, or callbacks in, a whole screen out.',
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

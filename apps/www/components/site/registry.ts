import { resolveClosure } from '@/lib/registry-closure'
import type { RegistryItem } from '@/lib/registry-item'
import { type CatalogGroupId, catalogGroupDefinitions, catalogGroupFor } from '@/lib/registry-kinds'
import registryJson from '@/registry.json'

export type { RegistryFile, RegistryItem } from '@/lib/registry-item'
export { installCommandFor } from '@/lib/site'

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

const fullBleedPreview =
  'flex min-h-[36rem] items-stretch overflow-hidden rounded-lg border border-border'

const previewFrameClasses: PreviewFrameClassByItem = {
  'hub-browser': 'flex min-h-64 items-stretch rounded-lg border border-border p-4 sm:p-6',
  'hub-tree': 'flex min-h-[28rem] items-stretch rounded-lg border border-border p-4 sm:p-6',
  finder:
    'flex min-h-[24rem] items-start justify-center rounded-lg border border-border p-4 sm:p-6',
  'hub-sidebar': 'flex min-h-[28rem] items-stretch overflow-hidden rounded-lg border border-border',
  'connections-view':
    'flex min-h-[28rem] items-start justify-center rounded-lg border border-border p-4 sm:p-6',
  'model-viewer-page': fullBleedPreview,
  'model-upload-page': fullBleedPreview,
  'aps-viewer': 'flex min-h-[36rem] items-stretch',
  'file-drop-zone': 'flex min-h-[26rem] items-start rounded-lg border border-border p-4 sm:p-6',
}

export function previewLayoutFor(name: string): 'full-bleed' | 'centered' {
  return previewFrameClasses[name] === fullBleedPreview ? 'full-bleed' : 'centered'
}

export function getPreviewFrameClassName(name: string): string {
  return (
    previewFrameClasses[name] ??
    'flex min-h-64 items-center justify-center rounded-lg border border-border p-8 sm:p-12'
  )
}

const DEFAULT_PREVIEW_HEIGHT = 640

/** `meta.iframeHeight` in pixels — the same field shadcn's own blocks carry. */
export function previewHeightFor(item: RegistryItem): number {
  const parsed = Number.parseInt(item.meta?.iframeHeight ?? '', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_PREVIEW_HEIGHT
}

export interface RegistryGroup {
  id: CatalogGroupId
  title: string
  description: string
  items: RegistryItem[]
}

function buildGroups(): RegistryGroup[] {
  return catalogGroupDefinitions
    .map((group) => ({
      ...group,
      items: registryItems.filter((item) => catalogGroupFor(item) === group.id),
    }))
    .filter((group) => group.items.length > 0)
}

const registryGroups: RegistryGroup[] = buildGroups()

function groupsIn(...order: CatalogGroupId[]): RegistryGroup[] {
  return order.flatMap((id) => registryGroups.filter((group) => group.id === id))
}

export const blockItems = groupsIn('blocks').flatMap((group) => group.items)

export const templateItems = groupsIn('templates').flatMap((group) => group.items)

/** What /view/<name> previews. */
export const showcaseItems = [...templateItems, ...blockItems]

export const componentRegistryGroups = groupsIn('components', 'foundations')

export const componentSidebarGroups = groupsIn('components', 'foundations')

const examplesByName = new Map(
  allItems
    .filter((item) => item.type === 'registry:example')
    .map((item) => [item.name, item] as const),
)

export function getExampleItem(name: string): RegistryItem | undefined {
  return examplesByName.get(`${name}-demo`)
}

export interface InstallSummary {
  /** Every cantera item the install resolves, root first. */
  items: RegistryItem[]
  /** shadcn primitives the closure asks the consumer's own registry for. */
  primitives: string[]
  /** Distinct installed paths the closure writes; primitives add their own on top. */
  files: number
  routes: number
  packages: string[]
  envKeys: string[]
}

const ROUTE_MODULE = /^app\/api\/.*\/route$/

export function installSummaryFor(name: string): InstallSummary {
  const root = itemsByName.get(name)
  if (!root) return { items: [], primitives: [], files: 0, routes: 0, packages: [], envKeys: [] }

  const closure = resolveClosure(itemsByName, root)
  const modules = [...closure.modules.keys()]
  return {
    items: closure.items,
    primitives: [...closure.primitives].sort(),
    files: modules.length,
    routes: modules.filter((module) => ROUTE_MODULE.test(module)).length,
    packages: [...new Set(closure.items.flatMap((item) => item.dependencies ?? []))].sort(),
    envKeys: [...new Set(closure.items.flatMap((item) => Object.keys(item.envVars ?? {})))],
  }
}

import {
  type CatalogGroupId,
  catalogGroupDefinitions,
  catalogGroupFor,
  itemKind,
} from '@/lib/registry-kinds'
import { registryNamespace } from '@/lib/site'
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
  meta?: { kind?: string; iframeHeight?: string }
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
  'model-browser': fullBleedPreview,
  'model-upload': fullBleedPreview,
  'model-viewer-page': fullBleedPreview,
  'model-upload-page': fullBleedPreview,
  'aps-viewer': 'flex min-h-[36rem] items-stretch',
  'file-drop-zone': 'flex min-h-[26rem] items-start rounded-lg border border-border p-4 sm:p-6',
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

export const registryGroups: RegistryGroup[] = buildGroups()

function groupsIn(...order: CatalogGroupId[]): RegistryGroup[] {
  return order.flatMap((id) => registryGroups.filter((group) => group.id === id))
}

/** What the /blocks page shows: blocks and the templates that mount them. */
export const showcaseItems = registryItems.filter((item) => {
  const kind = itemKind(item)
  return kind === 'block' || kind === 'template'
})

export const componentRegistryGroups = groupsIn('components', 'foundations')

export const componentSidebarGroups = groupsIn('components', 'blocks', 'templates', 'foundations')

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
  /** Registry files the closure writes; primitives add their own on top. */
  files: number
  routes: number
  packages: string[]
}

const ROUTE_TARGET = /^app\/api\/.*route\.tsx?$/

/** Walks `registryDependencies` the way the CLI resolves them, counting what lands. */
export function installSummaryFor(name: string): InstallSummary {
  const items: RegistryItem[] = []
  const primitives = new Set<string>()
  const packages = new Set<string>()
  const seen = new Set<string>()

  const walk = (item: RegistryItem) => {
    if (seen.has(item.name)) return
    seen.add(item.name)
    items.push(item)
    for (const pkg of item.dependencies ?? []) packages.add(pkg)
    for (const dependency of item.registryDependencies ?? []) {
      if (!dependency.startsWith(`${registryNamespace}/`)) {
        primitives.add(dependency)
        continue
      }
      const next = itemsByName.get(dependency.slice(registryNamespace.length + 1))
      if (next) walk(next)
    }
  }

  const root = itemsByName.get(name)
  if (root) walk(root)

  const files = items.flatMap((item) => item.files ?? [])
  return {
    items,
    primitives: [...primitives].sort(),
    files: files.length,
    routes: files.filter((file) => ROUTE_TARGET.test(file.target ?? '')).length,
    packages: [...packages].sort(),
  }
}

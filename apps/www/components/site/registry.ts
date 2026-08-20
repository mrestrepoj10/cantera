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

export function getRegistryItem(name: string): RegistryItem | undefined {
  return registryItems.find((item) => item.name === name)
}

/** The generated example page for an item, when it has one. */
export function getExampleItem(name: string): RegistryItem | undefined {
  return allItems.find((item) => item.type === 'registry:example' && item.name === `${name}-demo`)
}

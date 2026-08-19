import registryJson from '@/registry.json'

export interface RegistryFile {
  path: string
  type: string
  target?: string
}

export interface RegistryItem {
  name: string
  /** `registry:item` is the file-less shape — cssVars only, e.g. status-tokens. */
  type: 'registry:lib' | 'registry:component' | 'registry:block' | 'registry:item'
  title: string
  description: string
  dependencies?: string[]
  registryDependencies?: string[]
  files?: RegistryFile[]
}

export const registryItems = registryJson.items as RegistryItem[]

export function getRegistryItem(name: string): RegistryItem | undefined {
  return registryItems.find((item) => item.name === name)
}

export function installCommandFor(name: string): string {
  return `npx shadcn@latest add @cantera/${name}`
}

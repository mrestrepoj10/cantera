import registryJson from '@/registry.json'

export interface RegistryFile {
  path: string
  type: string
  target?: string
}

export interface RegistryItem {
  name: string
  type: 'registry:lib' | 'registry:component' | 'registry:block'
  title: string
  description: string
  dependencies?: string[]
  registryDependencies?: string[]
  files: RegistryFile[]
}

export const registryItems = registryJson.items as RegistryItem[]

export function getRegistryItem(name: string): RegistryItem | undefined {
  return registryItems.find((item) => item.name === name)
}

export function installCommandFor(name: string): string {
  return `npx shadcn@latest add @cantera/${name}`
}

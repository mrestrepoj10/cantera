import type { RegistryFile, RegistryItem } from './registry-item.ts'
import { registryNamespace } from './site.ts'

/** Where the shadcn CLI writes one registry file in a consumer project with the
 * default aliases: an explicit `target` wins, otherwise the file type picks the
 * directory. Must match the CLI or every closure check looks at the wrong paths. */
export function installedPath(file: RegistryFile): string {
  if (file.target) return file.target.replace(/^\.\//, '').replace(/^src\//, '')
  const base = file.path.split('/').pop() ?? file.path
  switch (file.type) {
    case 'registry:ui':
      return `components/ui/${base}`
    case 'registry:lib':
      return `lib/${base}`
    case 'registry:hook':
      return `hooks/${base}`
    default:
      return `components/${base}`
  }
}

export function withoutExtension(filePath: string): string {
  return filePath.replace(/\.(tsx|ts|jsx|js|css)$/, '')
}

export interface ClosureFile {
  item: string
  file: RegistryFile
  module: string
}

export interface ItemClosure {
  /** Every cantera item the install resolves, root first. */
  items: RegistryItem[]
  /** shadcn primitives the closure asks the consumer's own registry for. */
  primitives: Set<string>
  /** Installed module path → the file that lands there. */
  modules: Map<string, ClosureFile>
  missing: string[]
}

/** Walks `registryDependencies` the way the CLI resolves them. */
export function resolveClosure(byName: Map<string, RegistryItem>, root: RegistryItem): ItemClosure {
  const items: RegistryItem[] = []
  const primitives = new Set<string>()
  const modules = new Map<string, ClosureFile>()
  const missing: string[] = []
  const seen = new Set<string>()

  const walk = (item: RegistryItem) => {
    if (seen.has(item.name)) return
    seen.add(item.name)
    items.push(item)
    for (const file of item.files ?? []) {
      const module = withoutExtension(installedPath(file))
      modules.set(module, { item: item.name, file, module })
    }
    for (const dependency of item.registryDependencies ?? []) {
      if (!dependency.startsWith(`${registryNamespace}/`)) {
        primitives.add(dependency)
        continue
      }
      const next = byName.get(dependency.slice(registryNamespace.length + 1))
      if (next) walk(next)
      else missing.push(dependency)
    }
  }

  walk(root)
  return { items, primitives, modules, missing }
}

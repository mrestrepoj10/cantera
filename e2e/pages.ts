import { readFileSync } from 'node:fs'
import path from 'node:path'

interface RegistryFile {
  items: { name: string; type: string; meta?: { kind?: string }; categories?: string[] }[]
}

// Derived from registry.json so the page list cannot drift when an item is
// added. registry:example items are v0 landing pages the docs site never routes.
const registry = JSON.parse(
  readFileSync(path.join(__dirname, '../apps/www/registry.json'), 'utf8'),
) as RegistryFile

export const componentPages = registry.items
  .filter((item) => item.type !== 'registry:example')
  .map((item) => `/components/${item.name}`)

export const markdownPages = componentPages.map((route) => `${route}.md`)

export const blockItems = registry.items.filter((item) => item.meta?.kind === 'block')

export const templateItems = registry.items.filter((item) => item.meta?.kind === 'template')

import { readFileSync } from 'node:fs'
import path from 'node:path'

interface RegistryFile {
  items: { name: string; type: string }[]
}

/**
 * Every catalog item gets a docs page at /components/<name> and a markdown
 * twin. Reading registry.json keeps the page list from drifting when an item
 * is added.
 *
 * Generated `registry:example` items are skipped: they are v0 landing pages, not
 * catalog entries, and the docs site never routes them.
 */
const registry = JSON.parse(
  readFileSync(path.join(__dirname, '../apps/www/registry.json'), 'utf8'),
) as RegistryFile

export const componentPages = registry.items
  .filter((item) => item.type !== 'registry:example')
  .map((item) => `/components/${item.name}`)

/**
 * The markdown twin of each docs page. Same list as `componentPages`, because
 * the `.md` route is generated from the same filtered catalog.
 */
export const markdownPages = componentPages.map((route) => `${route}.md`)

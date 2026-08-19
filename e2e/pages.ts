import { readFileSync } from 'node:fs'
import path from 'node:path'

interface RegistryFile {
  items: { name: string }[]
}

/**
 * Every registry item gets a docs page at /components/<name>, and those pages
 * render the exact code consumers install — so scanning them is how the
 * shipping bar in AGENTS.md gets enforced. Reading registry.json keeps the page
 * list from drifting when an item is added.
 */
const registry = JSON.parse(
  readFileSync(path.join(__dirname, '../apps/www/registry.json'), 'utf8'),
) as RegistryFile

export const componentPages = registry.items.map((item) => `/components/${item.name}`)

export const sitePages = ['/', '/installation', '/components', '/demo', ...componentPages]

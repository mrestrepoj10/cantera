/**
 * One registry item, serialized as markdown.
 *
 * The single serializer behind two surfaces that must not disagree: the agent
 * skill's per-item references (`skills/cantera/references/<name>.md`, generated
 * by `scripts/build-skill.mts`) and the `.md` twin of every docs page
 * (`/components/<name>.md`, served by the route handler). A reader who copies
 * the page and a reader who installs the skill get the same bytes.
 *
 * Everything is derived from `registry.json` and `components/site/props-tables.ts`
 * in file order, with no timestamps and no randomness — the skill output is
 * committed and `pnpm registry:verify` fails on any drift.
 *
 * Import specifiers carry their `.ts` extension because `build-skill.mts` runs
 * on node's native TypeScript support, where relative ESM specifiers are exact
 * file paths. The bundler resolves them the same way.
 */

import { type ApiTable, apiTables, libUsage } from '../components/site/props-tables.ts'
import { docsUrl, installCommandFor, registryItemUrl, registryNamespace } from './site.ts'

/** The shape both callers already have: `registry.json` items, loosely typed. */
export interface MarkdownItem {
  name: string
  type: string
  title?: string
  description?: string
  registryDependencies?: string[]
  dependencies?: string[]
  files?: { path: string; type: string; target?: string }[]
  cssVars?: Record<string, Record<string, string>>
  envVars?: Record<string, string>
  docs?: string
}

interface LabelByRegistryType {
  [type: string]: string
}

const TYPE_LABELS: LabelByRegistryType = {
  'registry:component': 'component',
  'registry:block': 'block',
  'registry:lib': 'lib',
  'registry:item': 'tokens',
  'registry:example': 'example',
}

/** Human label for a registry item type, as the docs and the skill both name it. */
export function typeLabelFor(type: string): string {
  return TYPE_LABELS[type] ?? type
}

/** One API table as a flat list — friendlier than a markdown table for types full of pipes. */
function serializeTable(table: ApiTable): string {
  const rows = table.rows.map((row) => {
    const qualifier =
      table.showDefault && row.defaultValue
        ? `\`${row.type}\`, default \`${row.defaultValue}\``
        : `\`${row.type}\``
    return `- \`${row.name}\` (${qualifier}) — ${row.description}`
  })
  return `## ${table.caption}\n\n${rows.join('\n')}`
}

/** Last path segment, without pulling `node:path` into a module the bundler ships. */
function basename(filePath: string): string {
  return filePath.split('/').pop() ?? filePath
}

/**
 * The full markdown reference for one item: what it is, how to install it, what
 * the install writes, and its complete API surface.
 *
 * `example` is the item's generated `registry:example`, when it has one.
 */
export function itemMarkdown(item: MarkdownItem, example?: MarkdownItem): string {
  const lines: string[] = [
    `# ${item.title} (\`${registryNamespace}/${item.name}\`)`,
    '',
    item.description ?? '',
    '',
    `- Type: ${typeLabelFor(item.type)}`,
    `- Install: \`${installCommandFor(item.name)}\``,
    `- Docs: ${docsUrl(item.name)}`,
    `- Registry item: ${registryItemUrl(item.name)}`,
  ]
  if (item.registryDependencies?.length) {
    lines.push(`- Registry dependencies: ${item.registryDependencies.join(', ')}`)
  }
  if (item.dependencies?.length) {
    lines.push(`- npm dependencies: ${item.dependencies.join(', ')}`)
  }
  if (example) {
    lines.push(
      `- Working example page: \`${installCommandFor(example.name)}\` — installs ${
        example.files?.find((file) => file.type === 'registry:page')?.target ?? 'a page'
      }`,
    )
  }

  const files = item.files ?? []
  if (files.length > 0) {
    lines.push('', 'Files written into the consumer project:', '')
    for (const file of files) lines.push(`- \`${file.target ?? basename(file.path)}\``)
  }
  if (item.cssVars) {
    lines.push('', 'Installs CSS variables into the consumer theme (light and dark).')
  }
  if (item.envVars) {
    lines.push('', 'Environment variables added to `.env.local`:', '')
    for (const name of Object.keys(item.envVars)) lines.push(`- \`${name}\``)
  }
  if (item.docs) {
    lines.push('', '## Install notes', '', item.docs)
  }

  const usage = libUsage[item.name]
  if (usage) {
    lines.push('', '## Usage', '', usage.intro, '', '```tsx', usage.example, '```')
  }
  for (const table of apiTables[item.name] ?? []) {
    lines.push('', serializeTable(table))
  }

  return `${lines.join('\n')}\n`
}

// The single serializer behind the skill's per-item references and the
// `/components/<name>.md` route — both surfaces must emit identical bytes.

import {
  type ApiTable,
  apiTables,
  installNotes,
  libUsage,
} from '../components/site/props-tables.ts'
import type { RegistryItem } from './registry-item.ts'
import { kindLabelFor } from './registry-kinds.ts'
import { docsUrl, installCommandFor, registryItemUrl, registryNamespace } from './site.ts'

export type MarkdownItem = Pick<
  RegistryItem,
  | 'name'
  | 'type'
  | 'title'
  | 'description'
  | 'registryDependencies'
  | 'dependencies'
  | 'files'
  | 'cssVars'
  | 'envVars'
  | 'docs'
  | 'meta'
>

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

/** Avoids pulling `node:path` into a module the bundler ships. */
function basename(filePath: string): string {
  return filePath.split('/').pop() ?? filePath
}

export function itemMarkdown(item: MarkdownItem, example?: MarkdownItem): string {
  const lines: string[] = [
    `# ${item.title} (\`${registryNamespace}/${item.name}\`)`,
    '',
    item.description ?? '',
    '',
    `- Type: ${kindLabelFor(item)}`,
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
  const notes = installNotes[item.name]
  if (notes) {
    lines.push('', '## Notes', '', notes)
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

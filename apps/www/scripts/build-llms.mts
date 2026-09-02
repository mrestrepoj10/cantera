import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import {
  type ApiTable,
  apiTables,
  installNotes,
  libUsage,
} from '../components/site/props-tables.ts'
import { designContracts } from '../lib/design-contracts.ts'
import type { RegistryItem } from '../lib/registry-item.ts'
import { catalogGroupDefinitions, catalogGroupFor, kindLabelFor } from '../lib/registry-kinds.ts'
import {
  docsUrl,
  installCommandFor,
  registryConfigSnippet,
  registryItemUrl,
  registryNamespace,
  siteUrl,
} from '../lib/site.ts'

const wwwRoot = path.join(import.meta.dirname, '..')

const SUMMARY =
  "cantera is a shadcn registry for construction (AEC) interfaces: OAuth sign-in, scope, and connection components, page-sized blocks, and wired Autodesk (APS / ACC) templates for sign-in, connections, model viewing, and model upload. It is not an npm package — the shadcn CLI copies the source into the consumer project, where it renders on that project's own shadcn primitives and theme."

function typeLabel(item: RegistryItem): string {
  const label = kindLabelFor(item)
  return label === 'tokens' ? 'tokens (CSS variables plus a typed accessor)' : label
}

const DESIGN_CONTRACTS = Object.values(designContracts(registryNamespace))
  .map((contract) => `### ${contract.title}\n\n${contract.body}`)
  .join('\n\n')

interface Registry {
  items: RegistryItem[]
}

function serializeTable(table: ApiTable): string {
  const rows = table.rows.map((row) => {
    const qualifier =
      table.showDefault && row.defaultValue
        ? `\`${row.type}\`, default \`${row.defaultValue}\``
        : `\`${row.type}\``
    return `- \`${row.name}\` (${qualifier}) — ${row.description}`
  })
  return `#### ${table.caption}\n\n${rows.join('\n')}`
}

function itemDependencies(item: RegistryItem): string[] {
  const lines: string[] = []
  if (item.registryDependencies?.length) {
    lines.push(`Registry dependencies: ${item.registryDependencies.join(', ')}`)
  }
  if (item.dependencies?.length) {
    lines.push(`npm dependencies: ${item.dependencies.join(', ')}`)
  }
  return lines
}

function buildRegistryIndex(items: RegistryItem[]): string {
  const header = [
    '# cantera registry',
    '',
    `> ${SUMMARY}`,
    '',
    `Namespace: ${registryNamespace}`,
    `Registry item URL: ${siteUrl}/r/{name}.json`,
    `Docs: ${siteUrl}/components/{name}`,
    `Installation guide: ${siteUrl}/installation`,
    `Full reference for agents: ${siteUrl}/llms-full.txt`,
    '',
    'One-time setup — add the namespace to components.json, then install items by name:',
    '',
    '```json',
    registryConfigSnippet,
    '```',
    '',
    '## Items',
  ].join('\n')

  const entries = items.map((item) =>
    [
      `### ${item.name}`,
      '',
      `Title: ${item.title}`,
      `Type: ${typeLabel(item)}`,
      `Description: ${item.description}`,
      `Install: ${installCommandFor(item.name)}`,
      `Docs: ${docsUrl(item.name)}`,
      `Item: ${registryItemUrl(item.name)}`,
    ].join('\n'),
  )

  return `${[header, ...entries].join('\n\n')}\n`
}

function buildSiteIndex(items: RegistryItem[]): string {
  const sections = catalogGroupDefinitions.flatMap(({ id, title, description }) => {
    const matching = items.filter((item) => catalogGroupFor(item) === id)
    if (matching.length === 0) return []
    const links = matching.map(
      (item) => `- [${item.title}](${docsUrl(item.name)}): ${item.description}`,
    )
    return [`## ${title}\n\n${description}\n\n${links.join('\n')}`]
  })

  const docs = [
    '## Docs',
    '',
    `- [Installation](${siteUrl}/installation): Add the ${registryNamespace} namespace to components.json, install items, and override the status tokens.`,
    `- [Components](${siteUrl}/components): Index of every registry item, with a live preview and the exact installed source on each page.`,
    `- [Demo](${siteUrl}/demo): The whole Autodesk OAuth flow, running against an embedded APS emulator — no credentials needed.`,
  ].join('\n')

  const optional = [
    '## Optional',
    '',
    `- [Full reference](${siteUrl}/llms-full.txt): Every item's description, install command, dependencies, props, exports, and data attributes, plus the design contracts behind them.`,
    `- [Registry index](${siteUrl}/r/llms.txt): The same item list, served next to the registry JSON.`,
    `- [Registry manifest](${siteUrl}/r/registry.json): The machine-readable shadcn registry.`,
  ].join('\n')

  const header = [
    '# cantera',
    '',
    `> ${SUMMARY}`,
    '',
    `- Install any item with \`${installCommandFor('<name>')}\` once ${registryNamespace} is registered in components.json.`,
    '- Components take plain typed props and never fetch: provider adapters translate an API payload into the shared oauth types, and the same components render Autodesk, Procore, or anything else.',
    '- Status color, pending behavior, and field density follow fixed contracts, documented in the full reference below.',
  ].join('\n')

  return `${[header, docs, ...sections, optional].join('\n\n')}\n`
}

function buildFullReference(items: RegistryItem[], examples: Set<string>): string {
  const header = [
    '# cantera — full reference',
    '',
    `> ${SUMMARY}`,
    '',
    `Site: ${siteUrl}`,
    `Installation guide: ${siteUrl}/installation`,
    '',
    '## Setup',
    '',
    'Add the namespace to components.json once:',
    '',
    '```json',
    registryConfigSnippet,
    '```',
    '',
    `Then install by name, e.g. \`${installCommandFor('connection-card')}\`. The CLI resolves shadcn primitives from the consumer's own base and style, and cantera dependencies from this registry. The installed code belongs to the consumer — it is copied in, not linked.`,
    '',
    '## Design contracts',
    '',
    'These are the semantics behind the props. A component that is wired against them behaves the way the rest of the registry does.',
    '',
    DESIGN_CONTRACTS,
    '',
    '## Items',
  ].join('\n')

  const entries = items.map((item) => {
    const lines: string[] = [
      `### ${item.title} (\`${registryNamespace}/${item.name}\`)`,
      '',
      `Type: ${typeLabel(item)}`,
      `Install: ${installCommandFor(item.name)}`,
      `Docs: ${docsUrl(item.name)}`,
      `Item: ${registryItemUrl(item.name)}`,
      ...(examples.has(item.name)
        ? [`Working example page: ${installCommandFor(`${item.name}-demo`)}`]
        : []),
      ...itemDependencies(item),
      '',
      item.description,
    ]

    const usage = libUsage[item.name]
    if (usage) {
      lines.push('', usage.intro, '', '```tsx', usage.example, '```')
    }

    const files = item.files ?? []
    if (files.length > 0) {
      const targets = files.map((file) => `- ${file.target ?? path.basename(file.path)}`)
      lines.push('', 'Files written into the consumer project:', '', ...targets)
    }

    if (item.docs) lines.push('', 'Install notes:', '', item.docs)
    const notes = installNotes[item.name]
    if (notes) lines.push('', 'Notes:', '', notes)

    for (const table of apiTables[item.name] ?? []) {
      lines.push('', serializeTable(table))
    }

    return lines.join('\n')
  })

  return `${[header, ...entries].join('\n\n')}\n`
}

async function main() {
  const outIndex = process.argv.indexOf('--out-dir')
  const outDir = outIndex === -1 ? path.join(wwwRoot, 'public') : process.argv[outIndex + 1]

  const registry = JSON.parse(
    await readFile(path.join(wwwRoot, 'registry.json'), 'utf8'),
  ) as Registry
  const items = registry.items.filter((item) => item.type !== 'registry:example')
  const examples = new Set(
    registry.items
      .filter((item) => item.type === 'registry:example')
      .map((item) => item.name.replace(/-demo$/, '')),
  )

  const outputs: [string, string][] = [
    [path.join(outDir, 'r/llms.txt'), buildRegistryIndex(items)],
    [path.join(outDir, 'llms.txt'), buildSiteIndex(items)],
    [path.join(outDir, 'llms-full.txt'), buildFullReference(items, examples)],
  ]

  for (const [file, contents] of outputs) {
    await writeFile(file, contents, 'utf8')
    console.log(`llms: wrote ${path.relative(wwwRoot, file)}`)
  }
}

await main()

/**
 * Generates the agent-facing indexes that ride along with the built registry.
 *
 * Three files, three audiences:
 * - `public/r/llms.txt` — next to the registry JSON, for an agent that already
 *   found the registry and needs to know what is installable and how.
 * - `public/llms.txt` — the llmstxt.org site index: what this project is, and
 *   where each docs page lives.
 * - `public/llms-full.txt` — the whole reference in one fetch: design contracts
 *   first, then every item with its props, exports, and data attributes.
 *
 * Everything is derived from `registry.json` and `components/site/props-tables.ts`
 * in file order, with no timestamps and no randomness: these are committed build
 * artifacts and CI fails the build if they drift. Run via `pnpm registry:build`,
 * which chains this after `shadcn build`.
 *
 * Run with node's native TypeScript support (node >= 23.6): `.mts` so node
 * treats it as ESM (apps/www is a CommonJS package), and explicit `.ts` import
 * specifiers because that is what an ES module resolver needs. The
 * MODULE_TYPELESS_PACKAGE_JSON warning is disabled in the npm script: it fires
 * once for the typeless `.ts` file this imports, and says nothing actionable.
 */

import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { type ApiTable, apiTables, libUsage } from '../components/site/props-tables.ts'
import type { RegistryItem } from '../components/site/registry.ts'
import { designContracts } from '../lib/design-contracts.ts'
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
  "cantera is a shadcn registry for construction (AEC) interfaces: OAuth sign-in, scope, and connection components, plus an end-to-end Autodesk (APS / ACC) sign-in block. It is not an npm package — the shadcn CLI copies the source into the consumer project, where it renders on that project's own shadcn primitives and theme."

/** Section headings in `llms.txt`, keyed by registry item type, in render order. */
const TYPE_SECTIONS: { type: RegistryItem['type']; heading: string; blurb: string }[] = [
  {
    type: 'registry:component',
    heading: 'Components',
    blurb: 'Data-agnostic UI: typed props in, callbacks out, no fetching.',
  },
  {
    type: 'registry:block',
    heading: 'Blocks',
    blurb: 'Wired end-to-end flows — pages, route handlers, and the auth glue between them.',
  },
  {
    type: 'registry:lib',
    heading: 'Libraries',
    blurb: 'The types the components speak, and the provider presets that translate into them.',
  },
  {
    type: 'registry:item',
    heading: 'Tokens',
    blurb: 'CSS variables installed into the consumer theme.',
  },
]

const TYPE_LABELS = {
  'registry:component': 'component',
  'registry:block': 'block',
  'registry:lib': 'lib',
  'registry:item': 'tokens (CSS variables plus a typed accessor)',
  'registry:example': 'example page',
} satisfies Record<RegistryItem['type'], string>

/**
 * The contracts an agent has to know to use a component correctly — the
 * semantics that live in a prose contract rather than in a type signature.
 * Canonical text: `apps/www/lib/design-contracts.ts`.
 */
const DESIGN_CONTRACTS = Object.values(designContracts(registryNamespace))
  .map((contract) => `### ${contract.title}\n\n${contract.body}`)
  .join('\n\n')

interface Registry {
  items: RegistryItem[]
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

/** `public/r/llms.txt` — the installable surface, for an agent at the registry. */
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
      `Type: ${TYPE_LABELS[item.type]}`,
      `Description: ${item.description}`,
      `Install: ${installCommandFor(item.name)}`,
      `Docs: ${docsUrl(item.name)}`,
      `Item: ${registryItemUrl(item.name)}`,
    ].join('\n'),
  )

  return `${[header, ...entries].join('\n\n')}\n`
}

/** `public/llms.txt` — the llmstxt.org site index. */
function buildSiteIndex(items: RegistryItem[]): string {
  const sections = TYPE_SECTIONS.flatMap(({ type, heading, blurb }) => {
    const matching = items.filter((item) => item.type === type)
    if (matching.length === 0) return []
    const links = matching.map(
      (item) => `- [${item.title}](${docsUrl(item.name)}): ${item.description}`,
    )
    return [`## ${heading}\n\n${blurb}\n\n${links.join('\n')}`]
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

/** `public/llms-full.txt` — contracts plus the complete per-item API. */
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
      `Type: ${TYPE_LABELS[item.type]}`,
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

    for (const table of apiTables[item.name] ?? []) {
      lines.push('', serializeTable(table))
    }

    return lines.join('\n')
  })

  return `${[header, ...entries].join('\n\n')}\n`
}

async function main() {
  // `--out-dir` lets the drift verifier rebuild into a scratch directory and
  // compare, rather than trusting that the committed artifacts are current.
  const outIndex = process.argv.indexOf('--out-dir')
  const outDir = outIndex === -1 ? path.join(wwwRoot, 'public') : process.argv[outIndex + 1]

  const registry = JSON.parse(
    await readFile(path.join(wwwRoot, 'registry.json'), 'utf8'),
  ) as Registry
  // Example items are v0 landing pages, not catalog entries: they carry no API
  // of their own and would only pad an index an agent reads to choose an item.
  const items = registry.items.filter((item) => item.type !== 'registry:example')
  // Example items are not listed themselves; each one is named on the item it
  // demonstrates, so an agent reading the reference knows a working page exists.
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

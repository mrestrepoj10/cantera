/**
 * Generates the docs site's component reference: one MDX page per registry item
 * under `apps/docs/content/components/`, plus the `meta.ts` that orders them.
 *
 * These pages are build output, not authored prose. Everything on them comes
 * from `registry.json`, `components/site/props-tables.ts`, and the registry
 * sources themselves, in file order, with no timestamps and no unordered
 * iteration — so `pnpm registry:verify` can rebuild the whole tree into a
 * scratch directory and compare byte for byte. That check is the reason the
 * docs live in this repo rather than one of their own: it only works while the
 * generator, its inputs, and its output share a commit.
 *
 * Authored pages (`content/index.mdx`, `content/installation.mdx`) are not
 * touched. This script owns `content/components/` exclusively and prunes
 * anything there it did not write, so a renamed or deleted item cannot leave a
 * stale page behind.
 *
 * Two deliberate departures from the `apps/www` docs pages they mirror:
 *
 * - **Previews are framed, not imported** (`<ComponentPreview />`, an island in
 *   `apps/docs/islands/`). Importing the registry sources here would mean a
 *   second copy of distributed code and a second theme layer to keep in step.
 * - **API tables are plain markdown, not Blume's `<TypeTable>`.** TypeTable
 *   marks every property it is not told is `required` with a `?`, and
 *   `ApiRow` carries no required-ness — so the native component would print a
 *   confident falsehood on every required prop. Add `required` to `ApiRow`
 *   (and to the www tables and the llms outputs, which read the same rows) and
 *   this can move over.
 *
 * Run via `pnpm registry:build`, which chains this after `build-llms.mts`.
 */

import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { hasDemo } from '../components/site/demo-names.ts'
import { type ApiTable, apiTables, libUsage } from '../components/site/props-tables.ts'
import { typeLabelFor } from '../lib/item-markdown.ts'
import { embedUrl, installCommandFor, registryItemUrl, registryNamespace } from '../lib/site.ts'
import {
  catalogItems,
  type RegistryFile,
  type RegistryItem,
  readRegistry,
  repoRoot,
  wwwRoot,
} from './lib/registry-source.mts'

const DOCS_CONTENT = path.join(repoRoot, 'apps/docs/content/components')

/** Fence language per source extension; everything else falls back to `text`. */
const FENCE_LANGUAGES: Record<string, string> = {
  '.tsx': 'tsx',
  '.ts': 'ts',
  '.css': 'css',
}

/**
 * Sidebar copy per item type. The reference is grouped by what a reader is
 * looking for — something to render, something to wire, something to import.
 */
const TYPE_BLURBS: Record<string, string> = {
  'registry:component': 'Data-agnostic UI: typed props in, callbacks out, no fetching.',
  'registry:block': 'Wired end-to-end flows — pages, route handlers, and the auth glue.',
  'registry:lib': 'The types the components speak, and the presets that translate into them.',
  'registry:item': 'CSS variables installed into the consumer theme.',
}

/**
 * A YAML double-quoted scalar. `JSON.stringify` is exactly that grammar for the
 * strings that appear here, and it escapes the `:` and `"` that would otherwise
 * end the value early.
 */
function yamlString(value: string): string {
  return JSON.stringify(value)
}

/**
 * Prose destined for MDX, made inert.
 *
 * MDX parses `<` as the start of a JSX tag and `{` as the start of an
 * expression, anywhere markdown would have taken them literally. Both appear in
 * this content for ordinary reasons — `data:read:<urn>` in a scope description
 * is the one that found this — and either produces a parse error that names a
 * generated file, not the source table it came from.
 *
 * Inline code spans are left alone: MDX does not parse JSX inside them, so a
 * type like `ComponentProps<'div'>` is already safe, and escaping it would
 * render the entity text instead of the angle bracket.
 */
function prose(value: string): string {
  return value
    .split(/(`[^`]*`)/g)
    .map((segment, index) =>
      // Odd indices are the captured code spans.
      index % 2 === 1 ? segment : segment.replace(/</g, '&lt;').replace(/\{/g, '&#123;'),
    )
    .join('')
}

/**
 * A markdown table cell. GFM ends a cell at an unescaped `|` even inside a code
 * span, and half these types are unions (`'default' | 'outline'`), so the pipes
 * have to be escaped rather than quoted away. Newlines would end the row.
 */
function cell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n\s*/g, ' ')
}

/** One API table, rendered with the same columns the www docs page shows. */
function renderTable(table: ApiTable): string {
  const headers = [table.nameHeader, table.typeHeader ?? 'Type']
  if (table.showDefault) headers.push('Default')
  headers.push('Description')

  const rows = table.rows.map((row) => {
    const cells = [`\`${cell(row.name)}\``, `\`${cell(row.type)}\``]
    if (table.showDefault) cells.push(row.defaultValue ? `\`${cell(row.defaultValue)}\`` : '—')
    cells.push(cell(prose(row.description)))
    return `| ${cells.join(' | ')} |`
  })

  return [
    `## ${table.caption}`,
    '',
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows,
  ].join('\n')
}

/** The install line, plus what the install pulls in with it. */
function renderInstall(item: RegistryItem): string {
  const lines = ['## Install', '', '```bash', installCommandFor(item.name), '```']

  const notes: string[] = []
  if (item.registryDependencies?.length) {
    notes.push(
      `Registry dependencies: ${item.registryDependencies.map((name) => `\`${name}\``).join(', ')}`,
    )
  }
  if (item.dependencies?.length) {
    notes.push(`npm dependencies: ${item.dependencies.map((name) => `\`${name}\``).join(', ')}`)
  }
  if (item.envVars) {
    notes.push(
      `Environment variables written to \`.env.local\`: ${Object.keys(item.envVars)
        .map((name) => `\`${name}\``)
        .join(', ')}`,
    )
  }
  if (notes.length > 0) lines.push('', notes.map((note) => `- ${note}`).join('\n'))

  if (item.docs) {
    // Plain prose rather than a `<Callout>`: the callout's body text does not
    // clear 4.5:1 in Blume's light palette, and `e2e/docs-a11y.spec.ts` fails
    // on it. This is also what `lib/item-markdown.ts` does for the same field,
    // so the docs page and the markdown twin now read the same. `docs` is
    // substantive install guidance — which env vars to set, what fails closed
    // without them — so a section suits it better than an aside anyway.
    lines.push('', '### Install notes', '', prose(item.docs))
  }
  return lines.join('\n')
}

/** The framed live demo, for the items that have one. */
function renderPreview(item: RegistryItem): string {
  return [
    '## Preview',
    '',
    `<ComponentPreview src=${yamlString(embedUrl(item.name))} name=${yamlString(item.name)} title=${yamlString(`${item.title} preview`)} />`,
  ].join('\n')
}

/** Where the shadcn CLI writes each file, so a reader knows what lands where. */
function renderFiles(files: RegistryFile[]): string {
  const rows = files.map(
    (file) => `| \`${cell(file.target ?? path.posix.basename(file.path))}\` | \`${file.type}\` |`,
  )
  return ['## Files', '', '| Path | Type |', '| --- | --- |', ...rows].join('\n')
}

/** The exact code the CLI copies in, one fenced block per file. */
async function renderSource(files: RegistryFile[]): Promise<string> {
  const blocks = await Promise.all(
    files.map(async (file) => {
      const source = await readFile(path.join(wwwRoot, file.path), 'utf8')
      const base = path.posix.basename(file.path)
      const language = FENCE_LANGUAGES[path.posix.extname(base)] ?? 'text'
      // The fence has to out-length any fence inside the file, or the block
      // ends early. None of the registry sources contain one today; this keeps
      // that from becoming a silent corruption if one ever does.
      const longest = Math.max(2, ...[...source.matchAll(/^`{3,}/gm)].map((m) => m[0].length))
      const fence = '`'.repeat(longest + 1)
      return `${fence}${language} ${base}\n${source.trimEnd()}\n${fence}`
    }),
  )

  const intro =
    '## Source\n\nThis is the exact code the CLI installs into your project — you own it from there.'
  return [intro, ...blocks].join('\n\n')
}

async function renderPage(item: RegistryItem): Promise<string> {
  const files = item.files ?? []
  const sections: string[] = [
    [
      '---',
      `title: ${yamlString(item.title ?? item.name)}`,
      `description: ${yamlString(item.description ?? '')}`,
      '---',
    ].join('\n'),
    `<Badge variant="accent">${typeLabelFor(item.type)}</Badge> \`${registryNamespace}/${item.name}\``,
    renderInstall(item),
  ]

  if (hasDemo(item.name)) sections.push(renderPreview(item))

  const usage = libUsage[item.name]
  if (usage) {
    sections.push(
      ['## Usage', '', prose(usage.intro), '', '```tsx', usage.example, '```'].join('\n'),
    )
  }

  if (files.length > 0) sections.push(renderFiles(files))
  for (const table of apiTables[item.name] ?? []) sections.push(renderTable(table))
  if (files.length > 0) sections.push(await renderSource(files))

  sections.push(
    [
      '## Registry item',
      '',
      `The machine-readable item the CLI fetches: [\`${item.name}.json\`](${registryItemUrl(item.name)}).`,
    ].join('\n'),
  )

  return `${sections.join('\n\n')}\n`
}

/** Biome's line budget, mirrored from `biome.json`. */
const LINE_WIDTH = 100

/**
 * A single-quoted TypeScript string literal, matching Biome's `quoteStyle`.
 *
 * `meta.ts` is the one generated file Biome formats — everything else this
 * script writes is `.mdx`, which Biome does not touch — so it has to be written
 * the way Biome would leave it. Otherwise `pnpm format` rewrites the quotes,
 * the committed file stops matching what the generator emits, and CI's
 * `git diff --exit-code` fails on a file nobody edited. Registry names are
 * kebab-case, so nothing here needs escaping, but a quote or backslash in one
 * should not silently produce a broken module.
 */
function tsString(value: string): string {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
}

/** Sidebar order: the registry's own order, which groups the domain sensibly. */
function renderMeta(items: RegistryItem[]): string {
  const names = items.map((item) => tsString(item.name))
  // Biome folds an array of primitives onto one line when it fits the budget
  // and expands it otherwise — the same rule `formatRegistry` encodes for
  // registry.json. Emitting the wrong one is a formatting diff, not a bug in
  // the output, which is exactly the kind that survives review and breaks CI.
  const inline = `  pages: [${names.join(', ')}],`
  const pages =
    inline.length <= LINE_WIDTH
      ? [inline]
      : ['  pages: [', ...names.map((name) => `    ${name},`), '  ],']

  return [
    "import { defineMeta } from 'blume'",
    '',
    '/**',
    ' * Generated by `apps/www/scripts/build-docs.mts` — edit the registry, not this file.',
    ' *',
    ' * Ordered as `registry.json` orders its items: types first, then the tokens',
    ' * and components built on them, then the wired blocks that compose those.',
    ' */',
    'export default defineMeta({',
    "  title: 'Components',",
    "  icon: 'blocks',",
    ...pages,
    '})',
    '',
  ].join('\n')
}

/** The reference landing page: every item, grouped by what it is. */
function renderIndex(items: RegistryItem[]): string {
  const groups = ['registry:lib', 'registry:item', 'registry:component', 'registry:block']
  const sections = groups.flatMap((type) => {
    const matching = items.filter((item) => item.type === type)
    if (matching.length === 0) return []
    const cards = matching.map(
      (item) =>
        `  <Card title=${yamlString(item.title ?? item.name)} href=${yamlString(`/components/${item.name}`)}>\n    ${prose(item.description ?? '')}\n  </Card>`,
    )
    return [
      [
        `## ${typeLabelFor(type).replace(/^./, (c) => c.toUpperCase())}s`,
        '',
        TYPE_BLURBS[type] ?? '',
        '',
        '<CardGroup cols={2}>',
        cards.join('\n'),
        '</CardGroup>',
      ].join('\n'),
    ]
  })

  const header = [
    '---',
    'title: "Components"',
    'description: "Every cantera registry item, with a live preview and the exact installed source."',
    '---',
    '',
    "Components take cantera's OAuth types as props and never fetch; lib items ship the types and",
    'provider presets they build on; blocks wire the whole flow. Install any of them with the shadcn',
    'CLI once the namespace is registered — see [Installation](/installation).',
  ].join('\n')

  return `${[header, ...sections].join('\n\n')}\n`
}

async function main() {
  const outIndex = process.argv.indexOf('--out-dir')
  const outDir = outIndex === -1 ? DOCS_CONTENT : process.argv[outIndex + 1]

  const registry = await readRegistry()
  const items = catalogItems(registry.items)

  await mkdir(outDir, { recursive: true })

  const written = new Map<string, string>([
    ['meta.ts', renderMeta(items)],
    ['index.mdx', renderIndex(items)],
  ])
  for (const item of items) written.set(`${item.name}.mdx`, await renderPage(item))

  for (const [file, contents] of written) {
    await writeFile(path.join(outDir, file), contents, 'utf8')
  }

  // Prune: a renamed item would otherwise leave its old page behind, and the
  // drift verifier only compares files it knows how to rebuild.
  const existing = await readdir(outDir).catch(() => [])
  for (const file of existing.sort()) {
    if (written.has(file)) continue
    await rm(path.join(outDir, file), { recursive: true, force: true })
    console.log(`docs: pruned ${file}`)
  }

  console.log(`docs: wrote ${written.size} files to ${path.relative(repoRoot, outDir)}`)
}

await main()

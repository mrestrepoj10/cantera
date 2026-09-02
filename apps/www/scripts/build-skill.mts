import { mkdir, readdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { designContracts } from '../lib/design-contracts.ts'
import { itemMarkdown } from '../lib/item-markdown.ts'
import { catalogGroupDefinitions, catalogGroupFor, kindLabelFor } from '../lib/registry-kinds.ts'
import { installCommandFor, registryConfigSnippet, siteUrl } from '../lib/site.ts'
import {
  catalogItems,
  namespace,
  type RegistryItem,
  readRegistry,
  repoRoot,
} from './lib/registry-source.mts'

const siteHost = new URL(siteUrl).host

const FRONTMATTER = `---
name: cantera
description: Use when building or reviewing construction (AEC) interfaces with the cantera shadcn registry — Autodesk (APS / ACC) sign-in, OAuth scope pickers, provider connection cards, status tokens, page-sized blocks, and the wired sign-in, connections, model viewer, and model upload templates. Triggers on "cantera", "@cantera/<item>", ${siteHost}, or any request for ACC / APS OAuth, scope, or connection UI in a shadcn project.
---`

const PATTERN = `## The locked pattern

Every domain follows the same layers, and new work stays inside them:

1. **Generic types** (\`registry:lib\`) — the vocabulary components speak:
   \`OAuthProvider\`, \`OAuthScope\`, \`OAuthConnection\`. Never provider-specific.
2. **Provider adapters** (\`registry:lib\`) — data-only presets that translate one
   API into those types: \`aps-oauth-preset\` carries Autodesk's provider metadata,
   scope catalog, scope bundles, and a \`fromApsUserInfo\` adapter.
3. **Blocks** (\`meta.kind: "block"\`) — sections and surfaces built from those
   components: sign-in cards, pickers, sidebars, browsers, drop zones. Sample data
   in, callbacks out, no routes and no environment of their own.
4. **Templates** (\`registry:block\`, \`meta.kind: "template"\`) — ready-to-deploy
   pages: the route, its API handlers, environment keys, and the aec-auth glue in
   one install. \`acc-auth-routes\` is the shared kit underneath them.

Components are data-agnostic and style-agnostic: plain typed props in, callbacks
out, no fetching, no token mechanics, built only on the consumer's own shadcn
primitives. If a component needs data, the consumer fetches it and passes it in.
Token handling — refresh, storage, rotation — belongs to
[aec-auth](https://github.com/mrestrepoj10/aec-auth), never to a component.`

const CONTRACTS = `## Binding contracts

These are not style preferences. Code that breaks them is wrong here.

${Object.values(designContracts(namespace))
  .map((contract) => `**${contract.title}.** ${contract.body}`)
  .join('\n\n')}`

function skillFor(items: RegistryItem[], examples: Map<string, RegistryItem>): string {
  const sections = catalogGroupDefinitions.flatMap((group) => {
    const members = items.filter((item) => catalogGroupFor(item) === group.id)
    if (members.length === 0) return []
    const rows = members.map(
      (item) =>
        `| \`${namespace}/${item.name}\` | ${kindLabelFor(item)} | ${item.description} | [references/${item.name}.md](references/${item.name}.md) |`,
    )
    return [
      `### ${group.title}\n\n${group.description}\n\n| Item | Type | What it is | Reference |\n| --- | --- | --- | --- |\n${rows.join('\n')}`,
    ]
  })

  const withExamples = items.filter((item) => examples.has(item.name))

  return `${FRONTMATTER}

# cantera

cantera is a shadcn registry for construction (AEC) interfaces: OAuth sign-in,
scope, and connection components, page-sized blocks, and end-to-end Autodesk
(APS / ACC) templates. It is **not an npm package** — \`npx shadcn@latest add ${namespace}/<item>\` copies the
source into the project, where it renders on that project's own shadcn primitives
and theme. The consumer owns the code from there, and editing it is expected.

Register the namespace once in \`components.json\`:

\`\`\`json
${registryConfigSnippet}
\`\`\`

Then install by name — the CLI resolves shadcn primitives from the project's own
base and style, and cantera dependencies from this registry:

\`\`\`sh
${installCommandFor('connection-card')}
${installCommandFor('acc-sign-in')}
\`\`\`

${PATTERN}

${CONTRACTS}

## Items

Read the reference before writing code against an item: it carries the props, the
exports, the files the install writes, and the environment it needs.

${sections.join('\n\n')}

## Working examples

Every component ships an example item: a self-contained demo plus a page that
mounts it, which is what "Open in v0" hands over and the fastest way to see one
wired up.

\`\`\`sh
${withExamples.map((item) => installCommandFor(`${item.name}-demo`)).join('\n')}
\`\`\`

## More

- Full API reference in one fetch: ${siteUrl}/llms-full.txt
- Registry index for agents: ${siteUrl}/r/llms.txt
- Token layer (refresh, storage, rotation): https://github.com/mrestrepoj10/aec-auth
- Credential-free OAuth emulator: https://github.com/mrestrepoj10/emulate
`
}

async function main() {
  const outIndex = process.argv.indexOf('--out-dir')
  const outDir = outIndex === -1 ? path.join(repoRoot, 'skills') : process.argv[outIndex + 1]
  const skillDir = path.join(outDir, 'cantera')
  const referencesDir = path.join(skillDir, 'references')

  const registry = await readRegistry()
  const items = catalogItems(registry.items)
  const examples = new Map(
    registry.items
      .filter((item) => item.name.endsWith('-demo'))
      .map((item) => [item.name.replace(/-demo$/, ''), item]),
  )

  await mkdir(referencesDir, { recursive: true })
  // Generated directory: an item that was removed must not leave a stale file.
  for (const entry of await readdir(referencesDir)) {
    if (!items.some((item) => `${item.name}.md` === entry)) {
      await rm(path.join(referencesDir, entry))
    }
  }

  await writeFile(path.join(skillDir, 'SKILL.md'), skillFor(items, examples), 'utf8')
  for (const item of items) {
    await writeFile(
      path.join(referencesDir, `${item.name}.md`),
      itemMarkdown(item, examples.get(item.name)),
      'utf8',
    )
  }

  console.log(`skill: wrote SKILL.md and ${items.length} references`)
}

await main()

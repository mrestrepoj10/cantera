/**
 * Generates the cantera Agent Skill: `skills/cantera/SKILL.md` plus one
 * reference per registry item under `skills/cantera/references/`.
 *
 * Shaped after ai-elements': SKILL.md is a router, not a manual — what cantera
 * is, the pattern every item follows, the contracts that are not visible in a
 * type signature, and a pointer per item. The references carry the API surface,
 * so an agent loads one file for the component it is actually using.
 *
 * Everything is derived from `registry.json` and
 * `components/site/props-tables.ts` in file order, with no timestamps: the skill
 * is committed build output, and `registry:verify` fails if it drifts. The prose
 * that is not derivable — the locked pattern, the design contracts — lives in
 * this file, next to the artifacts it explains.
 *
 * The per-item references come from `lib/item-markdown.ts`, which the site's
 * `/components/<name>.md` route handler serves as well — one serializer, so the
 * markdown an agent installs and the markdown a reader copies cannot disagree.
 *
 * Run via `pnpm registry:build`.
 */

import { mkdir, readdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { itemMarkdown, typeLabelFor } from '../lib/item-markdown.ts'
import { installCommandFor, registryConfigSnippet } from '../lib/site.ts'
import {
  catalogItems,
  namespace,
  type RegistryItem,
  readRegistry,
  repoRoot,
} from './lib/registry-source.mts'

const FRONTMATTER = `---
name: cantera
description: Use when building or reviewing construction (AEC) interfaces with the cantera shadcn registry — Autodesk (APS / ACC) sign-in, OAuth scope pickers, provider connection cards, status tokens, and the wired sign-in and connections blocks. Triggers on "cantera", "@cantera/<item>", canteraui.xyz, or any request for ACC / APS OAuth, scope, or connection UI in a shadcn project.
---`

const PATTERN = `## The locked pattern

Every domain follows the same three layers, and new work stays inside it:

1. **Generic types** (\`registry:lib\`) — the vocabulary components speak:
   \`OAuthProvider\`, \`OAuthScope\`, \`OAuthConnection\`. Never provider-specific.
2. **Provider adapters** (\`registry:lib\`) — data-only presets that translate one
   API into those types: \`aps-oauth-preset\` carries Autodesk's provider metadata,
   scope catalog, scope bundles, and a \`fromApsUserInfo\` adapter.
3. **Wired blocks** (\`registry:block\`) — the batteries-included path: pages, route
   handlers, and the aec-auth glue, composing the same components.

Components are data-agnostic and style-agnostic: plain typed props in, callbacks
out, no fetching, no token mechanics, built only on the consumer's own shadcn
primitives. If a component needs data, the consumer fetches it and passes it in.
Token handling — refresh, storage, rotation — belongs to
[aec-auth](https://github.com/mrestrepoj10/aec-auth), never to a component.`

const CONTRACTS = `## Binding contracts

These are not style preferences. Code that breaks them is wrong here.

**Status vocabulary.** Every status renders from the \`${namespace}/status-tokens\`
variables: \`--status-success\`, \`--status-warning\`, \`--status-danger\`,
\`--status-neutral\`, each with a \`-foreground\` companion (ink on the solid fill)
and a \`-surface\` companion (soft background, which always carries \`text-status-*\`
ink, never the \`-foreground\` ink). One color, one meaning: success is healthy,
warning is recoverable and needs attention, danger is a failure the user must act
on, neutral is absence. Expired and expiring soon are **warning** — a refresh
away, not a failure. Never substitute a generic badge variant: \`secondary\` reads
as gray nothing and \`destructive\` collapses "expired" into "broken". Status uses
solid fills, not low-alpha tints. \`statusCssVars\` (from \`lib/status-tokens.ts\`)
gives the same twelve tokens as typed \`var()\` strings for inline styles, chart
series, and canvas fills — never hand-type a variable name.

**Async pending.** Every component with an async callback exposes a pending
state, and pending means disabled-with-spinner-while-keeping-the-label — never a
label swapped for "Loading…", never a collapsed control. A pressed control is
never unmounted and never changes element type mid-action. Pending is both a prop
the consumer drives (\`loading\`, \`disconnectPending\`, \`reconnectPending\`,
\`loadingProvider\` — for server actions, where no promise comes back) and an
internal state: a callback that returns a promise drives it automatically.
Disabled controls render \`aria-disabled\`, not the native attribute, so they stay
focusable.

**Field density and a11y.** This UI is used with gloves, on a tablet, on site.
Primary actions carry a 44px minimum touch target; comfortable density is the
default and compact is opt-in. 12px is the text floor — there is no
\`text-[10px]\` anywhere in the registry. Focus indicators are 3:1 against their
surroundings (\`focus-visible:border-ring\` plus a full-alpha ring). Every block
ships a real heading, every description is wired with \`aria-describedby\`, and
\`Intl\` formatting is locale-neutral.

**Installed specifiers.** Distributed files import what the install produces:
\`@/components/ui/connection-card\`, \`@/lib/oauth-types\`. Never \`@/registry/...\`
— that path exists only in the cantera repo and installs broken.

**Icon sizing.** Preset provider marks carry their own \`className="size-4"\`, so
one renders correctly wherever it is dropped. A \`[&_svg]:size-*\` wrapper still
wins on specificity where a surface wants another size — use the wrapper, not a
rewritten mark, and keep \`aria-hidden\` on decorative marks.`

function skillFor(items: RegistryItem[], examples: Map<string, RegistryItem>): string {
  const rows = items.map(
    (item) =>
      `| \`${namespace}/${item.name}\` | ${typeLabelFor(item.type)} | ${item.description} | [references/${item.name}.md](references/${item.name}.md) |`,
  )

  const withExamples = items.filter((item) => examples.has(item.name))

  return `${FRONTMATTER}

# cantera

cantera is a shadcn registry for construction (AEC) interfaces: OAuth sign-in,
scope, and connection components, plus end-to-end Autodesk (APS / ACC) blocks. It
is **not an npm package** — \`npx shadcn@latest add ${namespace}/<item>\` copies the
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

| Item | Type | What it is | Reference |
| --- | --- | --- | --- |
${rows.join('\n')}

## Working examples

Every component ships an example item: a self-contained demo plus a page that
mounts it, which is what "Open in v0" hands over and the fastest way to see one
wired up.

\`\`\`sh
${withExamples.map((item) => installCommandFor(`${item.name}-demo`)).join('\n')}
\`\`\`

## More

- Full API reference in one fetch: https://canteraui.xyz/llms-full.txt
- Registry index for agents: https://canteraui.xyz/r/llms.txt
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

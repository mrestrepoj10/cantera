// `docs` prints in the consumer's terminal for every item in an install's
// closure, concatenated with no separators. Only templates and the auth kit earn
// that line — they own the routes and environment a consumer must act on — and
// each stays short enough to read before the prompt returns. Everything else
// documents itself in components/site/install-notes.ts.

import { itemKind } from '../lib/registry-kinds.ts'
import { catalogItems, installedPath, namespace, readRegistry } from './lib/registry-source.mts'

const MAX_WORDS = 120

const registry = await readRegistry()
const problems: string[] = []

for (const item of catalogItems(registry.items)) {
  const kind = itemKind(item)
  if (item.type === 'registry:block' && !kind) {
    problems.push(
      `${namespace}/${item.name}: a registry:block must carry meta.kind template, block, or kit`,
    )
  }
  if (item.meta?.kind && !kind) {
    problems.push(`${namespace}/${item.name}: meta.kind must be template, block, or kit`)
  }
  if ((kind === 'template' || kind === 'kit') && item.type !== 'registry:block') {
    problems.push(`${namespace}/${item.name}: only a registry:block can be a ${kind}`)
  }
  if (kind === 'template' && !item.files?.some((file) => file.type === 'registry:page')) {
    problems.push(`${namespace}/${item.name}: a template ships a registry:page file`)
  }
  if (kind === 'block' && item.files?.some((file) => installedPath(file).startsWith('app/'))) {
    problems.push(`${namespace}/${item.name}: a block never writes into app/`)
  }
  const carriesDocs = kind === 'template' || kind === 'kit'
  const words = item.docs?.trim().split(/\s+/).filter(Boolean).length ?? 0

  if (carriesDocs && words === 0) {
    problems.push(`${namespace}/${item.name}: a ${kind} must ship install docs`)
  }
  if (!carriesDocs && words > 0) {
    problems.push(
      `${namespace}/${item.name}: only templates and the kit carry docs — move this to installNotes in components/site/props-tables.ts`,
    )
  }
  if (words > MAX_WORDS) {
    problems.push(`${namespace}/${item.name}: docs run ${words} words; the cap is ${MAX_WORDS}`)
  }
  const reference = `Reference: ${registry.homepage}/components/${item.name}`
  if (item.docs && !item.docs.trimEnd().endsWith(reference)) {
    problems.push(`${namespace}/${item.name}: docs must end with "${reference}"`)
  }
}

if (problems.length > 0) {
  console.error('docs: install output policy violated\n')
  for (const problem of problems) console.error(`  ${problem}`)
  console.error('')
  process.exit(1)
}

console.log('docs: every block carries a kind; only templates and the kit print install notes')

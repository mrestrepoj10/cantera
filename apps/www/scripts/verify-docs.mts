// `docs` prints in the consumer's terminal for every item in an install's
// closure, concatenated with no separators. Only templates and the auth kit earn
// that line — they own the routes and environment a consumer must act on — and
// each stays short enough to read before the prompt returns. Everything else
// documents itself in components/site/install-notes.ts.

import { itemKind } from '../lib/registry-kinds.ts'
import { catalogItems, namespace, readRegistry } from './lib/registry-source.mts'

const MAX_WORDS = 120

const registry = await readRegistry()
const problems: string[] = []

for (const item of catalogItems(registry.items)) {
  const kind = itemKind(item)
  const carriesDocs = kind === 'template' || kind === 'kit'
  const words = item.docs?.trim().split(/\s+/).filter(Boolean).length ?? 0

  if (carriesDocs && words === 0) {
    problems.push(`${namespace}/${item.name}: a ${kind} must ship install docs`)
  }
  if (!carriesDocs && words > 0) {
    problems.push(
      `${namespace}/${item.name}: only templates and the kit carry docs — move this to components/site/install-notes.ts`,
    )
  }
  if (words > MAX_WORDS) {
    problems.push(`${namespace}/${item.name}: docs run ${words} words; the cap is ${MAX_WORDS}`)
  }
}

if (problems.length > 0) {
  console.error('docs: install output policy violated\n')
  for (const problem of problems) console.error(`  ${problem}`)
  console.error('')
  process.exit(1)
}

console.log('docs: only templates and the kit print install notes, each under the word cap')

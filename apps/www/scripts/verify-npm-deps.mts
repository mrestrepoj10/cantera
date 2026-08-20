/**
 * Verifier 2 of 3: every npm import in an item's closure is declared.
 *
 * The shadcn CLI installs exactly the packages an item names in `dependencies`.
 * A bare import that nobody declared means the consumer's project compiles until
 * it doesn't — a module-not-found at the first render, in a project that never
 * asked for the package. So for every item, every bare module imported anywhere
 * in its transitive closure has to be declared by the item or by one of the
 * `@cantera/*` dependencies it pulls in.
 *
 * Two allowances, both deliberate:
 * - React and Next are ambient. Every consumer of this registry is a React 19 /
 *   Next App Router project by construction, and shadcn's own items do not
 *   declare them either.
 * - shadcn primitives (`button`, `card`, …) are resolved from the consumer's own
 *   base and style, so the packages *they* pull in — Base UI, cva, clsx — are the
 *   primitive's problem, not ours. Only what our own files import counts.
 *
 * `@types/*` aliases both ways: declaring `@types/foo` covers a `foo` import and
 * vice versa, so a types-only dependency does not have to be declared twice.
 */

import { readFile } from 'node:fs/promises'
import path from 'node:path'

import {
  AMBIENT_PACKAGES,
  isAliasSpecifier,
  isRelativeSpecifier,
  namespace,
  packageNameFor,
  parseImports,
  readRegistry,
  resolveClosure,
  wwwRoot,
} from './lib/registry-source.mts'

/** `@types/node` covers `node`, and a plain package covers its types package. */
function aliases(pkg: string): string[] {
  if (pkg.startsWith('@types/')) {
    const bare = pkg.slice('@types/'.length)
    return [pkg, bare.includes('__') ? `@${bare.replace('__', '/')}` : bare]
  }
  return [pkg, `@types/${pkg.startsWith('@') ? pkg.slice(1).replace('/', '__') : pkg}`]
}

const registry = await readRegistry()
const byName = new Map(registry.items.map((item) => [item.name, item]))

/** Every bare package a file imports, cached: files are shared across closures. */
const importsByFile = new Map<string, string[]>()
async function packagesIn(filePath: string): Promise<string[]> {
  const cached = importsByFile.get(filePath)
  if (cached) return cached
  const source = await readFile(path.join(wwwRoot, filePath), 'utf8').catch(() => '')
  const packages = parseImports(source)
    .specifiers.filter(
      (specifier) => !isRelativeSpecifier(specifier) && !isAliasSpecifier(specifier),
    )
    .map(packageNameFor)
    .filter((pkg) => !pkg.startsWith('node:') && !AMBIENT_PACKAGES.has(pkg))
  const unique = [...new Set(packages)].sort()
  importsByFile.set(filePath, unique)
  return unique
}

const violations: string[] = []
const warnings: string[] = []

for (const item of registry.items) {
  const closure = resolveClosure(byName, item)

  const declared = new Set<string>()
  for (const member of closure.items) {
    for (const pkg of [...(member.dependencies ?? []), ...(member.devDependencies ?? [])]) {
      for (const alias of aliases(pkg)) declared.add(alias)
    }
  }

  const used = new Map<string, string>()
  for (const member of closure.items) {
    for (const file of member.files ?? []) {
      for (const pkg of await packagesIn(file.path)) {
        if (!used.has(pkg)) used.set(pkg, `${member.name} — ${file.path}`)
      }
    }
  }

  for (const [pkg, where] of used) {
    if (declared.has(pkg)) continue
    violations.push(
      `${namespace}/${item.name}: "${pkg}" is imported by ${where} but declared by nothing in the closure`,
    )
  }

  // Cruft, not breakage: a declared package nothing in the closure imports still
  // gets installed into the consumer's project.
  for (const pkg of item.dependencies ?? []) {
    if (used.has(pkg) || aliases(pkg).some((alias) => used.has(alias))) continue
    warnings.push(`${namespace}/${item.name}: declares "${pkg}", which nothing in it imports`)
  }
}

for (const warning of warnings) console.warn(`npm-deps: warning — ${warning}`)

if (violations.length > 0) {
  console.error('npm-deps: undeclared packages\n')
  for (const violation of violations) console.error(`  ${violation}`)
  console.error('')
  process.exit(1)
}

console.log(`npm-deps: ${registry.items.length} items declare every package they import`)

// Every bare import in an item's transitive closure must be declared within it.
// Two deliberate allowances: react/next are ambient in every consumer, and the
// packages shadcn primitives pull in are the primitive's problem, not ours.

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

function aliases(pkg: string): string[] {
  if (pkg.startsWith('@types/')) {
    const bare = pkg.slice('@types/'.length)
    return [pkg, bare.includes('__') ? `@${bare.replace('__', '/')}` : bare]
  }
  return [pkg, `@types/${pkg.startsWith('@') ? pkg.slice(1).replace('/', '__') : pkg}`]
}

const registry = await readRegistry()
const byName = new Map(registry.items.map((item) => [item.name, item]))

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

  // Cruft, not breakage: declared-but-unimported still installs into the consumer.
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

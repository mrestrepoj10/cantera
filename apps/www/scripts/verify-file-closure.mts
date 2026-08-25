// Every import in an item's files must be satisfied by something the install
// produces, checked against *installed* paths. The repo's tsconfig fallbacks make
// a broken install compile here, so this failure mode is invisible without it.

import { readFile } from 'node:fs/promises'
import path from 'node:path'

import {
  aliasTargetFor,
  installedPath,
  isAliasSpecifier,
  isRelativeSpecifier,
  namespace,
  PROJECT_PROVIDED_MODULES,
  parseImports,
  type RegistryItem,
  readRegistry,
  resolveClosure,
  withoutExtension,
  wwwRoot,
} from './lib/registry-source.mts'

const violations: string[] = []

function report(item: RegistryItem, file: string, message: string): void {
  violations.push(`${namespace}/${item.name} — ${file}: ${message}`)
}

const registry = await readRegistry()
const byName = new Map(registry.items.map((item) => [item.name, item]))

const owners = new Map<string, { item: string; module: string }>()
for (const item of registry.items) {
  for (const file of item.files ?? []) {
    owners.set(withoutExtension(installedPath(file)), {
      item: item.name,
      module: withoutExtension(installedPath(file)),
    })
  }
}

function explain(target: string, closure: ReturnType<typeof resolveClosure>): string {
  const owner = owners.get(target)
  if (owner) {
    return closure.items.some((candidate) => candidate.name === owner.item)
      ? `${namespace}/${owner.item} is a dependency but installs it elsewhere`
      : `add ${namespace}/${owner.item} to registryDependencies`
  }
  const base = path.posix.basename(target)
  const misplaced = [...owners.values()].find(
    (candidate) => path.posix.basename(candidate.module) === base,
  )
  if (misplaced) {
    return `${namespace}/${misplaced.item} installs it at ${misplaced.module} — fix the file type or target`
  }
  return target.startsWith('components/ui/')
    ? `add the shadcn primitive "${base}" to registryDependencies`
    : 'nothing in the registry installs that path'
}

// The shadcn CLI rewrites an alias import to whichever of the item's own files
// shares the specifier's basename, extension ignored — so two files with the same
// basename make one unreachable and the importer ends up pointing at itself. The
// registry JSON stays correct either way, which is why only an install shows it.
// Only alias-importable files can collide: everything under app/ is reached by
// filename, never imported, so a block's several route.ts are not a conflict.
for (const item of registry.items) {
  const byBasename = new Map<string, string[]>()
  for (const file of item.files ?? []) {
    const installed = installedPath(file)
    if (installed.startsWith('app/')) continue
    const base = path.posix.basename(withoutExtension(installed))
    byBasename.set(base, [...(byBasename.get(base) ?? []), installed])
  }
  for (const [base, paths] of byBasename) {
    if (paths.length > 1) {
      violations.push(
        `${namespace}/${item.name}: ${paths.join(' and ')} share the basename "${base}" — the CLI rewrites imports to the wrong one, so rename one of them`,
      )
    }
  }
}

for (const item of registry.items) {
  const closure = resolveClosure(byName, item)
  for (const missing of closure.missing) {
    violations.push(`${namespace}/${item.name}: registry dependency ${missing} does not exist`)
  }

  for (const file of item.files ?? []) {
    const source = await readFile(path.join(wwwRoot, file.path), 'utf8').catch(() => null)
    if (source === null) {
      report(item, file.path, 'file is listed in registry.json but missing on disk')
      continue
    }

    const { specifiers, requires } = parseImports(source)
    for (const required of requires) {
      report(item, file.path, `CJS require("${required}") — ESM-only consumers cannot load this`)
    }

    for (const specifier of specifiers) {
      if (specifier.startsWith('@/registry/')) {
        report(item, file.path, `"${specifier}" is a repo path — import the installed specifier`)
        continue
      }

      if (isRelativeSpecifier(specifier)) {
        const resolved = path.posix.normalize(
          path.posix.join(path.posix.dirname(file.path), specifier),
        )
        const sibling = (item.files ?? []).find(
          (candidate) => withoutExtension(candidate.path) === withoutExtension(resolved),
        )
        if (!sibling) {
          report(item, file.path, `"${specifier}" is not shipped by this item`)
          continue
        }
        const from = path.posix.dirname(installedPath(file))
        const to = path.posix.dirname(installedPath(sibling))
        if (from !== to) {
          report(
            item,
            file.path,
            `"${specifier}" installs to ${to} but the importer installs to ${from}`,
          )
        }
        continue
      }

      if (!isAliasSpecifier(specifier)) continue

      const target = aliasTargetFor(specifier)
      if (PROJECT_PROVIDED_MODULES.has(target)) continue
      if (closure.modules.has(target)) continue
      if (
        target.startsWith('components/ui/') &&
        closure.primitives.has(path.posix.basename(target))
      )
        continue

      report(item, file.path, `"${specifier}" resolves to nothing: ${explain(target, closure)}`)
    }
  }
}

if (violations.length > 0) {
  console.error('file-closure: incomplete installs\n')
  for (const violation of violations) console.error(`  ${violation}`)
  console.error('')
  process.exit(1)
}

console.log(`file-closure: ${registry.items.length} items ship a complete import closure`)

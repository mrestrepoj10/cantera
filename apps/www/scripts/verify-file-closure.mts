/**
 * Verifier 1 of 3: every installable item ships its complete import closure.
 *
 * `npx shadcn add @cantera/<item>` copies files into a project that has none of
 * this repo's tsconfig paths. So every import inside an item's files has to be
 * satisfied by something the install actually produces: another file in the same
 * item, a file from a `@cantera/*` registry dependency (followed transitively
 * through registry.json), a shadcn primitive declared by its plain name, or a
 * module `shadcn init` already created. Anything else installs broken — the
 * failure mode a registry cannot self-detect, because the site's path fallbacks
 * make it compile here.
 *
 * The check is done against *installed* paths, not repo paths: a file's type and
 * target decide where the CLI writes it, so a `registry:component` file lands in
 * `components/` while `@/components/ui/x` reads from `components/ui/`. That
 * mismatch is invisible in this repo and fatal in a consumer's.
 *
 * It also rejects CJS `require()` and `@/registry/...` specifiers: the first
 * breaks ESM-only consumers (Vite), the second is a repo path that means nothing
 * once installed.
 */

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

/** Every module any item installs, so a miss can name the item that owns it. */
const owners = new Map<string, { item: string; module: string }>()
for (const item of registry.items) {
  for (const file of item.files ?? []) {
    owners.set(withoutExtension(installedPath(file)), {
      item: item.name,
      module: withoutExtension(installedPath(file)),
    })
  }
}

/** Turns an unsatisfied import into the fix for it. */
function explain(target: string, closure: ReturnType<typeof resolveClosure>): string {
  const owner = owners.get(target)
  if (owner) {
    return closure.items.some((candidate) => candidate.name === owner.item)
      ? `${namespace}/${owner.item} is a dependency but installs it elsewhere`
      : `add ${namespace}/${owner.item} to registryDependencies`
  }
  // Same file name, different install directory: a wrong file type or target.
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
        // A relative import only survives the install when both files land in
        // the same installed directory, whatever their layout is in the repo.
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
      // A shadcn primitive: satisfied by declaring its plain registry name.
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

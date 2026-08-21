/**
 * Shared plumbing for every script that reads or writes the registry:
 * `build-examples`, `build-skill`, `build-llms`, and the three verifiers.
 *
 * Three jobs live here, all of them things the scripts must agree on exactly:
 * reading and re-serializing `registry.json` byte-identically to Biome's
 * formatter, parsing the import graph out of a distributed file, and resolving
 * where the shadcn CLI writes each file in a consumer project.
 */

import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

export const wwwRoot = path.join(import.meta.dirname, '..', '..')
export const repoRoot = path.join(wwwRoot, '..', '..')
export const registryPath = path.join(wwwRoot, 'registry.json')

/** The namespace consumers register this registry under. */
export const namespace = '@cantera'

export interface RegistryFile {
  path: string
  type: string
  target?: string
}

export interface RegistryItem {
  name: string
  type: string
  title?: string
  description?: string
  author?: string
  categories?: string[]
  dependencies?: string[]
  devDependencies?: string[]
  registryDependencies?: string[]
  files?: RegistryFile[]
  cssVars?: Record<string, Record<string, string>>
  envVars?: Record<string, string>
  docs?: string
}

export interface Registry {
  $schema?: string
  name: string
  homepage?: string
  author?: string
  items: RegistryItem[]
}

/** Items generated as v0 landing pages, kept out of every catalog surface. */
export const EXAMPLE_TYPE = 'registry:example'

/** The registry as a consumer browses it: everything except the v0 examples. */
export function catalogItems(items: RegistryItem[]): RegistryItem[] {
  return items.filter((item) => item.type !== EXAMPLE_TYPE)
}

export function exampleItems(items: RegistryItem[]): RegistryItem[] {
  return items.filter((item) => item.type === EXAMPLE_TYPE)
}

export async function readRegistry(): Promise<Registry> {
  return JSON.parse(await readFile(registryPath, 'utf8')) as Registry
}

const LINE_WIDTH = 100

/**
 * Serializes the registry the way Biome formats it, so a generated write is a
 * formatting fixpoint and `pnpm lint` stays green.
 *
 * `JSON.stringify` already matches on everything except one rule: Biome folds an
 * array whose elements are all primitives onto a single line when the result
 * fits the 100-column budget. Objects stay expanded either way.
 */
export function formatRegistry(registry: Registry): string {
  const expanded = `${JSON.stringify(registry, null, 2)}\n`
  return expanded.replace(
    /^( *)("[^"\n]*": )?\[\n((?:[^[\]{}\n]*\n)*?)( *)\](,?)/gm,
    (
      match,
      indent: string,
      key: string | undefined,
      body: string,
      _closing: string,
      comma: string,
    ) => {
      const elements = body
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .map((line) => line.replace(/,$/, ''))
      if (elements.length === 0) return match
      const line = `${indent}${key ?? ''}[${elements.join(', ')}]${comma}`
      return line.length <= LINE_WIDTH ? line : match
    },
  )
}

export async function writeRegistry(registry: Registry): Promise<void> {
  await writeFile(registryPath, formatRegistry(registry), 'utf8')
}

// ---------------------------------------------------------------------------
// Import graph
// ---------------------------------------------------------------------------

export interface ParsedImports {
  /** Every module specifier the file imports, in source order, deduplicated. */
  specifiers: string[]
  /** CJS `require()` specifiers — never valid in a distributed file. */
  requires: string[]
}

const IMPORT_PATTERNS = [
  /\bfrom\s*['"]([^'"]+)['"]/g,
  /\bimport\s*['"]([^'"]+)['"]/g,
  /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
]
const REQUIRE_PATTERN = /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g

/**
 * Regex-based on purpose: the alternative is a TypeScript parser dependency for
 * a set of files that are all hand-written, formatted by Biome, and free of the
 * exotic syntax that would fool it. A false positive costs a verifier message;
 * a parser costs a build dependency.
 */
export function parseImports(source: string): ParsedImports {
  const specifiers = new Set<string>()
  for (const pattern of IMPORT_PATTERNS) {
    for (const match of source.matchAll(pattern)) specifiers.add(match[1])
  }
  const requires = new Set<string>()
  for (const match of source.matchAll(REQUIRE_PATTERN)) requires.add(match[1])
  return { specifiers: [...specifiers], requires: [...requires] }
}

export function isRelativeSpecifier(specifier: string): boolean {
  return specifier.startsWith('./') || specifier.startsWith('../')
}

export function isAliasSpecifier(specifier: string): boolean {
  return specifier.startsWith('@/')
}

/** `aec-auth/vault` and `@scope/pkg/sub` both collapse to their package name. */
export function packageNameFor(specifier: string): string {
  const segments = specifier.split('/')
  return specifier.startsWith('@') ? segments.slice(0, 2).join('/') : segments[0]
}

// ---------------------------------------------------------------------------
// Install-path resolution
// ---------------------------------------------------------------------------

/**
 * Where the shadcn CLI writes one registry file in a consumer project with the
 * default aliases, as a project-relative posix path.
 *
 * An explicit `target` wins (the CLI joins it onto the project root). Otherwise
 * the file type picks the directory — this is the rule that makes a
 * `registry:component` file land in `components/` and a `registry:ui` file in
 * `components/ui/`, which is exactly what an `@/components/ui/...` import in a
 * sibling file depends on.
 */
export function installedPath(file: RegistryFile): string {
  if (file.target) return file.target.replace(/^\.\//, '').replace(/^src\//, '')
  const base = path.posix.basename(file.path)
  switch (file.type) {
    case 'registry:ui':
      return `components/ui/${base}`
    case 'registry:lib':
      return `lib/${base}`
    case 'registry:hook':
      return `hooks/${base}`
    default:
      return `components/${base}`
  }
}

/** Drops the extension so an import specifier can be compared against it. */
export function withoutExtension(filePath: string): string {
  return filePath.replace(/\.(tsx|ts|jsx|js|css)$/, '')
}

/**
 * The project-relative module path an `@/...` specifier points at, extension
 * stripped. The CLI only rewrites the alias prefix of these specifiers, so
 * `@/components/ui/token-status` resolves to `components/ui/token-status`.
 */
export function aliasTargetFor(specifier: string): string {
  return withoutExtension(specifier.replace(/^@\//, ''))
}

/**
 * Files the consumer project already has from `shadcn init`, so no registry
 * item has to ship them.
 */
export const PROJECT_PROVIDED_MODULES = new Set(['lib/utils'])

/**
 * Bare modules a React/Next consumer already has. Everything else has to be
 * declared in an item's `dependencies`.
 */
export const AMBIENT_PACKAGES = new Set(['react', 'react-dom', 'next'])

// ---------------------------------------------------------------------------
// Dependency closure
// ---------------------------------------------------------------------------

export interface ClosureFile {
  /** The registry item that ships this file. */
  item: string
  file: RegistryFile
  /** Where it lands in a consumer project, extension stripped. */
  module: string
}

export interface ItemClosure {
  /** The item itself plus every `@cantera/*` dependency, transitively. */
  items: RegistryItem[]
  /** Plain-name registry dependencies: shadcn primitives the consumer installs. */
  primitives: Set<string>
  /** Every module the closure installs, keyed by its consumer-project path. */
  modules: Map<string, ClosureFile>
  /** Unresolvable `@cantera/*` dependencies, if any. */
  missing: string[]
}

export function resolveClosure(byName: Map<string, RegistryItem>, root: RegistryItem): ItemClosure {
  const items: RegistryItem[] = []
  const primitives = new Set<string>()
  const modules = new Map<string, ClosureFile>()
  const missing: string[] = []
  const seen = new Set<string>()

  const walk = (item: RegistryItem) => {
    if (seen.has(item.name)) return
    seen.add(item.name)
    items.push(item)
    for (const file of item.files ?? []) {
      modules.set(withoutExtension(installedPath(file)), {
        item: item.name,
        file,
        module: withoutExtension(installedPath(file)),
      })
    }
    for (const dependency of item.registryDependencies ?? []) {
      if (!dependency.startsWith(`${namespace}/`)) {
        primitives.add(dependency)
        continue
      }
      const next = byName.get(dependency.slice(namespace.length + 1))
      if (next) walk(next)
      else missing.push(dependency)
    }
  }

  walk(root)
  return { items, primitives, modules, missing }
}

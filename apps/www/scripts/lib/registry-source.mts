import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { withoutExtension } from '../../lib/registry-closure.ts'
import type { RegistryItem } from '../../lib/registry-item.ts'

export const wwwRoot = path.join(import.meta.dirname, '..', '..')
export const repoRoot = path.join(wwwRoot, '..', '..')
export const registryPath = path.join(wwwRoot, 'registry.json')

export {
  type ClosureFile,
  type ItemClosure,
  installedPath,
  resolveClosure,
  withoutExtension,
} from '../../lib/registry-closure.ts'
export type { RegistryFile, RegistryItem } from '../../lib/registry-item.ts'
export { registryNamespace as namespace } from '../../lib/site.ts'

export interface Registry {
  $schema?: string
  name: string
  homepage?: string
  author?: string
  items: RegistryItem[]
}

export const EXAMPLE_TYPE = 'registry:example'

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
 * formatting fixpoint: `JSON.stringify` matches except that Biome folds an
 * all-primitive array onto one line when it fits the 100-column budget.
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

export interface ParsedImports {
  specifiers: string[]
  requires: string[]
}

const IMPORT_PATTERNS = [
  /\bfrom\s*['"]([^'"]+)['"]/g,
  /\bimport\s*['"]([^'"]+)['"]/g,
  /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
]
const REQUIRE_PATTERN = /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g

/** Regex-based on purpose: a TypeScript parser is a build dependency, a false
 * positive is only a verifier message. */
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

export function packageNameFor(specifier: string): string {
  const segments = specifier.split('/')
  return specifier.startsWith('@') ? segments.slice(0, 2).join('/') : segments[0]
}

export function aliasTargetFor(specifier: string): string {
  return withoutExtension(specifier.replace(/^@\//, ''))
}

export const PROJECT_PROVIDED_MODULES = new Set(['lib/utils'])

export const AMBIENT_PACKAGES = new Set(['react', 'react-dom', 'next'])

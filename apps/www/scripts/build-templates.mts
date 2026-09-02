// Generates templates/<name> — a whole Next.js app per template item: the
// item's install closure laid out at the CLI's paths, the shadcn primitives it
// needs, and a create-next-app skeleton. Deterministic: sorted iteration, no
// timestamps, versions read from apps/www/package.json.

import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { itemKind } from '../lib/registry-kinds.ts'
import {
  deployUrlFor,
  docsUrl,
  envDescriptions,
  installCommandFor,
  registryConfigSnippet,
  requiredEnvKeys,
} from '../lib/site.ts'
import {
  AMBIENT_PACKAGES,
  catalogItems,
  installedPath,
  isAliasSpecifier,
  isRelativeSpecifier,
  packageNameFor,
  parseImports,
  type RegistryItem,
  readRegistry,
  repoRoot,
  resolveClosure,
  wwwRoot,
} from './lib/registry-source.mts'

const skeletonDir = path.join(wwwRoot, 'scripts/template-skeleton')

const BASE_DEPENDENCIES = ['next', 'react', 'react-dom', 'tw-animate-css']
const BASE_DEV_DEPENDENCIES = [
  '@tailwindcss/postcss',
  '@types/node',
  '@types/react',
  '@types/react-dom',
  'eslint',
  'eslint-config-next',
  'tailwindcss',
  'typescript',
]

interface VersionByPackage {
  [name: string]: string
}

interface TemplateFile {
  /** Path inside the generated app. */
  target: string
  contents: string
}

async function readVersions(): Promise<VersionByPackage> {
  const pkg = JSON.parse(await readFile(path.join(wwwRoot, 'package.json'), 'utf8')) as {
    dependencies: VersionByPackage
    devDependencies: VersionByPackage
  }
  return { ...pkg.dependencies, ...pkg.devDependencies }
}

function versionOf(name: string, versions: VersionByPackage): string {
  const version = versions[name]
  if (!version || version.startsWith('workspace:')) {
    throw new Error(`templates: ${name} has no publishable version in apps/www/package.json`)
  }
  return version
}

/** The alias imports a file makes, mapped to the module they name. */
function aliasModulesOf(source: string): string[] {
  return parseImports(source)
    .specifiers.filter(isAliasSpecifier)
    .map((specifier) => specifier.replace(/^@\//, ''))
}

async function readSource(relative: string): Promise<string> {
  return readFile(path.join(wwwRoot, relative), 'utf8')
}

/** Resolves a module the consumer's own project would provide: a primitive, a hook, or lib/utils. */
function projectSourceFor(module: string): string | undefined {
  if (module.startsWith('components/ui/')) return `${module}.tsx`
  if (module.startsWith('hooks/')) return `${module}.ts`
  if (module === 'lib/utils') return 'lib/utils.ts'
  return undefined
}

async function collectFiles(item: RegistryItem, byName: Map<string, RegistryItem>) {
  const closure = resolveClosure(byName, item)
  if (closure.missing.length > 0) {
    throw new Error(`templates: ${item.name} depends on ${closure.missing.join(', ')}`)
  }

  const files = new Map<string, string>()
  const packages = new Set<string>()
  const pending: string[] = []

  const addFile = async (target: string, source: string) => {
    if (files.has(target)) return
    const contents = await readSource(source)
    files.set(target, contents)
    for (const specifier of parseImports(contents).specifiers) {
      if (isRelativeSpecifier(specifier)) continue
      if (isAliasSpecifier(specifier)) {
        pending.push(specifier.replace(/^@\//, ''))
        continue
      }
      const pkg = packageNameFor(specifier)
      if (!AMBIENT_PACKAGES.has(pkg)) packages.add(pkg)
    }
  }

  for (const [, file] of [...closure.modules].sort(([a], [b]) => a.localeCompare(b))) {
    await addFile(installedPath(file.file), file.file.path)
  }
  for (const primitive of [...closure.primitives].sort()) {
    pending.push(`components/ui/${primitive}`)
  }

  while (pending.length > 0) {
    const module = pending.shift() as string
    const provided = [...closure.modules.keys()].some((known) => known === module)
    if (provided) continue
    const source = projectSourceFor(module)
    if (!source)
      throw new Error(`templates: ${item.name} imports @/${module}, which nothing provides`)
    await addFile(source, source)
  }

  return { closure, files, packages }
}

function routeOf(item: RegistryItem): string {
  const page = item.files?.find((file) => file.type === 'registry:page')
  if (!page?.target) throw new Error(`templates: ${item.name} ships no registry:page`)
  return `/${page.target.replace(/^app\//, '').replace(/\/page\.tsx$/, '')}`
}

function layoutFor(item: RegistryItem): string {
  return `import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import type { ReactNode } from 'react'

import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: ${JSON.stringify(item.title)},
  description: ${JSON.stringify(item.description)},
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={\`\${geistSans.variable} \${geistMono.variable} h-full antialiased\`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  )
}
`
}

function homeFor(route: string): string {
  return `import { redirect } from 'next/navigation'

export default function Home() {
  redirect(${JSON.stringify(route)})
}
`
}

function packageJsonFor(
  item: RegistryItem,
  packages: Set<string>,
  devPackages: Set<string>,
  versions: VersionByPackage,
): string {
  const dependencies: VersionByPackage = {}
  for (const name of [...new Set([...BASE_DEPENDENCIES, ...packages])].sort()) {
    if (devPackages.has(name)) continue
    dependencies[name] = versionOf(name, versions)
  }
  const devDependencies: VersionByPackage = {}
  for (const name of [...new Set([...BASE_DEV_DEPENDENCIES, ...devPackages])].sort()) {
    devDependencies[name] = versionOf(name, versions)
  }
  return `${JSON.stringify(
    {
      name: `cantera-${item.name}`,
      version: '0.1.0',
      private: true,
      scripts: { dev: 'next dev', build: 'next build', start: 'next start', lint: 'eslint' },
      dependencies,
      devDependencies,
    },
    null,
    2,
  )}\n`
}

function componentsJson(): string {
  return `${JSON.stringify(
    {
      $schema: 'https://ui.shadcn.com/schema.json',
      style: 'base-nova',
      rsc: true,
      tsx: true,
      tailwind: {
        config: '',
        css: 'app/globals.css',
        baseColor: 'neutral',
        cssVariables: true,
        prefix: '',
      },
      iconLibrary: 'lucide',
      rtl: false,
      aliases: {
        components: '@/components',
        utils: '@/lib/utils',
        ui: '@/components/ui',
        lib: '@/lib',
        hooks: '@/hooks',
      },
      registries: JSON.parse(registryConfigSnippet).registries,
    },
    null,
    2,
  )}\n`
}

function envExampleFor(keys: string[]): string {
  const lines = ['# Copy to .env.local. The README explains every key.']
  for (const key of keys) {
    const description = envDescriptions[key]
    if (description) lines.push(`# ${description}`)
    lines.push(`${key}=`)
  }
  return `${lines.join('\n')}\n`
}

function readmeFor(item: RegistryItem, route: string, envKeys: string[], files: string[]): string {
  const required = new Set(requiredEnvKeys(envKeys))
  const envRows = envKeys.map(
    (key) => `| \`${key}\` | ${required.has(key) ? 'yes' : 'no'} | ${envDescriptions[key] ?? ''} |`,
  )
  const routes = files.filter((file) => file.startsWith('app/') && file !== 'app/globals.css')
  const rest = files.filter((file) => !file.startsWith('app/'))
  return `# ${item.title}

${item.description}

[![Deploy with Vercel](https://vercel.com/button)](${deployUrlFor(item.name, envKeys)})

The deploy prompts for the keys marked required below. Register
\`<your-deployment-url>/api/auth/callback/aps\` as a callback URL on your APS app if the
template signs users in. Everything else has a default.

## Run locally

\`\`\`sh
pnpm install
cp .env.example .env.local
pnpm dev
\`\`\`

Then open ${route}. The home route redirects there.

## Environment

| Key | Required | Meaning |
| --- | --- | --- |
${envRows.join('\n')}

## What is inside

Routes and handlers:

${routes.map((file) => `- \`${file}\``).join('\n')}

Components and libraries:

${rest.map((file) => `- \`${file}\``).join('\n')}

## Keep it current

This directory is generated from the cantera registry by \`pnpm registry:build\`; edit the
registry sources, not these files. The same code installs into an existing app with
\`${installCommandFor(item.name)}\`. Reference: ${docsUrl(item.name)}
`
}

function indexFor(templates: { item: RegistryItem; envKeys: string[] }[]): string {
  const rows = templates.map(
    ({ item, envKeys }) =>
      `| [${item.title}](./${item.name}) | ${item.description} | [Deploy](${deployUrlFor(item.name, envKeys)}) · [Docs](${docsUrl(item.name)}) |`,
  )
  return `# Templates

Ready-to-deploy Next.js apps, one per cantera template. Each directory is generated from the
registry by \`pnpm registry:build\` and is what the Deploy button on the site clones.

| Template | What it is | Links |
| --- | --- | --- |
${rows.join('\n')}
`
}

async function buildTemplate(
  item: RegistryItem,
  byName: Map<string, RegistryItem>,
  versions: VersionByPackage,
): Promise<{ files: TemplateFile[]; envKeys: string[] }> {
  const { closure, files, packages } = await collectFiles(item, byName)
  const devPackages = new Set(closure.items.flatMap((member) => member.devDependencies ?? []))
  const envKeys = [...new Set(closure.items.flatMap((member) => Object.keys(member.envVars ?? {})))]
  const route = routeOf(item)

  const output: TemplateFile[] = [...files].map(([target, contents]) => ({ target, contents }))
  for (const [source, target] of [
    ['globals.css', 'app/globals.css'],
    ['next.config.ts', 'next.config.ts'],
    ['postcss.config.mjs', 'postcss.config.mjs'],
    ['eslint.config.mjs', 'eslint.config.mjs'],
    ['tsconfig.json', 'tsconfig.json'],
    ['gitignore', '.gitignore'],
  ]) {
    output.push({ target, contents: await readFile(path.join(skeletonDir, source), 'utf8') })
  }
  output.push(
    { target: 'app/layout.tsx', contents: layoutFor(item) },
    { target: 'app/page.tsx', contents: homeFor(route) },
    { target: 'package.json', contents: packageJsonFor(item, packages, devPackages, versions) },
    { target: 'components.json', contents: componentsJson() },
    { target: '.env.example', contents: envExampleFor(envKeys) },
    {
      target: 'README.md',
      contents: readmeFor(item, route, envKeys, [...files.keys()].sort()),
    },
  )
  output.sort((a, b) => a.target.localeCompare(b.target))
  return { files: output, envKeys }
}

async function main() {
  const outIndex = process.argv.indexOf('--out-dir')
  const outDir = outIndex === -1 ? path.join(repoRoot, 'templates') : process.argv[outIndex + 1]

  const registry = await readRegistry()
  const catalog = catalogItems(registry.items)
  const byName = new Map(catalog.map((item) => [item.name, item]))
  const versions = await readVersions()
  const templates = catalog.filter((item) => itemKind(item) === 'template')

  await rm(outDir, { recursive: true, force: true })
  await mkdir(outDir, { recursive: true })

  const index: { item: RegistryItem; envKeys: string[] }[] = []
  let count = 0
  for (const item of templates) {
    const { files, envKeys } = await buildTemplate(item, byName, versions)
    for (const file of files) {
      const destination = path.join(outDir, item.name, file.target)
      await mkdir(path.dirname(destination), { recursive: true })
      await writeFile(destination, file.contents, 'utf8')
      count += 1
    }
    index.push({ item, envKeys })
  }
  await writeFile(path.join(outDir, 'README.md'), indexFor(index), 'utf8')

  console.log(`templates: ${templates.length} apps, ${count} files written`)
}

await main()

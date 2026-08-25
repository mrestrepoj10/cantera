// Rebuilds every committed artifact into a scratch directory and compares byte
// for byte — proving both currency and generator determinism (no timestamps, no
// unordered iteration).

import { execFile } from 'node:child_process'
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'

import { repoRoot, wwwRoot } from './lib/registry-source.mts'

const run = promisify(execFile)
const NODE_ARGS = ['--disable-warning=MODULE_TYPELESS_PACKAGE_JSON']

async function script(name: string, args: string[] = []): Promise<void> {
  await run(process.execPath, [...NODE_ARGS, path.join(wwwRoot, 'scripts', name), ...args], {
    cwd: wwwRoot,
  })
}

async function filesUnder(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true, recursive: true }).catch(() => [])
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) =>
      path.posix.join(path.relative(dir, entry.parentPath).split(path.sep).join('/'), entry.name),
    )
    .sort()
}

interface Comparison {
  label: string
  committed: string
  rebuilt: string
}

async function compare({ label, committed, rebuilt }: Comparison): Promise<string[]> {
  const [current, fresh] = await Promise.all([filesUnder(committed), filesUnder(rebuilt)])
  const problems: string[] = []

  for (const file of fresh) {
    if (!current.includes(file)) {
      problems.push(`${label}/${file} is missing — run \`pnpm registry:build\``)
      continue
    }
    const [a, b] = await Promise.all([
      readFile(path.join(committed, file), 'utf8'),
      readFile(path.join(rebuilt, file), 'utf8'),
    ])
    if (a !== b) problems.push(`${label}/${file} differs from a fresh build`)
  }
  for (const file of current) {
    if (!fresh.includes(file)) problems.push(`${label}/${file} is stale — nothing generates it`)
  }
  return problems
}

const scratch = await mkdtemp(path.join(tmpdir(), 'cantera-drift-'))

try {
  // Generated registry sources first: they feed the artifacts compared below.
  await script('build-examples.mts', ['--check']).catch((error) => {
    console.error(`${error.stdout ?? ''}${error.stderr ?? ''}`.trim())
    throw new Error('generated example items are stale')
  })
  await script('build-demo-registry.mts', ['--check']).catch((error) => {
    console.error(`${error.stdout ?? ''}${error.stderr ?? ''}`.trim())
    throw new Error('generated server demo registry is stale')
  })

  const shadcn = path.join(wwwRoot, 'node_modules/.bin/shadcn')
  await run(shadcn, ['build', '--output', path.join(scratch, 'r')], { cwd: wwwRoot })
  await script('build-llms.mts', ['--out-dir', scratch])
  await script('build-skill.mts', ['--out-dir', path.join(scratch, 'skills')])

  const problems = [
    ...(await compare({
      label: 'apps/www/public/r',
      committed: path.join(wwwRoot, 'public/r'),
      rebuilt: path.join(scratch, 'r'),
    })),
    ...(await compare({
      label: 'skills/cantera',
      committed: path.join(repoRoot, 'skills/cantera'),
      rebuilt: path.join(scratch, 'skills/cantera'),
    })),
  ]

  for (const file of ['llms.txt', 'llms-full.txt']) {
    const [a, b] = await Promise.all([
      readFile(path.join(wwwRoot, 'public', file), 'utf8').catch(() => null),
      readFile(path.join(scratch, file), 'utf8'),
    ])
    if (a !== b) problems.push(`apps/www/public/${file} differs from a fresh build`)
  }

  if (problems.length > 0) {
    console.error('drift: committed build output does not match its sources\n')
    for (const problem of problems) console.error(`  ${problem}`)
    console.error('')
    process.exit(1)
  }

  console.log('drift: committed registry, llms artifacts, and skill match a fresh build')
} finally {
  await rm(scratch, { recursive: true, force: true })
}

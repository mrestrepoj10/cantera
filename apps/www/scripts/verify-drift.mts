/**
 * Verifier 3 of 3: the committed build output matches the sources it comes from.
 *
 * `public/r/`, the `llms*.txt` artifacts, `skills/cantera/`, and the docs site's
 * component reference (`apps/docs/content/components/`) are all generated and
 * all committed — that is what makes the registry servable as static files, the
 * skill installable straight from the repo, and the docs provably a rendering of
 * the registry rather than a second account of it. Committed generated output
 * rots silently, so this rebuilds every artifact into a scratch directory and
 * compares byte for byte.
 *
 * Two things it proves at once: the artifacts are current (someone edited a
 * registry source and rebuilt), and the generators are deterministic (no
 * timestamps, no map ordering, no machine-dependent paths — a second run
 * produces identical bytes). CI additionally runs `git diff --exit-code` after
 * `registry:build`, which is the same guarantee from the other direction: this
 * check works on an uncommitted tree, that one proves the tree was committed.
 */

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

/** Every file under a directory, as posix paths relative to it. */
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
  // Generated registry sources first: the example items and their page wrappers
  // feed everything downstream, so stale ones would look like output drift.
  await script('build-examples.mts', ['--check']).catch((error) => {
    console.error(`${error.stdout ?? ''}${error.stderr ?? ''}`.trim())
    throw new Error('generated example items are stale')
  })

  const shadcn = path.join(wwwRoot, 'node_modules/.bin/shadcn')
  await run(shadcn, ['build', '--output', path.join(scratch, 'r')], { cwd: wwwRoot })
  await script('build-llms.mts', ['--out-dir', scratch])
  await script('build-docs.mts', ['--out-dir', path.join(scratch, 'docs')])
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
    ...(await compare({
      label: 'apps/docs/content/components',
      committed: path.join(repoRoot, 'apps/docs/content/components'),
      rebuilt: path.join(scratch, 'docs'),
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

  console.log('drift: committed registry, llms artifacts, skill, and docs match a fresh build')
} finally {
  await rm(scratch, { recursive: true, force: true })
}

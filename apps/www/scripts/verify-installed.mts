/**
 * Verifier 4 of 4: the registry lints and typechecks in consumer position.
 *
 * Everything under `apps/www/registry/` compiles in this repo through tsconfig
 * path fallbacks the consumer does not have, and is linted here by rules the
 * consumer does not run. This script lays the whole registry out in a scratch
 * project exactly where the shadcn CLI would write it, then runs the two
 * checks a fresh create-next-app runs over its own code:
 *
 *  - ESLint with `eslint-config-next` (core-web-vitals + typescript), zero
 *    warnings allowed — including the react-hooks React Compiler rules that
 *    Biome does not implement;
 *  - `tsc --noEmit` under strict mode, with only the installed file layout to
 *    resolve against — the check that catches an import that only works
 *    because of this repo's registry-first path fallbacks.
 *
 * The scratch project stands in for a consumer: this repo's harvested shadcn
 * primitives (`components/ui/`, `hooks/`, `lib/utils.ts`) play the part of
 * `shadcn init` + primitive installs, and `node_modules` is symlinked from
 * apps/www so npm dependencies resolve without a network install.
 */

import { execFile } from 'node:child_process'
import { cp, mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'

import { installedPath, type RegistryItem, readRegistry, wwwRoot } from './lib/registry-source.mts'

const run = promisify(execFile)

/** installed path -> registry source path, with conflicting sources rejected. */
function installPlan(items: RegistryItem[]): Map<string, string> {
  const plan = new Map<string, string>()
  for (const item of items) {
    for (const file of item.files ?? []) {
      const target = installedPath(file)
      const existing = plan.get(target)
      if (existing && existing !== file.path) {
        throw new Error(
          `installed: ${target} is shipped from both ${existing} and ${file.path} — one target, one source`,
        )
      }
      plan.set(target, file.path)
    }
  }
  return plan
}

const TSCONFIG = {
  compilerOptions: {
    target: 'ES2017',
    lib: ['dom', 'dom.iterable', 'esnext'],
    allowJs: true,
    skipLibCheck: true,
    strict: true,
    noEmit: true,
    esModuleInterop: true,
    module: 'esnext',
    moduleResolution: 'bundler',
    resolveJsonModule: true,
    isolatedModules: true,
    jsx: 'preserve',
    paths: { '@/*': ['./*'] },
  },
  include: ['**/*.ts', '**/*.tsx'],
  exclude: ['node_modules'],
}

const ESLINT_CONFIG = `import { defineConfig } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

export default defineConfig([...nextVitals, ...nextTs])
`

const scratch = await mkdtemp(path.join(tmpdir(), 'cantera-installed-'))

try {
  const registry = await readRegistry()
  const plan = installPlan(registry.items)

  // The consumer baseline a real project gets from shadcn init + primitive
  // installs: harvested upstream primitives, their hooks, and lib/utils.
  await cp(path.join(wwwRoot, 'components/ui'), path.join(scratch, 'components/ui'), {
    recursive: true,
  })
  await cp(path.join(wwwRoot, 'hooks'), path.join(scratch, 'hooks'), { recursive: true })
  await mkdir(path.join(scratch, 'lib'), { recursive: true })
  await cp(path.join(wwwRoot, 'lib/utils.ts'), path.join(scratch, 'lib/utils.ts'))

  // Then every registry file at the exact path the CLI writes it to.
  for (const [target, source] of plan) {
    const destination = path.join(scratch, target)
    await mkdir(path.dirname(destination), { recursive: true })
    await cp(path.join(wwwRoot, source), destination)
  }

  await symlink(path.join(wwwRoot, 'node_modules'), path.join(scratch, 'node_modules'))
  await writeFile(path.join(scratch, 'tsconfig.json'), `${JSON.stringify(TSCONFIG, null, 2)}\n`)
  await writeFile(path.join(scratch, 'eslint.config.mjs'), ESLINT_CONFIG)

  const bin = (name: string) => path.join(wwwRoot, 'node_modules/.bin', name)
  const registryTargets = [...plan.keys()].filter((target) => /\.(ts|tsx)$/.test(target))

  await run(
    bin('eslint'),
    ['--config', 'eslint.config.mjs', '--max-warnings', '0', ...registryTargets],
    { cwd: scratch },
  ).catch((error) => {
    console.error(`${error.stdout ?? ''}${error.stderr ?? ''}`.trim())
    throw new Error(
      'installed: registry files fail eslint-config-next in consumer position — fix at source, never suppress',
    )
  })

  await run(bin('tsc'), ['-p', 'tsconfig.json'], { cwd: scratch }).catch((error) => {
    console.error(`${error.stdout ?? ''}${error.stderr ?? ''}`.trim())
    throw new Error(
      'installed: registry files fail tsc --strict in consumer position — an import or type only resolves through this repo, not the installed layout',
    )
  })

  console.log(
    `installed: ${registryTargets.length} registry files lint and typecheck in consumer position`,
  )
} finally {
  await rm(scratch, { recursive: true, force: true })
}

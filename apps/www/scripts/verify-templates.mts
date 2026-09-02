// Each generated template must typecheck as the standalone app it claims to
// be: its own tsconfig, its own files, and only the packages it declares.

import { execFile } from 'node:child_process'
import { cp, mkdtemp, readdir, readFile, rm, symlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'

import { repoRoot, wwwRoot } from './lib/registry-source.mts'

const run = promisify(execFile)
const templatesDir = path.join(repoRoot, 'templates')

const names = (await readdir(templatesDir, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort()

const versions = JSON.parse(await readFile(path.join(wwwRoot, 'package.json'), 'utf8')) as {
  dependencies: Record<string, string>
  devDependencies: Record<string, string>
}
const available = new Set([
  ...Object.keys(versions.dependencies),
  ...Object.keys(versions.devDependencies),
])

const scratch = await mkdtemp(path.join(tmpdir(), 'cantera-templates-'))

try {
  for (const name of names) {
    const pkg = JSON.parse(
      await readFile(path.join(templatesDir, name, 'package.json'), 'utf8'),
    ) as { dependencies: Record<string, string>; devDependencies: Record<string, string> }
    for (const dependency of [
      ...Object.keys(pkg.dependencies),
      ...Object.keys(pkg.devDependencies),
    ]) {
      if (!available.has(dependency)) {
        throw new Error(
          `templates: ${name} declares ${dependency}, which apps/www does not install`,
        )
      }
    }

    const app = path.join(scratch, name)
    await cp(path.join(templatesDir, name), app, { recursive: true })
    await symlink(path.join(wwwRoot, 'node_modules'), path.join(app, 'node_modules'))
    await run(path.join(wwwRoot, 'node_modules/.bin/tsc'), ['-p', 'tsconfig.json'], {
      cwd: app,
    }).catch((error) => {
      console.error(`${error.stdout ?? ''}${error.stderr ?? ''}`.trim())
      throw new Error(`templates: ${name} does not typecheck as a standalone app`)
    })
  }
  console.log(`templates: ${names.length} apps typecheck standalone`)
} finally {
  await rm(scratch, { recursive: true, force: true })
}

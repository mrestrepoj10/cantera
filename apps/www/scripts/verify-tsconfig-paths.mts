import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { wwwRoot } from './lib/registry-source.mts'

const expected = {
  '@/components/ui/*': ['./registry/ui/*', './components/ui/*'],
  '@/components/examples/*': ['./registry/examples/*'],
  '@/components/*': [
    './registry/blocks/acc-auth-routes/components/*',
    './registry/blocks/acc-sign-in/components/*',
    './registry/blocks/connections-page/components/*',
    './registry/blocks/model-upload-page/components/*',
    './registry/blocks/model-viewer-page/components/*',
    './components/*',
  ],
  '@/lib/*': ['./registry/lib/*', './registry/blocks/acc-auth-routes/lib/*', './lib/*'],
  '@/*': ['./*'],
}

const tsconfig = JSON.parse(await readFile(path.join(wwwRoot, 'tsconfig.json'), 'utf8')) as {
  compilerOptions?: { paths?: Record<string, string[]> }
}

if (JSON.stringify(tsconfig.compilerOptions?.paths) !== JSON.stringify(expected)) {
  console.error(
    'tsconfig-paths: apps/www must keep registry-first aliases; shadcn add likely rewrote them',
  )
  process.exit(1)
}

console.log('tsconfig-paths: registry-first aliases are intact')

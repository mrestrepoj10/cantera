import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

// Consumer-dialect lint gate. Everything under registry/ ships verbatim into
// consumer projects, where create-next-app's default ESLint setup
// (core-web-vitals + typescript) lints it — including rules Biome does not
// implement, such as the react-hooks React Compiler family. This config lints
// the registry sources under exactly that rule set so a violation fails here
// before it can fail in a consumer's project. The showcase itself stays on
// Biome; keep this scoped to registry/.
export default defineConfig([
  globalIgnores(['**/*', '!registry', '!registry/**']),
  ...nextVitals,
  ...nextTs,
])

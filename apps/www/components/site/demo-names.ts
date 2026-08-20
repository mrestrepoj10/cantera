/**
 * The registry items that have a live demo.
 *
 * Its own axis, not derivable from the item type: every `registry:component`
 * has one, but so do `status-tokens` (a `registry:item`) and `connections-page`
 * (a `registry:block`), while `acc-sign-in` has none — a wired OAuth flow needs
 * routes and a session, so its demo is the whole `/demo` page, not a box.
 *
 * Three surfaces read this list and must agree on it: the demo registry in
 * `demos.tsx`, the `/embed/<name>` routes that frame those demos for the docs
 * site, and `scripts/build-docs.mts`, which decides whether a generated page
 * gets a preview. `demos.tsx` types its map as `Record<DemoName, ComponentType>`,
 * so adding a name here without a component — or a component without a name —
 * is a `pnpm typecheck` failure rather than a page that silently renders empty.
 *
 * Plain `.ts` with no React import on purpose: `build-docs.mts` imports it under
 * node's native TypeScript support, where a `.tsx` module would not load.
 */

export const demoNames = [
  'provider-sign-in-button',
  'sign-in-card',
  'scope-picker',
  'user-account-badge',
  'token-status',
  'connection-card',
  'status-tokens',
  'connections-page',
] as const

export type DemoName = (typeof demoNames)[number]

const demoNameSet: ReadonlySet<string> = new Set<string>(demoNames)

/** Whether an item renders a live preview — and therefore has an embed route. */
export function hasDemo(name: string): name is DemoName {
  return demoNameSet.has(name)
}

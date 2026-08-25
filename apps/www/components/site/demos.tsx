import 'server-only'

import { getDemoComponent } from '@/components/site/demos.generated'

/**
 * Docs-page entry point for the live demos. The generated server-only registry
 * resolves one lazy demo while the route is prerendered or prefetched, so the
 * browser never starts a client-side module lookup after navigation.
 */

/** Renders the demo for a registry item, or nothing for lib items. */
export function ComponentDemo({ name, viewerUrn }: { name: string; viewerUrn?: string }) {
  const Demo = getDemoComponent(name)
  if (!Demo) return null
  return name === 'aps-viewer' ? <Demo urn={viewerUrn} /> : <Demo />
}

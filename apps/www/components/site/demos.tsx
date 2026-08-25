import 'server-only'

import { getDemoComponent } from '@/components/site/demos.generated'

export function ComponentDemo({ name, viewerUrn }: { name: string; viewerUrn?: string }) {
  const Demo = getDemoComponent(name)
  if (!Demo) return null
  return name === 'aps-viewer' ? <Demo urn={viewerUrn} /> : <Demo />
}

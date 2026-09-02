import 'server-only'

import { getDemoComponent } from '@/components/site/demos.generated'

export type DemoHeadingLevel = 'h1' | 'h2' | 'h3'

export function hasDemo(name: string): boolean {
  return getDemoComponent(name) !== undefined
}

export function ComponentDemo({
  name,
  viewerUrn,
  titleAs,
}: {
  name: string
  viewerUrn?: string
  titleAs?: DemoHeadingLevel
}) {
  const Demo = getDemoComponent(name)
  if (!Demo) return null
  return <Demo urn={name === 'aps-viewer' ? viewerUrn : undefined} titleAs={titleAs} />
}

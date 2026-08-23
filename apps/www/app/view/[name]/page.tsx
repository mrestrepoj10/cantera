import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { preconnect } from 'react-dom'

import { ModelViewerPageDemo } from '@/components/site/demos/model-viewer-page-demo'
import { getRegistryItem } from '@/components/site/registry'

interface PreviewPageProps {
  params: Promise<{ name: string }>
}

export function generateStaticParams() {
  return [{ name: 'model-viewer-page' }]
}

export async function generateMetadata({ params }: PreviewPageProps): Promise<Metadata> {
  const { name } = await params
  const item = getRegistryItem(name)
  return {
    title: item ? `${item.title} preview` : 'Block preview',
    robots: { index: false, follow: false },
  }
}

async function BlockPreview({ params }: PreviewPageProps) {
  const { name } = await params
  if (name !== 'model-viewer-page') notFound()

  if (name === 'model-viewer-page') {
    if (process.env.APS_VIEWER_DEMO_URN) preconnect('https://developer.api.autodesk.com')
    return <ModelViewerPageDemo nextPath="/view/model-viewer-page" titleAs="h1" />
  }

  notFound()
}

export default function BlockPreviewPage({ params }: PreviewPageProps) {
  return (
    <Suspense
      fallback={
        <div role="status" className="min-h-svh bg-muted/30">
          <span className="sr-only">Loading preview</span>
        </div>
      }
    >
      <BlockPreview params={params} />
    </Suspense>
  )
}

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { preconnect } from 'react-dom'

import { ComponentDemo } from '@/components/site/demos'
import { getRegistryItem, previewLayoutFor, showcaseItems } from '@/components/site/registry'

interface PreviewPageProps {
  params: Promise<{ name: string }>
}

export function generateStaticParams() {
  return showcaseItems.map((item) => ({ name: item.name }))
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
  if (!showcaseItems.some((item) => item.name === name)) notFound()

  if (previewLayoutFor(name) === 'full-bleed') {
    if (process.env.APS_VIEWER_DEMO_URN) preconnect('https://developer.api.autodesk.com')
    return <ComponentDemo name={name} titleAs="h1" />
  }

  return (
    <main className="flex min-h-svh items-start justify-center p-6 sm:p-10">
      <div className="flex w-full max-w-5xl justify-center">
        <ComponentDemo name={name} titleAs="h1" />
      </div>
    </main>
  )
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

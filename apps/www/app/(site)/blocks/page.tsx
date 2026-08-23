import type { Metadata } from 'next'
import Link from 'next/link'

import { BlockShowcase } from '@/components/site/block-showcase'
import { OpenInV0 } from '@/components/site/open-in-v0'
import { getRegistryItem, installCommandFor } from '@/components/site/registry'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Blocks',
  description:
    'Complete AEC application surfaces for authentication, provider connections, project browsing, and Autodesk model viewing.',
}

const modelViewerBlock = getRegistryItem('model-viewer-page')

export default function BlocksPage() {
  return (
    <div className="mx-auto w-full max-w-[90rem] px-4 pb-24 sm:px-6">
      <section className="mx-auto flex max-w-3xl flex-col items-center py-16 text-center sm:py-24">
        <Badge variant="secondary" className="h-6 px-2.5">
          Cantera blocks
        </Badge>
        <h1 className="mt-4 text-balance font-semibold text-4xl tracking-tight sm:text-5xl">
          Building blocks for AEC apps
        </h1>
        <p className="mt-4 max-w-2xl text-balance text-muted-foreground sm:text-lg">
          Complete Autodesk workflows—copy them into your app, connect your credentials, and own
          every line of the result.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Button
            render={<a href="#blocks" />}
            nativeButton={false}
            role="link"
            size="lg"
            className="min-h-11 px-4"
          >
            Browse blocks
          </Button>
          <Button
            render={<Link href="/components" />}
            nativeButton={false}
            role="link"
            variant="ghost"
            size="lg"
            className="min-h-11 px-4"
          >
            View components
          </Button>
        </div>
      </section>

      <div id="blocks" className="border-border border-t pt-12">
        {modelViewerBlock && (
          <BlockShowcase
            name={modelViewerBlock.name}
            title={modelViewerBlock.title}
            description={modelViewerBlock.description}
            installCommand={installCommandFor(modelViewerBlock.name)}
            previewHeight={720}
            openInV0={<OpenInV0 name={modelViewerBlock.name} title={modelViewerBlock.title} />}
          />
        )}
      </div>
    </div>
  )
}

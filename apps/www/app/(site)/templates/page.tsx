import type { Metadata } from 'next'
import Link from 'next/link'

import { BlocksCatalog } from '@/components/site/blocks-catalog'
import { templateItems } from '@/components/site/registry'
import { showcaseEntryFor } from '@/components/site/showcase-entry'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Templates',
  description:
    'Ready-to-deploy Autodesk pages: sign-in, provider connections, the model viewer, and model upload, each with its routes and environment keys.',
}

export default function TemplatesPage() {
  return (
    <div className="mx-auto w-full max-w-[90rem] px-4 pb-24 sm:px-6">
      <section className="mx-auto flex max-w-3xl flex-col items-center py-16 text-center sm:py-24">
        <Badge variant="secondary" className="h-6 px-2.5">
          Cantera templates
        </Badge>
        <h1 className="mt-4 text-balance font-semibold text-4xl tracking-tight sm:text-5xl">
          Ready-to-deploy Autodesk pages
        </h1>
        <p className="mt-4 max-w-2xl text-balance text-muted-foreground sm:text-lg">
          One command installs the page, its API routes, and its environment keys on aec-auth. Fill
          the keys with your APS app credentials, run the app, open the URL. The previews below run
          against the showcase emulator; an installed template talks to real APS.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Button
            render={<a href="#catalog" />}
            nativeButton={false}
            role="link"
            size="lg"
            className="min-h-11 px-4"
          >
            Browse templates
          </Button>
          <Button
            render={<Link href="/blocks" />}
            nativeButton={false}
            role="link"
            variant="ghost"
            size="lg"
            className="min-h-11 px-4"
          >
            View blocks
          </Button>
        </div>
      </section>

      <div id="catalog" className="border-border border-t pt-12">
        <BlocksCatalog entries={templateItems.map(showcaseEntryFor)} />
      </div>
    </div>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'

import { ComponentGrid } from '@/components/site/component-grid'

export const metadata: Metadata = {
  title: 'Components',
  description: 'Cantera components, provider adapters, shared types, and design tokens.',
}

export default function ComponentsPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-12 sm:py-16">
      <h1 className="text-balance font-semibold text-3xl tracking-tight">Components</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground text-sm">
        Data-agnostic UI, shared types, provider adapters, and design tokens. Looking for complete
        workflows? Browse the{' '}
        <Link href="/blocks" className="text-foreground underline underline-offset-4">
          blocks
        </Link>
        .
      </p>
      <div className="mt-10">
        <ComponentGrid />
      </div>
    </div>
  )
}

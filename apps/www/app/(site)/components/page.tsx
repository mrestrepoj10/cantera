import type { Metadata } from 'next'

import { ComponentGrid } from '@/components/site/component-grid'

export const metadata: Metadata = {
  title: 'Components',
  description: 'Every cantera registry item: OAuth components and the lib items they build on.',
}

export default function ComponentsPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-12 sm:py-16">
      <h1 className="text-balance font-semibold text-3xl tracking-tight">Components</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground text-sm">
        Every registry item, grouped by what it is — wired blocks, the data-agnostic components they
        are built from, and the types, presets, and tokens underneath. Install any of them with the
        shadcn CLI.
      </p>
      <div className="mt-10">
        <ComponentGrid />
      </div>
    </div>
  )
}

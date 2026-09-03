'use client'

import { useState } from 'react'

import { BlockShowcase, type BlockShowcaseProps } from '@/components/site/block-showcase'
import { cn } from '@/lib/utils'

export type ShowcaseEntry = Omit<BlockShowcaseProps, 'headingLevel'> & { categories: string[] }

function CategoryFilter({
  categories,
  value,
  onChange,
}: {
  categories: string[]
  value: string | undefined
  onChange: (value: string | undefined) => void
}) {
  const buttonClass = cn(
    'focus-ring flex min-h-9 items-center rounded-md border border-border px-2.5',
    'text-xs transition-colors hover:bg-muted',
    'aria-pressed:border-primary aria-pressed:bg-primary',
    'aria-pressed:text-primary-foreground aria-pressed:hover:bg-primary',
  )
  return (
    <fieldset className="flex flex-wrap gap-2">
      <legend className="sr-only">Filter by category</legend>
      <button
        type="button"
        aria-pressed={value === undefined}
        onClick={() => onChange(undefined)}
        className={buttonClass}
      >
        All
      </button>
      {categories.map((category) => (
        <button
          key={category}
          type="button"
          aria-pressed={value === category}
          onClick={() => onChange(category)}
          className={buttonClass}
        >
          {category}
        </button>
      ))}
    </fieldset>
  )
}

function BlocksCatalog({ entries }: { entries: ShowcaseEntry[] }) {
  const [category, setCategory] = useState<string>()
  const categories = [...new Set(entries.flatMap((entry) => entry.categories))].sort()
  const visible = category
    ? entries.filter((entry) => entry.categories.includes(category))
    : entries

  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-col gap-3">
        <CategoryFilter categories={categories} value={category} onChange={setCategory} />
        <p role="status" className="text-muted-foreground text-xs">
          Showing {visible.length} of {entries.length}
        </p>
      </div>
      {visible.map(({ categories: _categories, ...entry }) => (
        <BlockShowcase key={entry.name} {...entry} />
      ))}
    </div>
  )
}

export { BlocksCatalog }

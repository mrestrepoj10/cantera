'use client'

import { useState } from 'react'

import { BlockShowcase, type BlockShowcaseProps } from '@/components/site/block-showcase'
import { cn } from '@/lib/utils'

export interface ShowcaseGroup {
  id: string
  title: string
  description: string
  entries: (Omit<BlockShowcaseProps, 'headingLevel'> & { categories: string[] })[]
}

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

function BlocksCatalog({ groups }: { groups: ShowcaseGroup[] }) {
  const [category, setCategory] = useState<string>()
  const entries = groups.flatMap((group) => group.entries)
  const categories = [...new Set(entries.flatMap((entry) => entry.categories))].sort()
  const matches = (entry: ShowcaseGroup['entries'][number]) =>
    !category || entry.categories.includes(category)
  const shown = entries.filter(matches).length

  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-col gap-3">
        <CategoryFilter categories={categories} value={category} onChange={setCategory} />
        <p role="status" className="text-muted-foreground text-xs">
          Showing {shown} of {entries.length}
        </p>
      </div>

      {groups.map((group) => {
        const members = group.entries.filter(matches)
        if (members.length === 0) return null
        return (
          <section
            key={group.id}
            id={group.id}
            aria-labelledby={`${group.id}-heading`}
            className="flex flex-col gap-10"
          >
            <div className="max-w-2xl">
              <h2
                id={`${group.id}-heading`}
                className="scroll-mt-28 font-semibold text-2xl tracking-tight"
              >
                {group.title}
              </h2>
              <p className="mt-1 text-muted-foreground text-sm">{group.description}</p>
            </div>
            {members.map(({ categories: _categories, ...entry }) => (
              <BlockShowcase key={entry.name} {...entry} headingLevel="h3" />
            ))}
          </section>
        )
      })}
    </div>
  )
}

export { BlocksCatalog }

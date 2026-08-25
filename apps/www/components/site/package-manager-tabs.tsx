'use client'

import type * as React from 'react'
import { createContext, useContext, useId, useRef, useState } from 'react'

import { InstallCommand } from '@/components/site/install-command'
import { cn } from '@/lib/utils'

const packageManagers = ['npm', 'pnpm', 'bun'] as const

type PackageManager = (typeof packageManagers)[number]

interface PackageManagerState {
  manager: PackageManager
  setManager: (manager: PackageManager) => void
}

const PackageManagerContext = createContext<PackageManagerState | null>(null)

function PackageManagerProvider({ children }: { children: React.ReactNode }) {
  const [manager, setManager] = useState<PackageManager>('npm')
  return (
    <PackageManagerContext.Provider value={{ manager, setManager }}>
      {children}
    </PackageManagerContext.Provider>
  )
}

interface PackageManagerTabsProps {
  label: string
  commands: Record<PackageManager, string>
  className?: string
}

// Full APG tabs with automatic activation — the panel is one copyable line, so
// selecting on focus saves a keypress. No tabindex on the panel: it always
// contains a focusable copy button.
function PackageManagerTabs({ label, commands, className }: PackageManagerTabsProps) {
  const context = useContext(PackageManagerContext)
  const [localManager, setLocalManager] = useState<PackageManager>('npm')
  const manager = context?.manager ?? localManager
  const setManager = context?.setManager ?? setLocalManager

  const baseId = useId()
  const tabId = (value: PackageManager) => `${baseId}-${value}`
  const tabRefs = useRef(new Map<PackageManager, HTMLButtonElement | null>())

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const index = packageManagers.indexOf(manager)
    let nextIndex = index
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % packageManagers.length
    else if (event.key === 'ArrowLeft')
      nextIndex = (index - 1 + packageManagers.length) % packageManagers.length
    else if (event.key === 'Home') nextIndex = 0
    else if (event.key === 'End') nextIndex = packageManagers.length - 1
    else return
    event.preventDefault()
    const next = packageManagers[nextIndex]
    setManager(next)
    tabRefs.current.get(next)?.focus()
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div
        role="tablist"
        aria-label={label}
        onKeyDown={handleKeyDown}
        className="flex w-fit flex-wrap gap-1"
      >
        {packageManagers.map((value) => {
          const selected = value === manager
          return (
            <button
              key={value}
              type="button"
              role="tab"
              id={tabId(value)}
              aria-selected={selected}
              aria-controls={`${baseId}-panel`}
              tabIndex={selected ? 0 : -1}
              ref={(node) => {
                tabRefs.current.set(value, node)
              }}
              onClick={() => setManager(value)}
              className={cn(
                'focus-ring flex min-h-9 items-center rounded-md border border-border px-3',
                'font-mono text-muted-foreground text-xs transition-colors hover:bg-muted',
                'aria-selected:border-primary aria-selected:bg-primary',
                'aria-selected:text-primary-foreground aria-selected:hover:bg-primary',
              )}
            >
              {value}
            </button>
          )
        })}
      </div>
      <div role="tabpanel" id={`${baseId}-panel`} aria-labelledby={tabId(manager)}>
        <InstallCommand command={commands[manager]} />
      </div>
    </div>
  )
}

export { type PackageManager, PackageManagerProvider, PackageManagerTabs }

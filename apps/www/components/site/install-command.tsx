'use client'

import { CheckIcon, CopyIcon } from 'lucide-react'
import { useState } from 'react'

import { cn } from '@/lib/utils'

interface InstallCommandProps {
  command: string
  className?: string
}

/** A copyable one-line install command with clipboard feedback. */
function InstallCommand({ command, className }: InstallCommandProps) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(command)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      // Clipboard unavailable — leave the command selectable.
    }
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg border border-border bg-muted/40 py-2 pr-2 pl-4',
        className,
      )}
    >
      <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap font-mono text-code">
        {command}
      </code>
      <button
        type="button"
        onClick={() => void copy()}
        aria-label={copied ? 'Copied' : 'Copy command'}
        className="focus-ring flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        {/* Both icons stay mounted in one grid cell and crossfade — the
            confirmation reads as the same control changing, not as a swap. */}
        <span aria-hidden className="grid size-4 place-items-center">
          <CopyIcon
            className={cn(
              'col-start-1 row-start-1 size-4 transition-opacity duration-150 ease-out',
              copied ? 'opacity-0' : 'opacity-100',
            )}
          />
          <CheckIcon
            className={cn(
              'col-start-1 row-start-1 size-4 transition-opacity duration-150 ease-out',
              copied ? 'opacity-100' : 'opacity-0',
            )}
          />
        </span>
      </button>
      {/* The icon change is invisible to a screen reader, so announce it. The
          live region is always in the DOM; only its text changes. */}
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? `Copied ${command} to the clipboard` : ''}
      </span>
    </div>
  )
}

export { InstallCommand }

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
      <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap font-mono text-[13px]">
        {command}
      </code>
      <button
        type="button"
        onClick={() => void copy()}
        aria-label={copied ? 'Copied' : 'Copy command'}
        className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {copied ? (
          <CheckIcon aria-hidden className="size-4" />
        ) : (
          <CopyIcon aria-hidden className="size-4" />
        )}
      </button>
    </div>
  )
}

export { InstallCommand }

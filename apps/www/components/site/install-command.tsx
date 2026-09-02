'use client'

import { CopyIcon } from 'lucide-react'

import { CopyGlyph, CopyStatus, useCopyToClipboard } from '@/components/site/use-copy'
import { cn } from '@/lib/utils'

interface InstallCommandProps {
  command: string
  className?: string
}

function InstallCommand({ command, className }: InstallCommandProps) {
  const { copied, copy } = useCopyToClipboard()

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
        onClick={() => void copy(command)}
        aria-label={copied ? 'Copied' : 'Copy command'}
        className="focus-ring flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <CopyGlyph copied={copied} icon={CopyIcon} />
      </button>
      <CopyStatus copied={copied} message={`Copied ${command} to the clipboard`} />
    </div>
  )
}

export { InstallCommand }

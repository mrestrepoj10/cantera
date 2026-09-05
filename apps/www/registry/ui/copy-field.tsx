'use client'

import { CheckIcon, CopyIcon } from 'lucide-react'
import type * as React from 'react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface CopyFieldProps extends Omit<React.ComponentProps<'div'>, 'children'> {
  /** The value someone has to paste into another system. */
  value: string
  /** Names the value for the copy button's accessible name: "Copy client ID". */
  label: string
  /** How long the confirmation shows, in milliseconds. */
  confirmMs?: number
}

/** The value stays fully visible and selectable: the Clipboard API is
 * unavailable on non-secure origins, so the button is the convenience, not
 * the only way out. */
function CopyField({ value, label, confirmMs = 2000, className, ...props }: CopyFieldProps) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), confirmMs)
    return () => window.clearTimeout(timer)
  }, [copied, confirmMs])

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div
      data-slot="copy-field"
      className={cn(
        'flex items-center gap-3 rounded-md border border-border bg-muted/40 py-1.5 pr-1.5 pl-3',
        className,
      )}
      {...props}
    >
      <code className="min-w-0 flex-1 select-all break-all font-mono text-xs">{value}</code>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={copy}
        aria-label={`Copy ${label}`}
        // The pseudo-element extends the hit area to the 44px floor.
        className="relative shrink-0 after:absolute after:-inset-y-2 after:inset-x-0"
      >
        {copied ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
        <span aria-live="polite">{copied ? 'Copied' : 'Copy'}</span>
      </Button>
    </div>
  )
}

export { CopyField, type CopyFieldProps }

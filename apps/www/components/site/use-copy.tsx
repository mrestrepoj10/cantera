'use client'

import { CheckIcon, type LucideIcon } from 'lucide-react'
import { useState } from 'react'

import { cn } from '@/lib/utils'

const COPIED_FOR_MS = 1600

export function useCopyToClipboard() {
  const [copied, setCopied] = useState(false)

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), COPIED_FOR_MS)
    } catch {
      // Clipboard unavailable — the text stays visible and selectable on the page.
    }
  }

  return { copied, copy }
}

interface CopyGlyphProps {
  copied: boolean
  icon: LucideIcon
  className?: string
}

/** The idle icon crossfading into a check, sized by the parent. */
export function CopyGlyph({ copied, icon: Icon, className }: CopyGlyphProps) {
  return (
    <span aria-hidden className={cn('grid size-4 place-items-center', className)}>
      <Icon
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
  )
}

/** Always mounted; only its text changes, so the announcement is one live region. */
export function CopyStatus({ copied, message }: { copied: boolean; message: string }) {
  return (
    <span role="status" aria-live="polite" className="sr-only">
      {copied ? message : ''}
    </span>
  )
}

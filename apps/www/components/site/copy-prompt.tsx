'use client'

import { CheckIcon, SparklesIcon } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface CopyPromptProps {
  prompt: string
  title: string
  className?: string
}

function CopyPrompt({ prompt, title, className }: CopyPromptProps) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(prompt)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      // Clipboard unavailable — the docs page still carries the same steps.
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="lg"
        onClick={() => void copy()}
        aria-label={`Copy an agent prompt that installs ${title}`}
        className={cn('min-h-11 shrink-0 gap-2 px-4', className)}
      >
        Copy prompt
        <span aria-hidden className="grid size-4 place-items-center text-muted-foreground">
          <SparklesIcon
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
      </Button>
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? `Copied the install prompt for ${title}` : ''}
      </span>
    </>
  )
}

export { CopyPrompt }

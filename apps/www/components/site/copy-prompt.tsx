'use client'

import { SparklesIcon } from 'lucide-react'

import { CopyGlyph, CopyStatus, useCopyToClipboard } from '@/components/site/use-copy'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface CopyPromptProps {
  prompt: string
  title: string
  className?: string
}

function CopyPrompt({ prompt, title, className }: CopyPromptProps) {
  const { copied, copy } = useCopyToClipboard()

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="lg"
        onClick={() => void copy(prompt)}
        aria-label={`Copy an agent prompt that installs ${title}`}
        className={cn('min-h-11 shrink-0 gap-2 px-4', className)}
      >
        Copy prompt
        <CopyGlyph copied={copied} icon={SparklesIcon} className="text-muted-foreground" />
      </Button>
      <CopyStatus copied={copied} message={`Copied the install prompt for ${title}`} />
    </>
  )
}

export { CopyPrompt }

'use client'

import { ArrowUpRightIcon, CheckIcon, ChevronDownIcon, CopyIcon, FileTextIcon } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PageHandoffProps {
  /** The item's title, so every control here gets a unique accessible name. */
  title: string
  /** The page as markdown — the exact bytes the `.md` URL serves. */
  markdown: string
  /** Same-origin path to the markdown, so the link works on any deployment. */
  markdownPath: string
  /** Absolute markdown URL, for the prompts a model has to be able to fetch. */
  markdownUrl: string
}

/**
 * Hands this docs page to whatever the reader is actually working in: the
 * clipboard, a raw markdown URL, or a new chat that starts by reading it.
 *
 * A disclosure, not a menu. The panel holds three links, so `aria-expanded` on
 * a real button plus a region it controls is the whole contract — Tab walks the
 * links in DOM order, and nothing is focusable while the panel is display:none.
 * `role="menu"` would owe a roving tabindex, typeahead, and arrow-key handling
 * that buys a link list nothing. `<details>` was the other candidate and lost on
 * measurement: Chromium exposes `<summary>` with no role and no accessible
 * name, so the trigger would have announced as nothing.
 *
 * Escape closes and returns focus to the trigger; a pointer press outside
 * closes. Both are listeners rather than a focus trap, because a disclosure
 * that traps focus is a dialog wearing the wrong clothes.
 */
function PageHandoff({ title, markdown, markdownPath, markdownUrl }: PageHandoffProps) {
  const [copied, setCopied] = useState(false)
  const [open, setOpen] = useState(false)
  const groupRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelId = useId()

  async function copy() {
    try {
      await navigator.clipboard.writeText(markdown)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      // Clipboard unavailable — the markdown is still one link away.
    }
  }

  useEffect(() => {
    if (!open) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      setOpen(false)
      triggerRef.current?.focus()
    }
    function onPointerDown(event: PointerEvent) {
      if (!groupRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [open])

  const prompt = `Read ${markdownUrl} — the reference for ${title} from the cantera shadcn registry — and help me use it in my project.`
  const links = [
    {
      href: markdownPath,
      label: 'View as Markdown',
      accessibleName: `View ${title} as Markdown`,
      external: false,
    },
    {
      href: `https://chatgpt.com/?q=${encodeURIComponent(prompt)}`,
      label: 'Open in ChatGPT',
      accessibleName: `Open ${title} in ChatGPT`,
      external: true,
    },
    {
      href: `https://claude.ai/new?q=${encodeURIComponent(prompt)}`,
      label: 'Open in Claude',
      accessibleName: `Open ${title} in Claude`,
      external: true,
    },
  ]

  return (
    <div ref={groupRef} className="relative flex shrink-0 items-stretch self-start">
      <Button
        variant="outline"
        size="lg"
        onClick={() => void copy()}
        aria-label={`Copy ${title} page as Markdown`}
        className="min-h-11 gap-2 rounded-r-none px-4"
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
        Copy page
      </Button>

      <Button
        ref={triggerRef}
        variant="outline"
        size="lg"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`More ways to open ${title}`}
        className="-ml-px min-h-11 rounded-l-none px-2.5"
      >
        <ChevronDownIcon
          aria-hidden
          className={cn(
            'size-4 text-muted-foreground transition-transform duration-150 ease-out',
            open && 'rotate-180',
          )}
        />
      </Button>

      <div
        id={panelId}
        className={cn(
          // Anchored to whichever edge the group itself sits on: the header
          // stacks on a phone, so a right-anchored panel would hang off-screen.
          'absolute top-full left-0 z-30 mt-2 w-60 flex-col sm:right-0 sm:left-auto',
          'rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md',
          open ? 'flex' : 'hidden',
        )}
      >
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            aria-label={link.accessibleName}
            {...(link.external ? { target: '_blank', rel: 'noreferrer' } : {})}
            className="focus-ring flex min-h-11 items-center gap-2 rounded-md px-3 text-sm transition-colors hover:bg-muted"
          >
            {link.external ? (
              <ArrowUpRightIcon aria-hidden className="size-4 text-muted-foreground" />
            ) : (
              <FileTextIcon aria-hidden className="size-4 text-muted-foreground" />
            )}
            {link.label}
          </a>
        ))}
      </div>

      {/* The icon change is invisible to a screen reader, so announce it. The
          live region is always in the DOM; only its text changes. */}
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? `Copied the ${title} page as Markdown` : ''}
      </span>
    </div>
  )
}

export { PageHandoff }

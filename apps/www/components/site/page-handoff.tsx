'use client'

import { ArrowUpRightIcon, CheckIcon, ChevronDownIcon, CopyIcon, FileTextIcon } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PageHandoffProps {
  title: string
  markdownPath: string
  markdownUrl: string
}

// A disclosure, not a menu: `role="menu"` owes roving tabindex, typeahead, and
// arrow keys that a three-link list does not need — and `<summary>` announces
// with no role and no accessible name in Chromium, so `<details>` lost too.
function PageHandoff({ title, markdownPath, markdownUrl }: PageHandoffProps) {
  const [copied, setCopied] = useState(false)
  const [open, setOpen] = useState(false)
  const groupRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelId = useId()

  async function copy() {
    try {
      // Fetched on demand: embedding the bytes would ship the document twice.
      const text = fetch(markdownPath).then((response) => {
        if (!response.ok) throw new Error(`markdown fetch failed: ${response.status}`)
        return response.text()
      })
      if (typeof ClipboardItem !== 'undefined') {
        // A promise-valued ClipboardItem keeps the write inside the user
        // gesture — Safari rejects a writeText issued after an await.
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/plain': text.then((markdown) => new Blob([markdown], { type: 'text/plain' })),
          }),
        ])
      } else {
        await navigator.clipboard.writeText(await text)
      }
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      // Clipboard or fetch unavailable — the markdown is still one link away.
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
          // Anchored to the group's own edge: the header stacks on a phone, where
          // a right-anchored panel would hang off-screen.
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

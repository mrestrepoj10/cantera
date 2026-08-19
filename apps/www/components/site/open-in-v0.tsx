import { ArrowUpRightIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { v0Url } from '@/lib/site'
import { cn } from '@/lib/utils'

interface OpenInV0Props {
  /** Registry item name — v0 fetches `/r/<name>.json` from the resolved origin. */
  name: string
  /** The item's title, used to give the link a unique accessible name. */
  title: string
  className?: string
}

/**
 * Hands a registry item to v0, which imports it into a new chat.
 *
 * Server-rendered on purpose: the href is built from the site origin, and the
 * Vercel production-domain env var only exists on the server (see lib/site).
 * Built on the Button primitive so it inherits the house press idiom, hover,
 * and the `focus-visible:border-ring` + full-alpha ring focus pattern.
 */
function OpenInV0({ name, title, className }: OpenInV0Props) {
  return (
    <Button
      render={<a href={v0Url(name)} target="_blank" rel="noreferrer" />}
      nativeButton={false}
      role="link"
      variant="outline"
      size="lg"
      // Named for the item, so a page read out link-by-link does not repeat
      // "Open in v0" with nothing to tell the links apart.
      aria-label={`Open ${title} in v0`}
      className={cn('min-h-11 shrink-0 gap-2 px-4', className)}
    >
      Open in v0
      <ArrowUpRightIcon aria-hidden className="size-4 text-muted-foreground" />
    </Button>
  )
}

export { OpenInV0 }

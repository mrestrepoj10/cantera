import { ArrowUpRightIcon } from 'lucide-react'

import { getExampleItem } from '@/components/site/registry'
import { Button } from '@/components/ui/button'
import { v0Url } from '@/lib/site'
import { cn } from '@/lib/utils'

interface OpenInV0Props {
  name: string
  title: string
  className?: string
}

// Server-rendered on purpose: the href needs the production-domain env var
// that only exists on the server (see lib/site).
function OpenInV0({ name, title, className }: OpenInV0Props) {
  const target = getExampleItem(name)?.name ?? name
  return (
    <Button
      render={<a href={v0Url(target)} target="_blank" rel="noreferrer" />}
      nativeButton={false}
      role="link"
      variant="outline"
      size="lg"
      // Named per item, so a page read link-by-link tells them apart.
      aria-label={`Open ${title} in v0`}
      className={cn('min-h-11 shrink-0 gap-2 px-4', className)}
    >
      Open in v0
      <ArrowUpRightIcon aria-hidden className="size-4 text-muted-foreground" />
    </Button>
  )
}

export { OpenInV0 }

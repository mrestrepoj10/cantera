import { ArrowUpRightIcon, TriangleIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'

interface DeployButtonProps {
  href: string
  sourceHref: string
  title: string
}

function DeployButton({ href, sourceHref, title }: DeployButtonProps) {
  return (
    <span className="flex shrink-0 items-center gap-2">
      <Button
        render={<a href={href} target="_blank" rel="noreferrer" />}
        nativeButton={false}
        role="link"
        size="lg"
        aria-label={`Deploy ${title} to Vercel`}
        className="min-h-11 gap-2 px-4"
      >
        <TriangleIcon aria-hidden className="size-3.5 fill-current" />
        Deploy to Vercel
      </Button>
      <a
        href={sourceHref}
        target="_blank"
        rel="noreferrer"
        aria-label={`View the ${title} template source on GitHub`}
        className="focus-ring inline-flex min-h-11 items-center gap-1 rounded-md px-2 text-muted-foreground text-sm underline-offset-4 hover:text-foreground hover:underline"
      >
        Source
        <ArrowUpRightIcon aria-hidden className="size-3.5" />
      </a>
    </span>
  )
}

export { DeployButton }

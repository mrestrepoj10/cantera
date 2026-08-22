import type { Metadata } from 'next'
import Link from 'next/link'

import { AccConnections } from '@/registry/blocks/connections-page/page'

export const metadata: Metadata = {
  title: 'Connections',
  description:
    'The connections-page block, wired to the embedded APS emulator — connect, reconnect, and revoke a real grant.',
}

export default function ConnectionsShowcasePage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-16">
      <AccConnections nextPath="/connections" />
      <p className="max-w-prose text-muted-foreground text-xs">
        This is the <code className="font-mono">connections-page</code> block on the same aec-auth
        wiring the{' '}
        <Link href="/demo" className="focus-ring rounded-sm underline underline-offset-4">
          sign-in demo
        </Link>{' '}
        uses, pointed at the embedded APS emulator. Autodesk is the wired provider here; the block
        renders any number of them, which the{' '}
        <Link
          href="/components/connections-page"
          className="focus-ring rounded-sm underline underline-offset-4"
        >
          docs page
        </Link>{' '}
        shows across all four states.
      </p>
    </div>
  )
}

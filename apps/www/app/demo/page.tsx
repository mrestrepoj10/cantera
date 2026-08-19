import type { Metadata } from 'next'

import { AccSignIn } from '@/registry/blocks/acc-sign-in/page'

export const metadata: Metadata = {
  title: 'Live demo',
  description:
    'The acc-sign-in block running against an embedded APS OAuth emulator — no Autodesk account needed.',
}

// The OAuth flow reads request cookies and headers on every visit.
export const dynamic = 'force-dynamic'

export default function DemoPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center gap-8 px-6 py-16">
      <div className="max-w-xl text-center">
        <h1 className="text-balance font-semibold text-3xl tracking-tight">Live demo</h1>
        <p className="mt-3 text-muted-foreground text-sm">
          This is the <code className="font-mono">acc-sign-in</code> block, exactly as installed by{' '}
          <code className="font-mono">npx shadcn add @cantera/acc-sign-in</code> — wired to
          aec-auth&apos;s vault and pointed at a stateful APS OAuth emulator embedded in this site.
          Click through the real flow: consent page, code exchange, single-use refresh rotation. No
          Autodesk account, no credentials.
        </p>
      </div>
      <AccSignIn nextPath="/demo" />
      <p className="max-w-xl text-center text-muted-foreground text-xs">
        The emulator stores state in memory, so connections reset when the server recycles — if a
        connection shows as expired, reconnect and the flow starts over. Point the same block at
        real APS by setting <code className="font-mono">APS_CLIENT_ID</code>,{' '}
        <code className="font-mono">APS_CLIENT_SECRET</code>, and removing{' '}
        <code className="font-mono">APS_AUTH_BASE_URL</code>.
      </p>
    </main>
  )
}

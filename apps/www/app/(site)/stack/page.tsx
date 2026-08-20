import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'The AEC Frontend Stack',
  description:
    'How cantera (UI registry), aec-auth (token layer), and the embedded APS emulator compose into a construction frontend you can run without credentials.',
}

/** Inline identifier, the site's code type role. */
function C({ children }: { children: React.ReactNode }) {
  return <code className="font-mono text-code">{children}</code>
}

function Section({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="flex scroll-mt-20 flex-col gap-4 border-border border-t pt-10">
      <h2 className="font-semibold text-xl tracking-tight">{title}</h2>
      {children}
    </section>
  )
}

/** One labelled box in the diagram. `kind`, not `role` — that name is taken. */
function Box({ label, kind, detail }: { label: string; kind: string; detail: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="font-mono text-code">{label}</span>
        <span className="text-muted-foreground text-xs uppercase tracking-wide">{kind}</span>
      </div>
      <p className="text-muted-foreground text-sm">{detail}</p>
    </div>
  )
}

/**
 * The connector between two boxes: a rule and the edge's name. The rule is
 * decorative — the label beside it is what carries the relationship.
 */
function Edge({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 py-2 pl-4">
      <span aria-hidden className="h-6 w-px bg-border" />
      <span className="text-muted-foreground text-xs">{label}</span>
    </div>
  )
}

/**
 * The stack, drawn in plain boxes rather than an image: every label is real
 * text, so it reflows at 375px, inherits the theme tokens in both appearances,
 * and is readable by a screen reader without an alt string standing in for it.
 * The caption carries the relationships the layout encodes visually.
 */
function StackDiagram() {
  return (
    <figure className="flex flex-col gap-3">
      <div className="flex flex-col rounded-lg border border-border border-dashed p-4">
        <p className="pb-3 font-medium text-sm">Your Next.js app</p>
        <Box
          label="cantera"
          kind="ui registry"
          detail="Sign-in card, scope picker, connection cards, and the wired pages. Installed as source with the shadcn CLI — typed props in, callbacks out, no fetching."
        />
        <Edge label="the block's /api/auth/* route handlers" />
        <Box
          label="aec-auth"
          kind="npm package"
          detail="Everything token-shaped: consent redirect, code exchange, single-use refresh rotation, vault custody, signed session."
        />
      </div>
      <Edge label="OAuth over HTTPS, to one of:" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Box
          label="APS / ACC"
          kind="production"
          detail="Autodesk Platform Services with your own client id and secret."
        />
        <Box
          label="@emulators/aps"
          kind="dev and demos"
          detail="A stateful OAuth sandbox embedded in this site at /emulate/aps. Same origin, seeded users, zero credentials."
        />
      </div>
      <figcaption className="text-muted-foreground text-sm">
        cantera renders inside your app and calls the block's route handlers; those handlers run on
        aec-auth, which holds the tokens and talks OAuth to Autodesk. The last hop is a swap:{' '}
        <C>APS_AUTH_BASE_URL</C> points either at real APS or at the embedded emulator, and nothing
        above it changes.
      </figcaption>
    </figure>
  )
}

const pieces = [
  {
    name: 'cantera',
    role: 'The UI. A shadcn registry, not an npm package.',
    detail:
      'Components and blocks copied into your project by the CLI, rendering on your own primitives and theme. Data-agnostic: it renders what you pass it.',
    href: 'https://github.com/mrestrepoj10/cantera',
  },
  {
    name: 'aec-auth',
    role: 'The tokens. On npm, versioned.',
    detail:
      'APS and Procore OAuth flows, vault-managed refresh custody with single-use rotation, and the session plumbing. A real dependency, because token handling is the part you do not want copied and forked.',
    href: 'https://github.com/mrestrepoj10/aec-auth',
  },
  {
    name: 'emulate',
    role: 'The sandbox. A stateful APS emulator.',
    detail:
      'Runs the actual flow — consent page, code exchange, refresh rotation, scope validation — with no Autodesk account. This site embeds it, so every demo here is the real thing.',
    href: 'https://github.com/mrestrepoj10/emulate',
  },
]

const envVars = [
  {
    name: 'APS_CLIENT_ID / APS_CLIENT_SECRET',
    meaning: 'Your APS app credentials.',
  },
  {
    name: 'APS_AUTH_BASE_URL',
    meaning:
      'Optional auth origin override — absolute, or relative like /emulate/aps for an embedded emulator. Unset means real APS.',
  },
  {
    name: 'SESSION_SECRET',
    meaning: 'HMAC key for the session cookie. Required in production — the block fails closed.',
  },
  {
    name: 'ACC_AUTH_DEMO',
    meaning:
      'Emulator-backed demos only: allows the insecure fallback session secret. Never set it anywhere that guards real accounts.',
  },
]

export default function StackPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 py-12 sm:py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-balance font-semibold text-3xl tracking-tight">
          The AEC frontend stack
        </h1>
        <p className="text-muted-foreground">
          Three open projects with one seam between each pair: aec-auth owns everything
          token-shaped, cantera renders, and the APS emulator makes the whole flow runnable before
          anyone has approved an Autodesk app. Each works alone; together they are the five-minute
          ACC path.
        </p>
      </header>

      <StackDiagram />

      <Section id="pieces" title="Three pieces, three jobs">
        <div className="flex flex-col gap-3">
          {pieces.map((piece) => (
            <a
              key={piece.name}
              href={piece.href}
              target="_blank"
              rel="noreferrer"
              className="focus-ring flex flex-col gap-1.5 rounded-lg border border-border p-5 transition-colors hover:border-foreground/25"
            >
              <span className="flex flex-wrap items-baseline gap-x-2">
                <span className="font-mono text-code">{piece.name}</span>
                <span className="text-muted-foreground text-xs">{piece.role}</span>
              </span>
              <span className="text-muted-foreground text-sm">{piece.detail}</span>
            </a>
          ))}
        </div>
      </Section>

      <Section id="seam" title="Where the line is">
        <p className="text-muted-foreground text-sm">
          The rule is one sentence: cantera never implements OAuth mechanics beyond a block's thin
          route wiring. A component takes an <C>OAuthConnection</C> and renders it. It does not know
          whether the token behind that connection is fresh, where it is stored, or how it will be
          refreshed — because refresh, storage, and rotation are aec-auth's job, and splitting that
          job across two projects is how token bugs get written.
        </p>
        <p className="text-muted-foreground text-sm">
          <C>@cantera/acc-sign-in</C> is the seam made concrete. It installs a working{' '}
          <C>/sign-in</C> page, the <C>/api/auth/*</C> route handlers, and one{' '}
          <C>lib/acc-auth.ts</C> that configures aec-auth's vault and session. The handlers are
          thin: start the flow, exchange the code, sign out. Everything underneath is the package's.{' '}
          <C>@cantera/connections-page</C> then reuses those exact routes as a registry dependency
          rather than growing a second copy of them.
        </p>
      </Section>

      <Section id="credential-free" title="Runnable without credentials">
        <p className="text-muted-foreground text-sm">
          The emulator is embedded in this site at <C>/emulate/aps</C> through{' '}
          <C>@emulators/adapter-next</C>, on the same origin as the app, so the demos work on any
          deployment URL without a redirect URI to register. Point <C>APS_AUTH_BASE_URL</C> at it
          and the sign-in block runs its real flow against seeded users: consent screen, code
          exchange, single-use refresh rotation, scope validation that rejects an unknown scope the
          way Autodesk would.
        </p>
        <p className="text-muted-foreground text-sm">
          Two caveats worth knowing before you copy the setup. The emulator's store is in memory, so
          a demo connection disappears when the server recycles — expected here, and the reason the
          demo restarts cleanly. And <C>ACC_AUTH_DEMO</C> exists only so this showcase can run with
          a fallback session secret; it belongs nowhere near a deployment that guards real accounts.
        </p>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[36rem] border-collapse text-sm">
            <caption className="sr-only">
              Environment variables the acc-sign-in and connections-page blocks read
            </caption>
            <thead>
              <tr className="border-border border-b bg-muted/40 text-left">
                <th className="px-4 py-2 font-medium text-muted-foreground text-xs">Variable</th>
                <th className="px-4 py-2 font-medium text-muted-foreground text-xs">Meaning</th>
              </tr>
            </thead>
            <tbody>
              {envVars.map((variable) => (
                <tr key={variable.name} className="border-border border-b last:border-b-0">
                  <td className="px-4 py-2.5 align-top font-mono text-code">{variable.name}</td>
                  <td className="px-4 py-2.5 align-top text-muted-foreground">
                    {variable.meaning}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section id="next" title="See it running">
        <ul className="flex flex-col gap-2 text-muted-foreground text-sm">
          <li>
            <Link
              href="/demo"
              className="focus-ring rounded-md underline underline-offset-4 hover:text-foreground"
            >
              The demo
            </Link>{' '}
            — the full Autodesk sign-in flow against the embedded emulator.
          </li>
          <li>
            <Link
              href="/connections"
              className="focus-ring rounded-md underline underline-offset-4 hover:text-foreground"
            >
              Connections
            </Link>{' '}
            — the manage-grants page, with connect, reconnect, and disconnect.
          </li>
          <li>
            <Link
              href="/philosophy"
              className="focus-ring rounded-md underline underline-offset-4 hover:text-foreground"
            >
              Philosophy
            </Link>{' '}
            — why the UI layer is a registry and what every item is held to.
          </li>
        </ul>
      </Section>
    </div>
  )
}

import Link from 'next/link'

import { ThemeToggle } from '@/components/site/theme-toggle'

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="sticky top-0 z-40 border-border border-b bg-background/80 backdrop-blur">
        <aside aria-label="Alpha notice" className="border-border border-b bg-muted/40">
          <div className="mx-auto flex min-h-8 w-full max-w-[90rem] items-center justify-center gap-2 px-4 py-1.5 text-center text-muted-foreground text-xs sm:px-6">
            <span className="shrink-0 whitespace-nowrap rounded-full bg-foreground px-2 py-0.5 font-medium font-mono text-background text-xs uppercase tracking-[0.14em]">
              Alpha
            </span>
            <span>Still setting the concrete — expect rough edges and frequent changes.</span>
          </div>
        </aside>
        {/* min-h + wrap: on phone widths the nav folds to a second row instead of
            overflowing the viewport; desktop renders identically (nothing wraps). */}
        <div className="mx-auto flex min-h-14 w-full max-w-[90rem] flex-wrap items-center gap-y-1 px-4 py-2 sm:px-6">
          <Link href="/" className="focus-ring rounded-md font-medium font-mono text-sm lowercase">
            cantera
          </Link>
          <nav
            aria-label="Main"
            className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-sm sm:gap-x-5"
          >
            <Link
              href="/installation"
              className="focus-ring rounded-md text-muted-foreground transition-colors hover:text-foreground"
            >
              Installation
            </Link>
            <Link
              href="/components"
              className="focus-ring rounded-md text-muted-foreground transition-colors hover:text-foreground"
            >
              Components
            </Link>
            <Link
              href="/blocks"
              className="focus-ring rounded-md text-muted-foreground transition-colors hover:text-foreground"
            >
              Blocks
            </Link>
            <Link
              href="/demo"
              className="focus-ring rounded-md text-muted-foreground transition-colors hover:text-foreground"
            >
              Demo
            </Link>
            <a
              href="https://github.com/mrestrepoj10/cantera"
              target="_blank"
              rel="noreferrer"
              className="focus-ring rounded-md text-muted-foreground transition-colors hover:text-foreground"
            >
              GitHub
            </a>
            <ThemeToggle />
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-border border-t">
        <div className="mx-auto flex w-full max-w-[90rem] flex-wrap items-center gap-x-6 gap-y-2 px-6 py-8 text-muted-foreground text-xs">
          <span>cantera — MIT License</span>
          {/* The positioning pages live here rather than in the header: that nav
              already wraps to a second row on a phone, and these are read-once
              context, not surfaces anyone navigates back to mid-task. */}
          <nav aria-label="About" className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link
              href="/philosophy"
              className="focus-ring rounded-md transition-colors hover:text-foreground"
            >
              Philosophy
            </Link>
            <Link
              href="/stack"
              className="focus-ring rounded-md transition-colors hover:text-foreground"
            >
              The stack
            </Link>
            <a
              href="https://github.com/mrestrepoj10/aec-auth"
              target="_blank"
              rel="noreferrer"
              className="focus-ring rounded-md transition-colors hover:text-foreground"
            >
              aec-auth
            </a>
            <a
              href="https://github.com/mrestrepoj10/emulate"
              target="_blank"
              rel="noreferrer"
              className="focus-ring rounded-md transition-colors hover:text-foreground"
            >
              emulate
            </a>
          </nav>
        </div>
      </footer>
    </>
  )
}

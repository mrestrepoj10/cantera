import Link from 'next/link'

import { ThemeToggle } from '@/components/site/theme-toggle'

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="sticky top-0 z-40 border-border border-b bg-background/80 backdrop-blur">
        {/* min-h + wrap: on phone widths the nav folds to a second row instead of
            overflowing the viewport; desktop renders identically (nothing wraps). */}
        <div className="mx-auto flex min-h-14 w-full max-w-5xl flex-wrap items-center gap-y-1 px-4 py-2 sm:px-6">
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
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-6 py-8 text-muted-foreground text-xs">
          <span>cantera — MIT License</span>
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
        </div>
      </footer>
    </>
  )
}

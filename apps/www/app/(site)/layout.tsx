import Link from 'next/link'

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="sticky top-0 z-40 border-border border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center px-6">
          <Link
            href="/"
            className="rounded-md font-medium font-mono text-sm lowercase outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            cantera
          </Link>
          <nav aria-label="Main" className="ml-auto flex items-center gap-5 text-sm">
            <Link
              href="/components"
              className="rounded-md text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              Components
            </Link>
            <Link
              href="/demo"
              className="rounded-md text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              Demo
            </Link>
            <a
              href="https://github.com/mrestrepoj10/cantera"
              target="_blank"
              rel="noreferrer"
              className="rounded-md text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              GitHub
            </a>
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
            className="rounded-md outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            aec-auth
          </a>
          <a
            href="https://github.com/mrestrepoj10/emulate"
            target="_blank"
            rel="noreferrer"
            className="rounded-md outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            emulate
          </a>
        </div>
      </footer>
    </>
  )
}

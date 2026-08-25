'use client'

import { MoonIcon, SunIcon } from 'lucide-react'
import { useTheme } from 'next-themes'

import { Button } from '@/components/ui/button'

// Icon and accessible name are selected in CSS off the `.dark` class, not
// React state: server and client markup stay identical (no hydration mismatch,
// no mounted-flicker placeholder) and the button works on the first paint.
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-lg"
      className="text-muted-foreground hover:text-foreground"
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
    >
      <span aria-hidden className="grid size-4 place-items-center">
        <MoonIcon className="col-start-1 row-start-1 size-4 dark:hidden" />
        <SunIcon className="col-start-1 row-start-1 hidden size-4 dark:block" />
      </span>
      {/* Hidden elements are excluded from the accessible name, so exactly one
          of these two names the button in any given appearance. */}
      <span className="sr-only dark:hidden">Switch to dark theme</span>
      <span className="sr-only hidden dark:inline">Switch to light theme</span>
    </Button>
  )
}

'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'

/**
 * Class-strategy theming, matching the `@custom-variant dark (&:is(.dark *))`
 * in globals.css. next-themes writes the class from a blocking inline script
 * at the top of <body>; the root layout runs the same logic from <head> first,
 * so the class is set before anything paintable exists — no flash. Keep the
 * two in sync: this config's strategy, storage key, and default are what the
 * layout's appearanceScript mirrors. The default is `system`, and the toggle
 * only ever moves off it deliberately.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      // Theme swaps are not a motion moment — suppress every transition for the
      // frame in which the class flips, so nothing crossfades on its own clock.
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  )
}

'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'

/**
 * Class-strategy theming, matching the `@custom-variant dark (&:is(.dark *))`
 * in globals.css. next-themes writes the class from a blocking inline script
 * in <head>, so the first paint is already in the right appearance — no flash.
 * The default is `system`, and the toggle only ever moves off it deliberately.
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

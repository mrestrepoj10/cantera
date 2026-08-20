'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'

/**
 * Class-strategy theming, matching the `@custom-variant dark (&:is(.dark *))`
 * in globals.css. next-themes writes the class from a blocking inline script
 * in <head>, so the first paint is already in the right appearance — no flash.
 * The default is `system`, and the toggle only ever moves off it deliberately.
 *
 * Mounted per layout rather than at the root, because the two surfaces need
 * different storage: `/embed/<name>` is framed by the docs site on another
 * origin and follows *that* page's appearance, so it must not write the
 * preference a visitor set on this one. See `EMBED_THEME_STORAGE_KEY`.
 */
export function ThemeProvider({
  children,
  storageKey,
}: {
  children: React.ReactNode
  /** Defaults to next-themes' own `theme` key — the site-wide preference. */
  storageKey?: string
}) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey={storageKey}
      // Theme swaps are not a motion moment — suppress every transition for the
      // frame in which the class flips, so nothing crossfades on its own clock.
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  )
}

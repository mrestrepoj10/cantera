'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'

// Keep in sync with the layout's appearanceScript: class strategy, "theme"
// storage key, and system default — the head script runs the same logic before
// <body> exists.
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      // Suppress every transition for the frame the class flips, so nothing
      // crossfades on its own clock.
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  )
}

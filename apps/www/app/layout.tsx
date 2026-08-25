import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import Script from 'next/script'

import { ThemeProvider } from '@/components/site/theme-provider'
import './globals.css'

const geistSans = Geist({
  variable: '--font-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    default: 'cantera',
    template: '%s – cantera',
  },
  description:
    'Construction UI. shadcn-native. Components for AEC data — ACC-ready, source-agnostic.',
}

// Runs from <head>, before <body> exists: a slow-streaming document can paint
// the body's background before next-themes' own script at the top of <body>.
// Mirrors the provider's config; next-themes re-applies the same result.
const appearanceScript = `try{var t=localStorage.getItem('theme');var d=t==='dark'||((t===null||t==='system')&&matchMedia('(prefers-color-scheme: dark)').matches);var r=document.documentElement;r.classList.toggle('dark',d);r.style.colorScheme=d?'dark':'light'}catch(e){}`

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    // The appearance scripts write onto this element before hydration;
    // suppressHydrationWarning covers that one server/client difference.
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Next tracks this script across server rendering and hydration. */}
        <Script id="appearance-script" strategy="beforeInteractive">
          {appearanceScript}
        </Script>
      </head>
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}

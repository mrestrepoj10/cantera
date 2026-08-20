import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    // next-themes writes the appearance class onto this element before paint;
    // suppressHydrationWarning covers that one server/client difference.
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* The theme provider is mounted per route group, not here: the site and
          the framed previews need different storage keys, so a preview embedded
          on the docs origin cannot overwrite a visitor's site preference. */}
      <body className="flex min-h-full flex-col bg-background text-foreground">{children}</body>
    </html>
  )
}

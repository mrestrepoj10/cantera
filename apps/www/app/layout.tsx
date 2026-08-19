import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'

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
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}

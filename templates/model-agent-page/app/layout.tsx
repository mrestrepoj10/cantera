import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import type { ReactNode } from 'react'

import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: "Model Agent Page",
  description: "An already-translated model in a full-bleed Autodesk Viewer next to the fx coding agent as a terminal that drives it: libfx running in the browser, a sandboxed bash workspace whose viewer command runs a typed viewer tool catalog, model traffic through a same-origin AI Gateway proxy, and a colour legend for what the agent paints.",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  )
}

'use client'

import { useTheme } from 'next-themes'
import { useEffect, useRef } from 'react'

/**
 * The client half of `/embed/<name>`: keeps a framed demo in step with the page
 * that frames it.
 *
 * The docs site renders these previews in an iframe rather than importing the
 * registry sources, so the preview stays the exact code consumers install and
 * the registry keeps one home. That buys correctness and costs two things an
 * iframe does not get for free — the host's appearance and the host's layout —
 * and this component pays both back over `postMessage`.
 *
 * Appearance arrives twice on purpose. The `?theme=` parameter is applied by a
 * blocking script in the page before first paint (see the route), so the frame
 * never flashes the wrong palette; this component then re-applies it through
 * next-themes so React state agrees with the DOM, and listens for later changes
 * so toggling the theme on the host updates the frame without reloading it.
 *
 * Height is reported, never guessed: a demo's natural height depends on the
 * consumer's own type scale, so the host sizes the frame from what actually
 * rendered. `ResizeObserver` catches the demos whose height changes on
 * interaction — the scope picker grows a row per custom scope.
 */

/** Messages are namespaced: a docs page may frame more than one thing. */
export const EMBED_MESSAGE_SOURCE = 'cantera-embed'

function isAppearance(value: unknown): value is 'light' | 'dark' {
  return value === 'light' || value === 'dark'
}

export function EmbedFrame({ name, children }: { name: string; children: React.ReactNode }) {
  const { setTheme } = useTheme()
  const contentRef = useRef<HTMLDivElement>(null)

  // Appearance: adopt the parameter the blocking script already applied, then
  // follow the host. Origin is deliberately not checked — the payload is one of
  // two appearance strings, nothing here is privileged, and the docs site is
  // served from a different origin than the registry by design.
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get('theme')
    if (isAppearance(requested)) setTheme(requested)

    function onMessage(event: MessageEvent) {
      const data = event.data as { source?: unknown; type?: unknown; theme?: unknown } | null
      if (!data || data.source !== EMBED_MESSAGE_SOURCE || data.type !== 'theme') return
      if (isAppearance(data.theme)) setTheme(data.theme)
    }

    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [setTheme])

  // Height: report the content box on every change, plus once on mount so a
  // host that framed this before it was interactive gets a size immediately.
  useEffect(() => {
    const element = contentRef.current
    if (!element || window.parent === window) return

    function post(height: number) {
      window.parent.postMessage(
        { source: EMBED_MESSAGE_SOURCE, type: 'height', name, height: Math.ceil(height) },
        '*',
      )
    }

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) post(entry.target.getBoundingClientRect().height)
    })
    observer.observe(element)
    post(element.getBoundingClientRect().height)
    return () => observer.disconnect()
  }, [name])

  return (
    <div ref={contentRef} className="flex min-h-0 w-full items-center justify-center p-6">
      {children}
    </div>
  )
}

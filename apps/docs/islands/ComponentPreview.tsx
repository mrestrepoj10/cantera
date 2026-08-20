import { useEffect, useRef, useState } from 'react'

/**
 * A live cantera demo, framed from the registry site.
 *
 * Every file in `islands/` becomes a global MDX tag, so the generated pages use
 * `<ComponentPreview />` without importing anything.
 *
 * ## Why an iframe
 *
 * The obvious alternative is to import the registry sources and render them
 * here as React islands. That is the wrong trade twice over. It would put a
 * second copy of distributed code in the repo — the one thing AGENTS.md rules
 * out — and it would need this app to reproduce the consumer surface those
 * components are built against: the shadcn primitives, the Tailwind theme, and
 * the status tokens from `apps/www/app/globals.css`. Every one of those is a
 * place the preview could drift from what `npx shadcn add` actually installs,
 * which would make the docs lie in the exact way the registry-as-source-of-truth
 * rule exists to prevent.
 *
 * Framing `apps/www/embed/<name>` instead keeps one copy of the components and
 * one theme layer. It also keeps the previews inside that app's axe sweep, so
 * the a11y bar is still enforced against the code consumers install.
 *
 * The two things an iframe loses — the host's appearance and the host's
 * layout — come back over `postMessage`, which is what the rest of this file
 * is: `data-theme` on Blume's root element is mirrored into the frame, and the
 * frame reports its rendered height back.
 */

/** Matches `EMBED_MESSAGE_SOURCE` in `apps/www/components/site/embed-frame.tsx`. */
const EMBED_MESSAGE_SOURCE = 'cantera-embed'

/**
 * Shown until the frame reports its real height. Tall enough that the common
 * case settles without the page lurching, short enough that the smallest demos
 * do not sit in a mostly empty box.
 */
const FALLBACK_HEIGHT = 260

type Appearance = 'light' | 'dark'

/**
 * Repoints the frame at a different `apps/www` for local work.
 *
 * The `src` baked into the generated MDX is the production origin, and it has
 * to be: those pages are committed build output that `pnpm registry:verify`
 * compares byte for byte, so they cannot vary by machine. That leaves local
 * development framing production — fine for reading, useless for checking a
 * component you are changing. Set `PUBLIC_EMBED_ORIGIN=http://localhost:3000`
 * alongside `pnpm --filter www dev` to point the frames at your own build.
 */
function resolveSrc(src: string): string {
  const origin = import.meta.env?.PUBLIC_EMBED_ORIGIN
  if (!origin) return src
  try {
    return new URL(new URL(src).pathname, origin).toString()
  } catch {
    // A malformed override should degrade to the real docs, not blank the page.
    return src
  }
}

/** Blume drives dark mode from `data-theme` on `<html>`, set before first paint. */
function currentAppearance(): Appearance {
  if (typeof document === 'undefined') return 'light'
  const declared = document.documentElement.dataset.theme
  if (declared === 'dark' || declared === 'light') return declared
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export default function ComponentPreview({
  src,
  name,
  title,
}: {
  /** Absolute embed URL, generated from `apps/www/lib/site.ts`. */
  src: string
  /** Registry item name, used to match height messages from this frame. */
  name: string
  /** Accessible name for the frame — an iframe without one is unlabelled. */
  title: string
}) {
  const frameRef = useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = useState(FALLBACK_HEIGHT)
  // Resolved on mount, not during render: the server pass has no DOM, and
  // reading one here would desynchronize hydration.
  const [appearance, setAppearance] = useState<Appearance | null>(null)
  // Set once and never recomputed. Deriving the URL from `appearance` would
  // renavigate the frame on every host theme change — discarding whatever
  // state the reader built up in the demo — which is the exact thing the
  // message channel below exists to avoid.
  const [frameSrc, setFrameSrc] = useState<string | null>(null)

  useEffect(() => {
    const initial = currentAppearance()
    setAppearance(initial)
    // The appearance rides in on the query string so the frame paints the right
    // palette on its first frame; `postMessage` carries every change after.
    setFrameSrc(`${resolveSrc(src)}?theme=${initial}`)

    const observer = new MutationObserver(() => setAppearance(currentAppearance()))
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })

    // `data-theme` stays unset while the host is on "system", so the OS switch
    // has to be watched separately or the frame keeps the stale palette.
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onMedia = () => setAppearance(currentAppearance())
    media.addEventListener('change', onMedia)

    return () => {
      observer.disconnect()
      media.removeEventListener('change', onMedia)
    }
  }, [src])

  // Push appearance changes rather than re-pointing `src`: a new URL would
  // reload the frame, resetting any state the reader built up in the demo.
  useEffect(() => {
    if (!appearance) return
    frameRef.current?.contentWindow?.postMessage(
      { source: EMBED_MESSAGE_SOURCE, type: 'theme', theme: appearance },
      '*',
    )
  }, [appearance])

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      const data = event.data as {
        source?: unknown
        type?: unknown
        name?: unknown
        height?: unknown
      } | null
      if (!data || data.source !== EMBED_MESSAGE_SOURCE || data.type !== 'height') return
      // A page documents one component, but the index pages frame several.
      if (data.name !== name) return
      if (typeof data.height === 'number' && data.height > 0) setHeight(data.height)
    }

    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [name])

  // Rendered without a `src` until the appearance resolves on mount, so the
  // frame is never navigated twice.
  if (!frameSrc) {
    return (
      <div
        className="not-prose my-6 rounded-lg border border-[var(--blume-border,currentColor)]"
        style={{ height: `${height}px` }}
      />
    )
  }

  return (
    <div className="not-prose my-6 overflow-hidden rounded-lg border border-[var(--blume-border,currentColor)]">
      <iframe
        ref={frameRef}
        src={frameSrc}
        title={title}
        loading="lazy"
        // No height transition: the motion grammar allows an animated height
        // only for a user-initiated disclosure, and this moves on data arriving.
        style={{ height: `${height}px` }}
        className="block w-full border-0"
      />
    </div>
  )
}

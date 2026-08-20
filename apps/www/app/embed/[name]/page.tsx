import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { demoNames, hasDemo } from '@/components/site/demo-names'
import { ComponentDemo } from '@/components/site/demos'
import { EmbedFrame } from '@/components/site/embed-frame'
import { getRegistryItem } from '@/components/site/registry'

/**
 * One live demo, framed and nothing else — the preview the docs site embeds.
 *
 * Deliberately outside the `(site)` group, so it inherits the root layout's
 * fonts, theme provider, and `globals.css` (the status tokens live there) but
 * none of the chrome: a header inside a preview box is noise, and its landmarks
 * would nest inside the host page's.
 *
 * This route exists so the docs site can move to its own app without the
 * registry sources moving with it. A preview that re-implemented the demos
 * there would be a second copy of distributed code — the one thing AGENTS.md
 * rules out — and it would drift the first time a component changed. Framing
 * the real page instead keeps one copy, and keeps these previews inside the
 * axe sweep that enforces the a11y bar on what consumers actually install.
 */

export const dynamicParams = false

export function generateStaticParams() {
  return demoNames.map((name) => ({ name }))
}

interface PageProps {
  params: Promise<{ name: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { name } = await params
  const item = getRegistryItem(name)
  if (!item) return {}
  return {
    title: `${item.title} preview`,
    // A fragment of a docs page, not a page: indexing it would put a preview
    // box in results where the documented component belongs.
    robots: { index: false, follow: false },
  }
}

/**
 * Applies `?theme=` before the demo paints.
 *
 * next-themes resolves the appearance from storage or the OS in its own
 * blocking script in `<head>`, which for a frame means "the visitor's system
 * theme", not "the theme of the page doing the framing". This runs after that
 * script and before the body renders, so the correct palette is the first one
 * painted. Writing storage too keeps next-themes from reverting on the next
 * read; `EmbedFrame` then syncs React state and follows later changes.
 */
const THEME_SCRIPT = `try{var t=new URLSearchParams(location.search).get('theme');if(t==='dark'||t==='light'){localStorage.setItem('theme',t);document.documentElement.classList.toggle('dark',t==='dark');document.documentElement.style.colorScheme=t}}catch(e){}`

export default async function EmbedPage({ params }: PageProps) {
  const { name } = await params
  if (!hasDemo(name)) notFound()

  return (
    <>
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: a fixed literal
          with no interpolation, and it has to be inline and blocking to beat
          the first paint — a `<Script>` would run too late to stop the flash. */}
      <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      <EmbedFrame name={name}>
        <ComponentDemo name={name} />
      </EmbedFrame>
    </>
  )
}

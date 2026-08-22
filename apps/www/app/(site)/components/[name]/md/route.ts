import { getExampleItem, getRegistryItem, registryItems } from '@/components/site/registry'
import { itemMarkdown } from '@/lib/item-markdown'

/**
 * The markdown twin of every docs page: `/components/<name>.md`.
 *
 * Same URL as the page plus an extension, so a reader who wants the source
 * text — or an agent handed the link — gets markdown at a guessable address,
 * with no redirect and no HTML to strip. The body comes from
 * `lib/item-markdown.ts`, the serializer that also writes the agent skill's
 * per-item references, so the two can never disagree.
 *
 * Prerendered: the param list is the catalog. Unknown names still resolve to
 * an explicit 404 below, which is compatible with Cache Components.
 */

export function generateStaticParams() {
  return registryItems.map((item) => ({ name: item.name }))
}

export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params
  const item = getRegistryItem(name)
  if (!item) return new Response('Not found', { status: 404 })

  return new Response(itemMarkdown(item, getExampleItem(name)), {
    headers: {
      'content-type': 'text/markdown; charset=utf-8',
      'cache-control': 'public, max-age=0, must-revalidate',
    },
  })
}

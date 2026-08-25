import { getExampleItem, getRegistryItem, registryItems } from '@/components/site/registry'
import { itemMarkdown } from '@/lib/item-markdown'

// The docs page's URL plus `.md`, served with no redirect. Prerendered: the
// param list is the catalog, and unknown names still resolve to an explicit
// 404, which Cache Components requires.

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

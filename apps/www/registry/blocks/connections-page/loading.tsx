import { ConnectionsView } from '@/components/connections-view'

/**
 * The route's loading UI, so the block's loading state is the real thing the
 * App Router streams rather than a decoration in a demo.
 *
 * The same ConnectionsView renders it: heading and description are already
 * final here, and only the list is placeholder — so nothing above the list
 * moves when the data lands. Retitle the page and retitle this too.
 */
export default function ConnectionsLoadingPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col p-6 sm:py-12">
      <ConnectionsView providers={[]} status="loading" />
    </main>
  )
}

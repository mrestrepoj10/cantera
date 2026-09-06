import { ConnectionsView } from '@/components/connections-view'

/** The same ConnectionsView renders this, so nothing above the list moves
 * when the data lands. Retitle the page and retitle this too. */
export default function ConnectionsLoadingPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col p-6 sm:py-12">
      <ConnectionsView providers={[]} status="loading" />
    </main>
  )
}

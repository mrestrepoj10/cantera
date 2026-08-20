import { ConnectionsView } from '@/components/connections-view'

/** The block's loading state, streamed by the App Router while the grant resolves. */
export default function ConnectionsShowcaseLoading() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-16">
      <ConnectionsView providers={[]} status="loading" />
    </div>
  )
}

import { LoaderCircleIcon } from 'lucide-react'

/**
 * The block's loading state, streamed by the App Router while the session is
 * verified and the token refreshed. Without it a signed-in visit shows nothing
 * until a third-party token round trip finishes.
 *
 * Deliberately still: skeleton rows at the connection panel's own geometry, no
 * shimmer, and one live spinner that carries the announcement.
 */
export default function SignInLoading() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="flex w-full max-w-sm flex-col gap-4">
        <output className="flex items-center gap-2 text-muted-foreground text-sm">
          {/* The spin lives on a wrapper: transform animations on the <svg>
              itself skip the compositor in some engines. */}
          <span aria-hidden className="grid size-3.5 shrink-0 animate-spin place-items-center">
            <LoaderCircleIcon className="size-3.5" />
          </span>
          Checking your Autodesk connection
        </output>
        {/* Same box as Card: rounded-xl, ring-1, py-(--card-spacing) at 4. */}
        <div aria-hidden className="rounded-xl bg-card py-4 ring-1 ring-foreground/10">
          <div className="flex flex-col gap-3 px-4">
            {/* Provider row: mark, name, action — the card's header line. */}
            <div className="flex items-center gap-3">
              <div className="size-5 shrink-0 rounded bg-muted" />
              <div className="h-4 w-28 rounded bg-muted" />
              <div className="ml-auto h-7 w-24 shrink-0 rounded-lg bg-muted" />
            </div>
            {/* Account badge row: avatar plus the name-over-email stack. */}
            <div className="flex items-center gap-2">
              <div className="size-7 shrink-0 rounded-full bg-muted" />
              <div className="flex flex-col gap-1">
                <div className="h-3.5 w-24 rounded bg-muted" />
                <div className="h-3.5 w-40 rounded bg-muted" />
              </div>
            </div>
            {/* Status line: one badge plus the expiry text. */}
            <div className="flex items-center gap-2">
              <div className="h-6 w-24 shrink-0 rounded-md bg-muted" />
              <div className="h-3 w-20 rounded bg-muted" />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

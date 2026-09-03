import { LoaderCircleIcon } from 'lucide-react'

export default function ModelViewerLoading() {
  return (
    <main className="grid h-svh min-h-[32rem] grid-cols-[20rem_minmax(0,1fr)] overflow-hidden bg-background">
      <aside className="flex min-w-0 flex-col border-r bg-background shadow-sm">
        <header className="flex min-h-16 items-center border-b px-4">
          <div>
            <h1 className="font-heading font-medium text-lg">Models</h1>
            <p className="text-muted-foreground text-xs">Autodesk project files</p>
          </div>
        </header>
        <output className="flex min-h-11 items-center gap-2 px-5 text-muted-foreground text-xs">
          <span aria-hidden className="grid size-3.5 animate-spin place-items-center">
            <LoaderCircleIcon className="size-3.5" />
          </span>
          Checking your Autodesk connection
        </output>
      </aside>
      <section className="grid place-items-center bg-muted" aria-label="Loading model viewer">
        <div aria-hidden className="h-24 w-72 rounded-xl bg-background shadow-sm" />
      </section>
    </main>
  )
}

import type { Metadata } from 'next'
import { ViewerConfigGallery } from '@/components/mockups/viewer-config/gallery'

export const metadata: Metadata = {
  title: 'Viewer config UI — mockups',
  robots: { index: false, follow: false },
}

export default function ViewerConfigMockupsPage() {
  return (
    <div className="mx-auto w-full max-w-[80rem] px-4 py-10 sm:px-6">
      <header className="mb-8 max-w-2xl">
        <span className="font-medium font-mono text-[11px] text-muted-foreground uppercase tracking-[0.14em]">
          Mockup
        </span>
        <h1 className="mt-2 font-medium text-2xl">Viewer configuration UI</h1>
        <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
          Five candidate shapes for a cantera-owned settings surface on{' '}
          <code className="font-mono text-xs">aps-viewer</code>. The canvas is a placeholder, not a
          live viewer — the controls drive the same props the real component takes (toolbar,
          position, scale, view cube, theme, radius, profile, extensions), so the fake native
          toolbar reacts the way the SDK one would. Settings persist as you switch between options.
        </p>
      </header>
      <ViewerConfigGallery />
    </div>
  )
}

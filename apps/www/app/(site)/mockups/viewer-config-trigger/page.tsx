import type { Metadata } from 'next'
import Link from 'next/link'
import { TriggerGallery } from '@/components/mockups/viewer-config/trigger-gallery'

export const metadata: Metadata = {
  title: 'Opening the viewer inspector — mockups',
  robots: { index: false, follow: false },
}

export default function ViewerConfigTriggerMockupsPage() {
  return (
    <div className="mx-auto w-full max-w-[80rem] px-4 py-10 sm:px-6">
      <header className="mb-10 max-w-2xl">
        <span className="font-medium font-mono text-[11px] text-muted-foreground uppercase tracking-[0.14em]">
          Mockup
        </span>
        <h1 className="mt-2 font-medium text-2xl">Opening the viewer inspector</h1>
        <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
          Five ways to reach the floating inspector from{' '}
          <Link href="/mockups/viewer-config" className="underline underline-offset-4">
            the config mockups
          </Link>
          , with Autodesk&apos;s own bottom-centre toolbar left intact in every one. Each option is
          shown at rest and open; the controls are live and shared across the page, so a setting
          changed in one shows up in the rest.
        </p>
      </header>
      <TriggerGallery />
    </div>
  )
}

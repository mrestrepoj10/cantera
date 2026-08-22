'use client'

import { LoaderCircleIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useId, useState, useTransition } from 'react'

import { Button } from '@/components/ui/button'
import { HubSwitcher } from '@/components/ui/hub-switcher'
import { ModelStatusCard } from '@/components/ui/model-status-card'
import { ProjectPicker } from '@/components/ui/project-picker'
import { VersionSetSelect } from '@/components/ui/version-set-select'
import type { AccWorkflowData } from '@/lib/acc-workflow'
import { cn } from '@/lib/utils'

/**
 * Client wiring for the /demo workflow. The server page is the truth: every
 * selection is a search param, so changing one is a navigation, and the four
 * components re-render from freshly fetched ACC data rather than from local
 * state about what the user probably picked.
 *
 * The transition holds the pending state until the server render commits, so
 * a picker keeps its label and spins for exactly as long as the fetch takes.
 */

/** The selection chain, in the order the screen reveals it. */
const fieldOrder = ['hub', 'project', 'versionSet'] as const

type WorkflowField = (typeof fieldOrder)[number]

/** A retry on the async-pending contract, for the fields that have no error slot. */
function RetryNotice({
  message,
  pending,
  onRetry,
}: {
  message: string
  pending: boolean
  onRetry: () => void
}) {
  const messageId = useId()

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <p id={messageId} role="status" className="text-sm text-status-danger">
        {message}
      </p>
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        focusableWhenDisabled
        aria-busy={pending || undefined}
        aria-describedby={messageId}
        // The pseudo-element extends the hit area to the 44px floor.
        className="relative shrink-0 gap-0 after:absolute after:-inset-y-2 after:inset-x-0"
        onClick={onRetry}
      >
        <span
          aria-hidden
          className={cn(
            'grid shrink-0 place-items-center overflow-hidden transition-[width,margin] duration-150 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none',
            pending ? 'mr-1 w-3.5' : 'mr-0 w-0',
          )}
        >
          {/* The spin lives on a wrapper: transform animations on the <svg>
              itself skip the compositor in some engines. */}
          <span className="grid size-3.5 animate-spin place-items-center">
            <LoaderCircleIcon
              className={cn(
                'size-3.5 transition-[opacity,scale,filter] duration-150 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none',
                pending ? 'scale-100 opacity-100 blur-none' : 'scale-25 opacity-0 blur-[4px]',
              )}
            />
          </span>
        </span>
        Retry
      </Button>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
      {/* The control carries the same string as its accessible name, so this
          is the visible half of one label, not a second announcement. */}
      <span aria-hidden className="font-medium text-muted-foreground text-xs">
        {label}
      </span>
      {children}
    </div>
  )
}

function AccWorkflowPanel({ data }: { data: AccWorkflowData }) {
  const router = useRouter()
  const [hydrated, setHydrated] = useState(false)
  const [touched, setTouched] = useState<WorkflowField | 'all'>()
  const [isPending, startTransition] = useTransition()

  // The showcase has an end-to-end OAuth contract that lands on a fresh
  // document. Mark this exact client island ready so the test never mistakes
  // the already-hydrated app shell for an interactive project picker.
  useEffect(() => setHydrated(true), [])

  // Changing one field invalidates everything after it, so the fields
  // downstream of the touched one are pending too — they are being replaced.
  const pendingFrom =
    isPending && touched ? (touched === 'all' ? 0 : fieldOrder.indexOf(touched)) : undefined
  const busy = (field: WorkflowField) =>
    pendingFrom !== undefined && pendingFrom <= fieldOrder.indexOf(field)

  function go(field: WorkflowField, params: Record<string, string | undefined>) {
    setTouched(field)
    const search = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      if (value) search.set(key, value)
    }
    const query = search.toString()
    startTransition(() => {
      router.replace(query ? `/demo?${query}` : '/demo', { scroll: false })
      // Clearing pending inside the transition keeps the spinner up until the
      // re-rendered server page commits, never a frame longer or shorter.
      setTouched(undefined)
    })
  }

  function retry() {
    setTouched('all')
    startTransition(() => {
      router.refresh()
      setTouched(undefined)
    })
  }

  const listError = data.hubsError ?? data.projectsError

  return (
    <div
      className="flex flex-col gap-6"
      data-slot="acc-workflow-panel"
      data-hydrated={hydrated || undefined}
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-4 sm:flex-row">
          <Field label="Hub">
            <HubSwitcher
              aria-label="Hub"
              hubs={data.hubs}
              // Always a string, never undefined: the selection is the server's
              // to own, and a control that flips to uncontrolled mid-session
              // would keep a stale hub after a failed read.
              value={data.selectedHubId ?? ''}
              pending={busy('hub')}
              emptyMessage={data.hubsError ? 'Hubs could not be loaded.' : 'No hubs available.'}
              onValueChange={(hubId) => go('hub', { hub: hubId })}
            />
          </Field>
          <Field label="Project">
            <ProjectPicker
              aria-label="Project"
              hubs={data.hubs}
              projects={data.projects}
              value={data.selectedProjectId ?? ''}
              status={listError ? 'error' : 'ready'}
              error={listError}
              onRetry={retry}
              retryPending={isPending}
              pending={busy('project')}
              emptyMessage="This hub has no projects."
              onValueChange={(projectId) =>
                go('project', { hub: data.selectedHubId, project: projectId })
              }
            />
          </Field>
        </div>
        {/* The picker keeps its own error state, but that one lives inside the
            open popup — a read that failed has to be visible without opening
            anything. */}
        {listError && <RetryNotice message={listError} pending={isPending} onRetry={retry} />}
      </div>

      <div className="flex flex-col gap-3">
        <Field label="Version set">
          <VersionSetSelect
            aria-label="Version set"
            versionSets={data.versionSets}
            value={data.selectedVersionSetId ?? ''}
            pending={busy('versionSet')}
            emptyMessage="No sheets have been issued for this project yet."
            onValueChange={(versionSetId) =>
              go('versionSet', {
                hub: data.selectedHubId,
                project: data.selectedProjectId,
                versionSet: versionSetId,
              })
            }
          />
        </Field>
        {data.versionSetsError && (
          <RetryNotice message={data.versionSetsError} pending={isPending} onRetry={retry} />
        )}
      </div>

      <section className="flex flex-col gap-3">
        <h3 className="font-heading font-medium text-base tracking-tight">Model translations</h3>
        {data.translationsError && (
          <RetryNotice message={data.translationsError} pending={isPending} onRetry={retry} />
        )}
        {data.translations.map((translation) => (
          <ModelStatusCard
            key={translation.urn}
            translation={translation}
            // The emulator has no re-translate endpoint, so a retry here is the
            // same honest move as everywhere else on this page: re-read the
            // manifest from the server.
            onRetry={retry}
            retryPending={isPending}
          />
        ))}
        {data.translations.length === 0 && !data.translationsError && (
          <p className="text-muted-foreground text-sm">
            {data.selectedVersionSetId
              ? 'No designs are published to this issuance yet.'
              : 'Pick a project with an issued sheet set to see its models.'}
          </p>
        )}
      </section>
    </div>
  )
}

export { AccWorkflowPanel }

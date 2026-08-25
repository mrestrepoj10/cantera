'use client'

import { LoaderCircleIcon } from 'lucide-react'
import type * as React from 'react'
import { useId, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { type StatusTone, statusInkClasses, statusToneClasses } from '@/components/ui/token-status'
import type { ModelTranslation, ModelTranslationStatus } from '@/lib/project-types'
import { cn } from '@/lib/utils'

/**
 * One tone per translation state. In-flight states are neutral — no outcome
 * yet is absence, not a warning. Timeout is warning, not danger: a retry away,
 * like an expired token. Failed is the one state the user must act on.
 */
const translationTone = {
  pending: 'neutral',
  inprogress: 'neutral',
  success: 'success',
  failed: 'danger',
  timeout: 'warning',
} satisfies Record<ModelTranslationStatus, StatusTone>

const translationLabel = {
  pending: 'Queued',
  inprogress: 'Translating',
  success: 'Ready',
  failed: 'Failed',
  timeout: 'Timed out',
} satisfies Record<ModelTranslationStatus, string>

interface ModelStatusCardProps extends React.ComponentProps<typeof Card> {
  translation: ModelTranslation
  /**
   * Retry for a failed or timed-out translation. Promise-returning handlers
   * drive the pending state; the button keeps its label, spins, and stays put.
   */
  onRetry?: () => void | Promise<void>
  retryPending?: boolean
  /** Render each produced output format as an outline badge. */
  showOutputs?: boolean
}

/** Thenable check, not `instanceof Promise`: a polyfilled or cross-realm
 * promise is still a pending round trip the button must reflect. */
function isPromiseLike(value: void | Promise<void>): value is Promise<void> {
  return value != null && typeof (value as Promise<void>).then === 'function'
}

/**
 * An action on the async-pending contract: disabled with a spinner while it
 * keeps its label, focusable throughout, never unmounted mid-request.
 */
function RetryAction({
  pending,
  onRetry,
  'aria-describedby': ariaDescribedby,
}: {
  pending: boolean
  onRetry: () => void | Promise<void>
  'aria-describedby'?: string
}) {
  const [asyncPending, setAsyncPending] = useState(false)
  const busy = pending || asyncPending

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={busy}
      focusableWhenDisabled
      aria-busy={busy || undefined}
      aria-describedby={ariaDescribedby}
      // The pseudo-element extends the hit area to the 44px floor.
      className="relative shrink-0 gap-0 after:absolute after:-inset-y-2 after:inset-x-0"
      onClick={() => {
        const result = onRetry()
        if (!isPromiseLike(result)) return
        setAsyncPending(true)
        result.then(
          () => setAsyncPending(false),
          () => setAsyncPending(false),
        )
      }}
    >
      <span
        aria-hidden
        className={cn(
          'grid shrink-0 place-items-center overflow-hidden transition-[width,margin] duration-150 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none',
          busy ? 'mr-1 w-3.5' : 'mr-0 w-0',
        )}
      >
        {/* The spin lives on a wrapper: transform animations on the <svg>
            itself skip the compositor in some engines. */}
        <span className="grid size-3.5 animate-spin place-items-center">
          <LoaderCircleIcon
            className={cn(
              'size-3.5 transition-[opacity,scale,filter] duration-150 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none',
              busy ? 'scale-100 opacity-100 blur-none' : 'scale-25 opacity-0 blur-[4px]',
            )}
          />
        </span>
      </span>
      Retry
    </Button>
  )
}

/**
 * The translation state of one design: whether the model is viewable yet, how
 * far along it is, and what failed. Drive it from a Model Derivative manifest
 * via `fromApsManifest`, or from any backend that fills a ModelTranslation.
 */
function ModelStatusCard({
  translation,
  onRetry,
  retryPending = false,
  showOutputs = true,
  className,
  ...props
}: ModelStatusCardProps) {
  const errorId = useId()
  const tone = translationTone[translation.status]
  const retryable = translation.status === 'failed' || translation.status === 'timeout'

  return (
    <Card
      data-slot="model-status-card"
      data-status={translation.status}
      data-tone={tone}
      className={cn('w-full', className)}
      {...props}
    >
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'min-w-0 flex-1 truncate font-medium',
              // A design with no readable name falls back to its URN — data,
              // not prose, so it reads as code.
              !translation.name && 'font-mono text-code text-muted-foreground',
            )}
          >
            {translation.name ?? translation.urn}
          </span>
          {retryable && onRetry && (
            <RetryAction
              pending={retryPending}
              onRetry={onRetry}
              aria-describedby={translation.error ? errorId : undefined}
            />
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
          <Badge className={cn('h-6 px-2.5 transition-colors', statusToneClasses[tone])}>
            {translationLabel[translation.status]}
          </Badge>
          {translation.progress && translation.status === 'inprogress' && (
            <span className="text-muted-foreground text-xs tabular-nums">
              {translation.progress}
            </span>
          )}
          {translation.error && (
            <span id={errorId} className={cn('text-xs', statusInkClasses[tone])}>
              {translation.error}
            </span>
          )}
          {showOutputs &&
            translation.status === 'success' &&
            translation.outputs?.map((output) => (
              <Badge key={output} variant="outline" className="font-mono text-xs">
                {output}
              </Badge>
            ))}
        </div>
      </CardContent>
    </Card>
  )
}

export { ModelStatusCard, type ModelStatusCardProps }

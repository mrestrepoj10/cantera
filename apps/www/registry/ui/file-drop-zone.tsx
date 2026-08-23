'use client'

import {
  CheckIcon,
  FileIcon,
  LoaderCircleIcon,
  TriangleAlertIcon,
  UploadIcon,
  XIcon,
} from 'lucide-react'
import type * as React from 'react'
import { useEffect, useId, useMemo, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { type StatusTone, statusInkClasses } from '@/components/ui/token-status'
import { statusCssVars } from '@/lib/status-tokens'
import {
  formatBytes,
  matchesAccept,
  type UploadFile,
  type UploadRejection,
} from '@/lib/upload-types'
import { cn } from '@/lib/utils'

/**
 * The drafting-grid surface. One dot grid, five behaviors: still while idle,
 * magnetized around the pointer during a drag, plotted bottom-up by upload
 * progress, wandered by a masked glow while the provider translates, and
 * settled into a status tint when the work ends. A radial "title block"
 * clearing keeps the center free of dots so the label never competes with
 * its own backdrop. Zone-phase selectors are scoped under the data-slot;
 * the shimmer and label classes are global so a standalone
 * FileDropZoneItem gets them too. Colors come from theme and status tokens.
 */
export const FILE_DROP_ZONE_CSS = `
[data-slot='file-drop-zone'] .cantera-fdz-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image: radial-gradient(circle, currentColor 1px, transparent 1.4px);
  background-size: 12px 12px;
}
[data-slot='file-drop-zone'] .cantera-fdz-dots {
  color: var(--muted-foreground);
  opacity: 0.3;
}
[data-slot='file-drop-zone'] .cantera-fdz-bright {
  color: var(--primary);
  opacity: 0;
  transition: opacity 300ms ease-out;
}
[data-slot='file-drop-zone'] .cantera-fdz-scanline {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0;
  background:
    linear-gradient(90deg, transparent 6%, var(--primary) 50%, transparent 94%)
    top / 100% 2px no-repeat;
  transform: translateY(100%);
}
[data-slot='file-drop-zone'] .cantera-fdz-clearing {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(
    ellipse 62% 58% at 50% 50%,
    var(--card) 30%,
    color-mix(in oklab, var(--card) 55%, transparent) 55%,
    transparent 78%
  );
}
[data-slot='file-drop-zone'][data-phase='dragover'] .cantera-fdz-bright {
  opacity: 1;
  -webkit-mask-image: radial-gradient(
    circle 9rem at var(--fdz-x, 50%) var(--fdz-y, 50%),
    #000 25%,
    transparent 72%
  );
  mask-image: radial-gradient(
    circle 9rem at var(--fdz-x, 50%) var(--fdz-y, 50%),
    #000 25%,
    transparent 72%
  );
}
[data-slot='file-drop-zone'][data-phase='uploading'] .cantera-fdz-bright {
  opacity: 0.9;
  clip-path: inset(calc((1 - var(--fdz-progress, 0)) * 100%) 0 0 0);
  transition: clip-path 300ms linear, opacity 300ms ease-out;
}
[data-slot='file-drop-zone'][data-phase='uploading'] .cantera-fdz-scanline {
  opacity: 0.9;
  transform: translateY(calc((1 - var(--fdz-progress, 0)) * 100%));
  transition: transform 300ms linear, opacity 300ms ease-out;
}
[data-slot='file-drop-zone'][data-phase='processing'] .cantera-fdz-bright {
  opacity: 1;
  -webkit-mask-image: radial-gradient(ellipse at center, #000 0%, transparent 60%),
    radial-gradient(ellipse at center, #000 0%, transparent 62%);
  mask-image: radial-gradient(ellipse at center, #000 0%, transparent 60%),
    radial-gradient(ellipse at center, #000 0%, transparent 62%);
  -webkit-mask-repeat: no-repeat, no-repeat;
  mask-repeat: no-repeat, no-repeat;
  animation:
    cantera-fdz-settle 400ms ease-out forwards,
    cantera-fdz-morph 4.2s cubic-bezier(0.35, 1.55, 0.65, 1) 400ms infinite,
    cantera-fdz-breathe 1.9s cubic-bezier(0.66, 0, 0.34, 1) 400ms infinite;
}
[data-slot='file-drop-zone'][data-phase='complete'] .cantera-fdz-bright {
  color: ${statusCssVars.success};
  opacity: 0.75;
}
[data-slot='file-drop-zone'][data-phase='error'][data-tone='warning'] .cantera-fdz-bright {
  color: ${statusCssVars.warning};
  opacity: 0.6;
}
[data-slot='file-drop-zone'][data-phase='error'][data-tone='danger'] .cantera-fdz-bright {
  color: ${statusCssVars.danger};
  opacity: 0.6;
}
.cantera-fdz-shimmer {
  background: linear-gradient(
    90deg,
    currentColor 0%,
    currentColor 32%,
    color-mix(in oklab, currentColor 45%, transparent) 50%,
    currentColor 68%,
    currentColor 100%
  );
  background-size: 300% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: cantera-fdz-shine 2.25s cubic-bezier(0.25, 0.1, 0.25, 1) infinite;
}
.cantera-fdz-label {
  display: inline-block;
  opacity: 1;
  filter: blur(0);
  transition: opacity 150ms ease-out, filter 150ms ease-out;
}
@starting-style {
  .cantera-fdz-label {
    opacity: 0;
    filter: blur(2px);
  }
}
@keyframes cantera-fdz-settle {
  from {
    -webkit-mask-size: 300% 300%, 300% 300%;
    mask-size: 300% 300%, 300% 300%;
    -webkit-mask-position: 50% 50%, 50% 50%;
    mask-position: 50% 50%, 50% 50%;
  }
  to {
    -webkit-mask-size: 52% 46%, 40% 40%;
    mask-size: 52% 46%, 40% 40%;
    -webkit-mask-position: 16% 20%, 30% 32%;
    mask-position: 16% 20%, 30% 32%;
  }
}
@keyframes cantera-fdz-morph {
  0%, 100% {
    -webkit-mask-size: 52% 46%, 40% 40%;
    mask-size: 52% 46%, 40% 40%;
    -webkit-mask-position: 16% 20%, 30% 32%;
    mask-position: 16% 20%, 30% 32%;
  }
  25% {
    -webkit-mask-size: 46% 58%, 44% 38%;
    mask-size: 46% 58%, 44% 38%;
    -webkit-mask-position: 84% 16%, 66% 30%;
    mask-position: 84% 16%, 66% 30%;
  }
  50% {
    -webkit-mask-size: 60% 44%, 38% 46%;
    mask-size: 60% 44%, 38% 46%;
    -webkit-mask-position: 82% 84%, 62% 68%;
    mask-position: 82% 84%, 62% 68%;
  }
  75% {
    -webkit-mask-size: 48% 54%, 46% 40%;
    mask-size: 48% 54%, 46% 40%;
    -webkit-mask-position: 14% 82%, 34% 66%;
    mask-position: 14% 82%, 34% 66%;
  }
}
@keyframes cantera-fdz-breathe {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.55; }
}
@keyframes cantera-fdz-shine {
  0%, 15% { background-position: 100% 0; }
  85%, 100% { background-position: 0% 0; }
}
@media (prefers-reduced-motion: reduce) {
  [data-slot='file-drop-zone'] .cantera-fdz-bright,
  [data-slot='file-drop-zone'] .cantera-fdz-scanline {
    animation: none;
    transition: none;
  }
  [data-slot='file-drop-zone'][data-phase='processing'] .cantera-fdz-bright {
    -webkit-mask-image: none;
    mask-image: none;
    opacity: 0.45;
  }
  .cantera-fdz-shimmer {
    animation: none;
    background: none;
    -webkit-text-fill-color: currentColor;
  }
  .cantera-fdz-label {
    transition: opacity 150ms ease-out;
    filter: none;
  }
}
`

type ZonePhase = 'idle' | 'dragover' | 'uploading' | 'processing' | 'complete' | 'error'

/**
 * The zone summarizes its files as one phase. Bytes in flight outrank
 * everything (queued counts — the batch is still landing), then provider
 * work, then errors, and the zone only reads complete when every file made
 * it. An empty zone is idle.
 */
function derivePhase(files: UploadFile[]): Exclude<ZonePhase, 'dragover'> {
  if (files.some((f) => f.phase === 'uploading' || f.phase === 'queued')) return 'uploading'
  if (files.some((f) => f.phase === 'processing')) return 'processing'
  if (files.some((f) => f.phase === 'error')) return 'error'
  if (files.length > 0) return 'complete'
  return 'idle'
}

/**
 * Equal-weight mean across files still in play; a finished or processing
 * file counts as landed. Byte-weighting would be more precise but needs
 * every size up front, which streams and folder drops do not guarantee.
 */
function overallProgress(files: UploadFile[]): number {
  const active = files.filter((f) => f.phase !== 'error')
  if (active.length === 0) return 0
  const landed = active.reduce((total, f) => {
    if (f.phase === 'complete' || f.phase === 'processing') return total + 1
    if (f.phase === 'uploading') return total + Math.min(1, Math.max(0, f.progress ?? 0))
    return total
  }, 0)
  return landed / active.length
}

/** ".rvt,.ifc" → "RVT, IFC" for the default hint. MIME entries are skipped. */
function acceptSummary(accept?: string): string | null {
  if (!accept) return null
  const extensions = accept
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.startsWith('.'))
    .map((entry) => entry.slice(1).toUpperCase())
  return extensions.length > 0 ? extensions.join(', ') : null
}

/** "summit-tower.rvt" → "RVT", for the per-file format chip. */
function fileExtension(name: string): string | null {
  const dot = name.lastIndexOf('.')
  if (dot <= 0 || dot === name.length - 1) return null
  return name.slice(dot + 1).toUpperCase()
}

/**
 * Thenable check, not `instanceof Promise`: a polyfilled or cross-realm
 * promise is still a pending round trip the retry button must reflect.
 */
function isPromiseLike(value: void | Promise<void>): value is Promise<void> {
  return value != null && typeof (value as Promise<void>).then === 'function'
}

function percentFormatter(locale?: string): Intl.NumberFormat {
  return new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 })
}

const phaseLabels: Record<Exclude<ZonePhase, 'idle' | 'uploading'>, string> = {
  dragover: 'Release to add files',
  processing: 'Processing',
  complete: 'Upload complete',
  error: 'Some files need attention',
}

interface FileDropZoneProps
  extends Omit<
    React.ComponentProps<'div'>,
    'onDrop' | 'onDragOver' | 'onDragEnter' | 'onDragLeave'
  > {
  /**
   * The files to render, controlled by the consumer. The zone derives its
   * surface phase from them: any uploading file plots the grid, any
   * processing file starts the ambient glow, and the grid settles into a
   * status tint when everything lands or fails.
   */
  files?: UploadFile[]
  /**
   * Files that passed validation, from a drop or the picker. The component
   * never uploads — start the transfer here and drive `files` as it moves.
   */
  onDropFiles?: (files: File[]) => void | Promise<void>
  /** Files refused before any upload started, with the rule each broke. */
  onReject?: (rejections: UploadRejection[]) => void
  /**
   * Retry for a failed file. Promise-returning handlers drive the pending
   * state; the button keeps its label, spins, and stays put.
   */
  onRetry?: (file: UploadFile) => void | Promise<void>
  /** Remove a file's row — cancel in flight, clear it after it settled. */
  onRemove?: (file: UploadFile) => void
  /** Native accept grammar: extensions, MIME types, `type/*` wildcards. */
  accept?: string
  /** Cap on tracked files; extras reject as `file-count`. */
  maxFiles?: number
  /** Per-file byte ceiling; larger files reject as `file-size`. */
  maxSize?: number
  /** Accept several files per gesture. On by default — drops usually batch. */
  multiple?: boolean
  disabled?: boolean
  /** Idle headline. The zone swaps it for phase copy while work is running. */
  label?: string
  /** Caption under the headline. Defaults to the accept and size rules. */
  hint?: string
  /**
   * Render the built-in file rows. Files keep driving the grid either way;
   * turn this off to lay rows out yourself with FileDropZoneItem.
   */
  showList?: boolean
  /** Comfortable keeps 44px rows; compact is the desktop escape hatch. */
  density?: 'comfortable' | 'compact'
  /** BCP 47 tag for sizes and percentages. Defaults locale-neutral. */
  locale?: string
}

/**
 * A drafting-grid drop zone for heavy AEC files. The dot grid magnetizes
 * under a dragged file, plots bottom-up as bytes land, and glows while the
 * provider translates — with per-file rows on the async-pending contract.
 */
function FileDropZone({
  files = [],
  onDropFiles,
  onReject,
  onRetry,
  onRemove,
  accept,
  maxFiles,
  maxSize,
  multiple = true,
  disabled = false,
  label = 'Drag files here or browse',
  hint,
  showList = true,
  density = 'comfortable',
  locale,
  className,
  ...props
}: FileDropZoneProps) {
  const hintId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const surfaceRef = useRef<HTMLButtonElement>(null)
  const dragDepth = useRef(0)
  const [dragging, setDragging] = useState(false)

  const settledPhase = derivePhase(files)
  const phase: ZonePhase = dragging && !disabled ? 'dragover' : settledPhase
  const progress = overallProgress(files)
  const errorTone: StatusTone = files.some((f) => f.phase === 'error' && !f.retryable)
    ? 'danger'
    : 'warning'

  const percentFormat = useMemo(() => percentFormatter(locale), [locale])

  // An Escape-cancelled drag or a drop outside the page does not always
  // fire dragleave, which would leave the grid magnetized forever.
  useEffect(() => {
    if (!dragging) return
    const reset = () => {
      dragDepth.current = 0
      setDragging(false)
    }
    window.addEventListener('dragend', reset)
    window.addEventListener('blur', reset)
    document.addEventListener('drop', reset)
    return () => {
      window.removeEventListener('dragend', reset)
      window.removeEventListener('blur', reset)
      document.removeEventListener('drop', reset)
    }
  }, [dragging])

  const uploadingCount = files.filter((f) => f.phase === 'uploading' || f.phase === 'queued').length
  const processingFile = files.find((f) => f.phase === 'processing')
  const resolvedHint =
    hint ??
    [acceptSummary(accept), maxSize !== undefined ? `up to ${formatBytes(maxSize, locale)}` : null]
      .filter(Boolean)
      .join(' · ')

  const zoneLabel =
    phase === 'idle'
      ? label
      : phase === 'uploading'
        ? `Uploading ${uploadingCount} ${uploadingCount === 1 ? 'file' : 'files'}`
        : phase === 'processing'
          ? (processingFile?.processingLabel ?? phaseLabels.processing)
          : phaseLabels[phase]

  // Announce phase changes, not percentages — progress lives on the rows'
  // progressbar roles; a live region repeating numbers is chatter.
  const announcement = phase === 'idle' || phase === 'dragover' ? '' : zoneLabel

  function process(incoming: File[]) {
    const accepted: File[] = []
    const rejections: UploadRejection[] = []
    let room = maxFiles === undefined ? Number.POSITIVE_INFINITY : maxFiles - files.length
    for (const file of multiple ? incoming : incoming.slice(0, 1)) {
      if (!matchesAccept(file, accept)) rejections.push({ file, reason: 'file-type' })
      else if (maxSize !== undefined && file.size > maxSize)
        rejections.push({ file, reason: 'file-size' })
      else if (room <= 0) rejections.push({ file, reason: 'file-count' })
      else {
        accepted.push(file)
        room -= 1
      }
    }
    if (accepted.length > 0) void onDropFiles?.(accepted)
    if (rejections.length > 0) onReject?.(rejections)
  }

  function dragHasFiles(event: React.DragEvent) {
    return Array.from(event.dataTransfer.types).includes('Files')
  }

  function handleDragEnter(event: React.DragEvent<HTMLDivElement>) {
    if (!dragHasFiles(event)) return
    event.preventDefault()
    dragDepth.current += 1
    setDragging(true)
  }

  function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    if (!dragHasFiles(event)) return
    event.preventDefault()
    // The magnet follows the pointer through CSS vars written straight to
    // the DOM — dragover fires continuously and must not render.
    const surface = surfaceRef.current
    if (!surface) return
    const rect = surface.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 100
    const y = ((event.clientY - rect.top) / rect.height) * 100
    surface.style.setProperty('--fdz-x', `${Math.min(100, Math.max(0, x))}%`)
    surface.style.setProperty('--fdz-y', `${Math.min(100, Math.max(0, y))}%`)
  }

  function handleDragLeave(event: React.DragEvent<HTMLDivElement>) {
    if (!dragHasFiles(event)) return
    dragDepth.current = Math.max(0, dragDepth.current - 1)
    if (dragDepth.current === 0) setDragging(false)
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    if (!dragHasFiles(event)) return
    event.preventDefault()
    dragDepth.current = 0
    setDragging(false)
    if (disabled) return
    process(Array.from(event.dataTransfer.files))
  }

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: drag-and-drop is a pointer-only enhancement on the wrapper; the accessible path is the picker button inside, which owns role, name, and keyboard activation
    <div
      data-slot="file-drop-zone"
      data-phase={phase}
      data-tone={phase === 'error' ? errorTone : phase === 'complete' ? 'success' : undefined}
      data-density={density}
      className={cn('group flex w-full flex-col gap-3', className)}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      {...props}
    >
      <style href="cantera-file-drop-zone" precedence="medium">
        {FILE_DROP_ZONE_CSS}
      </style>
      <button
        ref={surfaceRef}
        type="button"
        aria-disabled={disabled || undefined}
        aria-describedby={resolvedHint ? hintId : undefined}
        onClick={() => {
          if (!disabled) inputRef.current?.click()
        }}
        style={{ '--fdz-progress': String(progress) } as React.CSSProperties}
        className={cn(
          'relative isolate flex w-full flex-col items-center justify-center gap-2',
          'overflow-hidden rounded-xl border-2 border-dashed border-border bg-card px-6',
          'text-center outline-none transition-colors duration-200 motion-reduce:transition-none',
          'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
          'active:bg-muted/40 aria-disabled:opacity-60',
          density === 'comfortable' ? 'min-h-52 py-10' : 'min-h-36 py-6',
          'group-data-[phase=dragover]:border-primary',
          'group-data-[tone=success]:border-status-success/50',
          'group-data-[tone=warning]:border-status-warning/50',
          'group-data-[tone=danger]:border-status-danger/50',
        )}
      >
        <span aria-hidden className="cantera-fdz-layer cantera-fdz-dots" />
        <span aria-hidden className="cantera-fdz-layer cantera-fdz-bright" />
        <span aria-hidden className="cantera-fdz-scanline" />
        <span aria-hidden className="cantera-fdz-clearing" />
        <span className="relative z-10 grid size-6 place-items-center">
          <UploadIcon
            aria-hidden
            className={cn(
              'col-start-1 row-start-1 size-5 text-muted-foreground',
              'transition-opacity duration-150 ease-out motion-reduce:transition-none',
              phase === 'idle' || phase === 'dragover' ? 'opacity-100' : 'opacity-0',
            )}
          />
          <LoaderCircleIcon
            aria-hidden
            className={cn(
              'col-start-1 row-start-1 size-5 text-muted-foreground',
              'transition-opacity duration-150 ease-out motion-reduce:transition-none',
              phase === 'uploading' || phase === 'processing'
                ? 'animate-spin opacity-100 [animation-duration:700ms]'
                : 'opacity-0',
            )}
          />
          <CheckIcon
            aria-hidden
            className={cn(
              'col-start-1 row-start-1 size-5',
              statusInkClasses.success,
              'transition-opacity duration-150 ease-out motion-reduce:transition-none',
              phase === 'complete' ? 'opacity-100' : 'opacity-0',
            )}
          />
          <TriangleAlertIcon
            aria-hidden
            className={cn(
              'col-start-1 row-start-1 size-5',
              statusInkClasses[errorTone],
              'transition-opacity duration-150 ease-out motion-reduce:transition-none',
              phase === 'error' ? 'opacity-100' : 'opacity-0',
            )}
          />
        </span>
        <span className="relative z-10 flex items-baseline gap-2 font-medium text-sm">
          {/* Keyed by text so each phase label re-enters through the
              starting-style fade — a soft swap instead of a hard cut. */}
          <span
            key={zoneLabel}
            className={cn('cantera-fdz-label', phase === 'processing' && 'cantera-fdz-shimmer')}
          >
            {zoneLabel}
          </span>
          {phase === 'uploading' ? (
            <span className="text-muted-foreground text-xs tabular-nums">
              {percentFormat.format(progress)}
            </span>
          ) : null}
        </span>
        {resolvedHint ? (
          <span id={hintId} className="relative z-10 text-muted-foreground text-xs">
            {resolvedHint}
          </span>
        ) : null}
      </button>
      <input
        ref={inputRef}
        type="file"
        tabIndex={-1}
        aria-hidden
        multiple={multiple}
        accept={accept}
        disabled={disabled}
        className="sr-only"
        onChange={(event) => {
          const list = event.currentTarget.files
          if (list && list.length > 0) process(Array.from(list))
          event.currentTarget.value = ''
        }}
      />
      <output aria-live="polite" className="sr-only">
        {announcement}
      </output>
      {showList && files.length > 0 ? (
        <ul className="flex w-full flex-col gap-2">
          {files.map((file) => (
            <FileDropZoneItem
              key={file.id}
              file={file}
              density={density}
              locale={locale}
              onRetry={onRetry}
              onRemove={onRemove}
            />
          ))}
        </ul>
      ) : null}
    </div>
  )
}

interface FileDropZoneItemProps extends React.ComponentProps<'li'> {
  /** The file to render: name, format and size chip, and phase treatment. */
  file: UploadFile
  /**
   * Retry for a failed file. Promise-returning handlers drive the pending
   * state; the button keeps its label, spins, and stays put.
   */
  onRetry?: (file: UploadFile) => void | Promise<void>
  /** Pending state for the retry action, drivable from outside. */
  retryPending?: boolean
  /** Remove the row — cancel in flight, clear it after it settled. */
  onRemove?: (file: UploadFile) => void
  /** Comfortable keeps the 44px field target; compact is the escape hatch. */
  density?: 'comfortable' | 'compact'
  /** BCP 47 tag for sizes and percentages. Defaults locale-neutral. */
  locale?: string
}

/**
 * One file row: name, format and size chip, and the phase treatment —
 * progressbar, shimmer label, check, or error with retry. Rendered by the
 * zone's built-in list, and exported for laying rows out anywhere else.
 */
function FileDropZoneItem({
  file,
  onRetry,
  retryPending = false,
  onRemove,
  density = 'comfortable',
  locale,
  className,
  ...props
}: FileDropZoneItemProps) {
  const errorId = useId()
  const [internalPending, setInternalPending] = useState(false)
  const busy = retryPending || internalPending
  const percentFormat = useMemo(() => percentFormatter(locale), [locale])
  const tone: StatusTone =
    file.phase === 'error' ? (file.retryable ? 'warning' : 'danger') : 'neutral'
  const extension = fileExtension(file.name)
  const meta = [extension, file.size !== undefined ? formatBytes(file.size, locale) : null]
    .filter(Boolean)
    .join(' · ')
  const fraction = Math.min(1, Math.max(0, file.progress ?? 0))

  function handleRetry() {
    const result = onRetry?.(file)
    if (isPromiseLike(result)) {
      setInternalPending(true)
      void result.finally(() => setInternalPending(false))
    }
  }

  return (
    <li
      data-slot="file-drop-zone-item"
      data-phase={file.phase}
      className={cn(
        'flex items-center gap-3 rounded-lg border border-border bg-card px-3 transition-colors',
        density === 'comfortable' ? 'min-h-11' : 'min-h-9',
        file.phase === 'error' &&
          (tone === 'danger' ? 'border-status-danger/50' : 'border-status-warning/50'),
        className,
      )}
      {...props}
    >
      <style href="cantera-file-drop-zone" precedence="medium">
        {FILE_DROP_ZONE_CSS}
      </style>
      <FileIcon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm">{file.name}</span>
        {file.phase === 'error' && file.error ? (
          <span id={errorId} className={cn('block truncate text-xs', statusInkClasses[tone])}>
            {file.error}
          </span>
        ) : null}
      </span>
      {meta ? (
        <span className="shrink-0 text-muted-foreground text-xs tabular-nums">{meta}</span>
      ) : null}
      {file.phase === 'uploading' ? (
        <span className="flex shrink-0 items-center gap-2">
          <span
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(fraction * 100)}
            aria-label={`Uploading ${file.name}`}
            className="h-1 w-24 overflow-hidden rounded-full bg-muted"
          >
            <span
              className={cn(
                'block h-full w-full origin-left bg-primary transition-transform duration-300',
                'ease-linear motion-reduce:transition-none',
              )}
              style={{ transform: `scaleX(${fraction})` }}
            />
          </span>
          <span className="w-9 text-right text-muted-foreground text-xs tabular-nums">
            {percentFormat.format(fraction)}
          </span>
        </span>
      ) : null}
      {file.phase === 'queued' ? (
        <span className="shrink-0 text-muted-foreground text-xs">Queued</span>
      ) : null}
      {file.phase === 'processing' ? (
        <span className="cantera-fdz-shimmer shrink-0 text-muted-foreground text-xs">
          {file.processingLabel ?? 'Processing'}
        </span>
      ) : null}
      {file.phase === 'complete' ? (
        <CheckIcon aria-hidden className={cn('size-4 shrink-0', statusInkClasses.success)} />
      ) : null}
      {file.phase === 'error' && onRetry ? (
        <Button
          variant="outline"
          size="xs"
          disabled={busy}
          focusableWhenDisabled
          aria-busy={busy || undefined}
          aria-describedby={file.error ? errorId : undefined}
          onClick={handleRetry}
          // The pseudo-element extends the hit area to the 44px floor.
          className="relative shrink-0 gap-0 after:absolute after:-inset-y-2 after:inset-x-0"
        >
          <span
            className={cn(
              'grid shrink-0 place-items-center overflow-hidden transition-[width,margin]',
              'duration-150 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none',
              busy ? 'mr-1 w-3' : 'mr-0 w-0',
            )}
          >
            <LoaderCircleIcon aria-hidden className="size-3 animate-spin" />
          </span>
          Retry
        </Button>
      ) : null}
      {onRemove ? (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={
            file.phase === 'uploading' || file.phase === 'queued'
              ? `Cancel upload of ${file.name}`
              : `Remove ${file.name}`
          }
          onClick={() => onRemove(file)}
          // The pseudo-element extends the hit area to the 44px floor.
          className="relative shrink-0 after:absolute after:-inset-2"
        >
          <XIcon aria-hidden />
        </Button>
      ) : null}
    </li>
  )
}

export { FileDropZone, FileDropZoneItem, type FileDropZoneItemProps, type FileDropZoneProps }

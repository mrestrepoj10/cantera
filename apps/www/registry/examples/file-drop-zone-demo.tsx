'use client'

import { useEffect, useRef, useState } from 'react'

import { FileDropZone } from '@/components/ui/file-drop-zone'
import { MODEL_FILE_ACCEPT, type UploadFile, type UploadRejection } from '@/lib/upload-types'

/**
 * A simulated pipeline so every surface state is reachable without a
 * backend: dropped files upload on a timer, translate for a few seconds,
 * then complete. Files ending in .dwg drop the connection once at 65% to
 * show the retryable warning path. One seeded file translates forever so
 * the ambient processing state stays visible.
 */
const SEED_PROCESSING_ID = 'seed-processing'

const initialFiles: UploadFile[] = [
  {
    id: 'seed-complete',
    name: 'summit-tower.rvt',
    size: 248_000_000,
    phase: 'complete',
  },
  {
    id: SEED_PROCESSING_ID,
    name: 'cedar-mill-site.nwd',
    size: 612_000_000,
    phase: 'processing',
    processingLabel: 'Translating model',
  },
]

const rejectionCopy: Record<UploadRejection['reason'], string> = {
  'file-type': 'not an accepted format',
  'file-size': 'over the size limit',
  'file-count': 'too many files',
}

/** Steady per-file upload speed, varied a little by id so bars diverge. */
function stepFor(id: string): number {
  let hash = 0
  for (const char of id) hash += char.charCodeAt(0)
  return 0.03 + (hash % 5) * 0.012
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

export function FileDropZoneDemo() {
  const [files, setFiles] = useState<UploadFile[]>(initialFiles)
  const [rejections, setRejections] = useState<UploadRejection[]>([])
  const idCounter = useRef(0)
  const translateTimers = useRef(new Map<string, number>())

  // Advance uploading files; a .dwg loses its connection once, everything
  // else hands off to the simulated translation at 100%. Failure triggers
  // on crossing 65%, so the updater stays pure (StrictMode runs it twice)
  // and a retry resumes cleanly — the stored progress is already past it.
  useEffect(() => {
    if (!files.some((file) => file.phase === 'uploading')) return
    const timer = window.setInterval(() => {
      setFiles((current) =>
        current.map((file) => {
          if (file.phase !== 'uploading') return file
          const progress = Math.min(1, (file.progress ?? 0) + stepFor(file.id))
          const shouldFail =
            file.name.toLowerCase().endsWith('.dwg') &&
            (file.progress ?? 0) < 0.65 &&
            progress >= 0.65
          if (shouldFail) {
            return {
              ...file,
              progress,
              phase: 'error',
              retryable: true,
              error: 'Connection interrupted — retry to resume.',
            }
          }
          if (progress >= 1) {
            return {
              ...file,
              progress: 1,
              phase: 'processing',
              processingLabel: 'Translating model',
            }
          }
          return { ...file, progress }
        }),
      )
    }, 200)
    return () => window.clearInterval(timer)
  }, [files])

  // Each translation completes after a few seconds — except the seeded one,
  // which keeps the ambient state on screen.
  useEffect(() => {
    for (const file of files) {
      if (file.phase !== 'processing') continue
      if (file.id === SEED_PROCESSING_ID) continue
      if (translateTimers.current.has(file.id)) continue
      translateTimers.current.set(
        file.id,
        window.setTimeout(() => {
          translateTimers.current.delete(file.id)
          setFiles((current) =>
            current.map((entry) =>
              entry.id === file.id ? { ...entry, phase: 'complete' } : entry,
            ),
          )
        }, 3200),
      )
    }
  }, [files])

  useEffect(() => {
    const timers = translateTimers.current
    return () => {
      for (const timer of timers.values()) window.clearTimeout(timer)
    }
  }, [])

  return (
    <div className="flex w-full flex-col gap-3">
      <FileDropZone
        files={files}
        accept={MODEL_FILE_ACCEPT}
        maxSize={800_000_000}
        maxFiles={8}
        onDropFiles={(accepted) => {
          setRejections([])
          setFiles((current) => [
            ...current,
            ...accepted.map((file) => {
              idCounter.current += 1
              return {
                id: `drop-${idCounter.current}`,
                name: file.name,
                size: file.size,
                phase: 'uploading' as const,
                progress: 0,
              }
            }),
          ])
        }}
        onReject={setRejections}
        onRetry={async (file) => {
          await delay(700)
          setFiles((current) =>
            current.map((entry) =>
              entry.id === file.id ? { ...entry, phase: 'uploading', error: undefined } : entry,
            ),
          )
        }}
        onRemove={(file) => {
          const timer = translateTimers.current.get(file.id)
          if (timer !== undefined) {
            window.clearTimeout(timer)
            translateTimers.current.delete(file.id)
          }
          setFiles((current) => current.filter((entry) => entry.id !== file.id))
        }}
      />
      {rejections.length > 0 ? (
        <p className="text-muted-foreground text-xs">
          {rejections
            .map((rejection) => `${rejection.file.name} (${rejectionCopy[rejection.reason]})`)
            .join(', ')}
        </p>
      ) : null}
    </div>
  )
}

'use client'

import {
  BoxesIcon,
  BoxIcon,
  Building2Icon,
  EyeOffIcon,
  KeyRoundIcon,
  LoaderCircleIcon,
  PlusIcon,
  UploadIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { APSViewer } from '@/components/ui/aps-viewer/aps-viewer'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FileDropZone } from '@/components/ui/file-drop-zone'
import type { FinderEntry } from '@/components/ui/finder'
import { HubSidebar } from '@/components/ui/hub-sidebar'
import type { HubTreeItemNode } from '@/components/ui/hub-tree'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ModelStatusCard } from '@/components/ui/model-status-card'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { type Item, type ModelTranslationStatus, normalizeSearchText } from '@/lib/project-types'
import { MODEL_FILE_ACCEPT, type UploadFile, type UploadRejection } from '@/lib/upload-types'
import { cn } from '@/lib/utils'
import { AEC_STARTER_EXTENSIONS } from '@/lib/viewer-extension-types'
import type { GetAccessToken } from '@/lib/viewer-types'

export interface ModelUploadProps {
  uploadEndpoint?: string
  viewerTokenEndpoint?: string
  embedded?: boolean
}

interface BucketModel {
  name: string
  urn: string
  size?: number
  status?: ModelTranslationStatus
}

type ModelsState =
  | { status: 'loading' }
  | { status: 'ready'; models: BucketModel[] }
  | { status: 'error'; message: string }

interface TranslationSnapshot {
  status: ModelTranslationStatus
  progress?: string
  messages: string[]
}

type SelectionState =
  | { kind: 'checking' }
  | { kind: 'translating'; snapshot: TranslationSnapshot }
  | { kind: 'ready' }
  | { kind: 'failed'; snapshot: TranslationSnapshot }

interface ViewerIssue {
  kind: 'unviewable' | 'no-credentials' | 'error'
  detail: string
}

interface StartResponse {
  objectKey?: string
  objectId?: string
  uploadKey?: string
  urls?: string[]
  partSize?: number
  error?: string
}

interface FinishResponse {
  urn?: string
  error?: string
}

interface StatusResponse {
  status?: ModelTranslationStatus
  progress?: string
  messages?: string[]
  error?: string
}

interface ActiveUpload {
  file: File
  controller: AbortController
  zipEntrypoint?: string
  xhr?: XMLHttpRequest
  cancelled?: boolean
  lastProgressAt?: number
  /** Set once finish succeeds — retries resume polling, never re-upload. */
  urn?: string
}

const UPLOAD_ACCEPT = `${MODEL_FILE_ACCEPT},.zip`
const STATUS_POLL_MS = 2500
const STATUS_POLL_MAX_MS = 15_000
const STATUS_POLL_TIMEOUT_MS = 10 * 60 * 1000
const PROGRESS_UPDATE_MS = 100
const EMPTY_MODELS: BucketModel[] = []

const rejectionReasonLabel = {
  'file-type': 'is not a supported file type',
  'file-size': 'is larger than the size limit',
  'file-count': 'exceeds the file limit',
} satisfies Record<UploadRejection['reason'], string>

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('The operation was aborted.', 'AbortError'))
      return
    }
    const onAbort = () => {
      window.clearTimeout(timer)
      reject(new DOMException('The operation was aborted.', 'AbortError'))
    }
    const timer = window.setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

function nextPollDelay(current: number): number {
  return Math.min(STATUS_POLL_MAX_MS, Math.round(current * 1.5))
}

function isZip(name: string): boolean {
  return name.toLowerCase().endsWith('.zip')
}

function viewerIssueFor(error: Error): ViewerIssue {
  if (
    error.message.includes('viewer token is unavailable') ||
    error.message.includes('getAccessToken failed')
  ) {
    return { kind: 'no-credentials', detail: error.message }
  }
  const unviewable =
    /Document\.load failed \(5\)/.test(error.message) ||
    /\b404\b/.test(error.message) ||
    error.message.includes('document has no viewable geometry')
  return { kind: unviewable ? 'unviewable' : 'error', detail: error.message }
}

function PaneState({
  icon,
  title,
  description,
  children,
  role,
}: {
  icon: ReactNode
  title: string
  description: ReactNode
  children?: ReactNode
  role?: 'status'
}) {
  return (
    <div role={role} className="flex max-w-sm flex-col items-center text-center">
      <span className="grid size-12 place-items-center rounded-lg bg-background text-muted-foreground shadow-sm">
        {icon}
      </span>
      <h2 className="mt-4 text-balance font-heading font-medium text-lg">{title}</h2>
      <p className="mt-1.5 text-pretty text-muted-foreground text-sm">{description}</p>
      {children}
    </div>
  )
}

function modelNode(model: BucketModel): HubTreeItemNode {
  const item: Item = {
    id: model.urn,
    name: model.name,
    type: 'item',
    translationStatus: model.status,
    tip: {
      id: model.urn,
      versionNumber: 1,
      displayName: model.name,
      createTime: '',
      createdBy: '',
      storageSize: model.size ?? 0,
      derivativeUrn: model.urn,
    },
  }
  return {
    id: `model:${model.urn}`,
    name: model.name,
    type: 'item',
    value: item,
    hasChildren: false,
  }
}

function ModelUpload({
  uploadEndpoint = '/api/models/upload',
  viewerTokenEndpoint = '/api/viewer-token',
  embedded = false,
}: ModelUploadProps) {
  const [modelsState, setModelsState] = useState<ModelsState>({ status: 'loading' })
  const [selected, setSelected] = useState<{ urn: string; name: string }>()
  const [selectionState, setSelectionState] = useState<SelectionState>({ kind: 'checking' })
  const [viewerIssue, setViewerIssue] = useState<ViewerIssue>()
  const [query, setQuery] = useState('')
  const [uploadOpen, setUploadOpen] = useState(false)
  const [files, setFiles] = useState<UploadFile[]>([])
  const [pendingZips, setPendingZips] = useState<{ id: string; name: string; entry: string }[]>([])
  const [rejection, setRejection] = useState<string>()
  const [sheets, setSheets] = useState(true)
  const [models3d, setModels3d] = useState(true)
  const [masterViews, setMasterViews] = useState(false)
  const uploads = useRef(new Map<string, ActiveUpload>())
  const completedUrns = useRef(new Set<string>())

  useEffect(
    () => () => {
      for (const upload of uploads.current.values()) {
        upload.cancelled = true
        upload.controller.abort()
        upload.xhr?.abort()
      }
      uploads.current.clear()
    },
    [],
  )

  // Callers set the loading state first; the initial load relies on the
  // state initializer so the effect never writes state synchronously.
  const loadModels = useCallback(
    (signal?: AbortSignal) =>
      fetch(`${uploadEndpoint}?kind=models`, { cache: 'no-store', signal })
        .then(async (response) => {
          const body = (await response.json()) as { models?: BucketModel[]; error?: string }
          if (!response.ok || !body.models) {
            throw new Error(body.error ?? 'Models could not be listed.')
          }
          setModelsState({ status: 'ready', models: body.models })
          return body.models
        })
        .catch((error: unknown) => {
          if (signal?.aborted) return [] as BucketModel[]
          setModelsState({
            status: 'error',
            message: error instanceof Error ? error.message : 'Models could not be listed.',
          })
          return [] as BucketModel[]
        }),
    [uploadEndpoint],
  )

  useEffect(() => {
    const controller = new AbortController()
    void loadModels(controller.signal).then((models) => {
      // A shared link restores its model: ?urn=... names the selection.
      const shared = new URLSearchParams(window.location.search).get('urn')
      if (!shared) return
      const model = models.find((entry) => entry.urn === shared)
      if (model) {
        if (model.status === 'success') completedUrns.current.add(model.urn)
        setSelected(model)
        setSelectionState({ kind: model.status === 'success' ? 'ready' : 'checking' })
        setViewerIssue(undefined)
      }
    })
    return () => controller.abort()
  }, [loadModels])

  function selectModel(
    model: { urn: string; name: string },
    options?: { fromUrl?: boolean; ready?: boolean },
  ): void {
    if (options?.ready) completedUrns.current.add(model.urn)
    setSelected(model)
    setSelectionState({ kind: options?.ready ? 'ready' : 'checking' })
    setViewerIssue(undefined)
    if (!embedded && !options?.fromUrl) {
      const url = new URL(window.location.href)
      url.searchParams.set('urn', model.urn)
      window.history.replaceState(null, '', url)
    }
  }

  // The selected model renders only once its manifest settles: poll while the
  // translation is still running.
  useEffect(() => {
    if (!selected) return
    if (completedUrns.current.has(selected.urn)) return
    const controller = new AbortController()
    async function track(urn: string): Promise<void> {
      const deadline = Date.now() + STATUS_POLL_TIMEOUT_MS
      let pollDelay = STATUS_POLL_MS
      while (Date.now() < deadline && !controller.signal.aborted) {
        try {
          const response = await fetch(
            `${uploadEndpoint}?kind=status&urn=${encodeURIComponent(urn)}`,
            {
              cache: 'no-store',
              signal: controller.signal,
            },
          )
          const body = (await response.json()) as StatusResponse
          if (controller.signal.aborted) return
          if (!response.ok) throw new Error(body.error ?? 'The translation status is unavailable.')
          const snapshot: TranslationSnapshot = {
            status: body.status ?? 'pending',
            progress: body.progress,
            messages: body.messages ?? [],
          }
          if (snapshot.status === 'success') {
            setSelectionState({ kind: 'ready' })
            return
          }
          if (snapshot.status === 'failed' || snapshot.status === 'timeout') {
            setSelectionState({ kind: 'failed', snapshot })
            return
          }
          setSelectionState({ kind: 'translating', snapshot })
        } catch (error) {
          if (controller.signal.aborted) return
          setSelectionState({
            kind: 'failed',
            snapshot: {
              status: 'failed',
              messages: [
                error instanceof Error ? error.message : 'The translation status is unavailable.',
              ],
            },
          })
          return
        }
        await delay(pollDelay, controller.signal).catch(() => undefined)
        pollDelay = nextPollDelay(pollDelay)
      }
    }
    void track(selected.urn)
    return () => controller.abort()
  }, [selected, uploadEndpoint])

  const getAccessToken = useCallback<GetAccessToken>(async () => {
    const response = await fetch(viewerTokenEndpoint, { cache: 'no-store' })
    if (!response.ok) throw new Error('The viewer token is unavailable.')
    return (await response.json()) as Awaited<ReturnType<GetAccessToken>>
  }, [viewerTokenEndpoint])

  function patchFile(id: string, patch: Partial<UploadFile>): void {
    setFiles((current) =>
      current.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)),
    )
  }

  async function postUpload<T>(body: unknown, signal: AbortSignal): Promise<T> {
    const response = await fetch(uploadEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    })
    const parsed = (await response.json()) as T & { error?: string }
    if (!response.ok) throw new Error(parsed.error ?? 'The upload request failed.')
    return parsed
  }

  function putPart(
    id: string,
    url: string,
    part: Blob,
    onProgress: (loaded: number) => void,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const active = uploads.current.get(id)
      if (!active || active.cancelled) {
        reject(new Error('cancelled'))
        return
      }
      const xhr = new XMLHttpRequest()
      active.xhr = xhr
      xhr.open('PUT', url)
      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) return
        const now = performance.now()
        if (event.loaded < event.total && now - (active.lastProgressAt ?? 0) < PROGRESS_UPDATE_MS) {
          return
        }
        active.lastProgressAt = now
        onProgress(event.loaded)
      }
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve()
        else if (xhr.status === 413) {
          reject(new Error('The file is larger than this storage accepts.'))
        } else reject(new Error(`Upload failed (${xhr.status}).`))
      }
      xhr.onerror = () => reject(new Error('Upload failed. Check your connection.'))
      xhr.onabort = () => reject(new Error('cancelled'))
      xhr.send(part)
    })
  }

  async function trackUploadTranslation(id: string, urn: string): Promise<boolean> {
    let elapsed = 0
    let pollDelay = STATUS_POLL_MS
    while (elapsed < STATUS_POLL_TIMEOUT_MS) {
      const active = uploads.current.get(id)
      if (!active || active.cancelled) return false
      const response = await fetch(`${uploadEndpoint}?kind=status&urn=${encodeURIComponent(urn)}`, {
        cache: 'no-store',
        signal: active.controller.signal,
      })
      const body = (await response.json()) as StatusResponse
      if (!response.ok) throw new Error(body.error ?? 'The translation status is unavailable.')
      if (body.status === 'success') {
        patchFile(id, { phase: 'complete', processingLabel: undefined })
        completedUrns.current.add(urn)
        return true
      }
      if (body.status === 'failed' || body.status === 'timeout') {
        patchFile(id, {
          phase: 'error',
          error: body.messages?.[0] ?? 'The upload finished but translation failed.',
          retryable: false,
        })
        return false
      }
      patchFile(id, {
        processingLabel: body.progress ? `Translating · ${body.progress}` : 'Translating',
      })
      await delay(pollDelay, active.controller.signal)
      elapsed += pollDelay
      pollDelay = nextPollDelay(pollDelay)
    }
    throw new Error('Translation is taking longer than expected.')
  }

  async function runUpload(id: string): Promise<void> {
    const active = uploads.current.get(id)
    if (!active) return
    const { file } = active
    try {
      if (active.urn) {
        patchFile(id, { phase: 'processing', processingLabel: 'Translating', error: undefined })
        if (!(await trackUploadTranslation(id, active.urn))) return
      } else {
        patchFile(id, { phase: 'queued', progress: undefined, error: undefined })
        const start = await postUpload<StartResponse>(
          {
            kind: 'start',
            name: file.name,
            size: file.size,
          },
          active.controller.signal,
        )
        if (
          !start.objectKey ||
          !start.objectId ||
          !start.uploadKey ||
          !start.urls?.length ||
          !start.partSize
        ) {
          throw new Error('The upload could not be started.')
        }
        patchFile(id, { phase: 'uploading', progress: 0 })
        for (let index = 0; index < start.urls.length; index += 1) {
          const url = start.urls[index]
          if (!url) throw new Error('The upload could not be started.')
          const from = index * start.partSize
          const part = file.slice(from, Math.min(file.size, from + start.partSize))
          await putPart(id, url, part, (loaded) => {
            patchFile(id, { progress: file.size > 0 ? (from + loaded) / file.size : 1 })
          })
        }
        patchFile(id, { phase: 'processing', progress: undefined, processingLabel: 'Translating' })
        const finish = await postUpload<FinishResponse>(
          {
            kind: 'finish',
            name: file.name,
            objectKey: start.objectKey,
            objectId: start.objectId,
            uploadKey: start.uploadKey,
            views: [...(sheets ? ['2d' as const] : []), ...(models3d ? ['3d' as const] : [])],
            masterViews,
            zipEntrypoint: active.zipEntrypoint,
          },
          active.controller.signal,
        )
        if (!finish.urn) throw new Error('The version could not be created.')
        active.urn = finish.urn
        if (!(await trackUploadTranslation(id, finish.urn))) return
      }
      const current = uploads.current.get(id)
      if (!current || current.cancelled) return
      const models = await loadModels(active.controller.signal)
      const uploaded = models.find((entry) => entry.urn === active.urn)
      if (uploaded) selectModel(uploaded, { ready: true })
      uploads.current.delete(id)
    } catch (error) {
      const current = uploads.current.get(id)
      if (!current || current.cancelled || active.controller.signal.aborted) return
      const message = error instanceof Error ? error.message : 'The upload failed.'
      if (message === 'cancelled') return
      patchFile(id, { phase: 'error', progress: undefined, error: message, retryable: true })
    } finally {
      active.xhr = undefined
    }
  }

  function startFile(file: File, zipEntrypoint?: string): void {
    const id = crypto.randomUUID()
    uploads.current.set(id, { file, zipEntrypoint, controller: new AbortController() })
    setFiles((current) => [...current, { id, name: file.name, size: file.size, phase: 'queued' }])
    void runUpload(id)
  }

  function handleDropFiles(dropped: File[]): void {
    setRejection(undefined)
    for (const file of dropped) {
      if (isZip(file.name)) {
        // An archive translates its root design file — ask which one first.
        const id = crypto.randomUUID()
        uploads.current.set(id, { file, controller: new AbortController() })
        setPendingZips((current) => [...current, { id, name: file.name, entry: '' }])
        continue
      }
      startFile(file)
    }
  }

  function startZip(id: string): void {
    const pending = pendingZips.find((entry) => entry.id === id)
    const active = uploads.current.get(id)
    if (!pending || !active || !pending.entry.trim()) return
    active.zipEntrypoint = pending.entry.trim()
    setPendingZips((current) => current.filter((entry) => entry.id !== id))
    setFiles((current) => [
      ...current,
      { id, name: active.file.name, size: active.file.size, phase: 'queued' },
    ])
    void runUpload(id)
  }

  function handleReject(rejections: UploadRejection[]): void {
    const first = rejections[0]
    if (!first) return
    const rest = rejections.length - 1
    setRejection(
      `${first.file.name} ${rejectionReasonLabel[first.reason]}${
        rest > 0 ? ` (and ${rest} more ${rest === 1 ? 'file was' : 'files were'} skipped)` : ''
      }.`,
    )
  }

  function handleRemove(file: UploadFile): void {
    const active = uploads.current.get(file.id)
    if (active) {
      active.cancelled = true
      active.controller.abort()
      active.xhr?.abort()
      uploads.current.delete(file.id)
    }
    setFiles((current) => current.filter((entry) => entry.id !== file.id))
  }

  function removePendingZip(id: string): void {
    const active = uploads.current.get(id)
    if (active) {
      active.cancelled = true
      active.controller.abort()
      uploads.current.delete(id)
    }
    setPendingZips((current) => current.filter((entry) => entry.id !== id))
  }

  async function handleRetry(file: UploadFile): Promise<void> {
    const active = uploads.current.get(file.id)
    if (!active) return
    active.cancelled = false
    active.controller = new AbortController()
    active.xhr = undefined
    await runUpload(file.id)
  }

  const models = modelsState.status === 'ready' ? modelsState.models : EMPTY_MODELS
  const nodes = useMemo(() => models.map(modelNode), [models])
  const finderEntries: FinderEntry[] = useMemo(() => {
    const term = normalizeSearchText(query.trim())
    return term
      ? models
          .filter((model) => normalizeSearchText(model.name).includes(term))
          .map((model) => ({ item: modelNode(model).value }))
      : []
  }, [models, query])

  const treeEmpty =
    modelsState.status === 'loading' ? (
      <output className="flex min-h-11 items-center gap-2 px-2 py-4 text-muted-foreground text-xs">
        <LoaderCircleIcon aria-hidden className="size-3.5 animate-spin" />
        Loading models
      </output>
    ) : modelsState.status === 'error' ? (
      <div role="alert" className="flex flex-col items-start gap-3 px-2 py-4">
        <p className="text-sm">{modelsState.message}</p>
        <Button
          variant="outline"
          size="sm"
          className="relative after:absolute after:-inset-y-2 after:inset-x-0"
          onClick={() => {
            setModelsState({ status: 'loading' })
            void loadModels()
          }}
        >
          Retry
        </Button>
      </div>
    ) : (
      <div className="flex flex-col items-start px-2 py-4">
        <p className="font-medium text-sm">No models yet</p>
        <p className="mt-1 text-muted-foreground text-xs">
          Upload a Revit, IFC, DWG, or Navisworks file to view it here.
        </p>
        <Button
          variant="outline"
          className="mt-4 min-h-11 w-full"
          onClick={() => setUploadOpen(true)}
        >
          <UploadIcon aria-hidden />
          Upload a model
        </Button>
      </div>
    )

  const failedTranslation =
    selected && selectionState.kind === 'failed'
      ? {
          urn: selected.urn,
          name: selected.name,
          status: selectionState.snapshot.status,
          progress: selectionState.snapshot.progress,
          error: selectionState.snapshot.messages[0] ?? 'Translation failed.',
        }
      : undefined

  return (
    <SidebarProvider
      className={
        embedded
          ? 'relative h-[36rem] min-h-[36rem] overflow-hidden bg-background'
          : 'h-svh min-h-[32rem] overflow-hidden bg-background'
      }
    >
      <HubSidebar
        user={{
          name: 'Model library',
          detail: 'App storage',
          avatar: (
            <span className="grid size-8 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <BoxesIcon aria-hidden className="size-4" />
            </span>
          ),
        }}
        finder={{
          query,
          onQueryChange: setQuery,
          groups: [{ id: 'models', label: 'Models', entries: finderEntries }],
          onItemOpen: (entry) =>
            selectModel(
              { urn: entry.item.id, name: entry.item.name },
              { ready: entry.item.translationStatus === 'success' },
            ),
          placeholder: 'Find a model',
          emptyLabel: `No models match "${query.trim()}".`,
        }}
        tree={{
          nodes,
          expandedIds: [],
          selectedId: selected ? `model:${selected.urn}` : undefined,
          empty: treeEmpty,
          'aria-label': 'Uploaded models',
          onExpand: () => {},
          onCollapse: () => {},
          onItemOpen: (item) =>
            selectModel(
              { urn: item.id, name: item.name },
              { ready: item.translationStatus === 'success' },
            ),
        }}
        treeLabel={models.length > 0 ? `Models · ${models.length}` : 'Models'}
        treeAction={
          <button
            type="button"
            aria-label="Upload models"
            // The primitive drops its extended hit area on md+: keep the 44px
            // target on every pointer.
            className="after:-inset-3.5 md:after:block"
            onClick={() => setUploadOpen(true)}
          >
            <PlusIcon aria-hidden />
          </button>
        }
        collapsible="icon"
        className={
          embedded ? 'border-border border-r md:absolute md:h-full' : 'border-border border-r'
        }
      />

      <SidebarInset
        className={
          embedded
            ? 'h-full min-h-0 min-w-0 overflow-hidden'
            : 'h-svh min-h-0 min-w-0 overflow-hidden'
        }
      >
        <header className="flex min-h-16 shrink-0 items-center gap-3 border-b bg-background px-2 sm:px-4">
          <SidebarTrigger className="size-11 shrink-0" />
          <span className="hidden size-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground sm:grid">
            <Building2Icon aria-hidden className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-heading font-medium text-sm sm:text-base">Model viewer</h1>
            <p className="truncate text-muted-foreground text-xs">
              {selected?.name ?? 'Models in this app’s storage'}
            </p>
          </div>
          <Button className="min-h-11 shrink-0 gap-1.5" onClick={() => setUploadOpen(true)}>
            <UploadIcon aria-hidden />
            <span className="hidden sm:inline">Upload models</span>
          </Button>
        </header>

        <section className="relative min-h-0 min-w-0 flex-1 bg-muted" aria-label="Model viewer">
          {selected && selectionState.kind === 'ready' && !viewerIssue ? (
            <APSViewer
              urn={selected.urn}
              getAccessToken={getAccessToken}
              extensions={AEC_STARTER_EXTENSIONS}
              profile="aec"
              toolbar="native"
              radius={0}
              className="size-full"
              onViewerReady={(viewer) => viewer.prefs.set('openPropertiesOnSelect', true)}
              onError={(error) => setViewerIssue(viewerIssueFor(error))}
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center overflow-y-auto p-6">
              {!selected ? (
                <PaneState
                  icon={<BoxIcon aria-hidden className="size-6" />}
                  title="Choose a model"
                  description={
                    models.length > 0
                      ? 'Pick a model from the sidebar, or upload a new one.'
                      : 'Upload a design file to translate and view it here.'
                  }
                />
              ) : viewerIssue?.kind === 'no-credentials' ? (
                <PaneState
                  role="status"
                  icon={<KeyRoundIcon aria-hidden className="size-6" />}
                  title="Viewer unavailable"
                  description="The viewer token endpoint needs real APS credentials. The upload and translation flow still works without them."
                />
              ) : viewerIssue?.kind === 'unviewable' ? (
                <PaneState
                  role="status"
                  icon={<EyeOffIcon aria-hidden className="size-6" />}
                  title="No preview for this file"
                  description={
                    <>Autodesk has not produced a viewable version of “{selected.name}”.</>
                  }
                >
                  <details className="mt-4 w-full text-left">
                    <summary className="w-fit text-muted-foreground text-xs">
                      Technical details
                    </summary>
                    <p className="mt-1 break-all font-mono text-muted-foreground text-xs">
                      {viewerIssue.detail}
                    </p>
                  </details>
                </PaneState>
              ) : viewerIssue ? (
                <ModelStatusCard
                  translation={{
                    urn: selected.urn,
                    name: selected.name,
                    status: 'failed',
                    error: viewerIssue.detail,
                  }}
                  className="max-w-lg"
                />
              ) : failedTranslation ? (
                <div className="flex w-full max-w-lg flex-col gap-3">
                  <ModelStatusCard translation={failedTranslation} />
                  {selectionState.kind === 'failed' &&
                    selectionState.snapshot.messages.length > 1 && (
                      <ul className="flex flex-col gap-1 rounded-lg border border-border bg-card p-3">
                        {selectionState.snapshot.messages.slice(1).map((message) => (
                          <li key={message} className="text-muted-foreground text-xs">
                            {message}
                          </li>
                        ))}
                      </ul>
                    )}
                </div>
              ) : (
                <ModelStatusCard
                  translation={{
                    urn: selected.urn,
                    name: selected.name,
                    status:
                      selectionState.kind === 'translating'
                        ? selectionState.snapshot.status
                        : 'pending',
                    progress:
                      selectionState.kind === 'translating'
                        ? selectionState.snapshot.progress
                        : undefined,
                  }}
                  className="max-w-lg"
                />
              )}
            </div>
          )}
        </section>
      </SidebarInset>

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="w-[min(40rem,calc(100%-2rem))] gap-4 sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload models</DialogTitle>
            <DialogDescription>
              Files land in this app’s storage and translate for the viewer.
            </DialogDescription>
          </DialogHeader>
          <FileDropZone
            files={files}
            accept={UPLOAD_ACCEPT}
            onDropFiles={handleDropFiles}
            onReject={handleReject}
            onRetry={handleRetry}
            onRemove={handleRemove}
          />
          <fieldset className="flex flex-col">
            <legend className="mb-1 font-medium text-muted-foreground text-xs">
              Translation outputs
            </legend>
            <div className="flex min-h-11 items-center gap-3">
              <Checkbox
                id="model-upload-sheets"
                checked={sheets}
                // The job needs at least one view: the last one on stays on.
                aria-disabled={(sheets && !models3d) || undefined}
                onCheckedChange={(checked) => {
                  if (sheets && !models3d) return
                  setSheets(checked === true)
                }}
              />
              <Label htmlFor="model-upload-sheets" className="flex-1 flex-col items-start gap-0.5">
                2D sheets
                <span className="font-normal text-muted-foreground text-xs">
                  Plans and sheet views
                </span>
              </Label>
            </div>
            <div className="flex min-h-11 items-center gap-3">
              <Checkbox
                id="model-upload-models"
                checked={models3d}
                aria-disabled={(models3d && !sheets) || undefined}
                onCheckedChange={(checked) => {
                  if (models3d && !sheets) return
                  setModels3d(checked === true)
                }}
              />
              <Label htmlFor="model-upload-models" className="flex-1 flex-col items-start gap-0.5">
                3D views
                <span className="font-normal text-muted-foreground text-xs">
                  The model geometry the viewer opens
                </span>
              </Label>
            </div>
            <div className="flex min-h-11 items-center gap-3">
              <Checkbox
                id="model-upload-master-views"
                checked={masterViews}
                onCheckedChange={(checked) => setMasterViews(checked === true)}
              />
              <Label
                htmlFor="model-upload-master-views"
                className="flex-1 flex-col items-start gap-0.5"
              >
                Revit master views
                <span className="font-normal text-muted-foreground text-xs">
                  Also export phase-based master views from Revit files
                </span>
              </Label>
            </div>
          </fieldset>
          {pendingZips.map((zip) => (
            <div key={zip.id} className="flex flex-wrap items-end gap-2">
              <div className="flex min-w-48 flex-1 flex-col gap-1.5">
                <Label htmlFor={`zip-entry-${zip.id}`} className="text-xs">
                  Main design inside {zip.name}
                </Label>
                <Input
                  id={`zip-entry-${zip.id}`}
                  value={zip.entry}
                  placeholder="model.rvt"
                  className="min-h-11"
                  onChange={(event) =>
                    setPendingZips((current) =>
                      current.map((entry) =>
                        entry.id === zip.id ? { ...entry, entry: event.target.value } : entry,
                      ),
                    )
                  }
                />
              </div>
              <Button
                className="min-h-11"
                aria-disabled={!zip.entry.trim() || undefined}
                onClick={() => startZip(zip.id)}
              >
                Upload archive
              </Button>
              <Button variant="ghost" className="min-h-11" onClick={() => removePendingZip(zip.id)}>
                Remove
              </Button>
            </div>
          ))}
          {rejection && (
            <p role="status" className={cn('text-status-warning text-xs')}>
              {rejection}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  )
}

export { ModelUpload }

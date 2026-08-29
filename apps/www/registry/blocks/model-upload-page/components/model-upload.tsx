'use client'

import { Building2Icon, LoaderCircleIcon, UploadIcon } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

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
import type { Item, ModelTranslationStatus } from '@/lib/project-types'
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
  zipEntrypoint?: string
  xhr?: XMLHttpRequest
  cancelled?: boolean
  /** Set once finish succeeds — retries resume polling, never re-upload. */
  urn?: string
}

const UPLOAD_ACCEPT = `${MODEL_FILE_ACCEPT},.zip`
const STATUS_POLL_MS = 2500
const STATUS_POLL_LIMIT = 240

const rejectionReasonLabel = {
  'file-type': 'is not a supported file type',
  'file-size': 'is larger than the size limit',
  'file-count': 'exceeds the file limit',
} satisfies Record<UploadRejection['reason'], string>

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function searchNormalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}+/gu, '')
    .toLocaleLowerCase()
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

function modelNode(model: BucketModel): HubTreeItemNode {
  const item: Item = {
    id: model.urn,
    name: model.name,
    type: 'item',
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

  // Callers set the loading state first; the initial load relies on the
  // state initializer so the effect never writes state synchronously.
  const loadModels = useCallback(
    () =>
      fetch(`${uploadEndpoint}?kind=models`, { cache: 'no-store' })
        .then(async (response) => {
          const body = (await response.json()) as { models?: BucketModel[]; error?: string }
          if (!response.ok || !body.models) {
            throw new Error(body.error ?? 'Models could not be listed.')
          }
          setModelsState({ status: 'ready', models: body.models })
          return body.models
        })
        .catch((error: unknown) => {
          setModelsState({
            status: 'error',
            message: error instanceof Error ? error.message : 'Models could not be listed.',
          })
          return [] as BucketModel[]
        }),
    [uploadEndpoint],
  )

  useEffect(() => {
    void loadModels().then((models) => {
      // A shared link restores its model: ?urn=... names the selection.
      const shared = new URLSearchParams(window.location.search).get('urn')
      if (!shared) return
      const model = models.find((entry) => entry.urn === shared)
      if (model) {
        setSelected(model)
        setSelectionState({ kind: 'checking' })
        setViewerIssue(undefined)
      }
    })
  }, [loadModels])

  function selectModel(
    model: { urn: string; name: string },
    options?: { fromUrl?: boolean },
  ): void {
    setSelected(model)
    setSelectionState({ kind: 'checking' })
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
    let cancelled = false
    async function track(urn: string): Promise<void> {
      for (let attempt = 0; attempt < STATUS_POLL_LIMIT && !cancelled; attempt += 1) {
        try {
          const response = await fetch(
            `${uploadEndpoint}?kind=status&urn=${encodeURIComponent(urn)}`,
            {
              cache: 'no-store',
            },
          )
          const body = (await response.json()) as StatusResponse
          if (cancelled) return
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
          if (cancelled) return
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
        await delay(STATUS_POLL_MS)
      }
    }
    void track(selected.urn)
    return () => {
      cancelled = true
    }
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

  async function postUpload<T>(body: unknown): Promise<T> {
    const response = await fetch(uploadEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
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
        if (event.lengthComputable) onProgress(event.loaded)
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

  async function trackUploadTranslation(id: string, urn: string): Promise<void> {
    for (let attempt = 0; attempt < STATUS_POLL_LIMIT; attempt += 1) {
      if (uploads.current.get(id)?.cancelled) return
      const response = await fetch(`${uploadEndpoint}?kind=status&urn=${encodeURIComponent(urn)}`, {
        cache: 'no-store',
      })
      const body = (await response.json()) as StatusResponse
      if (!response.ok) throw new Error(body.error ?? 'The translation status is unavailable.')
      if (body.status === 'success') {
        patchFile(id, { phase: 'complete', processingLabel: undefined })
        return
      }
      if (body.status === 'failed' || body.status === 'timeout') {
        patchFile(id, {
          phase: 'error',
          error: body.messages?.[0] ?? 'The upload finished but translation failed.',
          retryable: false,
        })
        return
      }
      patchFile(id, {
        processingLabel: body.progress ? `Translating · ${body.progress}` : 'Translating',
      })
      await delay(STATUS_POLL_MS)
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
        await trackUploadTranslation(id, active.urn)
      } else {
        patchFile(id, { phase: 'queued', progress: undefined, error: undefined })
        const start = await postUpload<StartResponse>({
          kind: 'start',
          name: file.name,
          size: file.size,
        })
        if (!start.objectId || !start.uploadKey || !start.urls?.length || !start.partSize) {
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
        const finish = await postUpload<FinishResponse>({
          kind: 'finish',
          name: file.name,
          objectId: start.objectId,
          uploadKey: start.uploadKey,
          views: [...(sheets ? ['2d' as const] : []), ...(models3d ? ['3d' as const] : [])],
          masterViews,
          zipEntrypoint: active.zipEntrypoint,
        })
        if (!finish.urn) throw new Error('The version could not be created.')
        active.urn = finish.urn
        await trackUploadTranslation(id, finish.urn)
      }
      if (uploads.current.get(id)?.cancelled) return
      const models = await loadModels()
      const uploaded = models.find((entry) => entry.urn === active.urn)
      if (uploaded) selectModel(uploaded)
    } catch (error) {
      if (uploads.current.get(id)?.cancelled) return
      const message = error instanceof Error ? error.message : 'The upload failed.'
      if (message === 'cancelled') return
      patchFile(id, { phase: 'error', progress: undefined, error: message, retryable: true })
    }
  }

  function startFile(file: File, zipEntrypoint?: string): void {
    const id = crypto.randomUUID()
    uploads.current.set(id, { file, zipEntrypoint })
    setFiles((current) => [...current, { id, name: file.name, size: file.size, phase: 'queued' }])
    void runUpload(id)
  }

  function handleDropFiles(dropped: File[]): void {
    setRejection(undefined)
    for (const file of dropped) {
      if (isZip(file.name)) {
        // An archive translates its root design file — ask which one first.
        const id = crypto.randomUUID()
        uploads.current.set(id, { file })
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
      active.xhr?.abort()
      uploads.current.delete(file.id)
    }
    setFiles((current) => current.filter((entry) => entry.id !== file.id))
  }

  async function handleRetry(file: UploadFile): Promise<void> {
    const active = uploads.current.get(file.id)
    if (!active) return
    active.cancelled = false
    active.xhr = undefined
    await runUpload(file.id)
  }

  const models = modelsState.status === 'ready' ? modelsState.models : []
  const nodes = models.map(modelNode)
  const term = searchNormalize(query.trim())
  const finderEntries: FinderEntry[] = term
    ? models
        .filter((model) => searchNormalize(model.name).includes(term))
        .map((model) => ({ item: modelNode(model).value }))
    : []

  const treeEmpty =
    modelsState.status === 'loading' ? (
      <output className="flex min-h-11 items-center justify-center gap-2 px-2 py-6 text-muted-foreground text-xs">
        <LoaderCircleIcon aria-hidden className="size-3.5 animate-spin" />
        Loading models
      </output>
    ) : modelsState.status === 'error' ? (
      <div role="alert" className="flex flex-col items-center gap-3 px-3 py-8 text-center">
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
      <p className="px-3 py-8 text-center text-muted-foreground text-xs">No models uploaded yet.</p>
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
        finder={{
          query,
          onQueryChange: setQuery,
          groups: [{ id: 'models', label: 'Models', entries: finderEntries }],
          onItemOpen: (entry) => selectModel({ urn: entry.item.id, name: entry.item.name }),
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
          onItemOpen: (item) => selectModel({ urn: item.id, name: item.name }),
        }}
        header={
          <Button
            className="min-h-11 w-full group-data-[collapsible=icon]:hidden"
            onClick={() => setUploadOpen(true)}
          >
            <UploadIcon aria-hidden />
            Upload models
          </Button>
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
          <Button
            variant="outline"
            className="min-h-11 shrink-0 gap-1.5"
            onClick={() => setUploadOpen(true)}
          >
            <UploadIcon aria-hidden />
            <span className="hidden sm:inline">Upload</span>
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
                <div className="max-w-sm text-center">
                  <h2 className="font-heading font-medium text-xl">Choose a model</h2>
                  <p className="mt-2 text-muted-foreground text-sm">
                    {models.length > 0
                      ? 'Pick a model from the sidebar, or upload a new one.'
                      : 'Upload a design file to translate and view it here.'}
                  </p>
                  <Button className="mt-4 min-h-11" onClick={() => setUploadOpen(true)}>
                    <UploadIcon aria-hidden />
                    Upload models
                  </Button>
                </div>
              ) : viewerIssue?.kind === 'no-credentials' ? (
                <div role="status" className="max-w-sm text-center">
                  <h2 className="font-heading font-medium text-xl">Viewer unavailable</h2>
                  <p className="mt-2 text-muted-foreground text-sm">
                    The viewer token endpoint needs real APS credentials. The upload and translation
                    flow still works without them.
                  </p>
                </div>
              ) : viewerIssue?.kind === 'unviewable' ? (
                <div role="status" className="max-w-sm text-center">
                  <h2 className="font-heading font-medium text-xl">No preview for this file</h2>
                  <p className="mt-2 break-words text-muted-foreground text-sm">
                    Autodesk has not produced a viewable version of “{selected.name}”.
                  </p>
                  <details className="mt-4 text-left">
                    <summary className="w-fit text-muted-foreground text-xs">
                      Technical details
                    </summary>
                    <p className="mt-1 break-all font-mono text-muted-foreground text-xs">
                      {viewerIssue.detail}
                    </p>
                  </details>
                </div>
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
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <span className="flex min-h-11 items-center gap-2">
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
              <Label htmlFor="model-upload-sheets">2D sheets</Label>
            </span>
            <span className="flex min-h-11 items-center gap-2">
              <Checkbox
                id="model-upload-models"
                checked={models3d}
                aria-disabled={(models3d && !sheets) || undefined}
                onCheckedChange={(checked) => {
                  if (models3d && !sheets) return
                  setModels3d(checked === true)
                }}
              />
              <Label htmlFor="model-upload-models">3D views</Label>
            </span>
            <span className="flex min-h-11 items-center gap-2">
              <Checkbox
                id="model-upload-master-views"
                checked={masterViews}
                onCheckedChange={(checked) => setMasterViews(checked === true)}
              />
              <Label htmlFor="model-upload-master-views">Revit master views</Label>
            </span>
          </div>
          <FileDropZone
            files={files}
            accept={UPLOAD_ACCEPT}
            onDropFiles={handleDropFiles}
            onReject={handleReject}
            onRetry={handleRetry}
            onRemove={handleRemove}
          />
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

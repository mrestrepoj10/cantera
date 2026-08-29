'use client'

import { LogOutIcon, UploadIcon } from 'lucide-react'
import { useCallback, useEffect, useId, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { FileDropZone } from '@/components/ui/file-drop-zone'
import { Label } from '@/components/ui/label'
import { ProjectPicker } from '@/components/ui/project-picker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { UserAccountBadge } from '@/components/ui/user-account-badge'
import type { OAuthAccount } from '@/lib/oauth-types'
import type { Folder, Hub, ModelTranslationStatus, Project } from '@/lib/project-types'
import { MODEL_FILE_ACCEPT, type UploadFile, type UploadRejection } from '@/lib/upload-types'

export interface ModelUploadProps {
  account: OAuthAccount
  uploadEndpoint?: string
  signOutHref?: string
  embedded?: boolean
}

type Catalog =
  | { status: 'loading' }
  | { status: 'ready'; hubs: Hub[]; projects: Project[] }
  | { status: 'error'; message: string }

interface FolderLevel {
  folders: Folder[]
  selectedId: string
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
  error?: string
}

interface ActiveUpload {
  file: File
  projectId: string
  folderId: string
  xhr?: XMLHttpRequest
  cancelled?: boolean
  /** Set once finish succeeds — retries resume polling, never re-upload. */
  urn?: string
  region?: string
}

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

async function fetchCatalog(uploadEndpoint: string): Promise<{ hubs: Hub[]; projects: Project[] }> {
  const hubsResponse = await fetch(`${uploadEndpoint}?kind=hubs`, { cache: 'no-store' })
  const hubsBody = (await hubsResponse.json()) as { hubs?: Hub[]; error?: string }
  if (!hubsResponse.ok || !hubsBody.hubs) {
    throw new Error(hubsBody.error ?? 'Hubs could not be loaded.')
  }
  const projectLists = await Promise.all(
    hubsBody.hubs.map(async (hub) => {
      const response = await fetch(
        `${uploadEndpoint}?kind=projects&hubId=${encodeURIComponent(hub.id)}`,
        { cache: 'no-store' },
      )
      const body = (await response.json()) as { projects?: Project[]; error?: string }
      if (!response.ok || !body.projects) {
        throw new Error(body.error ?? `Projects in ${hub.name} could not be loaded.`)
      }
      return body.projects
    }),
  )
  return { hubs: hubsBody.hubs, projects: projectLists.flat() }
}

function ModelUpload({
  account,
  uploadEndpoint = '/api/models/upload',
  signOutHref = '/api/auth/signout?next=/sign-in',
  embedded = false,
}: ModelUploadProps) {
  const [catalog, setCatalog] = useState<Catalog>({ status: 'loading' })
  const [projectId, setProjectId] = useState<string>()
  const [folderLevels, setFolderLevels] = useState<FolderLevel[]>([])
  const [folderPending, setFolderPending] = useState(false)
  const [sheets, setSheets] = useState(true)
  const [models, setModels] = useState(true)
  const [masterViews, setMasterViews] = useState(false)
  const [files, setFiles] = useState<UploadFile[]>([])
  const [rejection, setRejection] = useState<string>()
  const uploads = useRef(new Map<string, ActiveUpload>())
  const folderRequest = useRef(0)
  const rejectionId = useId()

  const project =
    catalog.status === 'ready'
      ? catalog.projects.find((entry) => entry.id === projectId)
      : undefined
  const targetFolderId = [...folderLevels].reverse().find((level) => level.selectedId)?.selectedId

  // Callers set the loading state first; the initial load relies on the
  // state initializer so the effect never writes state synchronously.
  const loadCatalog = useCallback(
    () =>
      fetchCatalog(uploadEndpoint)
        .then((catalog) => setCatalog({ status: 'ready', ...catalog }))
        .catch((error: unknown) => {
          setCatalog({
            status: 'error',
            message: error instanceof Error ? error.message : 'Projects could not be loaded.',
          })
        }),
    [uploadEndpoint],
  )

  useEffect(() => {
    void loadCatalog()
  }, [loadCatalog])

  async function loadFolders(project: Project, folderId?: string): Promise<Folder[]> {
    const params = new URLSearchParams({ kind: 'folders', projectId: project.id })
    if (folderId) params.set('folderId', folderId)
    else params.set('hubId', project.hubId ?? '')
    const response = await fetch(`${uploadEndpoint}?${params}`, { cache: 'no-store' })
    const body = (await response.json()) as { folders?: Folder[]; error?: string }
    if (!response.ok || !body.folders) {
      throw new Error(body.error ?? 'Folders could not be loaded.')
    }
    return body.folders
  }

  async function chooseProject(nextProjectId: string): Promise<void> {
    if (catalog.status !== 'ready') return
    const next = catalog.projects.find((entry) => entry.id === nextProjectId)
    if (!next) return
    // A slower response for a superseded selection must not land: the ticket
    // retires every earlier in-flight folder request.
    const ticket = ++folderRequest.current
    setProjectId(nextProjectId)
    setFolderLevels([])
    setFolderPending(true)
    try {
      const folders = await loadFolders(next)
      if (folderRequest.current !== ticket) return
      // A single top folder (Project Files, typically) is not a choice.
      if (folders.length === 1 && folders[0]) {
        const only = folders[0]
        const children = await loadFolders(next, only.id)
        if (folderRequest.current !== ticket) return
        setFolderLevels([
          { folders, selectedId: only.id },
          ...(children.length > 0 ? [{ folders: children, selectedId: '' }] : []),
        ])
      } else {
        setFolderLevels([{ folders, selectedId: '' }])
      }
    } catch {
      if (folderRequest.current === ticket) setFolderLevels([])
    } finally {
      if (folderRequest.current === ticket) setFolderPending(false)
    }
  }

  async function chooseFolder(level: number, folderId: string): Promise<void> {
    if (!project) return
    const current = folderLevels[level]
    if (!current) return
    const ticket = ++folderRequest.current
    setFolderLevels([...folderLevels.slice(0, level), { ...current, selectedId: folderId }])
    setFolderPending(true)
    try {
      const children = await loadFolders(project, folderId)
      if (folderRequest.current !== ticket) return
      if (children.length > 0) {
        setFolderLevels((levels) => [
          ...levels.slice(0, level + 1),
          { folders: children, selectedId: '' },
        ])
      }
    } catch {
      // The chosen folder still works as the target; drill-down just stops here.
    } finally {
      if (folderRequest.current === ticket) setFolderPending(false)
    }
  }

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

  async function runUpload(id: string): Promise<void> {
    const active = uploads.current.get(id)
    if (!active) return
    const { file } = active
    try {
      if (active.urn) {
        patchFile(id, { phase: 'processing', processingLabel: 'Translating', error: undefined })
        await trackTranslation(id, active.urn)
        return
      }
      patchFile(id, { phase: 'queued', progress: undefined, error: undefined })
      const start = await postUpload<StartResponse>({
        kind: 'start',
        projectId: active.projectId,
        folderId: active.folderId,
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
      patchFile(id, { phase: 'processing', progress: undefined, processingLabel: 'Saving version' })
      const finish = await postUpload<FinishResponse>({
        kind: 'finish',
        projectId: active.projectId,
        folderId: active.folderId,
        name: file.name,
        objectId: start.objectId,
        uploadKey: start.uploadKey,
        views: [...(sheets ? ['2d' as const] : []), ...(models ? ['3d' as const] : [])],
        masterViews,
        region: active.region,
      })
      if (!finish.urn) throw new Error('The version could not be created.')
      active.urn = finish.urn
      patchFile(id, { processingLabel: 'Translating' })
      await trackTranslation(id, finish.urn)
    } catch (error) {
      if (uploads.current.get(id)?.cancelled) return
      const message = error instanceof Error ? error.message : 'The upload failed.'
      if (message === 'cancelled') return
      patchFile(id, { phase: 'error', progress: undefined, error: message, retryable: true })
    }
  }

  async function trackTranslation(id: string, urn: string): Promise<void> {
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
      if (body.status === 'failed') {
        patchFile(id, {
          phase: 'error',
          error: 'The upload finished but translation failed.',
          retryable: false,
        })
        return
      }
      if (body.status === 'timeout') {
        throw new Error('Translation timed out.')
      }
      patchFile(id, {
        processingLabel: body.progress ? `Translating · ${body.progress}` : 'Translating',
      })
      await delay(STATUS_POLL_MS)
    }
    throw new Error('Translation is taking longer than expected.')
  }

  function handleDropFiles(dropped: File[]): void {
    if (!project || !targetFolderId) return
    setRejection(undefined)
    const hub =
      catalog.status === 'ready'
        ? catalog.hubs.find((entry) => entry.id === project.hubId)
        : undefined
    for (const file of dropped) {
      const id = crypto.randomUUID()
      uploads.current.set(id, {
        file,
        projectId: project.id,
        folderId: targetFolderId,
        region: hub?.region,
      })
      setFiles((current) => [...current, { id, name: file.name, size: file.size, phase: 'queued' }])
      void runUpload(id)
    }
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

  const destinationReady = Boolean(project && targetFolderId)

  return (
    <main
      className={
        embedded
          ? 'flex min-h-[36rem] flex-col bg-background'
          : 'flex min-h-svh flex-col bg-background'
      }
    >
      <header className="flex min-h-16 shrink-0 items-center gap-3 border-b bg-background px-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
          <UploadIcon aria-hidden className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-heading font-medium text-sm sm:text-base">Upload models</h1>
          <p className="truncate text-muted-foreground text-xs">
            Add files to an Autodesk project folder
          </p>
        </div>
        <UserAccountBadge account={account} size="sm" className="hidden max-w-52 sm:flex" />
        <form action={signOutHref} method="post" className="shrink-0">
          <Button
            type="submit"
            variant="ghost"
            className="size-11 gap-1.5 px-0 sm:w-auto sm:px-3"
            aria-label="Sign out of Autodesk"
          >
            <LogOutIcon aria-hidden />
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        </form>
      </header>

      <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-4 sm:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Destination</CardTitle>
            <CardDescription>The project folder that receives the files.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="model-upload-project">Project</Label>
              <ProjectPicker
                projects={catalog.status === 'ready' ? catalog.projects : []}
                hubs={catalog.status === 'ready' ? catalog.hubs : []}
                value={projectId}
                onValueChange={chooseProject}
                status={
                  catalog.status === 'ready'
                    ? 'ready'
                    : catalog.status === 'loading'
                      ? 'loading'
                      : 'error'
                }
                error={catalog.status === 'error' ? catalog.message : undefined}
                onRetry={() => {
                  setCatalog({ status: 'loading' })
                  return loadCatalog()
                }}
                aria-label="Project"
                className="min-h-11 w-full"
              />
            </div>
            {folderLevels.map((level, index) => {
              const parent = index > 0 ? folderLevels[index - 1] : undefined
              const parentName = parent?.folders.find(
                (folder) => folder.id === parent.selectedId,
              )?.name
              return (
                <div key={parent?.selectedId ?? 'top'} className="flex flex-col gap-2">
                  <Label>{index === 0 ? 'Folder' : `Folder in ${parentName ?? 'folder'}`}</Label>
                  <Select
                    value={level.selectedId === '' ? null : level.selectedId}
                    onValueChange={(next: string | null) => {
                      if (next) void chooseFolder(index, next)
                    }}
                  >
                    <SelectTrigger
                      aria-label={index === 0 ? 'Folder' : `Folder in ${parentName ?? 'folder'}`}
                      className="min-h-11 w-full"
                    >
                      <SelectValue placeholder={index === 0 ? 'Choose a folder' : 'Upload here'}>
                        {(selected: string | null) =>
                          level.folders.find((folder) => folder.id === selected)?.name ??
                          (index === 0 ? 'Choose a folder' : 'Upload here')
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {level.folders.map((folder) => (
                        <SelectItem key={folder.id} value={folder.id} className="min-h-11">
                          {folder.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )
            })}
            {folderPending && (
              <output className="text-muted-foreground text-xs">Loading folders…</output>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Translation</CardTitle>
            <CardDescription>What the viewer produces from each upload.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex min-h-11 items-center gap-3">
              <Checkbox
                id="model-upload-sheets"
                checked={sheets}
                // The job needs at least one view: the last one on stays on.
                aria-disabled={(sheets && !models) || undefined}
                onCheckedChange={(checked) => {
                  if (sheets && !models) return
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
                checked={models}
                aria-disabled={(models && !sheets) || undefined}
                onCheckedChange={(checked) => {
                  if (models && !sheets) return
                  setModels(checked === true)
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
          </CardContent>
        </Card>

        <FileDropZone
          files={files}
          accept={MODEL_FILE_ACCEPT}
          disabled={!destinationReady}
          label={
            destinationReady ? 'Drag files here or browse' : 'Choose a destination folder first'
          }
          onDropFiles={handleDropFiles}
          onReject={handleReject}
          onRetry={handleRetry}
          onRemove={handleRemove}
          aria-describedby={rejection ? rejectionId : undefined}
        />
        {rejection && (
          <p id={rejectionId} role="status" className="text-status-warning text-xs">
            {rejection}
          </p>
        )}
      </section>
    </main>
  )
}

export { ModelUpload }

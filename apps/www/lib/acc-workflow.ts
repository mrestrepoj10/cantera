import { type AccessToken, APS_BASE_URL, authHeaders } from 'aec-auth'

import {
  type AccVersionSetDoc,
  type ApsHubDoc,
  type ApsManifestDoc,
  type ApsProjectDoc,
  fromAccVersionSet,
  fromApsHub,
  fromApsManifest,
  fromApsProject,
} from '@/lib/aps-data-preset'
import type { Hub, ModelTranslation, Project, SheetVersionSet } from '@/lib/project-types'

// Every step reports a failure as a message rather than throwing: a 500 must
// land in a picker's error state with a retry, never in an error boundary.

/** `APS_AUTH_BASE_URL` — absolute, or relative like "/emulate/aps" — serves
 * auth and data from one origin. Unset means real APS. */
export function apsApiBaseUrl(origin: string): string {
  const configured = process.env.APS_AUTH_BASE_URL
  if (!configured) return APS_BASE_URL
  return configured.startsWith('/') ? `${origin}${configured}` : configured
}

export async function apsGet<T>(url: string, token: AccessToken): Promise<T> {
  const response = await fetch(url, {
    headers: { ...authHeaders(token), Accept: 'application/json' },
    cache: 'no-store',
  })
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`.trim())
  }
  return (await response.json()) as T
}

/** `encodeURIComponent` over-encodes: RFC 3986 allows ":" in a segment and a
 * design URN is full of them. */
export function segment(value: string): string {
  return encodeURIComponent(value).replaceAll('%3A', ':')
}

export function failureMessage(error: unknown, subject: string): string {
  const detail = error instanceof Error ? error.message : String(error)
  return `${subject} could not be loaded (${detail}).`
}

interface JsonApiList<T> {
  data?: T[]
}

interface SheetsEnvelope<T> {
  results?: T[]
  pagination?: { nextUrl?: string }
}

// Bounded: a server that always offers a next page truncates instead of hanging.
const MAX_SHEETS_PAGES = 20

async function apsGetAllSheets<T>(firstUrl: string, token: AccessToken): Promise<T[]> {
  const results: T[] = []
  let url: string | undefined = firstUrl
  for (let page = 0; url && page < MAX_SHEETS_PAGES; page += 1) {
    const envelope: SheetsEnvelope<T> = await apsGet<SheetsEnvelope<T>>(url, token)
    results.push(...(envelope.results ?? []))
    url = envelope.pagination?.nextUrl || undefined
  }
  return results
}

interface AccSheetDoc {
  id: string
  number?: string
  title?: string
  uploadFileName?: string
  viewable?: { urn?: string }
}

interface DesignRef {
  urn: string
  fileName?: string
}

export interface AccWorkflowData {
  hubs: Hub[]
  hubsError?: string
  selectedHubId?: string
  projects: Project[]
  projectsError?: string
  selectedProjectId?: string
  versionSets: SheetVersionSet[]
  versionSetsError?: string
  selectedVersionSetId?: string
  translations: ModelTranslation[]
  translationsError?: string
}

const emptyWorkflow: AccWorkflowData = {
  hubs: [],
  projects: [],
  versionSets: [],
  translations: [],
}

export interface AccWorkflowSelection {
  hubId?: string
  projectId?: string
  versionSetId?: string
  fallbackHubId?: string
}

function byIssuanceDescending(a: SheetVersionSet, b: SheetVersionSet): number {
  const left = a.issuanceDate ? new Date(a.issuanceDate).getTime() : 0
  const right = b.issuanceDate ? new Date(b.issuanceDate).getTime() : 0
  return right - left
}

export async function loadAccWorkflow(
  origin: string,
  token: AccessToken,
  selection: AccWorkflowSelection,
): Promise<AccWorkflowData> {
  const base = apsApiBaseUrl(origin)

  let hubs: Hub[]
  try {
    const document = await apsGet<JsonApiList<ApsHubDoc>>(`${base}/project/v1/hubs`, token)
    hubs = (document.data ?? []).map(fromApsHub)
  } catch (error) {
    return { ...emptyWorkflow, hubsError: failureMessage(error, 'Hubs') }
  }

  const selectedHub =
    hubs.find((hub) => hub.id === selection.hubId) ??
    hubs.find((hub) => hub.id === selection.fallbackHubId) ??
    hubs[0]
  if (!selectedHub) return { ...emptyWorkflow, hubs }

  let projects: Project[]
  try {
    const document = await apsGet<JsonApiList<ApsProjectDoc>>(
      `${base}/project/v1/hubs/${segment(selectedHub.id)}/projects`,
      token,
    )
    projects = (document.data ?? []).map(fromApsProject)
  } catch (error) {
    return {
      ...emptyWorkflow,
      hubs,
      selectedHubId: selectedHub.id,
      projectsError: failureMessage(error, 'Projects'),
    }
  }

  const selectedProject =
    projects.find((project) => project.id === selection.projectId) ?? projects[0]
  if (!selectedProject) {
    return { ...emptyWorkflow, hubs, selectedHubId: selectedHub.id, projects }
  }

  const projectPath = `${base}/construction/sheets/v1/projects/${segment(selectedProject.id)}`
  const settled = {
    ...emptyWorkflow,
    hubs,
    selectedHubId: selectedHub.id,
    projects,
    selectedProjectId: selectedProject.id,
  }

  let versionSets: SheetVersionSet[]
  try {
    const documents = await apsGetAllSheets<AccVersionSetDoc>(
      `${projectPath}/version-sets?limit=200`,
      token,
    )
    versionSets = documents.map(fromAccVersionSet).sort(byIssuanceDescending)
  } catch (error) {
    return { ...settled, versionSetsError: failureMessage(error, 'Version sets') }
  }

  const selectedVersionSet =
    versionSets.find((versionSet) => versionSet.id === selection.versionSetId) ?? versionSets[0]
  if (!selectedVersionSet) return { ...settled, versionSets }

  const withVersionSet = { ...settled, versionSets, selectedVersionSetId: selectedVersionSet.id }

  let designs: DesignRef[]
  try {
    // No `currentOnly`: a sheet superseded by a newer issuance still belongs
    // to the historical version set the user selected.
    const sheets = await apsGetAllSheets<AccSheetDoc>(
      `${projectPath}/sheets?filter[versionSetId]=${encodeURIComponent(selectedVersionSet.id)}&limit=200`,
      token,
    )
    const byUrn = new Map<string, DesignRef>()
    for (const sheet of sheets) {
      const urn = sheet.viewable?.urn
      if (!urn || byUrn.has(urn)) continue
      byUrn.set(urn, { urn, fileName: sheet.uploadFileName || undefined })
    }
    designs = [...byUrn.values()]
  } catch (error) {
    return { ...withVersionSet, translationsError: failureMessage(error, 'Sheets') }
  }

  const results = await Promise.all(
    designs.map(async (design) => await loadTranslation(base, token, design)),
  )
  const failure = results.find((result) => result.error)
  return {
    ...withVersionSet,
    translations: results.flatMap((result) => (result.translation ? [result.translation] : [])),
    translationsError: failure?.error,
  }
}

// A 404 manifest is APS saying never-translated — the queued state, not an error.
async function loadTranslation(
  base: string,
  token: AccessToken,
  design: DesignRef,
): Promise<{ translation?: ModelTranslation; error?: string }> {
  const url = `${base}/modelderivative/v2/designdata/${segment(design.urn)}/manifest`
  try {
    const response = await fetch(url, {
      headers: { ...authHeaders(token), Accept: 'application/json' },
      cache: 'no-store',
    })
    if (response.status === 404) {
      return { translation: { urn: design.urn, name: design.fileName, status: 'pending' } }
    }
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`.trim())
    }
    const manifest = (await response.json()) as ApsManifestDoc
    const translation = fromApsManifest({ ...manifest, urn: manifest.urn || design.urn })
    return { translation: { ...translation, name: translation.name ?? design.fileName } }
  } catch (error) {
    return {
      error: failureMessage(error, `Translation status for ${design.fileName ?? 'a design'}`),
    }
  }
}

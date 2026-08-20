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

/**
 * Server-side reads for the /demo workflow: hubs, projects, sheet version
 * sets, and the translation manifests behind the selected issuance.
 *
 * This is the demo's own wiring, not distributed code. The registry stays
 * data-agnostic — components take plain props — so the fetching, the token,
 * and the failure vocabulary live here, on the server, next to the page that
 * renders them.
 *
 * Every step reports a failure as a message rather than throwing: an emulator
 * (or APS) that answers 500 has to land in a picker's error state with a
 * retry, never in an error boundary.
 */

/**
 * Where the APS data APIs live. The emulator serves auth and data from one
 * origin, so `APS_AUTH_BASE_URL` — absolute, or relative like "/emulate/aps" —
 * points at both. Unset means real APS.
 */
export function apsApiBaseUrl(origin: string): string {
  const configured = process.env.APS_AUTH_BASE_URL
  if (!configured) return APS_BASE_URL
  return configured.startsWith('/') ? `${origin}${configured}` : configured
}

async function apsGet<T>(url: string, token: AccessToken): Promise<T> {
  const response = await fetch(url, {
    headers: { ...authHeaders(token), Accept: 'application/json' },
    // A demo whose selection changes per request has nothing to gain from a
    // cached read, and a stale hub list would be a lie.
    cache: 'no-store',
  })
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`.trim())
  }
  return (await response.json()) as T
}

/**
 * Encode one path segment. `encodeURIComponent` over-encodes: RFC 3986 allows
 * ":" inside a segment, and a design URN is full of them ("urn:adsk.…"), so
 * restore it — percent-encoded colons make the URL legal but unrecognizable to
 * anything matching on the decoded path.
 */
function segment(value: string): string {
  return encodeURIComponent(value).replaceAll('%3A', ':')
}

function failureMessage(error: unknown, subject: string): string {
  const detail = error instanceof Error ? error.message : String(error)
  return `${subject} could not be loaded (${detail}).`
}

/** JSON:API list document — the Data Management response shape. */
interface JsonApiList<T> {
  data?: T[]
}

/** ACC Sheets list envelope: results plus an offset pagination block. */
interface SheetsEnvelope<T> {
  results?: T[]
}

interface AccSheetDoc {
  id: string
  number?: string
  title?: string
  uploadFileName?: string
  viewable?: { urn?: string }
}

/** One design behind the selected issuance, with the sheets it produced. */
interface DesignRef {
  urn: string
  /** Readable name for a design whose manifest does not name it (or 404s). */
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
  /** Hub to start from when nothing is selected yet, if the grant can see it. */
  fallbackHubId?: string
}

/** Newest issuance first — the set a crew is most likely building from. */
function byIssuanceDescending(a: SheetVersionSet, b: SheetVersionSet): number {
  const left = a.issuanceDate ? new Date(a.issuanceDate).getTime() : 0
  const right = b.issuanceDate ? new Date(b.issuanceDate).getTime() : 0
  return right - left
}

/**
 * Read the whole workflow for one selection, in the order the UI reveals it:
 * hubs, then that hub's projects, then that project's issuances, then the
 * translation manifest of every design the chosen issuance was published from.
 *
 * A selection that no longer exists (a stale ?project= after switching hubs)
 * falls back to the first item rather than rendering an empty screen.
 */
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
    const envelope = await apsGet<SheetsEnvelope<AccVersionSetDoc>>(
      `${projectPath}/version-sets?limit=200`,
      token,
    )
    versionSets = (envelope.results ?? []).map(fromAccVersionSet).sort(byIssuanceDescending)
  } catch (error) {
    return { ...settled, versionSetsError: failureMessage(error, 'Version sets') }
  }

  const selectedVersionSet =
    versionSets.find((versionSet) => versionSet.id === selection.versionSetId) ?? versionSets[0]
  if (!selectedVersionSet) return { ...settled, versionSets }

  const withVersionSet = { ...settled, versionSets, selectedVersionSetId: selectedVersionSet.id }

  let designs: DesignRef[]
  try {
    const envelope = await apsGet<SheetsEnvelope<AccSheetDoc>>(
      `${projectPath}/sheets?filter[versionSetId]=${encodeURIComponent(selectedVersionSet.id)}&currentOnly=true&limit=200`,
      token,
    )
    // Several sheets come out of one upload, so the same design urn repeats;
    // the model status is per design, not per sheet.
    const byUrn = new Map<string, DesignRef>()
    for (const sheet of envelope.results ?? []) {
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

/**
 * One design's translation state. A 404 manifest is not a failure: it is APS
 * saying the design was never submitted for translation, which is exactly the
 * "queued" state — so it renders as a card, not as an error.
 */
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

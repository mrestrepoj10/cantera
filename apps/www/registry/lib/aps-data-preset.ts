import type {
  Hub,
  ModelTranslation,
  ModelTranslationStatus,
  Project,
  SheetVersionSet,
} from '@/lib/project-types'

/**
 * Autodesk Platform Services (APS / ACC) data preset: adapters from the Data
 * Management, Model Derivative, and ACC Sheets payloads into cantera's project
 * types.
 *
 * This is data translation, not a client — fetching and token handling belong
 * to your auth layer (e.g. aec-auth, https://github.com/mrestrepoj10/aec-auth).
 * Each input interface is the structural subset of the response the adapter
 * actually reads, so any payload with these fields adapts, including the APS
 * emulator's.
 */

/** Subset of a Data Management hub resource (`GET /project/v1/hubs`). */
export interface ApsHubDoc {
  id: string
  attributes?: {
    name?: string
    region?: string
  }
}

/** Translate a Data Management hub resource into a cantera Hub. */
export function fromApsHub(doc: ApsHubDoc): Hub {
  return {
    id: doc.id,
    name: doc.attributes?.name ?? doc.id,
    region: doc.attributes?.region,
  }
}

/** Subset of a Data Management project resource (`GET /project/v1/hubs/{hub}/projects`). */
export interface ApsProjectDoc {
  id: string
  attributes?: {
    name?: string
  }
  relationships?: {
    hub?: {
      data?: {
        id?: string
      }
    }
  }
}

/** Translate a Data Management project resource into a cantera Project. */
export function fromApsProject(doc: ApsProjectDoc): Project {
  return {
    id: doc.id,
    name: doc.attributes?.name ?? doc.id,
    hubId: doc.relationships?.hub?.data?.id,
  }
}

const translationStatuses: ModelTranslationStatus[] = [
  'pending',
  'inprogress',
  'success',
  'failed',
  'timeout',
]

/**
 * Normalize a manifest status string into the translation vocabulary. Unknown
 * strings read as "pending" — the one state that promises nothing.
 */
export function toTranslationStatus(status: string | undefined): ModelTranslationStatus {
  const normalized = status?.toLowerCase()
  return translationStatuses.find((known) => known === normalized) ?? 'pending'
}

/** Subset of a Model Derivative manifest (`GET /modelderivative/v2/designdata/{urn}/manifest`). */
export interface ApsManifestDoc {
  urn: string
  status?: string
  progress?: string
  derivatives?: {
    name?: string
    outputType?: string
    status?: string
  }[]
}

/**
 * Translate a Model Derivative manifest into a cantera ModelTranslation. The
 * design name comes from the first named derivative (the manifest itself has
 * none); outputs list each derivative's outputType once, in manifest order.
 */
export function fromApsManifest(doc: ApsManifestDoc): ModelTranslation {
  const derivatives = doc.derivatives ?? []
  const outputs: string[] = []
  for (const derivative of derivatives) {
    if (derivative.outputType && !outputs.includes(derivative.outputType)) {
      outputs.push(derivative.outputType)
    }
  }
  const failed = derivatives.find(
    (derivative) => toTranslationStatus(derivative.status) === 'failed',
  )
  return {
    urn: doc.urn,
    name: derivatives.find((derivative) => derivative.name)?.name,
    status: toTranslationStatus(doc.status),
    // "complete" restates success; it only reads as progress mid-translation.
    progress: doc.progress === 'complete' ? undefined : doc.progress,
    outputs: outputs.length > 0 ? outputs : undefined,
    error: failed?.name ? `Derivative "${failed.name}" failed to translate.` : undefined,
  }
}

/** Subset of an ACC Sheets version set (`GET /construction/sheets/v1/projects/{project}/version-sets`). */
export interface AccVersionSetDoc {
  id: string
  name?: string
  issuanceDate?: string
}

/** Translate an ACC Sheets version set into a cantera SheetVersionSet. */
export function fromAccVersionSet(doc: AccVersionSetDoc): SheetVersionSet {
  return {
    id: doc.id,
    name: doc.name ?? doc.id,
    issuanceDate: doc.issuanceDate,
  }
}

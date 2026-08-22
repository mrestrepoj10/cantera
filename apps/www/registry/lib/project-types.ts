/**
 * cantera project types — the lingua franca for project-context components.
 *
 * Every ACC integration starts the same way: pick a hub, pick a project, pick
 * the model or sheet set to work against. These are the shapes that flow
 * carries. Components take them as props and never fetch data themselves.
 * Adapters (e.g. the aps-data-preset) translate provider-specific payloads
 * into them, so Autodesk, Procore, or your own backend renders with the same
 * components.
 */

/** An account-level container of projects — an ACC hub, a Procore company. */
export interface Hub {
  /** Stable identifier, e.g. "b.9dc6…" for an ACC hub. */
  id: string
  /** Human-readable name shown in switchers, e.g. "Ridgeline Builders". */
  name: string
  /** Provider region code, e.g. "US", "EMEA", shown as secondary context. */
  region?: string
}

export interface Project {
  /** Stable identifier, e.g. "b.baf-1a2…" for an ACC project. */
  id: string
  /** Human-readable name shown in pickers, e.g. "Summit Tower". */
  name: string
  /** The hub this project belongs to; pickers group by it when present. */
  hubId?: string
}

/** A level in the controlled hub → project → folder breadcrumb. */
export interface BrowsePathSegment {
  id: string
  name: string
  type: 'hub' | 'project' | 'folder'
}

/** A navigable folder-like row. Hub and Project are structurally compatible. */
export interface Folder {
  id: string
  name: string
  /** APS folder adapters set this; hubs and projects can omit it. */
  type?: 'folder'
  lastModifiedTime?: Date | string | number
  modifiedBy?: string
  objectCount?: number
}

/** One immutable version of a document item. */
export interface ItemVersion {
  id: string
  versionNumber: number
  displayName: string
  createTime: Date | string | number
  createdBy: string
  storageSize: number
  /** URL-safe Model Derivative URN, or null when this version is not translated. */
  derivativeUrn: string | null
}

/** A file-like row inside a folder. */
export interface Item {
  id: string
  name: string
  type: 'item'
  lastModifiedTime?: Date | string | number
  modifiedBy?: string
  /** Tip version when the provider included it with the item response. */
  tip?: ItemVersion
  /** Optional provider-normalized translation state for the tip. */
  translationStatus?: ModelTranslationStatus
}

/** The rows a hub browser renders at its current controlled level. */
export type FolderEntry = Folder | Item

/** Narrow a folder entry to its file-like shape. */
export function isItem(entry: FolderEntry): entry is Item {
  return entry.type === 'item'
}

/**
 * Translation states a design goes through before it can be viewed. Mirrors
 * the Model Derivative manifest vocabulary; adapters normalize into it.
 */
export type ModelTranslationStatus = 'pending' | 'inprogress' | 'success' | 'failed' | 'timeout'

/** The translation state of one design — what a Model Derivative manifest describes. */
export interface ModelTranslation {
  /** The design URN the manifest describes (base64, as the API returns it). */
  urn: string
  /** Human-readable design name, when known — the URN alone is unreadable. */
  name?: string
  status: ModelTranslationStatus
  /** Provider progress string while translating, e.g. "42% complete". */
  progress?: string
  /** Output formats already produced, e.g. ["svf2", "thumbnail"]. */
  outputs?: string[]
  /** Human-readable failure detail, shown when status is "failed" or "timeout". */
  error?: string
}

/** A named issuance of construction sheets — an ACC Sheets version set. */
export interface SheetVersionSet {
  id: string
  /** Name of the issuance, e.g. "Permit Set" or "IFC 2026-03". */
  name: string
  /** When the set was issued for construction. */
  issuanceDate?: Date | string | number
}

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/

/** Normalize a version set's issuance into a Date, or null when absent or invalid. */
export function versionSetIssuance(versionSet: SheetVersionSet): Date | null {
  if (versionSet.issuanceDate == null) return null
  // A date-only string ("2026-03-12" — the shape ACC Sheets returns) names a
  // calendar day, not an instant. `new Date(string)` would read it as UTC
  // midnight, which formats a day early anywhere west of UTC — so build it in
  // local time instead.
  if (typeof versionSet.issuanceDate === 'string') {
    const dateOnly = DATE_ONLY.exec(versionSet.issuanceDate)
    if (dateOnly) {
      const [, year, month, day] = dateOnly
      return new Date(Number(year), Number(month) - 1, Number(day))
    }
  }
  const date = new Date(versionSet.issuanceDate)
  return Number.isNaN(date.getTime()) ? null : date
}

/**
 * Projects grouped in hub catalog order, the shape pickers render: one group
 * per hub that has projects, then — only when some projects reference no known
 * hub — a trailing group with `hub: null` so nothing is silently dropped.
 */
export function groupProjectsByHub(
  hubs: Hub[],
  projects: Project[],
): { hub: Hub | null; projects: Project[] }[] {
  const byHub = new Map<string, Project[]>()
  const orphans: Project[] = []
  // Membership by Set, not `hubs.some()` per project — the scan would make
  // grouping quadratic on large hub lists.
  const knownHubs = new Set(hubs.map((hub) => hub.id))
  for (const project of projects) {
    const hub = project.hubId != null && knownHubs.has(project.hubId)
    if (!hub) {
      orphans.push(project)
      continue
    }
    const group = byHub.get(project.hubId as string)
    if (group) group.push(project)
    else byHub.set(project.hubId as string, [project])
  }
  const groups: { hub: Hub | null; projects: Project[] }[] = []
  for (const hub of hubs) {
    const grouped = byHub.get(hub.id)
    if (grouped) groups.push({ hub, projects: grouped })
  }
  if (orphans.length > 0) groups.push({ hub: null, projects: orphans })
  return groups
}

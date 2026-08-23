/**
 * cantera upload types — the lifecycle of a file on its way into a project.
 *
 * Construction files are heavy — a Revit model runs to hundreds of megabytes —
 * and "uploaded" is not "done": cloud platforms translate a design after the
 * bytes land before anything can be viewed. These shapes carry that whole
 * journey. Components render them and never upload anything themselves;
 * adapters (e.g. an APS signed-S3 upload flow) drive the phases and report
 * back through these types.
 */

/**
 * The phases one file moves through. `processing` is the provider working
 * after the bytes arrived — translation, extraction — usually with no
 * reliable progress signal. `error` covers both retryable and terminal
 * failures; `retryable` on the file decides warning versus danger.
 */
export type UploadPhase = 'queued' | 'uploading' | 'processing' | 'complete' | 'error'

/** One file a consumer is tracking through an upload. */
export interface UploadFile {
  /** Stable identifier for reconciliation — not the name, which can repeat. */
  id: string
  /** File name shown to the user, e.g. "summit-tower.rvt". */
  name: string
  /** Size in bytes, when known. Render with `formatBytes`. */
  size?: number
  phase: UploadPhase
  /** Upload progress as a 0–1 fraction while `uploading`. */
  progress?: number
  /** What the provider is doing while `processing`, e.g. "Translating model". */
  processingLabel?: string
  /** Human-readable failure while `error`. */
  error?: string
  /** A retryable error is a warning — a retry away; a terminal one is danger. */
  retryable?: boolean
}

/** Why a drop zone refused a file before any callback fired. */
export type UploadRejectionReason = 'file-type' | 'file-size' | 'file-count'

/** One refused file plus the rule it broke. */
export interface UploadRejection {
  file: File
  reason: UploadRejectionReason
}

/**
 * Accept string for the design formats APS translates most often. A preset
 * for the common case, not a limit — pass any accept string instead.
 */
export const MODEL_FILE_ACCEPT = '.rvt,.ifc,.dwg,.dxf,.nwd,.nwc,.pdf'

/**
 * Whether a browser File satisfies an `accept` string (extension entries,
 * exact MIME types, and `type/*` wildcards — the same grammar the native
 * file input uses). An empty or missing accept admits everything.
 */
export function matchesAccept(file: File, accept?: string): boolean {
  if (!accept) return true
  const name = file.name.toLowerCase()
  const type = file.type.toLowerCase()
  return accept.split(',').some((entry) => {
    const rule = entry.trim().toLowerCase()
    if (!rule) return false
    if (rule.startsWith('.')) return name.endsWith(rule)
    if (rule.endsWith('/*')) return type.startsWith(rule.slice(0, -1))
    return type === rule
  })
}

const BYTE_UNITS = ['byte', 'kilobyte', 'megabyte', 'gigabyte', 'terabyte'] as const

/**
 * Bytes as a localized short unit string, e.g. 248 MB. Locale-neutral by
 * default (`Intl` with `undefined`); pass a locale to pin one. Decimal
 * units, matching what storage providers and file managers report.
 */
export function formatBytes(bytes: number, locale?: string): string {
  let value = Math.max(0, bytes)
  let unit: (typeof BYTE_UNITS)[number] = 'byte'
  for (const next of BYTE_UNITS.slice(1)) {
    if (value < 1000) break
    value /= 1000
    unit = next
  }
  return new Intl.NumberFormat(locale, {
    style: 'unit',
    unit,
    unitDisplay: 'short',
    maximumFractionDigits: unit !== 'byte' && value < 10 ? 1 : 0,
  }).format(value)
}

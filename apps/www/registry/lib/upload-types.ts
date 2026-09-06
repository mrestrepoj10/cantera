/** `processing` is the provider working after the bytes arrived — translation,
 * extraction — usually with no reliable progress signal. */
export type UploadPhase = 'queued' | 'uploading' | 'processing' | 'complete' | 'error'

export interface UploadFile {
  /** Stable identifier for reconciliation — not the name, which can repeat. */
  id: string
  name: string
  size?: number
  phase: UploadPhase
  /** Upload progress as a 0–1 fraction while `uploading`. */
  progress?: number
  processingLabel?: string
  error?: string
  /** A retryable error is a warning — a retry away; a terminal one is danger. */
  retryable?: boolean
}

export type UploadRejectionReason = 'file-type' | 'file-size' | 'file-count'

export interface UploadRejection {
  file: File
  reason: UploadRejectionReason
}

/** The design formats APS translates most often — a preset, not a limit. */
export const MODEL_FILE_ACCEPT = '.rvt,.ifc,.dwg,.dxf,.nwd,.nwc,.pdf'

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

// Decimal units, matching what storage providers and file managers report.
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

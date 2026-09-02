# Upload Types (`@cantera/upload-types`)

Generic upload lifecycle types for cantera components: files moving through queued, uploading, processing, complete, and error, plus rejection reasons, an accept matcher, and locale-neutral byte formatting.

- Type: types
- Install: `npx shadcn@latest add @cantera/upload-types`
- Docs: https://canteraui.vercel.app/components/upload-types
- Registry item: https://canteraui.vercel.app/r/upload-types.json

Files written into the consumer project:

- `lib/upload-types.ts`

## Usage

The lifecycle of a file on its way into a project. Construction files are heavy and "uploaded" is not "done" — providers translate a design after the bytes land. Components render these shapes and never upload; adapters drive the phases and report back through them.

```tsx
import { formatBytes, MODEL_FILE_ACCEPT, type UploadFile } from '@/lib/upload-types'

const files: UploadFile[] = [
  { id: 'v1', name: 'summit-tower.rvt', size: 248_000_000, phase: 'complete' },
  { id: 'v2', name: 'cedar-mill-site.nwd', size: 612_000_000, phase: 'uploading', progress: 0.42 },
  {
    id: 'v3',
    name: 'dockside-mep.ifc',
    phase: 'processing',
    processingLabel: 'Translating model',
  },
]

const caption = `${MODEL_FILE_ACCEPT} · up to ${formatBytes(800_000_000)}`
```

## Exports

- `UploadPhase` (`type`) — 'queued' | 'uploading' | 'processing' | 'complete' | 'error'. Processing is the provider working after the bytes arrived — translation, extraction — usually without a progress signal.
- `UploadFile` (`interface`) — One tracked file: stable id, name, optional byte size, phase, 0–1 progress while uploading, a processingLabel, and error text with a retryable flag that decides warning versus danger.
- `UploadRejection / UploadRejectionReason` (`interface / type`) — A refused browser File plus the rule it broke: 'file-type', 'file-size', or 'file-count'.
- `MODEL_FILE_ACCEPT` (`string`) — Accept preset for the design formats APS translates most often: .rvt, .ifc, .dwg, .dxf, .nwd, .nwc, .pdf.
- `matchesAccept` (`(file: File, accept?: string) => boolean`) — Whether a File satisfies an accept string — extensions, exact MIME types, and type/* wildcards, the native file-input grammar.
- `formatBytes` (`(bytes: number, locale?: string) => string`) — Bytes as a localized short unit string, e.g. 248 MB. Locale-neutral Intl by default; decimal units, matching what storage providers report.

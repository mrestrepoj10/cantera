# File Drop Zone (`@cantera/file-drop-zone`)

A drafting-grid drop zone for heavy AEC files: the dot grid magnetizes under a dragged file, plots upward as bytes land, and glows while the provider translates — with per-file rows on the async-pending contract.

- Type: component
- Install: `npx shadcn@latest add @cantera/file-drop-zone`
- Docs: https://canteraui.vercel.app/components/file-drop-zone
- Registry item: https://canteraui.vercel.app/r/file-drop-zone.json
- Registry dependencies: button, @cantera/token-status, @cantera/status-tokens, @cantera/upload-types
- npm dependencies: lucide-react
- Working example page: `npx shadcn@latest add @cantera/file-drop-zone-demo` — installs app/examples/file-drop-zone/page.tsx

Files written into the consumer project:

- `file-drop-zone.tsx`

## Notes

The component never uploads: onDropFiles hands over validated File objects and the consumer drives the controlled files array as the transfer moves through queued, uploading, processing, complete, and error. The grid surface derives one phase from those files — magnetized during a drag, plotted bottom-up by aggregate progress, an ambient glow while providers translate, and a status tint when work settles. Ambient motion is confined to the surface and falls back to a static treatment under prefers-reduced-motion.

Validation runs before any callback: accept (extension, MIME, and type/* wildcard grammar), maxSize per file, and maxFiles against the tracked list; refusals arrive at onReject with a reason. MODEL_FILE_ACCEPT from upload-types covers the common APS design formats. Retry follows the async-pending contract; remove doubles as cancel while a file is in flight.

showList false hides the built-in rows while files keep driving the grid; FileDropZoneItem is exported for rendering the same rows in your own layout.

## Props

- `files` (`UploadFile[]`, default `[]`) — The tracked files, controlled by the consumer. The grid surface derives its phase from them: uploading plots the grid, processing starts the ambient glow, settled files tint it.
- `onDropFiles` (`(files: File[]) => void | Promise<void>`) — Files that passed validation, from a drop or the picker. The component never uploads — start the transfer here and drive files as it moves.
- `onReject` (`(rejections: UploadRejection[]) => void`) — Files refused before any upload started, with the rule each broke.
- `onRetry` (`(file: UploadFile) => void | Promise<void>`) — Retry for a failed file. Promise-returning handlers drive the pending state; the button keeps its label, spins, and stays put.
- `onRemove` (`(file: UploadFile) => void`) — Remove a file's row. While the file is queued or uploading the same control reads as cancel.
- `accept` (`string`) — Native accept grammar: extensions, MIME types, type/* wildcards. MODEL_FILE_ACCEPT covers the common APS design formats.
- `maxFiles` (`number`) — Cap on tracked files; extras reject as file-count.
- `maxSize` (`number`) — Per-file byte ceiling; larger files reject as file-size.
- `multiple` (`boolean`, default `true`) — Accept several files per gesture. Drops usually batch.
- `disabled` (`boolean`, default `false`) — Ignores drops and the picker while keeping the zone focusable.
- `label` (`string`, default `'Drag files here or browse'`) — Idle headline. The zone swaps it for phase copy while work is running.
- `hint` (`string`) — Caption under the headline. Defaults to a summary of the accept and size rules.
- `showList` (`boolean`, default `true`) — Render the built-in file rows. Files keep driving the grid either way; turn this off to lay rows out yourself with FileDropZoneItem.
- `density` (`'comfortable' | 'compact'`, default `'comfortable'`) — Comfortable keeps the 44px field target on rows; compact is the explicit desktop escape hatch.
- `locale` (`string`) — BCP 47 tag for sizes and percentages. Defaults locale-neutral.
- `...props` (`ComponentProps<'div'>`) — Everything else lands on the root element.

## Data attributes

- `data-phase` (`'idle' | 'dragover' | 'uploading' | 'processing' | 'complete' | 'error'`) — The derived surface phase, on the root and each file row (rows carry their own file phase).
- `data-tone` (`'success' | 'warning' | 'danger'`) — Present once work settles: success on complete; a retryable-only failure is warning, a terminal one danger.
- `data-density` (`'comfortable' | 'compact'`) — The active density, for consumer styling hooks.

## FileDropZoneItem props

- `file` (`UploadFile`) — The file to render: name, format and size chip, and the phase treatment — progressbar, shimmer label, check, or error with retry.
- `onRetry` (`(file: UploadFile) => void | Promise<void>`) — Retry for a failed file. Promise-returning handlers drive the pending state; the button keeps its label, spins, and stays put.
- `retryPending` (`boolean`, default `false`) — Pending state for the retry action, drivable from outside.
- `onRemove` (`(file: UploadFile) => void`) — Remove the row — cancel in flight, clear it after it settled.
- `density` (`'comfortable' | 'compact'`, default `'comfortable'`) — Comfortable keeps the 44px field target; compact is the escape hatch.
- `locale` (`string`) — BCP 47 tag for sizes and percentages. Defaults locale-neutral.
- `...props` (`ComponentProps<'li'>`) — Everything else lands on the root li.

## Exports

- `FileDropZoneItem` (`component`) — The file row on its own, for laying rows out anywhere — a table, a sidebar, next to model-status-card — with identical styling. Pair with showList false.
- `FILE_DROP_ZONE_CSS` (`string`) — The drafting-grid stylesheet the component hoists via React 19 style precedence — exported for custom surfaces that reuse the grid outside the zone.

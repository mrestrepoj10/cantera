# Viewer Agent Tools (`@cantera/viewer-agent-tools`)

A typed tool catalog that lets an AI agent drive a live Autodesk Viewer: find and search elements into named sets, read properties, isolate, colour, section, frame, measure, screenshot, switch views, and query the property database in a sandboxed worker — with undo snapshots for every display change.

- Type: preset
- Install: `npx shadcn@latest add @cantera/viewer-agent-tools`
- Docs: https://canteraui.vercel.app/components/viewer-agent-tools
- Registry item: https://canteraui.vercel.app/r/viewer-agent-tools.json
- Registry dependencies: @cantera/agent-types, @cantera/viewer-types

Files written into the consumer project:

- `lib/viewer-agent-tools.ts`
- `lib/viewer-agent-core.ts`
- `lib/viewer-agent-state.ts`
- `lib/viewer-agent-inspect.ts`
- `lib/viewer-agent-display.ts`
- `lib/viewer-agent-query.ts`

## Notes

Client-only: tools run against the viewer getViewer returns at call time, so pass a getter over a ref, never a captured value. Every tool validates its input against its closed schema and throws a plain Error on failure; map a throw to a failed action. Mutating tools snapshot viewer.getState() and the colour ledger first; undo.restore(undoId) returns there, keeping the current camera unless the undone tool moved it, and drops later entries. Pass the runtime’s call id as actionId to make it the undo key.

The element index (leaf dbIds with name, category, and level) is built once per model on first use and dropped when the model changes; a different document also clears the sets. run_query copies the property database into a Blob-URL Web Worker that has no DOM, with network and storage globals deleted before any query runs, and terminates it when a query overruns its time box. A Content-Security-Policy without worker-src blob: and script-src unsafe-eval disables run_query only. Tool output is capped at 60,000 characters with a truncation note.

## Usage

Everything an AI agent needs to drive a live Autodesk Viewer, as plain typed functions: discovery, named element sets, display changes with undo snapshots, measurement, screenshots the model can see, and JavaScript over the property database in a sandboxed worker. The catalog is runtime-agnostic — map each tool to your agent runtime’s tool contract, or to terminal subcommands.

```tsx
import { useAPSViewer } from '@/components/ui/aps-viewer'
import { createViewerAgentTools } from '@/lib/viewer-agent-tools'

const { viewer } = useAPSViewer()
const viewerRef = useRef(viewer)
const [agentTools] = useState(() => createViewerAgentTools(() => viewerRef.current))

const runtimeTools = agentTools.tools.map((tool) => ({
  name: tool.name,
  description: tool.description,
  inputSchema: tool.inputSchema,
  execute: (input, { signal }) => tool.execute(input, { signal }),
}))

const sets = useSyncExternalStore(agentTools.sets.subscribe, agentTools.sets.list)
```

## Exports

- `createViewerAgentTools` (`(getViewer: () => ViewerAgentViewer | null, options?: ViewerAgentToolsOptions) => ViewerAgentTools`) — Builds the catalog over whatever viewer getViewer returns at call time. A real APSViewer3D satisfies ViewerAgentViewer.
- `ViewerAgentTools` (`interface`) — tools (25 ViewerAgentTool), sets (ElementSetStore), undo (UndoStack), colors (ColorLedger), instructions (the system prompt, under 4 KB), describeSelection(dbIds?), and dispose() to stop the query worker.
- `ElementSetStore / UndoStack / ColorLedger` (`class`) — External stores with subscribe and a stable snapshot getter — sets.list, undo.entries, colors.legend — ready for useSyncExternalStore. undo.restore(undoId) returns the viewer to how it was before that action. Re-exported from lib/viewer-agent-tools with their entry types.
- `ViewerAgentToolsOptions` (`interface`) — math (THREE constructors, default the viewer global), resultTextLimit (default 60,000 characters), queryTimeoutMs (default 10 s), queryMaxPairs, createQueryWorker, now.
- `VIEWER_AGENT_INSTRUCTIONS` (`string`) — The same system prompt, for runtimes that need it before the viewer exists.
- `validateToolInput / parseHexColor / truncateResultText / unionBoxes / boxGap` (`function`) — The pure helpers the tools are built from, exported from lib/viewer-agent-core for tests and custom tools.

## Tools

- `get_model_info / list_levels / list_categories` (`read`) — Orientation: units, counts, bounding box; levels with authored elevation and viewer z range; categories by count.
- `find_elements / search_text / get_selection / list_sets` (`read`) — Save matches as a named set and return a sample. Every tool that takes ids also takes setId, and setId "selection" is the live selection.
- `get_properties / measure_bbox / take_screenshot / run_query` (`read`) — Properties by name, bounding-box sizes and distances in model units and metres, an image of at most 1024 px the model can see, and JavaScript over the property database in a time-boxed worker.
- `select_elements / isolate_elements / hide_elements / show_all` (`mutates`) — Visibility and selection, each recorded for undo. isolate_elements ghosts the rest, or with hideOthers: true fully hides it through the viewer’s Hide others mode, which the toolbar button then shows pressed.
- `color_elements / clear_colors` (`mutates`) — Theming colours tracked in the ledger that feeds the legend.
- `fit_to_view / set_camera / set_section / clear_section` (`mutates`) — Framing, camera presets and look-at, and one section plane by level or by axis and position.
- `list_views / open_view / save_view_state / restore_view_state` (`read / mutates`) — Switch between the document’s 3D views and sheets, and name and return to viewer states.

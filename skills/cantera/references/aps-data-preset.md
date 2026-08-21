# APS Data Preset (`@cantera/aps-data-preset`)

Autodesk Platform Services (ACC) data preset: adapters from Data Management hubs, projects, folders, items, and versions plus Model Derivative and ACC Sheets payloads into cantera's project types.

- Type: lib
- Install: `npx shadcn@latest add @cantera/aps-data-preset`
- Docs: https://canteraui.xyz/components/aps-data-preset
- Registry item: https://canteraui.xyz/r/aps-data-preset.json
- Registry dependencies: @cantera/project-types

Files written into the consumer project:

- `lib/aps-data-preset.ts`

## Usage

Everything ACC-data-specific in one data-only item: adapters from the Data Management, Model Derivative, and ACC Sheets payloads into cantera project types. Each input interface is the structural subset the adapter actually reads, so any payload with those fields adapts — the APS emulator included. Fetching and tokens stay in your auth layer.

```tsx
import { fromApsFolder, fromApsHub, fromApsItem, fromApsProject } from '@/lib/aps-data-preset'
import { ProjectPicker } from '@/components/ui/project-picker'

// GET /project/v1/hubs and /project/v1/hubs/{hub}/projects, fetched by you.
const hubs = hubsResponse.data.map(fromApsHub)
const projects = projectsResponse.data.map(fromApsProject)
const folders = topFoldersResponse.data.map(fromApsFolder)
const items = contentsResponse.data.map((item) => fromApsItem(item, includedTips.get(item.id)))

<ProjectPicker hubs={hubs} projects={projects} onValueChange={setProjectId} />
```

## Exports

- `fromApsHub` (`(doc: ApsHubDoc) => Hub`) — Adapter from a Data Management hub resource into a cantera Hub.
- `fromApsProject` (`(doc: ApsProjectDoc) => Project`) — Adapter from a Data Management project resource into a cantera Project, hub relationship included.
- `fromApsFolder` (`(doc: ApsFolderDoc) => Folder`) — Adapter from a Data Management folder resource, including modified metadata and object count.
- `fromApsItem` (`(doc: ApsItemDoc, tip?: ApsVersionDoc) => Item`) — Adapter from an item resource plus its optional JSON:API included tip version.
- `fromApsVersion` (`(doc: ApsVersionDoc) => ItemVersion`) — Adapter from a version resource, reading the nullable Model Derivative URN from the derivatives relationship.
- `fromApsManifest` (`(doc: ApsManifestDoc) => ModelTranslation`) — Adapter from a Model Derivative manifest: normalizes status, reads the design name from the first named derivative, lists outputs once each.
- `toTranslationStatus` (`(status?: string) => ModelTranslationStatus`) — Normalizes a manifest status string; unknown strings read as "pending", the one state that promises nothing.
- `fromAccVersionSet` (`(doc: AccVersionSetDoc) => SheetVersionSet`) — Adapter from an ACC Sheets version set into a cantera SheetVersionSet.
- `ApsHubDoc / ApsProjectDoc / ApsFolderDoc / ApsItemDoc / ApsVersionDoc / ApsManifestDoc / AccVersionSetDoc` (`interface`) — The structural subsets of the API responses each adapter reads — any payload with these fields adapts, the APS emulator included.

# Project Types (`@cantera/project-types`)

Generic project-context types for cantera components: hubs, projects, folders, items, versions, model translations, and sheet version sets. The lingua franca adapters translate into.

- Type: lib
- Install: `npx shadcn@latest add @cantera/project-types`
- Docs: https://canteraui.vercel.app/components/project-types
- Registry item: https://canteraui.vercel.app/r/project-types.json

Files written into the consumer project:

- `lib/project-types.ts`

## Usage

The lingua franca for project context — hubs, projects, browsable folders and items, immutable versions, model translations, and sheet version sets. Components take these shapes as props and never fetch; adapters translate provider payloads into them.

```tsx
import type { FolderEntry, Hub, ItemVersion, Project } from '@/lib/project-types'

const hub: Hub = { id: 'b.ridgeline-us', name: 'Ridgeline Builders', region: 'US' }

const projects: Project[] = [
  { id: 'b.summit-tower', name: 'Summit Tower', hubId: hub.id },
  { id: 'b.cedar-mill', name: 'Cedar Mill Campus', hubId: hub.id },
]

const entries: FolderEntry[] = [{ id: 'folder-1', name: 'Project Files', type: 'folder' }]
const versions: ItemVersion[] = []
```

## Exports

- `Hub` (`interface`) — An account-level container of projects — an ACC hub, a Procore company: id, name, optional region.
- `Project` (`interface`) — One project: id, name, and the hubId pickers group by when present.
- `BrowsePathSegment` (`interface`) — One controlled breadcrumb level: id, name, and type 'hub' | 'project' | 'folder'.
- `Folder / Item / FolderEntry` (`interface / union`) — Folder-like navigation rows and file-like item rows. FolderEntry is their rendering union; Hub and Project are structurally compatible with Folder.
- `ItemVersion` (`interface`) — An immutable file version: id, version number, display name, creator/time, storage size, and nullable derivative URN.
- `isItem` (`(entry: FolderEntry) => entry is Item`) — Narrows a browser row to its file-like Item shape.
- `normalizeSearchText` (`(value: string) => string`) — Case-folds and strips diacritics for consistent client and server search.
- `ModelTranslationStatus` (`type`) — 'pending' | 'inprogress' | 'success' | 'failed' | 'timeout'.
- `ModelTranslation` (`interface`) — The translation state of one design: urn, status, and optional name, progress, outputs, error.
- `SheetVersionSet` (`interface`) — A named issuance of construction sheets: id, name, and when it was issued.
- `versionSetIssuance` (`(versionSet: SheetVersionSet) => Date | null`) — Normalizes issuanceDate (Date, string, or number) into a Date, or null when absent.
- `groupProjectsByHub` (`(hubs: Hub[], projects: Project[]) => { hub: Hub | null; projects: Project[] }[]`) — Projects grouped in hub catalog order; projects referencing no known hub land in a trailing hub: null group rather than being dropped.

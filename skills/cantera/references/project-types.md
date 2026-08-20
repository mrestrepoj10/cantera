# Project Types (`@cantera/project-types`)

Generic project-context types for cantera components: hubs, projects, model translations, sheet version sets. The lingua franca adapters translate into.

- Type: lib
- Install: `npx shadcn@latest add @cantera/project-types`
- Docs: https://canteraui.xyz/components/project-types
- Registry item: https://canteraui.xyz/r/project-types.json

Files written into the consumer project:

- `lib/project-types.ts`

## Usage

The lingua franca for project context — hubs, projects, model translations, sheet version sets. The pickers take these shapes as props and never fetch; adapters translate provider payloads into them, so ACC, Procore, or your own backend renders with the same components.

```tsx
import type { Hub, Project } from '@/lib/project-types'

const hub: Hub = { id: 'b.ridgeline-us', name: 'Ridgeline Builders', region: 'US' }

const projects: Project[] = [
  { id: 'b.summit-tower', name: 'Summit Tower', hubId: hub.id },
  { id: 'b.cedar-mill', name: 'Cedar Mill Campus', hubId: hub.id },
]
```

## Exports

- `Hub` (`interface`) — An account-level container of projects — an ACC hub, a Procore company: id, name, optional region.
- `Project` (`interface`) — One project: id, name, and the hubId pickers group by when present.
- `ModelTranslationStatus` (`type`) — 'pending' | 'inprogress' | 'success' | 'failed' | 'timeout'.
- `ModelTranslation` (`interface`) — The translation state of one design: urn, status, and optional name, progress, outputs, error.
- `SheetVersionSet` (`interface`) — A named issuance of construction sheets: id, name, and when it was issued.
- `versionSetIssuance` (`(versionSet: SheetVersionSet) => Date | null`) — Normalizes issuanceDate (Date, string, or number) into a Date, or null when absent.
- `groupProjectsByHub` (`(hubs: Hub[], projects: Project[]) => { hub: Hub | null; projects: Project[] }[]`) — Projects grouped in hub catalog order; projects referencing no known hub land in a trailing hub: null group rather than being dropped.

# Project Picker (`@cantera/project-picker`)

The project choice every ACC screen starts from: a searchable combobox grouped by hub, with the loading, error, and empty states a real fetch needs.

- Type: component
- Install: `npx shadcn@latest add @cantera/project-picker`
- Docs: https://canteraui.xyz/components/project-picker
- Registry item: https://canteraui.xyz/r/project-picker.json
- Registry dependencies: button, command, popover, @cantera/project-types
- npm dependencies: lucide-react
- Working example page: `npx shadcn@latest add @cantera/project-picker-demo` — installs app/examples/project-picker/page.tsx

Files written into the consumer project:

- `project-picker.tsx`

## Props

- `projects` (`Project[]`) — The projects to offer. Search matches their visible names.
- `hubs` (`Hub[]`) — Hubs to group by, in catalog order. Omit for a flat list; projects referencing no known hub still render, never silently dropped.
- `value` (`string`) — Selected project id (controlled).
- `defaultValue` (`string`) — Initially selected project id (uncontrolled).
- `onValueChange` (`(projectId: string) => void | Promise<void>`) — Called with the chosen project id. Return a promise and the picker drives its own pending state.
- `status` (`'ready' | 'loading' | 'error'`, default `'ready'`) — Where the project list stands. Loading renders a still skeleton, error the message wired to a retry — both inside the open picker, so the trigger never unmounts.
- `error` (`string`) — Human-readable fetch failure, shown when status is "error".
- `onRetry` (`() => void | Promise<void>`) — Retry for the failed fetch, rendered on the async-pending contract at the 44px floor.
- `retryPending` (`boolean`, default `false`) — Pending state for the retry action, drivable from outside.
- `pending` (`boolean`, default `false`) — The trigger keeps its label, crossfades in a spinner, and stays focusable while a selection lands.
- `emptyMessage` (`string`, default `'No projects in this hub yet.'`) — Shown when the list is ready but holds no projects at all.
- `'aria-label'` (`string`, default `'Project'`) — Accessible name for the trigger. A combobox never takes its name from its content, so without one the control announces its value but not what it is.

# Hub Switcher (`@cantera/hub-switcher`)

The hub context switch: which ACC hub — or any Hub — the rest of the screen works against, with region context and a pending state for the switch itself.

- Type: component
- Install: `npx shadcn@latest add @cantera/hub-switcher`
- Docs: https://canteraui.xyz/components/hub-switcher
- Registry item: https://canteraui.xyz/r/hub-switcher.json
- Registry dependencies: select, @cantera/project-types
- npm dependencies: lucide-react
- Working example page: `npx shadcn@latest add @cantera/hub-switcher-demo` — installs app/examples/hub-switcher/page.tsx

Files written into the consumer project:

- `hub-switcher.tsx`

## Props

- `hubs` (`Hub[]`) — The hubs to offer, in the order they render.
- `value` (`string`) — Selected hub id (controlled). Leave undefined to let the switcher own it.
- `defaultValue` (`string`) — Initially selected hub id (uncontrolled).
- `onValueChange` (`(hubId: string) => void | Promise<void>`) — Called with the chosen hub id. Return a promise and the switcher drives its own pending state for the duration.
- `pending` (`boolean`, default `false`) — The trigger keeps showing the current hub, crossfades in a spinner, and goes read-only — still focusable, never unmounted.
- `disabled` (`boolean`, default `false`) — Disables the whole select.
- `placeholder` (`string`, default `'Select hub'`) — Shown while no hub is selected.
- `emptyMessage` (`string`, default `'No hubs available.'`) — Shown inside the open list when there are no hubs at all.
- `'aria-label'` (`string`, default `'Hub'`) — Accessible name for the trigger. A combobox never takes its name from its content, so without one the control announces its value but not what it is.

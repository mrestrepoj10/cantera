# Version Set Select (`@cantera/version-set-select`)

Which issuance of the construction sheets to read from, every option carrying its issuance date — building from a superseded set is an expensive mistake.

- Type: component
- Install: `npx shadcn@latest add @cantera/version-set-select`
- Docs: https://canteraui.xyz/components/version-set-select
- Registry item: https://canteraui.xyz/r/version-set-select.json
- Registry dependencies: select, @cantera/project-types
- npm dependencies: lucide-react
- Working example page: `npx shadcn@latest add @cantera/version-set-select-demo` — installs app/examples/version-set-select/page.tsx

Files written into the consumer project:

- `version-set-select.tsx`

## Props

- `versionSets` (`SheetVersionSet[]`) — The issuances to offer, in the order they render — each option carries its issuance date.
- `value` (`string`) — Selected version set id (controlled).
- `defaultValue` (`string`) — Initially selected version set id (uncontrolled).
- `onValueChange` (`(versionSetId: string) => void | Promise<void>`) — Called with the chosen version set id. Return a promise and the select drives its own pending state.
- `pending` (`boolean`, default `false`) — The trigger keeps showing the current set, crossfades in a spinner, and goes read-only — still focusable, never unmounted.
- `disabled` (`boolean`, default `false`) — Disables the whole select.
- `locale` (`string | string[]`, default `runtime locale`) — BCP 47 locale(s) for the issuance dates. Left undefined, Intl resolves the runtime locale — nothing is hardcoded to English.
- `'aria-label'` (`string`, default `'Version set'`) — Accessible name for the trigger. A combobox never takes its name from its content, so without one the control announces its value but not what it is.

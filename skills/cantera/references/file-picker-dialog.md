# File Picker Dialog (`@cantera/file-picker-dialog`)

Hub Browser inside a dialog, with tip-or-version selection and an explicit cancel action.

- Type: component
- Install: `npx shadcn@latest add @cantera/file-picker-dialog`
- Docs: https://canteraui.xyz/components/file-picker-dialog
- Registry item: https://canteraui.xyz/r/file-picker-dialog.json
- Registry dependencies: button, dialog, @cantera/hub-browser, @cantera/project-types
- Working example page: `npx shadcn@latest add @cantera/file-picker-dialog-demo` — installs app/examples/file-picker-dialog/page.tsx

Files written into the consumer project:

- `file-picker-dialog.tsx`

## Props

- `...HubBrowserProps` (`HubBrowserProps`) — The same controlled path, entries, status, pending, pagination, and version-history props.
- `open / defaultOpen / onOpenChange` (`boolean / boolean / (open: boolean) => void`) — Controlled or uncontrolled dialog visibility.
- `trigger` (`ReactElement`) — Optional element enhanced as the dialog trigger without an extra wrapper.
- `onSelect` (`(item: Item, version?: ItemVersion) => void | Promise<void>`) — Selection callback for the tip or exact version.
- `onCancel` (`() => void`) — Called from the explicit Cancel action.
- `title / description` (`string / string`, default `'Choose a file' / browser guidance`) — Accessible dialog title and description.

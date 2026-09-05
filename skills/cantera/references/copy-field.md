# Copy Field (`@cantera/copy-field`)

A value someone has to paste into another system — a client ID, a callback URL — shown in full and always selectable, with a copy button that confirms.

- Type: component
- Install: `npx shadcn@latest add @cantera/copy-field`
- Docs: https://canteraui.vercel.app/components/copy-field
- Registry item: https://canteraui.vercel.app/r/copy-field.json
- Registry dependencies: button
- npm dependencies: lucide-react
- Working example page: `npx shadcn@latest add @cantera/copy-field-demo` — installs app/examples/copy-field/page.tsx

Files written into the consumer project:

- `copy-field.tsx`

## Notes

The value is rendered in full and selectable, and the Clipboard API is only reached for on click, so the field works on non-secure origins where writeText is unavailable: the button simply fails quietly and the value stays there to select by hand. The confirmation is announced politely to screen readers.

## Props

- `value` (`string`) — The value to hand over. Rendered in full, selectable, and breakable at any character so long identifiers never overflow.
- `label` (`string`) — What the value is, for the button's accessible name: label "client ID" gives "Copy client ID".
- `confirmMs` (`number`, default `2000`) — How long the Copied confirmation shows before the button resets.

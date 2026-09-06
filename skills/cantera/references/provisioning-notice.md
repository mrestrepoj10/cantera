# Provisioning Notice (`@cantera/provisioning-notice`)

The empty state every ACC app hits: signed in, but no hubs until an account admin adds the client ID under Custom Integrations. Names the step, hands over the ID, and says what else an empty list can mean.

- Type: block
- Install: `npx shadcn@latest add @cantera/provisioning-notice`
- Docs: https://canteraui.vercel.app/components/provisioning-notice
- Registry item: https://canteraui.vercel.app/r/provisioning-notice.json
- Registry dependencies: @cantera/copy-field
- Working example page: `npx shadcn@latest add @cantera/provisioning-notice-demo` — installs app/examples/provisioning-notice/page.tsx

Files written into the consumer project:

- `provisioning-notice.tsx`

## Notes

Show it when the hub list comes back empty after a successful sign-in — the Data Management API reports an unprovisioned app as an empty list, not an error, so a picker's emptyMessage is the wrong place for these instructions. Pass the disconnect action as footer so a visitor who signed in with the wrong account has a way out; ProjectPicker and hub-switcher stay for the accounts that do have hubs.

## Props

- `clientId` (`string`) — The APS client ID the account admin adds. Rendered in a CopyField.
- `appName` (`string`) — Your product's name as the admin will see it in the provider's admin console.
- `containerNoun` (`string`, default `'hubs'`) — The provider's account-level container, plural: hubs for ACC, companies for Procore.
- `adminPath` (`ReactNode`, default `'Account Admin → Custom Integrations'`) — Where the admin adds the app, as the provider labels it.
- `title` (`ReactNode`, default `'No projects visible yet'`) — The heading.
- `titleAs` (`'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'div'`, default `'h2'`) — The heading level that fits the page outline, or div to opt out.
- `footer` (`ReactNode`) — Rendered under the notice: a disconnect action, a support link.

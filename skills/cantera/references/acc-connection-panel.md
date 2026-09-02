# ACC Connection Panel (`@cantera/acc-connection-panel`)

The live Autodesk connection panel: one ConnectionCard wired to a sign-out route and a consent restart, with disconnect and reconnect on the async-pending contract.

- Type: block
- Install: `npx shadcn@latest add @cantera/acc-connection-panel`
- Docs: https://canteraui.vercel.app/components/acc-connection-panel
- Registry item: https://canteraui.vercel.app/r/acc-connection-panel.json
- Registry dependencies: @cantera/connection-card, @cantera/oauth-types

Files written into the consumer project:

- `components/acc-connection-panel.tsx`

## Notes

One ConnectionCard bound to two hrefs: signOutHref takes a POST that clears the grant and session, signInHref restarts consent. Disconnect settles by refreshing the server page, so the server view stays the truth; reconnect navigates. @cantera/acc-sign-in mounts it under a heading once a session exists.

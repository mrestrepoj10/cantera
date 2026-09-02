# Model Browser (`@cantera/model-browser`)

Hub sidebar, recursive finder, account controls, and a full-bleed Autodesk Viewer composed into one screen, with untranslated-model states. Points at your tree and viewer-token endpoints; model-viewer-page ships those routes.

- Type: block
- Install: `npx shadcn@latest add @cantera/model-browser`
- Docs: https://canteraui.vercel.app/components/model-browser
- Registry item: https://canteraui.vercel.app/r/model-browser.json
- Registry dependencies: button, sidebar, @cantera/hub-sidebar, @cantera/hub-tree, @cantera/finder, @cantera/aps-viewer, @cantera/viewer-types, @cantera/viewer-extension-types, @cantera/project-types, @cantera/model-status-card, @cantera/token-status, @cantera/user-account-badge, @cantera/oauth-types, @cantera/status-tokens
- npm dependencies: lucide-react

Files written into the consumer project:

- `components/model-browser.tsx`
- `components/model-finder.ts`

## Notes

Fetches from treeEndpoint (default /api/models/tree) and viewerTokenEndpoint (default /api/viewer-token) — the routes @cantera/model-viewer-page ships. Point both at your own handlers to mount the screen without the template. initialNodes skips the first hub read when the server already has the tree; embedded drops the page chrome so the browser fits a docs or preview frame.

## ModelBrowser props

- `account` (`OAuthAccount`) — Signed-in account shown in the fixed top-right account control.
- `initialNodes` (`HubTreeNode[]`, default `[]`) — Optional normalized roots. When empty, the client starts by requesting hubs from treeEndpoint.
- `treeEndpoint` (`string`, default `'/api/models/tree'`) — Session-backed lazy Data Management route implementing the shared kind and id query contract.
- `viewerTokenEndpoint` (`string`, default `'/api/viewer-token'`) — Separate two-legged viewer token route, scoped to viewables:read. Three-legged Data Management tokens never cross into the viewer.
- `signOutHref` (`string`, default `'/api/auth/signout?next=/sign-in'`) — POST route used by the account control to revoke the grant and clear the session.
- `embedded` (`boolean`, default `false`) — Constrains the desktop sidebar and shell height to the nearest positioned preview container. Leave false for the full-page route.

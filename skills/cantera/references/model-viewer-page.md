# Model Viewer Page (`@cantera/model-viewer-page`)

A complete APS project-tree and Autodesk Viewer page: scoped Autodesk sign-in, lazy 3-legged Data Management browsing, a full-bleed native viewer, account controls, and untranslated-model states.

- Type: block
- Install: `npx shadcn@latest add @cantera/model-viewer-page`
- Docs: https://canteraui.vercel.app/components/model-viewer-page
- Registry item: https://canteraui.vercel.app/r/model-viewer-page.json
- Registry dependencies: button, card, sidebar, @cantera/hub-sidebar, @cantera/hub-tree, @cantera/aps-viewer, @cantera/viewer-extension-types, @cantera/aps-data-preset, @cantera/project-types, @cantera/acc-sign-in, @cantera/model-status-card, @cantera/status-tokens, @cantera/user-account-badge
- npm dependencies: aec-auth, lucide-react

Files written into the consumer project:

- `app/models/page.tsx`
- `app/models/loading.tsx`
- `components/model-browser.tsx`
- `app/api/models/tree/route.ts`
- `app/api/viewer-token/route.ts`

Environment variables added to `.env.local`:

- `APS_CLIENT_ID`
- `APS_CLIENT_SECRET`
- `SESSION_SECRET`
- `APS_AUTH_BASE_URL`

## Install notes

Installed: app/models/page.tsx, its loading UI, the lazy /api/models/tree route, and the 2-legged /api/viewer-token route. The acc-sign-in dependency supplies the OAuth routes, lib/acc-auth.ts, and the /sign-in page with its scope picker — signed out, /models prompts and routes there with next=/models, so one surface owns scope selection.

Environment (added to .env.local as empty keys — fill them in):
- APS_CLIENT_ID / APS_CLIENT_SECRET — your APS app credentials. The tree uses the signed-in user's 3-legged grant; the viewer route uses the same app credentials with viewables:read only.
- SESSION_SECRET — required in production. Generate one with `openssl rand -base64 32`.
- APS_AUTH_BASE_URL — optional APS origin override. Leave unset for real APS. A relative value such as "/emulate/aps" is useful only when your app mounts a compatible embedded emulator at that path.

The default aec-auth vault from acc-sign-in is in-memory: appropriate for a demo, not production. Replace it with a durable encrypted VaultStore before real users connect.

The cantera showcase emulator supplies the project tree but no SVF geometry. Its seeded demo links one tip version to an externally translated sample URN when credentials are configured; every other item intentionally renders the no-geometry state. Your application should store real derivative URNs on normalized item versions.

## ModelBrowser props

- `account` (`OAuthAccount`) — Signed-in account shown in the fixed top-right account control.
- `initialNodes` (`HubTreeNode[]`, default `[]`) — Optional normalized roots. When empty, the client starts by requesting hubs from treeEndpoint.
- `treeEndpoint` (`string`, default `'/api/models/tree'`) — Session-backed lazy Data Management route implementing the shared kind and id query contract.
- `viewerTokenEndpoint` (`string`, default `'/api/viewer-token'`) — Separate two-legged viewer token route, scoped to viewables:read. Three-legged Data Management tokens never cross into the viewer.
- `signOutHref` (`string`, default `'/api/auth/signout?next=/sign-in'`) — POST route used by the account control to revoke the grant and clear the session.
- `embedded` (`boolean`, default `false`) — Constrains the desktop sidebar and shell height to the nearest positioned preview container. Leave false for the full-page route.

## Tree route

- `kind=hubs` (`no ids`) — Loads the signed-in account’s hubs.
- `kind=projects` (`hubId`) — Loads projects under one hub.
- `kind=top-folders` (`hubId, projectId`) — Loads a project’s top folders.
- `kind=folder-contents` (`projectId, folderId`) — Loads folders and items under one folder.
- `kind=versions` (`projectId, itemId`) — Loads immutable versions under one item.
- `kind=search` (`projectId, folderId, q`) — Recursively searches unopened descendants of one folder and returns matching tip versions for the scoped finder.

# Model Viewer Page (`@cantera-pro/model-viewer-page`)

A complete APS project-tree and Autodesk Viewer page: scoped Autodesk sign-in, lazy 3-legged Data Management browsing, recursive project and folder search, a full-bleed native viewer, account controls, and untranslated-model states.

- Type: template (pro, license required)
- Install: `npx shadcn@latest add @cantera-pro/model-viewer-page`
- Docs: https://canteraui.vercel.app/components/model-viewer-page
- Registry item: https://canteraui.vercel.app/r-pro/model-viewer-page.json
- License: https://canteraui.vercel.app/pro
- Registry dependencies: button, sidebar, @cantera/acc-auth-routes, @cantera/aps-data-preset, @cantera/project-types, @cantera/oauth-types, @cantera/hub-sidebar, @cantera/hub-tree, @cantera/finder, @cantera/aps-viewer, @cantera/viewer-types, @cantera/viewer-extension-types, @cantera/model-status-card, @cantera/token-status, @cantera/status-tokens, @cantera/theme-toggle
- npm dependencies: aec-auth, lucide-react

Files written into the consumer project:

- `app/models/page.tsx`
- `app/models/loading.tsx`
- `components/model-browser.tsx`
- `components/model-finder.ts`
- `app/api/models/tree/route.ts`
- `app/api/viewer-token/route.ts`

Environment variables added to `.env.local`:

- `APS_CLIENT_ID`
- `APS_CLIENT_SECRET`
- `SESSION_SECRET`
- `APP_ORIGIN`
- `APS_AUTH_BASE_URL`

## Install notes

Installed at /models: the page, its loading UI, the lazy /api/models/tree route, and the two-legged /api/viewer-token route. ModelBrowser is the screen; signed out, /models renders ScopedAutodeskSignIn inline.

Next:
1. Fill the keys acc-auth-routes added to .env.local (see its notes above).
2. Wrap children in app/layout.tsx with ThemeProvider from components/theme-provider.tsx (see theme-toggle).
3. Run next dev and open /models.

The cantera showcase emulator supplies a project tree but no geometry; store real derivative URNs on your item versions.
Reference: https://canteraui.vercel.app/components/model-viewer-page

## Notes

ModelBrowser fetches from treeEndpoint (default /api/models/tree) and viewerTokenEndpoint (default /api/viewer-token), the routes this template ships. Point both at your own handlers to mount the screen elsewhere. initialNodes skips the first hub read when the server already has the tree; embedded drops the page chrome so the browser fits a docs or preview frame. A theme toggle sits in the sidebar’s identity row, beside the collapse toggle; it needs ThemeProvider mounted in your root layout. The viewer settings panel saves its choices in this browser’s localStorage under cantera:model-viewer-page:viewer-settings; Reset returns to the starter set and clears the saved copy.

## ModelBrowser props

- `account` (`OAuthAccount`) — Signed-in account shown in the fixed top-right account control.
- `initialNodes` (`HubTreeNode[]`, default `[]`) — Optional normalized roots. When empty, the client starts by requesting hubs from treeEndpoint.
- `initialExpandedIds` (`string[]`, default `[]`) — Tree ids shown expanded on first render. Pair with initialNodes whose children are already loaded, such as a single preloaded folder.
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
- `kind=path` (`projectId, itemId, topFolderId`) — Walks a found item’s parent folders up to the searched top folder and returns the intermediate segments, so picking a search result can expand and select it in the tree.

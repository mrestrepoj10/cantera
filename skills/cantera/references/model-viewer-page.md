# Model Viewer Page (`@cantera/model-viewer-page`)

A complete APS project-tree and Autodesk Viewer page: scoped Autodesk sign-in, lazy 3-legged Data Management browsing, recursive project and folder search, a full-bleed native viewer, account controls, and untranslated-model states.

- Type: block
- Install: `npx shadcn@latest add @cantera/model-viewer-page`
- Docs: https://canteraui.vercel.app/components/model-viewer-page
- Registry item: https://canteraui.vercel.app/r/model-viewer-page.json
- Registry dependencies: @cantera/model-browser, @cantera/acc-auth-routes, @cantera/aps-data-preset, @cantera/project-types, @cantera/oauth-types
- npm dependencies: aec-auth, lucide-react

Files written into the consumer project:

- `app/models/page.tsx`
- `app/models/loading.tsx`
- `app/api/models/tree/route.ts`
- `app/api/viewer-token/route.ts`

Environment variables added to `.env.local`:

- `APS_CLIENT_ID`
- `APS_CLIENT_SECRET`
- `SESSION_SECRET`
- `APP_ORIGIN`
- `APS_AUTH_BASE_URL`

## Install notes

Installed at /models: the page, its loading UI, the lazy /api/models/tree route, and the two-legged /api/viewer-token route. The screen is @cantera/model-browser; signed out, /models renders ScopedAutodeskSignIn inline.

Next:
1. Fill the keys acc-auth-routes added to .env.local (see its notes above).
2. Run next dev and open /models.

The cantera showcase emulator supplies a project tree but no geometry; store real derivative URNs on your item versions.
Reference: https://canteraui.vercel.app/components/model-viewer-page

## Tree route

- `kind=hubs` (`no ids`) — Loads the signed-in account’s hubs.
- `kind=projects` (`hubId`) — Loads projects under one hub.
- `kind=top-folders` (`hubId, projectId`) — Loads a project’s top folders.
- `kind=folder-contents` (`projectId, folderId`) — Loads folders and items under one folder.
- `kind=versions` (`projectId, itemId`) — Loads immutable versions under one item.
- `kind=search` (`projectId, folderId, q`) — Recursively searches unopened descendants of one folder and returns matching tip versions for the scoped finder.
- `kind=path` (`projectId, itemId, topFolderId`) — Walks a found item’s parent folders up to the searched top folder and returns the intermediate segments, so picking a search result can expand and select it in the tree.

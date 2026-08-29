# Model Upload Page (`@cantera/model-upload-page`)

A complete APS upload page: scoped Autodesk sign-in with write access, a project and folder destination picker, translation options, direct-to-storage signed S3 uploads with progress, and per-file translation tracking.

- Type: block
- Install: `npx shadcn@latest add @cantera/model-upload-page`
- Docs: https://canteraui.vercel.app/components/model-upload-page
- Registry item: https://canteraui.vercel.app/r/model-upload-page.json
- Registry dependencies: button, card, checkbox, label, select, @cantera/file-drop-zone, @cantera/project-picker, @cantera/user-account-badge, @cantera/upload-types, @cantera/aps-data-preset, @cantera/project-types, @cantera/acc-auth-routes, @cantera/status-tokens
- npm dependencies: aec-auth, lucide-react

Files written into the consumer project:

- `app/upload/page.tsx`
- `app/upload/loading.tsx`
- `components/model-upload.tsx`
- `app/api/models/upload/route.ts`

Environment variables added to `.env.local`:

- `APS_CLIENT_ID`
- `APS_CLIENT_SECRET`
- `SESSION_SECRET`
- `APS_AUTH_BASE_URL`

## Install notes

Installed: app/upload/page.tsx, its loading UI, and the /api/models/upload route covering destination browsing, the signed-S3 storage dance, item or version creation, and translation status. The acc-auth-routes dependency supplies the OAuth routes and the scoped sign-in component; the page requests the Manage files access level and re-consents a read-only session.

Uploads go browser-to-storage through signed S3 part URLs, so file bytes never pass through your server. A file whose name already exists in the destination folder becomes a new version of that item; otherwise a new item is created. Every finished upload submits an svf2 translation job with the chosen views (2D sheets, 3D views, optional Revit master views) and the page polls the manifest until it settles.

Environment (added to .env.local as empty keys, fill them in):
- APS_CLIENT_ID / APS_CLIENT_SECRET - your APS app credentials; uploads use the signed-in user's 3-legged grant.
- SESSION_SECRET - required in production. Generate one with `openssl rand -base64 32`.
- APS_AUTH_BASE_URL - optional APS origin override. Leave unset for real APS; a relative value such as "/emulate/aps" targets a compatible embedded emulator.

Files over 250 MB are rejected by the start request - raise PART_SIZE or MAX_PARTS in the route to lift the bound.

## ModelUpload props

- `account` (`OAuthAccount`) — Signed-in account shown in the header account control.
- `uploadEndpoint` (`string`, default `'/api/models/upload'`) — Session-backed route implementing the browse, start, finish, and status contract.
- `signOutHref` (`string`, default `'/api/auth/signout?next=/sign-in'`) — POST route used by the account control to revoke the grant and clear the session.
- `embedded` (`boolean`, default `false`) — Constrains the shell height for preview containers. Leave false for the full-page route.

## Upload route

- `kind=hubs / projects / folders` (`GET · hubId, projectId, folderId`) — Destination browsing: hubs, projects in a hub, top folders, or the subfolders of one folder.
- `kind=start` (`POST · projectId, folderId, name, size`) — Creates the storage object and returns signed S3 part URLs the browser uploads to directly.
- `kind=finish` (`POST · objectId, uploadKey, views, masterViews`) — Completes the signed upload, creates the item or a new version on a name match, and submits the svf2 translation job.
- `kind=status` (`GET · urn`) — Reads the Model Derivative manifest and normalizes it into the translation status vocabulary.

# Model Upload Page (`@cantera/model-upload-page`)

A two-legged upload and viewing page over the app's own OSS bucket: drag-and-drop signed S3 uploads with archive support, translation options and tracking with manifest diagnostics, a sidebar model list with search, and a shareable full-bleed viewer.

- Type: block
- Install: `npx shadcn@latest add @cantera/model-upload-page`
- Docs: https://canteraui.vercel.app/components/model-upload-page
- Registry item: https://canteraui.vercel.app/r/model-upload-page.json
- Registry dependencies: button, checkbox, dialog, input, label, @cantera/hub-sidebar, @cantera/file-drop-zone, @cantera/aps-viewer, @cantera/viewer-extension-types, @cantera/model-status-card, @cantera/upload-types, @cantera/project-types, @cantera/status-tokens
- npm dependencies: aec-auth, lucide-react

Files written into the consumer project:

- `app/upload/page.tsx`
- `app/upload/loading.tsx`
- `components/model-upload.tsx`
- `app/api/models/upload/route.ts`
- `app/api/models/upload/upload-request.ts`
- `app/api/viewer-token/route.ts`

Environment variables added to `.env.local`:

- `APS_CLIENT_ID`
- `APS_CLIENT_SECRET`
- `APS_BUCKET`
- `APP_ORIGIN`
- `APS_AUTH_BASE_URL`

## Install notes

Installed: app/upload/page.tsx, its loading UI, the two-legged /api/models/upload route (bucket bootstrap, signed-S3 uploads, translation jobs, manifest status with diagnostics), and the 2-legged /api/viewer-token route. No sign-in is installed: every route runs on the app's credentials against the app's own OSS bucket, so anyone who can reach the deployment can read and write it — add your own access control before shipping beyond a trusted team.

Uploads go browser-to-storage through signed S3 part URLs. A .zip upload asks for the root design filename and translates through compressedUrn. Every finished upload submits an svf2 job with the chosen views (2D sheets, 3D views, optional Revit master views), appears in the sidebar list, and becomes the selection — the URL carries ?urn=... so a view is shareable. Failed translations surface the manifest's diagnostic messages.

Environment (added to .env.local as empty keys — fill them in):
- APS_CLIENT_ID / APS_CLIENT_SECRET — your APS app credentials.
- APS_BUCKET — optional OSS bucket key; defaults to one derived from the client id. Buckets are global per client, and the route creates it with a persistent policy on first use.
- APP_ORIGIN — the canonical public origin. Required in production when APS_AUTH_BASE_URL is relative.
- APS_AUTH_BASE_URL — optional APS origin override. Leave unset for real APS; a relative value such as "/emulate/aps" targets a compatible embedded emulator.

Files over 250 MB are rejected at start — raise PART_SIZE or MAX_PARTS in the route to lift the bound.

## ModelUpload props

- `uploadEndpoint` (`string`, default `'/api/models/upload'`) — Two-legged route implementing the models, start, finish, and status contract over the app bucket.
- `viewerTokenEndpoint` (`string`, default `'/api/viewer-token'`) — Separate two-legged viewer token route, scoped to viewables:read. Upload-scoped tokens never cross into the viewer.
- `embedded` (`boolean`, default `false`) — Constrains the desktop sidebar and shell height to the nearest positioned preview container, and skips writing ?urn= to the URL. Leave false for the full-page route.

## Upload route

- `kind=models` (`GET`) — Ensures the app bucket exists and lists its objects as { name, urn, size } models.
- `kind=start` (`POST · name, size`) — Returns signed S3 part URLs for the object the browser uploads to directly.
- `kind=finish` (`POST · objectId, uploadKey, views, masterViews, zipEntrypoint`) — Completes the signed upload and submits the svf2 job — compressed with the archive root when zipEntrypoint is set.
- `kind=status` (`GET · urn`) — Reads the Model Derivative manifest into the translation status vocabulary, with the derivative diagnostic messages.

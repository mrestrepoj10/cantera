# Model Upload Page (`@cantera/model-upload-page`)

A two-legged upload and viewing page over the app's own OSS bucket: drag-and-drop signed S3 uploads with archive support, translation options and tracking with manifest diagnostics, a sidebar model list with search, and a shareable full-bleed viewer.

- Type: template
- Install: `npx shadcn@latest add @cantera/model-upload-page`
- Docs: https://canteraui.vercel.app/components/model-upload-page
- Registry item: https://canteraui.vercel.app/r/model-upload-page.json
- Registry dependencies: @cantera/model-upload, @cantera/upload-types, @cantera/project-types
- npm dependencies: aec-auth, lucide-react

Files written into the consumer project:

- `app/upload/page.tsx`
- `app/upload/loading.tsx`
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

Installed at /upload: the page, its loading UI, the two-legged /api/models/upload route (bucket bootstrap, signed S3 uploads, translation jobs, manifest status), and /api/viewer-token. The screen is @cantera/model-upload. No sign-in is installed: every route runs on the app's credentials, so add your own access control before shipping beyond a trusted team.

Next:
1. Fill .env.local: APS_CLIENT_ID and APS_CLIENT_SECRET from aps.autodesk.com; APS_BUCKET optional (derived from the client id); APP_ORIGIN in production.
2. Run next dev and open /upload.

Files over 250 MB are rejected; raise PART_SIZE or MAX_PARTS in the route.
Reference: https://canteraui.vercel.app/components/model-upload-page

## ModelUpload props

- `uploadEndpoint` (`string`, default `'/api/models/upload'`) — Two-legged route implementing the models, start, finish, and status contract over the app bucket.
- `viewerTokenEndpoint` (`string`, default `'/api/viewer-token'`) — Separate two-legged viewer token route, scoped to viewables:read. Upload-scoped tokens never cross into the viewer.
- `embedded` (`boolean`, default `false`) — Constrains the desktop sidebar and shell height to the nearest positioned preview container, and skips writing ?urn= to the URL. Leave false for the full-page route.

## Upload route

- `kind=models` (`GET`) — Ensures the app bucket exists and lists its objects as { name, urn, size } models.
- `kind=start` (`POST · name, size`) — Returns signed S3 part URLs for the object the browser uploads to directly.
- `kind=finish` (`POST · objectId, uploadKey, views, masterViews, zipEntrypoint`) — Completes the signed upload and submits the svf2 job — compressed with the archive root when zipEntrypoint is set.
- `kind=status` (`GET · urn`) — Reads the Model Derivative manifest into the translation status vocabulary, with the derivative diagnostic messages.

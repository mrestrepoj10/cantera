# Model Upload Page (`@cantera-pro/model-upload-page`)

A two-legged upload and viewing page over the app's own OSS bucket: drag-and-drop signed S3 uploads with archive support, translation options and tracking with manifest diagnostics, a sidebar model list with search, and a shareable full-bleed viewer.

- Type: template (pro, license required)
- Install: `npx shadcn@latest add @cantera-pro/model-upload-page`
- Docs: https://canteraui.vercel.app/components/model-upload-page
- Registry item: https://canteraui.vercel.app/r-pro/model-upload-page.json
- License: https://canteraui.vercel.app/pro
- Registry dependencies: button, checkbox, dialog, input, label, sidebar, @cantera/upload-types, @cantera/project-types, @cantera/hub-sidebar, @cantera/hub-tree, @cantera/finder, @cantera/file-drop-zone, @cantera/copy-field, @cantera/aps-viewer, @cantera/viewer-types, @cantera/viewer-extension-types, @cantera/token-status, @cantera/model-status-card, @cantera/status-tokens, @cantera/theme-toggle
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

Installed at /upload: the page, its loading UI, the two-legged /api/models/upload route (bucket bootstrap, signed S3 uploads, translation jobs, manifest status), and /api/viewer-token. ModelUpload is the screen. No sign-in is installed: every route runs on the app's credentials, so add your own access control before shipping beyond a trusted team.

Next:
1. Fill .env.local: APS_CLIENT_ID and APS_CLIENT_SECRET from aps.autodesk.com; APS_BUCKET optional (derived from the client id); APP_ORIGIN in production.
2. Wrap children in app/layout.tsx with ThemeProvider from components/theme-provider.tsx (see theme-toggle).
3. Run next dev and open /upload.

Files over 250 MB are rejected; raise PART_SIZE or MAX_PARTS in the route.
Reference: https://canteraui.vercel.app/components/model-upload-page

## Notes

ModelUpload fetches from uploadEndpoint (default /api/models/upload) and viewerTokenEndpoint (default /api/viewer-token), the routes this template ships. The upload protocol is start, signed part URLs, finish, then status polling with manifest diagnostics; any handler that speaks it works. embedded drops the page chrome so the screen fits a docs or preview frame. A theme toggle sits in the sidebar’s identity row, beside the collapse toggle; it needs ThemeProvider mounted in your root layout. The viewer settings panel saves its choices in this browser’s localStorage under cantera:model-upload-page:viewer-settings; Reset returns to the starter set and clears the saved copy. The sidebar lists the bucket as a folder of models; the selected model’s Details button opens its storage and translation facts (route kind=details), the translated thumbnail (kind=thumbnail), and a five-minute signed download of the original file (kind=download).

## ModelUpload props

- `uploadEndpoint` (`string`, default `'/api/models/upload'`) — Two-legged route implementing the models, start, finish, and status contract over the app bucket.
- `viewerTokenEndpoint` (`string`, default `'/api/viewer-token'`) — Separate two-legged viewer token route, scoped to viewables:read. Upload-scoped tokens never cross into the viewer.
- `embedded` (`boolean`, default `false`) — Constrains the desktop sidebar and shell height to the nearest positioned preview container, and skips writing ?urn= to the URL. Leave false for the full-page route.

## Upload route

- `kind=models` (`GET`) — Ensures the app bucket exists and lists its objects as { name, urn, size } models.
- `kind=start` (`POST · name, size`) — Returns signed S3 part URLs for the object the browser uploads to directly.
- `kind=finish` (`POST · objectId, uploadKey, views, masterViews, zipEntrypoint`) — Completes the signed upload and submits the svf2 job — compressed with the archive root when zipEntrypoint is set.
- `kind=status` (`GET · urn`) — Reads the Model Derivative manifest into the translation status vocabulary, with the derivative diagnostic messages.

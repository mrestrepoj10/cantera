# Model Upload (`@cantera/model-upload`)

Drop zone with archive support, translation options and tracking with manifest diagnostics, a searchable model library, and a shareable full-bleed Viewer composed into one screen. Points at your upload and viewer-token endpoints; model-upload-page ships those routes.

- Type: block
- Install: `npx shadcn@latest add @cantera/model-upload`
- Docs: https://canteraui.vercel.app/components/model-upload
- Registry item: https://canteraui.vercel.app/r/model-upload.json
- Registry dependencies: button, checkbox, dialog, input, label, sidebar, @cantera/hub-sidebar, @cantera/hub-tree, @cantera/finder, @cantera/file-drop-zone, @cantera/aps-viewer, @cantera/viewer-types, @cantera/viewer-extension-types, @cantera/model-status-card, @cantera/upload-types, @cantera/project-types, @cantera/status-tokens
- npm dependencies: lucide-react

Files written into the consumer project:

- `components/model-upload.tsx`

## Notes

Fetches from uploadEndpoint (default /api/models/upload) and viewerTokenEndpoint (default /api/viewer-token) — the routes @cantera/model-upload-page ships. The upload protocol is start, signed part URLs, finish, then status polling with manifest diagnostics; any handler that speaks it works. embedded drops the page chrome so the screen fits a docs or preview frame.

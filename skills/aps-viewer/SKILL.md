---
name: aps-viewer
description: Autodesk Platform Services (APS) Viewer v7 guidance for browser model loading, SVF/SVF2 initialization, Viewer tokens, extensions, events, selection, properties, screenshots, multi-model loading, and UI integration. Use when implementing or debugging Autodesk Viewer, Forge Viewer, viewer3D.js, GuiViewer3D, Autodesk.Viewing, Document.load, loadDocumentNode, Viewer extensions, or browser model visualization.
metadata:
  priority: 7
  docs:
    - "https://aps.autodesk.com/en/docs/viewer/v7"
    - "https://aps.autodesk.com/en/docs/viewer/v7/reference/Viewing/Viewer3D/"
    - "https://aps.autodesk.com/en/docs/viewer/v7/developers_guide/viewer_basics/extensions/"
    - "https://aps.autodesk.com/blog/viewer-extensions-tips-and-tricks-or-treats"
    - "https://github.com/autodesk-platform-services/aps-extensions"
    - "https://get-started.aps.autodesk.com/tutorials/dashboard"
    - "https://get-started.aps.autodesk.com/tutorials/hubs-browser/viewer"
    - "https://get-started.aps.autodesk.com/tutorials/simple-viewer/viewer"
  pathPatterns:
    - "**/viewer/**"
    - "**/viewer*.js"
    - "**/viewer*.ts"
    - "**/viewer*.tsx"
    - "**/extensions/**"
    - "**/services/aps.*"
    - "**/services/autodesk.*"
  promptSignals:
    phrases:
      - "autodesk viewer"
      - "aps viewer"
      - "forge viewer"
      - "Autodesk.Viewing"
      - "Viewer3D"
      - "viewer extension"
      - "loadExtension"
      - "getScreenShot"
      - "aps-extensions"
    minScore: 5
---
# APS Viewer

You are an expert in Autodesk Viewer v7. Build browser integrations that initialize the runtime once, use narrow Viewer tokens, load translated SVF/SVF2 viewables correctly, and encapsulate custom behavior in maintainable extensions.

## Flow Picker

| Need | Use |
| --- | --- |
| Show one translated model | Initialize Viewer, fetch `viewables:read` token, `Document.load('urn:' + urn)`, then `loadDocumentNode` |
| Show SVF2 derivatives | `env: 'AutodeskProduction2'` and `api: 'streamingV2'`, or region variant such as `streamingV2_EU` |
| Add reusable UI or behavior | `Autodesk.Viewing.Extension`, `registerExtension`, `loadExtension`, and cleanup in `unload` |
| Add toolbar, panel, grid, chart, markup, or custom property UI | Extension-owned `Autodesk.Viewing.UI` controls, `DockingPanel`, or `PropertyPanel` |
| React/Vue/Svelte wrapper | Load Viewer scripts once, initialize runtime once, create/finish viewer in component lifecycle |
| Capture images | `viewer.getScreenShot(width, height, callback)` or screenshot utilities for bounded/markup cases |

## Rules

- Use `aps-auth` for the `/api/auth/token` route. Client tokens should usually contain only `viewables:read`.
- Use `aps-model-derivative` before Viewer work when a source file still needs translation to SVF/SVF2.
- Load Viewer assets from the APS CDN unless the app has an explicit self-hosting strategy.
- Initialize `Autodesk.Viewing.Initializer` once per runtime configuration. Do not reinitialize with different `env`, `api`, `language`, or token options inside component rerenders.
- Always call the token callback with both access token and expiry seconds: `callback(access_token, expires_in)`.
- Pass derivative URNs as `urn:${urn}` to `Autodesk.Viewing.Document.load`; do not pass raw OSS object IDs, unencoded object IDs, or full manifest URLs.
- Use public Viewer APIs first. Treat `Autodesk.Viewing.Private` and private property DB classes as unstable internals.
- Strictly follow [references/custom-ui.md](references/custom-ui.md) for Viewer-owned UI: create toolbar controls in `onToolbarCreated`, host property UI in `PropertyPanel`, host rich UI in `DockingPanel`, and keep app navigation outside the Viewer shell.
- Clean up viewers, extensions, panels, buttons, overlays, and listeners with `viewer.finish()`, `unloadExtension`, and `removeEventListener`.
- For multi-model loading, use `loadDocumentNode` options such as `keepCurrentModels`, `preserveView`, `applyRefPoint`, `applyScaling`, and `globalOffset` deliberately.

## Detection Rules

- Viewer token endpoints expose `data:write`, `bucket:*`, refresh tokens, client secrets, or internal APS tokens.
- Viewer v7.95+ SVF2 apps omit required `env` or `api`, causing `404 resource not found` while loading derivatives.
- React or SPA code inserts Viewer scripts repeatedly or calls `Autodesk.Viewing.Initializer` on every render.
- `Document.load` receives a raw object ID, missing `urn:` prefix, URL-unsafe URN, or derivative from a different region.
- Event listeners, extensions, toolbar controls, docking panels, overlays, or viewer instances are not cleaned up during route changes.
- Screenshot code ignores async callbacks, aspect ratio, markups, or hidden/offscreen viewer sizing.
- Multi-model scenes load additional models without `keepCurrentModels` or without shared coordinate/scale options.
- Viewer UI is rendered as arbitrary app DOM over the canvas instead of extension-owned `Autodesk.Viewing.UI` controls/panels.

## Implementation Workflow

1. Verify the model has a completed SVF/SVF2 derivative and get its URL-safe Base64 URN.
2. Add Viewer CSS/JS or a framework loader that guarantees single script/runtime initialization.
3. Implement a backend token endpoint returning a narrow `{ access_token, expires_in }` for the Viewer.
4. Initialize Viewer with explicit `env`, `api`, `getAccessToken`, language, theme, and extensions.
5. Create `Autodesk.Viewing.GuiViewer3D`, call `start()`, then load a viewable from `Document.load`.
6. Add event handlers, selection/property logic, screenshots, overlays, toolbar controls, or panels through extensions.
7. Verify in a browser: no console errors, model visible, navigation works, properties load, and teardown is clean.

## Reference Map

- Viewer runtime, loading, Viewer3D API families, events, screenshots, and teardown: [references/viewer3d.md](references/viewer3d.md)
- Extension architecture, options, async dependencies, state, toolbar/panels, and `aps-extensions`: [references/extensions.md](references/extensions.md)
- Custom Viewer UI, toolbar buttons, docking panels, property panels, and cleanup rules: [references/custom-ui.md](references/custom-ui.md)
- Lessons from APS Simple Viewer, Hubs Browser, and Dashboard tutorials: [references/tutorial-patterns.md](references/tutorial-patterns.md)
- Minimal init/load/status-loop example: [exemplars/simple-viewer.md](exemplars/simple-viewer.md)
- Selection property inspector using `PropertyPanel`: [exemplars/property-inspector.md](exemplars/property-inspector.md)
- Base extension plus dashboard panel/grid pattern: [exemplars/dashboard-extension.md](exemplars/dashboard-extension.md)

## Cross-Skill Routing

- Use `aps-auth` for Viewer token endpoints and secure OAuth handling.
- Use `aps-model-derivative` for translation, manifests, metadata/property extraction, thumbnails, URNs, and SVF/SVF2 readiness.
- Use `aps-data-management` for locating ACC/BIM 360/Fusion files, item versions, storage objects, and uploads.
- Use `aps-dataviz` for the Viewer Data Visualization extension, sprites, sensor icons, heatmaps, surface shading, planar heatmaps, and sensor-to-room mapping.

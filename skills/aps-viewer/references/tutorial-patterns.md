# Tutorial Patterns

Use this when adapting Autodesk's APS tutorial patterns into production code.

## Simple Viewer

Source pages:

- https://get-started.aps.autodesk.com/tutorials/simple-viewer/auth
- https://get-started.aps.autodesk.com/tutorials/simple-viewer/viewer

Patterns to reuse:

- Separate internal server token from public Viewer token.
- Expose `/api/auth/token` for the Viewer token callback.
- Initialize Viewer in a small `initViewer(container)` function.
- Load a model with `Document.load('urn:' + urn)` and `viewer.loadDocumentNode`.
- Check translation status before loading; show clear "not translated", "in progress", and "failed" states.
- Keep upload/translation UI outside Viewer-specific code.

Production adjustments:

- Use explicit `env/api` for SVF2 (`AutodeskProduction2` plus `streamingV2` region).
- Replace alerts with app-level error surfaces.
- Add cancellation/debouncing when switching selected models quickly.
- Avoid leaking broad backend tokens to the browser.

## Hubs Browser

Source pages:

- https://get-started.aps.autodesk.com/tutorials/hubs-browser
- https://get-started.aps.autodesk.com/tutorials/hubs-browser/data
- https://get-started.aps.autodesk.com/tutorials/hubs-browser/viewer

Patterns to reuse:

- Use 3-legged auth for user hubs/projects/folders/items/versions.
- Keep tree browsing logic separate from Viewer initialization.
- Encode selected version IDs to derivative URNs before calling `loadModel`.
- Use a responsive split layout: project tree/sidebar and Viewer surface.
- Handle login/logout and profile state before initializing user-data UI.

Production adjustments:

- Route Data Management work to `aps-data-management`.
- Preserve pagination, filtering, and permissions when browsing large ACC/Fusion projects.
- Handle Fusion designs that are not processed for viewing until opened/prepared in the source product.
- Do not assume every item version has a ready Viewer derivative.

## Dashboard

Source pages:

- https://get-started.aps.autodesk.com/tutorials/dashboard
- https://get-started.aps.autodesk.com/tutorials/dashboard/basic
- https://get-started.aps.autodesk.com/tutorials/dashboard/grid

Patterns to reuse:

- Implement dashboard functionality as Viewer extensions, not scattered app logic.
- Create a `BaseExtension` for model-loaded, selection-changed, and isolation-changed hooks.
- Query leaf nodes and bulk properties for interactive summaries, charts, and grids.
- Use toolbar buttons and docking panels for Viewer-owned UI.
- Connect chart/grid interactions back to Viewer state with `isolate`, `fitToView`, and selection.

Production adjustments:

- Make property names configurable; tutorials assume sample properties such as `Volume`, `Level`, and `Price`.
- For large models, do not fetch all properties in the browser by default; use targeted bulk properties or server-side Model Derivative property queries.
- Keep third-party chart/grid dependencies versioned and loaded once.
- Clean up panels, buttons, listeners, and dependency-owned DOM in `unload`.

## Source Mapping

| User task | Start with |
| --- | --- |
| "Show uploaded model in Viewer" | Simple Viewer pattern |
| "Browse ACC projects and open a version" | Hubs Browser pattern |
| "Build dashboard widgets from model metadata" | Dashboard basic/grid patterns |
| "Make reusable Viewer behavior" | Extension base class pattern |
| "Add many optional extensions" | `aps-extensions` config/loader pattern |

## Cross-Skill Notes

- Use `aps-auth` for public/internal token split and 3-legged login.
- Use `aps-data-management` for hubs, projects, folders, items, versions, and permissions.
- Use `aps-model-derivative` for translation status, manifests, URNs, metadata/property server queries, and thumbnails.

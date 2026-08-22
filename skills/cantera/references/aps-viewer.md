# APS Viewer (`@cantera/aps-viewer`)

A Strict-Mode-safe React host for Autodesk Viewer 7.* with deduplicated runtime loading, live theme changes, URN swaps, automatic resize, and composable hooks.

- Type: component
- Install: `npx shadcn@latest add @cantera/aps-viewer`
- Docs: https://canteraui.xyz/components/aps-viewer
- Registry item: https://canteraui.xyz/r/aps-viewer.json
- Registry dependencies: @cantera/viewer-types
- Working example page: `npx shadcn@latest add @cantera/aps-viewer-demo` — installs app/examples/aps-viewer/page.tsx

Files written into the consumer project:

- `components/ui/aps-viewer/aps-viewer.tsx`
- `components/ui/aps-viewer/context.ts`
- `components/ui/aps-viewer/hooks.ts`
- `components/ui/aps-viewer/loader.ts`
- `components/ui/aps-viewer/store.ts`
- `components/ui/aps-viewer/index.ts`

## Install notes

APSViewer is client-only but SSR-safe: Autodesk's global script is not touched until an effect mounts. Supply getAccessToken from your own backend and keep APS credentials off the client. Changing urn unloads and loads the model without recreating the WebGL context; app appearance changes call setTheme in place. toolbar=none uses the core Viewer3D and omits Autodesk's native GUI.

Autodesk Viewer 7.* renders third-party DOM that cantera cannot repair. The docs accessibility suite excludes only the subtree rooted inside the viewer canvas; controls you add around or over the viewer remain in scope. Audit the inherited Autodesk controls against your own product requirements.

## Props

- `urn` (`string`) — Model Derivative URN with or without the urn: prefix. Changes reuse the live WebGL viewer.
- `getAccessToken` (`GetAccessToken`) — Fetches a short-lived token from your backend. APS credentials must never enter the browser.
- `toolbar` (`'native' | 'none'`, default `'native'`) — Chooses GuiViewer3D with Autodesk controls or the toolbar-less core Viewer3D.
- `theme` (`'light' | 'dark'`, default `app appearance`) — Optional forced appearance. Undefined follows the document class and system preference live.
- `autoResize` (`boolean`, default `true`) — ResizeObserver keeps the WebGL canvas matched to its container.
- `version / env / api` (`string`, default `'7.*' / 'AutodeskProduction2' / 'streamingV2'`) — Viewer CDN and Initializer settings. The first mounted runtime consumer wins.
- `extensions / viewerConfig` (`APSExtensionRequest[] / Record<string, unknown>`) — Extensions to load — bare ids or { id, options } entries — and extra constructor configuration, captured when the viewer mounts. Load progress is observable via useAPSExtensions(); viewer-extension-types catalogs the public ids and types their options.
- `profile` (`'aec' | 'default' | 'fluent' | 'navis'`) — Named Autodesk settings profile applied at creation. 'aec' is the Construction (AEC) tuning: reversed zoom, edge rendering, AEC light preset.
- `shutdownOnUnmount` (`boolean`, default `false`) — Shuts down the global SDK only after its last consumer releases; false keeps it warm across routes.
- `onViewerReady / onModelLoaded / onError / onExtensionError` (`callbacks`) — Lifecycle callbacks. Inline functions do not recreate the viewer. onExtensionError reports a failed extension load without tearing the viewer down.
- `children` (`ReactNode`) — Overlay UI inside the viewer context. Descendants can use every exported APS hook.

## Hooks and runtime exports

- `useAPSViewer / useAPSModelLoaded` (`hooks`) — Live viewer identity and model-geometry readiness.
- `useAPSSelection / useAPSCamera / useAPSProperties` (`hooks`) — Event-driven selection, camera, and cancellable property state.
- `useAPSViewerEvent / useAPSContextMenu` (`hooks`) — Raw event and context-menu escape hatches.
- `useAPSExtension / useAPSExtensions` (`hooks`) — Per-extension load with status, instance, and setOptions re-application on option change; and the load lifecycle of every extension requested through the extensions prop.
- `acquireViewerRuntime / releaseViewerRuntime / loadViewerScript` (`functions`) — Deduplicated CDN and Initializer lifecycle, exposed for advanced imperative composition.

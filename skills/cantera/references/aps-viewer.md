# APS Viewer (`@cantera/aps-viewer`)

A Strict-Mode-safe React host for Autodesk Viewer 7.* with deduplicated runtime loading, live native-toolbar controls, a Hide others toolbar toggle, theme and ViewCube controls, frame radius, URN swaps, automatic resize, composable hooks, and a floating settings panel triggered from the native toolbar.

- Type: component
- Install: `npx shadcn@latest add @cantera/aps-viewer`
- Docs: https://canteraui.vercel.app/components/aps-viewer
- Registry item: https://canteraui.vercel.app/r/aps-viewer.json
- Registry dependencies: button, checkbox, @cantera/viewer-types, @cantera/viewer-extension-types
- npm dependencies: lucide-react
- Working example page: `npx shadcn@latest add @cantera/aps-viewer-demo` — installs app/examples/aps-viewer/page.tsx

Files written into the consumer project:

- `components/ui/aps-viewer/aps-viewer.tsx`
- `components/ui/aps-viewer/context.ts`
- `components/ui/aps-viewer/hooks.ts`
- `components/ui/aps-viewer/loader.ts`
- `components/ui/aps-viewer/store.ts`
- `components/ui/aps-viewer/toolbar.ts`
- `components/ui/aps-viewer/hide-others.ts`
- `components/ui/aps-viewer/extensions.tsx`
- `components/ui/aps-viewer/settings.tsx`
- `components/ui/aps-viewer/index.ts`

## Notes

APSViewer is client-only but SSR-safe: Autodesk's global script is not touched until an effect mounts. Supply getAccessToken from your own backend and keep APS credentials off the client. Changing urn unloads and loads the model without recreating the WebGL context; app appearance, viewCube, radius, toolbarPosition, and toolbarScale changes apply in place. toolbar=none uses the core Viewer3D without Autodesk's native toolbar; viewCube controls the cube independently.

Hide others is built in: a toolbar toggle (hideOthers, default true) that keeps the current selection, or the current isolation when nothing is selected, and fully hides everything else instead of ghosting it. While pressed it re-isolates to each new selection, keeps the last set when the selection clears, and ends when anything shows all; releasing it shows everything and restores the ghosting preference, keeping the selection. Pressed with nothing selected, it waits for the next selection. useAPSHideOthers drives the same mode from your own UI, and code that holds only the viewer reaches it as the Cantera.HideOthers extension.

APSViewerSettings renders an end-user settings panel as a viewer child: a trigger button appended to the SDK toolbar (a corner button when the native toolbar is off) opens a floating panel over the canvas, collapsed by default. It is controlled — hold an APSViewerSettingsValue in state, spread apsViewerPropsFor(value) onto APSViewer, and pass value/onValueChange to the panel. It has two tabs. Setup holds the toolbar, view cube, position, density, radius, and appearance. Extensions loads and unloads catalog extensions live, with no viewer restart, and reports load failures with a Retry. The panel loads value.extensions itself, so keep it mounted while the viewer is; to make starter extensions removable, put them in the initial value instead of APSViewer's extensions prop. Extra controls compose through children; APSViewerSettingsTrigger is exported alone for custom panels.

The native-toolbar positioning uses Autodesk LMV 7.* DOM class names, which are not a published stable contract, so docking is best-effort and should be checked when changing the Viewer major version. Autodesk Viewer also renders third-party DOM that cantera cannot repair. The docs accessibility suite excludes only the subtree rooted inside the viewer canvas; controls you add around or over the viewer remain in scope. Audit the inherited Autodesk controls against your own product requirements.

## Props

- `urn` (`string`) — Model Derivative URN with or without the urn: prefix. Changes reuse the live WebGL viewer.
- `getAccessToken` (`GetAccessToken`) — Fetches a short-lived token from your backend. APS credentials must never enter the browser.
- `toolbar` (`'native' | 'none'`, default `'native'`) — Chooses the GuiViewer3D native toolbar or the core Viewer3D; ViewCube remains independently controllable.
- `toolbarPosition` (`'bottom' | 'top' | 'left' | 'right'`, default `'bottom'`) — Docks the native toolbar to an edge. Left and right derive a vertical layout; changes apply live.
- `toolbarScale` (`'sm' | 'md' | 'lg' | number`, default `'md'`) — Native-toolbar button box: compact 36px, comfortable 44px, gloved 52px, or an exact number clamped to 32–64. Changes apply live.
- `viewCube` (`boolean`, default `true`) — Shows Autodesk's ViewCube and companion controls. Changes apply live without recreating the viewer.
- `hideOthers` (`boolean`, default `true`) — Shows the Hide others toggle in the native toolbar: it keeps the selection and fully hides everything else, following each new selection until released. Changes apply live; useAPSHideOthers drives the mode either way.
- `radius` (`number`) — Clips the viewer frame to a pixel radius clamped to 0–32. Omit to leave frame styling to the consumer.
- `theme` (`'light' | 'dark'`, default `app appearance`) — Optional forced appearance. Undefined follows the document class and system preference live.
- `autoResize` (`boolean`, default `true`) — ResizeObserver keeps the WebGL canvas matched to its container.
- `version / env / api` (`string`, default `'7.*' / 'AutodeskProduction2' / 'streamingV2'`) — Viewer CDN and Initializer settings. The first mounted runtime consumer wins.
- `extensions / viewerConfig` (`readonly APSExtensionRequest[] / Record<string, unknown>`) — Extensions to load — bare ids or { id, options } entries — and extra constructor configuration, captured when the viewer mounts. Load progress is observable via useAPSExtensions(); viewer-extension-types catalogs the public ids and types their options.
- `profile` (`'aec' | 'default' | 'fluent' | 'navis'`) — Named Autodesk settings profile applied at creation. 'aec' is the Construction (AEC) tuning: reversed zoom, edge rendering, AEC light preset.
- `shutdownOnUnmount` (`boolean`, default `false`) — Shuts down the global SDK only after its last consumer releases; false keeps it warm across routes.
- `onViewerReady / onModelLoaded / onError / onExtensionError` (`callbacks`) — Lifecycle callbacks. Inline functions do not recreate the viewer. onExtensionError reports a failed extension load without tearing the viewer down.
- `children` (`ReactNode`) — Overlay UI inside the viewer context. Descendants can use every exported APS hook.

## Hooks and runtime exports

- `useAPSViewer / useAPSModelLoaded` (`hooks`) — Live viewer identity and model-geometry readiness.
- `useAPSSelection / useAPSCamera / useAPSProperties` (`hooks`) — Event-driven selection, camera, and cancellable property state.
- `useAPSHideOthers` (`hook`) — The Hide others mode as { active, ids, toggle, set }: set(true, ids?) keeps ids, else the selection, else the current isolation; set(false) shows everything and restores ghosting.
- `useAPSViewerEvent / useAPSContextMenu` (`hooks`) — Raw event and context-menu escape hatches.
- `useAPSExtension / useAPSExtensions` (`hooks`) — Per-extension load with status, instance, and setOptions re-application on option change; and the load lifecycle of every extension requested through the extensions prop.
- `acquireViewerRuntime / releaseViewerRuntime / loadViewerScript` (`functions`) — Deduplicated CDN and Initializer lifecycle, exposed for advanced imperative composition.

## APSViewerSettings props

- `value` (`APSViewerSettingsValue`) — Controlled settings: toolbar on/off, toolbarPosition, toolbarScale (a preset or an exact pixel box the density slider drives across 32–64), viewCube, hideOthers, theme, radius (0–32), and extensions (ids, in load order). Spread apsViewerPropsFor(value) onto APSViewer to apply the display fields; the panel itself loads the extensions.
- `onValueChange` (`(value: APSViewerSettingsValue) => void`) — Called with the next settings object when the user changes a control.
- `resetValue` (`APSViewerSettingsValue`, default `DEFAULT_APS_VIEWER_SETTINGS`) — What the footer Reset restores. Pass your own starting settings, such as a starter extension set.
- `open / onOpenChange / defaultOpen` (`boolean / callback / boolean`, default `false`) — Panel visibility, controlled or uncontrolled. The panel starts collapsed; the trigger sits in the SDK toolbar, or a corner button when the native toolbar is off.
- `label` (`string`, default `'Viewer settings'`) — Names the trigger, its tooltip, and the panel heading.
- `children` (`ReactNode`) — Extra controls appended to the Setup tab.
- `APSViewerSettingsTrigger` (`component`) — The toolbar-mounted trigger alone — our control group appended to the SDK toolbar after a divider, inheriting toolbar position and scale — for wiring a custom panel.
- `APSViewerExtensionPicker / Chip / Loader` (`components`) — The Extensions tab in parts: the searchable catalog grouped by job, a removable chip with load state, and a loader that holds one extension while mounted inside APSViewer.
- `parseAPSViewerSettings` (`(input: unknown, fallback?) => APSViewerSettingsValue`) — Reads settings from outside the app — storage, a URL, an API. Invalid or missing fields take the fallback value and unknown extension ids are dropped, so a stale or edited copy cannot break the viewer.
- `DEFAULT_APS_VIEWER_SETTINGS / apsViewerPropsFor` (`constant / function`) — The starting settings object, and the mapping from a settings object to APSViewer props.

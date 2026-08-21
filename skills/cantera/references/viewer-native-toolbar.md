# Viewer Native Toolbar (`@cantera/viewer-native-toolbar`)

An Autodesk Viewer extension that docks the native toolbar on any edge and offers a 44px touch-target scale without replacing Autodesk controls.

- Type: component
- Install: `npx shadcn@latest add @cantera/viewer-native-toolbar`
- Docs: https://canteraui.xyz/components/viewer-native-toolbar
- Registry item: https://canteraui.xyz/r/viewer-native-toolbar.json
- Registry dependencies: @cantera/aps-viewer, @cantera/viewer-types
- Working example page: `npx shadcn@latest add @cantera/viewer-native-toolbar-demo` — installs app/examples/viewer-native-toolbar/page.tsx

Files written into the consumer project:

- `viewer-native-toolbar.tsx`

## Install notes

Render ViewerNativeToolbar inside APSViewer, or register VIEWER_NATIVE_TOOLBAR_EXTENSION_ID and load it directly. position chooses bottom, top, left, or right; left and right derive a vertical layout. scale=lg raises native buttons to a 44px minimum touch target.

The extension uses only viewer.toolbar.container and the public extension manager, and cleans up its classes and stylesheet in unload. Its CSS targets Autodesk LMV 7.* native toolbar, tooltip, and flyout class names. Those DOM selectors are not a published stable contract, so positioning is best-effort and should be checked when you change the Viewer major version.

## Props and exports

- `position` (`'bottom' | 'top' | 'left' | 'right'`, default `'bottom'`) — Docking edge. Left and right derive the vertical native-toolbar layout.
- `scale` (`'md' | 'lg'`, default `'md'`) — Autodesk stock size, or a 44px minimum native control target for touch use.
- `useViewerNativeToolbar` (`(options?: ViewerNativeToolbarOptions) => void`) — Hook form of the declarative component. Use inside APSViewer.
- `registerViewerNativeToolbar` (`(autodesk: AutodeskGlobal) => void`) — Idempotently registers the extension against an initialized Viewer runtime.
- `VIEWER_NATIVE_TOOLBAR_EXTENSION_ID` (`string`, default `'Cantera.ViewerNativeToolbar'`) — Extension id for direct viewer.loadExtension usage.

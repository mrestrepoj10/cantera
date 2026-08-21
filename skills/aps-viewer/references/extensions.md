# Viewer Extensions

Use this when building, loading, reviewing, or debugging Autodesk Viewer extensions.

## When to Use an Extension

Use an extension when the feature:

- Listens to Viewer events.
- Adds toolbar buttons, docking panels, overlays, custom context menus, or custom property panels.
- Queries model metadata or object trees.
- Coordinates charts, grids, markups, or external UI with Viewer selection/isolation.
- Needs reusable behavior across pages or projects.

Small one-off `viewer.fitToView()` calls do not need an extension. Reusable behavior does.

## Minimal Extension

```js
class MyExtension extends Autodesk.Viewing.Extension {
  constructor(viewer, options) {
    super(viewer, options)
  }

  load() {
    return true
  }

  unload() {
    return true
  }
}

Autodesk.Viewing.theExtensionManager.registerExtension('MyExtension', MyExtension)
```

The constructor receives the owning Viewer instance and the options object passed during loading.

## Loading Options

The extension tips blog highlights three loading patterns:

```js
const viewer = new Autodesk.Viewing.GuiViewer3D(container, {
  extensions: ['MyExtension'],
})
```

```js
viewer.loadExtension('MyExtension', { msg: 'hello' })
```

```js
Autodesk.Viewing.theExtensionManager.registerExternalExtension(
  'MyExtension',
  'https://example.com/MyExtension.js'
)
```

External extensions still need to register themselves with `registerExtension`. Only load external URLs when they are controlled, pinned, and compatible with the Viewer version.

## Options

Direct options:

```js
viewer.loadExtension('MyExtension', { targetLevel: 'Level 2' })
```

Constructor:

```js
constructor(viewer, options) {
  super(viewer, options)
  this.targetLevel = options.targetLevel
}
```

Constructor-time config through Viewer options is also possible:

```js
const viewer = new Autodesk.Viewing.GuiViewer3D(container, {
  extensions: ['MyExtension'],
  myExtensionOptions: { targetLevel: 'Level 2' },
})
```

Use direct `loadExtension` options unless startup loading is required.

## Async Load and Unload

`load` and `unload` may be async. Use this for dependency loading and cleanup:

```js
async load() {
  await Promise.all([
    this.viewer.loadExtension('Autodesk.DocumentBrowser'),
    loadScript('/vendor/grid.js'),
    loadStylesheet('/vendor/grid.css'),
  ])
  return true
}

unload() {
  this.viewer.removeEventListener(Autodesk.Viewing.SELECTION_CHANGED_EVENT, this.onSelection)
  this.panel?.setVisible(false)
  this.panel?.uninitialize?.()
  this.button?.parent?.removeControl?.(this.button)
  return true
}
```

Do not leave DOM nodes, toolbar controls, panels, event listeners, intervals, or external subscriptions behind.

## Event Base Class Pattern

The APS Dashboard tutorial uses a reusable base extension that maps Viewer events to overridable methods:

```js
export class BaseExtension extends Autodesk.Viewing.Extension {
  constructor(viewer, options) {
    super(viewer, options)
    this._onObjectTreeCreated = (ev) => this.onModelLoaded(ev.model)
    this._onSelectionChanged = (ev) => this.onSelectionChanged(ev.model, ev.dbIdArray)
    this._onIsolationChanged = (ev) => this.onIsolationChanged(ev.model, ev.nodeIdArray)
  }

  load() {
    this.viewer.addEventListener(Autodesk.Viewing.OBJECT_TREE_CREATED_EVENT, this._onObjectTreeCreated)
    this.viewer.addEventListener(Autodesk.Viewing.SELECTION_CHANGED_EVENT, this._onSelectionChanged)
    this.viewer.addEventListener(Autodesk.Viewing.ISOLATE_EVENT, this._onIsolationChanged)
    return true
  }

  unload() {
    this.viewer.removeEventListener(Autodesk.Viewing.OBJECT_TREE_CREATED_EVENT, this._onObjectTreeCreated)
    this.viewer.removeEventListener(Autodesk.Viewing.SELECTION_CHANGED_EVENT, this._onSelectionChanged)
    this.viewer.removeEventListener(Autodesk.Viewing.ISOLATE_EVENT, this._onIsolationChanged)
    return true
  }

  onModelLoaded(model) {}
  onSelectionChanged(model, dbids) {}
  onIsolationChanged(model, dbids) {}
}
```

This pattern is a good default for dashboards, metadata UI, selection-driven panels, and property-driven charts.

## Toolbar and Panels

Use Viewer UI classes for Viewer-owned controls. For detailed custom UI guidance, use [custom-ui.md](custom-ui.md).

```js
onToolbarCreated() {
  this.group = this.viewer.toolbar.getControl('custom-toolbar')
  if (!this.group) {
    this.group = new Autodesk.Viewing.UI.ControlGroup('custom-toolbar')
    this.viewer.toolbar.addControl(this.group)
  }

  this.button = new Autodesk.Viewing.UI.Button('my-button')
  this.button.setToolTip('Show Panel')
  this.button.addClass('my-button-icon')
  this.button.onClick = () => this.panel.setVisible(!this.panel.isVisible())
  this.group.addControl(this.button)
}
```

For larger UI, create `Autodesk.Viewing.UI.DockingPanel` subclasses. Keep panel sizing, visibility, and teardown explicit.

Do not render extension panels as arbitrary app-level cards over the canvas. If the UI belongs to a Viewer extension, it should be created by the extension, mounted into a Viewer panel/container, and removed by the extension.

## Extension State

Extensions can participate in Viewer state persistence by implementing `getState` and `restoreState`:

```js
getState(state) {
  state.myExtension = { visible: this.panel?.isVisible() ?? false }
}

restoreState(state) {
  this.panel?.setVisible(Boolean(state.myExtension?.visible))
}
```

Use this for bookmarks, saved views, collaboration, or route state. Keep the extension state namespaced.

## aps-extensions Repo Pattern

The `autodesk-platform-services/aps-extensions` repository is a reusable extension gallery. It includes extensions such as camera rotation, icon markup, nested viewer, transform, Google Maps locator, draw tool, custom properties, XLS export, Edit2D, phasing, Potree, room locator, tab selection, and bounding boxes.

Useful repo conventions:

```text
public/extensions/ExtensionName/
  config.json
  contents/
    main.js
    main.css
    assets/
```

`config.json` describes the registered extension name, display name, description, options, Viewer version, startup loading, files to load, and whether to show it in the extension list.

The repo's extension loader dynamically injects CSS/JS files, receives a Viewer instance through a `viewerinstance` custom event, and supports `loadextension` and `unloadextension` custom events. This is useful for sample galleries, but in product apps prefer direct imports or a typed extension registry unless dynamic marketplace-style loading is actually needed.

Important repo note: if an extension depends on `OBJECT_TREE_CREATED_EVENT`, check whether the instance tree already exists before waiting for the event:

```js
if (this.viewer.model.getInstanceTree()) {
  this.onTreeReady()
} else {
  this.viewer.addEventListener(Autodesk.Viewing.OBJECT_TREE_CREATED_EVENT, this.onTreeReady)
}
```

## Review Checklist

- Extension has a unique stable ID.
- `load` returns true only after required setup succeeds.
- `unload` removes every listener, DOM node, panel, toolbar button, interval, and external subscription.
- Extension options are documented and not pulled from global variables.
- Dependencies are loaded once and versioned.
- Model tree/property code handles "already loaded" and "not loaded yet" states.
- Multi-model code uses aggregate selection and model-aware dbIds.
- UI is implemented with Viewer UI primitives when it belongs inside the Viewer shell.

# Custom Viewer UI

Use this when creating toolbar buttons, panels, grids, charts, markups, custom property panels, or React/Vue/Svelte UI inside an Autodesk Viewer extension.

## Ownership Rule

Viewer-owned UI belongs to the extension. App-owned UI belongs to the app shell.

| UI type | Put it in |
| --- | --- |
| App navigation, login, project tree, file upload, page layout | App shell/components outside Viewer |
| Viewer toolbar button, command toggle, metadata panel, markup overlay, grid/chart tied to selection | Viewer extension |
| Property-like data display | `Autodesk.Viewing.UI.PropertyPanel` or a custom `DockingPanel` |
| Rich grid/chart/form | `Autodesk.Viewing.UI.DockingPanel` with a dedicated content node |
| Custom model browser click behavior | Configure or replace `Autodesk.Viewing.Extensions.ViewerModelStructurePanel` |
| Temporary canvas/world overlay | Extension-owned DOM/SVG/Three overlay cleaned up in `unload` |

Do not mount random absolutely positioned app cards over the Viewer canvas for extension functionality. That UI will drift from Viewer lifecycle, fullscreen, theme, toolbar state, and cleanup.

## Strict Generation Rule

When generating Viewer extension UI, prefer Viewer UI primitives by default:

- For selected-object or property-like displays, use `Autodesk.Viewing.UI.PropertyPanel`.
- For richer custom UI such as grids, charts, forms, filters, or framework components, use `Autodesk.Viewing.UI.DockingPanel`.
- For a persistent/reusable inspection mode, add a Viewer toolbar button in `onToolbarCreated` and toggle panel visibility/button state from that button.
- Use raw extension-owned DOM overlays only for temporary visual annotations, world/canvas markups, or explicitly requested passive overlays.
- Do not append a floating property card to `viewer.container` when a `PropertyPanel` or `DockingPanel` would represent the UI correctly.
- Do not mutate `viewer.container.style.position` to make custom UI work. Create a Viewer panel or an extension-owned overlay container with its own positioning.
- Make preferred property names configurable through extension options, for example `viewer.loadExtension('PeekPropertiesExtension', { preferredProperties: [...] })`.

## Extension UI Lifecycle

Follow this order:

1. Register the extension with `Autodesk.Viewing.theExtensionManager.registerExtension`.
2. In `load`, register events and load external JS/CSS dependencies.
3. In `onToolbarCreated`, create toolbar groups, buttons, and panels. This method may not run in headless Viewer modes.
4. In button handlers, toggle panel visibility and update button state.
5. In model/selection/isolation events, update panel contents only when the model and panel exist.
6. In `unload`, remove buttons/groups, hide and uninitialize panels, remove events, and clear extension-created DOM.

## Toolbar Button Pattern

This follows the APS Dashboard tutorial and `aps-extensions` BasicSkeleton pattern:

```js
onToolbarCreated() {
  this.group = this.viewer.toolbar.getControl('dashboard-toolbar-group')
  if (!this.group) {
    this.group = new Autodesk.Viewing.UI.ControlGroup('dashboard-toolbar-group')
    this.viewer.toolbar.addControl(this.group)
  }

  this.button = new Autodesk.Viewing.UI.Button('summary-button')
  this.button.setToolTip('Show Model Summary')
  this.button.addClass('summary-button-icon')
  this.button.onClick = () => {
    this.panel.setVisible(!this.panel.isVisible())
    this.button.setState(
      this.panel.isVisible()
        ? Autodesk.Viewing.UI.Button.State.ACTIVE
        : Autodesk.Viewing.UI.Button.State.INACTIVE
    )
    if (this.panel.isVisible()) this.update()
  }
  this.group.addControl(this.button)
}
```

Cleanup:

```js
unload() {
  if (this.group && this.button) {
    this.group.removeControl(this.button)
    if (this.group.getNumberOfControls() === 0) {
      this.viewer.toolbar.removeControl(this.group)
    }
    this.button = null
    this.group = null
  }
  return true
}
```

## DockingPanel Pattern

Use `DockingPanel` for custom grids, charts, forms, and richer UI. The Viewer container should host the panel; the panel content should live inside a child node owned by the panel.

```js
export class DataGridPanel extends Autodesk.Viewing.UI.DockingPanel {
  constructor(extension, id, title, options = {}) {
    super(extension.viewer.container, id, title, options)
    this.extension = extension
    this.container.style.left = `${options.x ?? 10}px`
    this.container.style.top = `${options.y ?? 10}px`
    this.container.style.width = `${options.width ?? 500}px`
    this.container.style.height = `${options.height ?? 400}px`
    this.container.style.resize = 'none'
  }

  initialize() {
    this.title = this.createTitleBar(this.titleLabel || this.container.id)
    this.initializeMoveHandlers(this.title)
    this.container.appendChild(this.title)

    this.content = document.createElement('div')
    this.content.className = 'viewer-panel-content'
    this.content.style.height = '350px'
    this.content.style.background = 'white'
    this.content.innerHTML = '<div class="datagrid-container" style="height: 100%"></div>'
    this.container.appendChild(this.content)
  }

  update(model, dbids) {
    model.getBulkProperties(dbids, { propFilter: ['name', 'Volume', 'Level'] }, (results) => {
      // Update grid/chart/UI here.
    })
  }
}
```

Create the panel from the extension, usually in `onToolbarCreated`:

```js
onToolbarCreated() {
  this.panel = new DataGridPanel(this, 'dashboard-datagrid-panel', 'Data Grid', { x: 10, y: 10 })
  this.button = this.createToolbarButton('dashboard-datagrid-button', iconUrl, 'Show Data Grid')
}
```

Do not use `document.body` or unrelated app containers as the parent for Viewer extension panels. Use `extension.viewer.container` so the panel participates in Viewer fullscreen, theme, and layout behavior.

## PropertyPanel Pattern

Use `PropertyPanel` when the UI is property-like. The APS Dashboard tutorial uses it for model summary values:

```js
export class SummaryPanel extends Autodesk.Viewing.UI.PropertyPanel {
  constructor(extension, id, title) {
    super(extension.viewer.container, id, title)
    this.extension = extension
  }

  async update(model, dbids, propNames) {
    this.removeAllProperties()
    for (const propName of propNames) {
      this.addProperty('Count', dbids.length, propName)
    }
  }
}
```

Use `removeAllProperties`, `addProperty`, and property categories instead of hand-building property tables when the panel is semantically a property display.

For a selection property inspector, follow [../exemplars/property-inspector.md](../exemplars/property-inspector.md).

## Built-In Panel Customization

Do not rebuild the Viewer model browser as app UI just to change click behavior. Autodesk's ModelStructurePanel blog shows that the built-in model browser can be replaced with a configured `Autodesk.Viewing.Extensions.ViewerModelStructurePanel`.

Use `OBJECT_TREE_CREATED_EVENT` as the safe replacement point because the model structure is loaded:

```js
viewer.addEventListener(Autodesk.Viewing.OBJECT_TREE_CREATED_EVENT, () => {
  const panel = new Autodesk.Viewing.Extensions.ViewerModelStructurePanel(viewer, 'Browser', {
    docStructureConfig: {
      click: { onObject: ['selectOnly'] },
      clickShift: { onObject: ['isolate'] },
      clickCtrl: { onObject: ['selectToggle'] },
    },
  })
  viewer.setModelStructurePanel(panel)
})
```

Useful built-in actions include `selectOnly`, `deselectAll`, `selectToggle`, `isolate`, `showAll`, `focus`, `hide`, `show`, and `toggleVisibility`. For deeper changes, subclass `ViewerModelStructurePanel` and override behavior deliberately instead of mutating Viewer DOM nodes.

This is the right path when the desired UI is still the model tree, but with different selection, focus, isolation, or visibility behavior.

## React or Framework UI Inside a Panel

If a rich framework component is needed:

- Create a plain DOM mount inside `DockingPanel.initialize`.
- Mount the React/Vue/Svelte root into that mount node.
- Keep the framework root handle on the panel or extension.
- Unmount it in panel teardown or extension `unload`.
- Do not mount framework UI directly into `viewer.container` or `document.body`.

Sketch:

```js
initialize() {
  this.title = this.createTitleBar(this.titleLabel || this.container.id)
  this.initializeMoveHandlers(this.title)
  this.container.appendChild(this.title)
  this.mount = document.createElement('div')
  this.mount.style.height = '100%'
  this.container.appendChild(this.mount)
}
```

The extension owns when the component receives Viewer data; the component should not reach into global Viewer state on its own.

## Update Rules

- Update panel data on model loaded, selection changed, isolation changed, or explicit button action.
- Check `this.panel` exists before updating.
- Check `this.viewer.model` exists before querying properties.
- If the panel is hidden and update is expensive, defer until the panel is shown.
- For large models, use `getBulkProperties` with `propFilter` or move aggregation to Model Derivative server queries.
- For multi-model scenes, use aggregate selection and pass the correct model with dbIds.

## Wrong Patterns to Flag

- Creating a panel in app React state and absolutely positioning it over the Viewer for extension behavior.
- Creating a property card with `document.createElement('div')` and `viewer.container.appendChild(...)` instead of using `PropertyPanel` or `DockingPanel`.
- Mutating `viewer.container.style.position` to support extension UI.
- Rebuilding the built-in Model Browser externally when `ViewerModelStructurePanel` configuration would solve the behavior change.
- Appending extension UI directly to `document.body`.
- Creating toolbar buttons in `load` without waiting for `onToolbarCreated`.
- Recreating buttons/panels on every model load or selection change.
- Creating a DockingPanel without a child content node, then letting a grid/chart mutate the panel container itself.
- Not calling `setVisible(false)` and `uninitialize()` for panels in `unload`.
- Removing a toolbar button without removing the empty `ControlGroup`.
- Hardcoding tutorial property names such as `Volume`, `Level`, or `Price` without making them configurable.
- Using `Autodesk.Viewing.Private` for normal UI unless no public API exists and the risk is documented.

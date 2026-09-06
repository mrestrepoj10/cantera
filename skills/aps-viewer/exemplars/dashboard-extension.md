# Dashboard Extension Exemplar

Use this for Viewer features that react to model metadata, selection, isolation, toolbar buttons, or panels.

## Base Extension

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

  findLeafNodes(model) {
    return new Promise((resolve, reject) => {
      model.getObjectTree((tree) => {
        const leaves = []
        tree.enumNodeChildren(tree.getRootId(), (dbid) => {
          if (tree.getChildCount(dbid) === 0) leaves.push(dbid)
        }, true)
        resolve(leaves)
      }, reject)
    })
  }
}
```

## Toolbar and Panel Extension

```js
class DataGridExtension extends BaseExtension {
  constructor(viewer, options) {
    super(viewer, options)
    this.group = null
    this.button = null
    this.panel = null
  }

  async load() {
    super.load()
    await Promise.all([
      loadScript('https://unpkg.com/tabulator-tables@4.9.3/dist/js/tabulator.min.js'),
      loadStylesheet('https://unpkg.com/tabulator-tables@4.9.3/dist/css/tabulator.min.css'),
    ])
    return true
  }

  unload() {
    super.unload()
    if (this.group && this.button) {
      this.group.removeControl(this.button)
      if (this.group.getNumberOfControls() === 0) this.viewer.toolbar.removeControl(this.group)
    }
    if (this.panel) {
      this.panel.setVisible(false)
      this.panel.uninitialize()
    }
    return true
  }

  onToolbarCreated() {
    this.group = this.viewer.toolbar.getControl('dashboard-toolbar')
    if (!this.group) {
      this.group = new Autodesk.Viewing.UI.ControlGroup('dashboard-toolbar')
      this.viewer.toolbar.addControl(this.group)
    }
    this.panel = new DataGridPanel(this, 'dashboard-grid', 'Data Grid', { x: 10, y: 10 })
    this.button = new Autodesk.Viewing.UI.Button('dashboard-grid-button')
    this.button.setToolTip('Show Data Grid')
    this.button.onClick = () => {
      this.panel.setVisible(!this.panel.isVisible())
      if (this.panel.isVisible()) this.update()
    }
    this.group.addControl(this.button)
  }

  async update() {
    const dbids = await this.findLeafNodes(this.viewer.model)
    this.panel.update(this.viewer.model, dbids)
  }
}

Autodesk.Viewing.theExtensionManager.registerExtension('DataGridExtension', DataGridExtension)
```

## Docking Panel

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
    this.content.style.height = '350px'
    this.content.style.backgroundColor = 'white'
    this.content.innerHTML = '<div class="datagrid-container" style="position: relative; height: 350px;"></div>'
    this.container.appendChild(this.content)
  }

  update(model, dbids) {
    model.getBulkProperties(dbids, { propFilter: ['name', 'Volume', 'Level'] }, (results) => {
      // Replace grid rows with model-derived data here.
    })
  }
}
```

## Production Notes

- Make property names configurable instead of hardcoding tutorial sample fields.
- Use `getBulkProperties` with `propFilter` for interactive UI.
- Move very large property aggregation to Model Derivative server-side property queries.
- Keep extension-owned UI inside `viewer.container` via Viewer UI classes; keep app navigation outside the Viewer shell.
- For property-like summaries, prefer `Autodesk.Viewing.UI.PropertyPanel`.
- Always implement full `unload` cleanup before adding more behavior.

# Property Inspector Exemplar

Use this when a Viewer extension needs to show selected-object properties, a "peek properties" card, or a compact property summary. The default pattern is `Autodesk.Viewing.UI.PropertyPanel`, not a raw floating DOM card.

## Extension

```js
class PeekPropertiesExtension extends Autodesk.Viewing.Extension {
  constructor(viewer, options = {}) {
    super(viewer, options)
    this.preferredProperties = options.preferredProperties || ['Category', 'Type', 'Material', 'Level', 'Area', 'Volume']
    this.panel = null
    this.button = null
    this.group = null
    this.onSelectionChanged = this.onSelectionChanged.bind(this)
  }

  load() {
    this.panel = new PeekPropertiesPanel(this, 'peek-properties-panel', 'Properties')
    this.viewer.addEventListener(Autodesk.Viewing.SELECTION_CHANGED_EVENT, this.onSelectionChanged)
    return true
  }

  unload() {
    this.viewer.removeEventListener(Autodesk.Viewing.SELECTION_CHANGED_EVENT, this.onSelectionChanged)
    if (this.panel) {
      this.panel.setVisible(false)
      this.panel.uninitialize()
      this.panel = null
    }
    if (this.group && this.button) {
      this.group.removeControl(this.button)
      if (this.group.getNumberOfControls() === 0) this.viewer.toolbar.removeControl(this.group)
      this.group = null
      this.button = null
    }
    return true
  }

  onToolbarCreated() {
    this.group = this.viewer.toolbar.getControl('inspect-toolbar')
    if (!this.group) {
      this.group = new Autodesk.Viewing.UI.ControlGroup('inspect-toolbar')
      this.viewer.toolbar.addControl(this.group)
    }

    this.button = new Autodesk.Viewing.UI.Button('peek-properties-button')
    this.button.setToolTip('Peek Properties')
    this.button.onClick = () => {
      this.panel.setVisible(!this.panel.isVisible())
      this.button.setState(
        this.panel.isVisible()
          ? Autodesk.Viewing.UI.Button.State.ACTIVE
          : Autodesk.Viewing.UI.Button.State.INACTIVE
      )
      this.updateFromSelection()
    }
    this.group.addControl(this.button)
  }

  onSelectionChanged() {
    this.updateFromSelection()
  }

  updateFromSelection() {
    if (!this.panel || !this.viewer.model) return
    const selection = this.viewer.getSelection()
    if (selection.length !== 1) {
      this.panel.clear()
      this.panel.setVisible(false)
      return
    }
    this.viewer.getProperties(selection[0], (result) => {
      this.panel.update(result, this.preferredProperties)
      this.panel.setVisible(true)
    })
  }
}

Autodesk.Viewing.theExtensionManager.registerExtension('PeekPropertiesExtension', PeekPropertiesExtension)
```

## Panel

```js
class PeekPropertiesPanel extends Autodesk.Viewing.UI.PropertyPanel {
  constructor(extension, id, title) {
    super(extension.viewer.container, id, title)
    this.extension = extension
    this.container.style.left = '10px'
    this.container.style.top = '10px'
    this.container.style.width = '320px'
    this.container.style.height = '360px'
  }

  clear() {
    this.removeAllProperties()
  }

  update(result, preferredProperties) {
    this.removeAllProperties()
    this.addProperty('Name', result.name || String(result.dbId), 'Object')
    this.addProperty('dbId', result.dbId, 'Object')

    const wanted = new Set(preferredProperties)
    for (const prop of result.properties || []) {
      if (wanted.has(prop.displayName)) {
        this.addProperty(prop.displayName, prop.displayValue, prop.displayCategory || 'Properties')
      }
    }
  }
}
```

## Rules

- Keep `preferredProperties` configurable through extension options.
- Use `PropertyPanel` for property-like display, even when the visual goal is a compact card.
- Add a toolbar toggle for reusable inspection behavior. If the prompt explicitly asks for passive display, the extension can still own the panel and show/hide it based on selection.
- Hide or clear the panel when there is no single selected object.
- Do not append raw floating property DOM to `viewer.container`.
- Do not mutate `viewer.container.style.position`.

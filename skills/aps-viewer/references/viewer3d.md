# Viewer3D and Runtime

Use this when editing Viewer initialization, model loading, Viewer3D API calls, screenshots, event handling, selection, object properties, navigation, state, or teardown.

## Runtime and Assets

Load the hosted Viewer assets unless the app has a deliberate offline/self-hosting strategy:

```html
<link rel="stylesheet" href="https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/style.css">
<script src="https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/viewer3D.js"></script>
```

For TypeScript projects:

```bash
npm install --save-dev @types/forge-viewer
```

The Viewer is a browser global (`Autodesk.Viewing`). In bundlers, use an idempotent script loader and global declarations rather than importing Viewer as a normal ESM package.

## Initialization

Initialize the runtime once for each stable runtime configuration:

```js
Autodesk.Viewing.Initializer({
  env: 'AutodeskProduction2',
  api: 'streamingV2',
  getAccessToken,
  language: 'en',
}, () => {
  const viewer = new Autodesk.Viewing.GuiViewer3D(container, {
    extensions: ['Autodesk.DocumentBrowser'],
  })
  viewer.start()
})
```

For SVF2, Autodesk's Viewer team documented that v7.95+ requires explicit `env` and `api`.

| Derivative/region | `env` | `api` |
| --- | --- | --- |
| SVF2, US/default | `AutodeskProduction2` | `streamingV2` |
| SVF2, EMEA/EU | `AutodeskProduction2` | `streamingV2_EU` |
| SVF2, Australia | `AutodeskProduction2` | `streamingV2_AUS` |
| Legacy SVF | Verify current docs/app | `derivativeV2` or region variant |

Keep the Viewer `api` aligned with the derivative format and region used by Data Management and Model Derivative.

## Token Contract

The Viewer token callback must receive token and expiry seconds:

```js
async function getAccessToken(callback) {
  const resp = await fetch('/api/auth/token')
  if (!resp.ok) throw new Error(await resp.text())
  const { access_token, expires_in } = await resp.json()
  callback(access_token, expires_in)
}
```

The backend route should return a short-lived token with `viewables:read`. Do not send `APS_CLIENT_SECRET`, refresh tokens, 3-legged refresh tokens, or broad internal tokens to the browser.

## Loading Models

Load the manifest document first, then load a viewable node:

```js
function loadModel(viewer, urn) {
  return new Promise((resolve, reject) => {
    Autodesk.Viewing.Document.load(
      `urn:${urn}`,
      (doc) => {
        const viewable = doc.getRoot().getDefaultGeometry()
        resolve(viewer.loadDocumentNode(doc, viewable))
      },
      (code, message, errors) => reject({ code, message, errors })
    )
  })
}
```

Rules:

- `urn` is the URL-safe Base64 derivative URN, without `urn:`.
- Use search helpers when users must select a named view, 2D sheet, or non-default geometry.
- Set theme, light preset, navigation style, and camera after the viewer starts or after geometry loads.
- For upload workflows, check translation status before calling `Document.load`.

## Viewer3D API Families

Use public Viewer3D methods first:

- Lifecycle: `start`, `finish`, `resize`, `tearDown`, `loadExtension`, `unloadExtension`.
- Loading: `loadDocumentNode`, `unloadDocumentNode`, `unloadModel`.
- Selection and visibility: `select`, `clearSelection`, `getSelection`, `getAggregateSelection`, `isolate`, `hide`, `show`, `showAll`, `fitToView`.
- Properties and model data: `getProperties`, `model.getObjectTree`, `model.getBulkProperties`, `model.getData`.
- Navigation and state: `navigation`, `autocam.goHome`, `getState`, `restoreState`, `setViewFromFile`, `setLightPreset`, `setTheme`.
- UI: `toolbar`, `addEventListener`, `removeEventListener`.
- Capture: `getScreenShot(width, height, callback)`.

Avoid `Autodesk.Viewing.Private` unless no public API exists and the risk is documented.

## Events

Register listeners when the model/viewer lifecycle requires them, and remove the same function reference during cleanup:

```js
function onSelection(event) {
  const dbIds = event.dbIdArray
  if (dbIds.length) viewer.getProperties(dbIds[0], console.log)
}

viewer.addEventListener(Autodesk.Viewing.SELECTION_CHANGED_EVENT, onSelection)
viewer.addEventListener(Autodesk.Viewing.GEOMETRY_LOADED_EVENT, () => viewer.fitToView())
viewer.removeEventListener(Autodesk.Viewing.SELECTION_CHANGED_EVENT, onSelection)
```

Common event families:

- Load readiness: `OBJECT_TREE_CREATED_EVENT`, `GEOMETRY_LOADED_EVENT`, model root/document load callbacks.
- User state: `SELECTION_CHANGED_EVENT`, `AGGREGATE_SELECTION_CHANGED_EVENT`, `ISOLATE_EVENT`, hide/show events.
- View state: camera, explode, cut planes, fullscreen, resize.
- Extension state: extension loaded/unloaded events.

## Selection, Properties, and Object Tree

Viewer property APIs are best for interactive UI. Use Model Derivative server APIs for heavy analytics.

Common object tree pattern:

```js
function findLeafNodes(model) {
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
```

Use aggregate APIs in multi-model scenes because dbIds are model-local.

## Screenshots

Basic screenshot:

```js
viewer.getScreenShot(width, height, (dataUrl) => {
  image.src = dataUrl
})
```

Checklist:

- Wait until geometry and overlays are rendered.
- Use dimensions with the intended aspect ratio.
- Ensure the Viewer container is visible and has non-zero size.
- Markups may need separate rendering through the Markups extension.
- Bounded or high-resolution screenshots may require `Autodesk.Viewing.ScreenShot` helpers.

## Multi-Model Loading

To add models instead of replacing the current one:

```js
viewer.loadDocumentNode(doc, viewable, {
  keepCurrentModels: true,
  preserveView: true,
  applyRefPoint: true,
  applyScaling: 'm',
  globalOffset: { x: 0, y: 0, z: 0 },
})
```

Use consistent units, shared coordinates, and global offsets. For Navisworks/Revit/manufacturing mixtures, verify scale, up vector, ref point, and large coordinate behavior.

## Framework Lifecycle

For React, Vue, Svelte, or similar frameworks:

- Load Viewer CSS/JS once.
- Cache the `Autodesk.Viewing.Initializer` promise by runtime options.
- Create `GuiViewer3D` after the DOM container exists and has dimensions.
- Call `viewer.resize()` after layout changes.
- Remove listeners, unload custom extensions when needed, and call `viewer.finish()` on unmount.

## Troubleshooting

| Symptom | Checks |
| --- | --- |
| 404 loading derivative resources | Missing v7.95+ `env/api`, wrong `streamingV2` region, derivative not SVF2, manifest not complete. |
| Blank Viewer | Container has zero height, token lacks `viewables:read`, wrong URN, geometry not translated. |
| `Document.load` fails | Missing `urn:` prefix, raw object ID instead of Base64 derivative URN, expired token, region mismatch. |
| Properties fail | Object tree not ready, selected dbId is from another model, token lacks access, derivative has limited metadata. |
| SPA leaks memory | Scripts/runtime/listeners/viewers recreated on rerender or route change. |
| Screenshot bad output | Hidden container, wrong dimensions/aspect, capture before render, markups rendered separately. |

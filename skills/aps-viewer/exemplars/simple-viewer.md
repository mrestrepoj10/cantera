# Simple Viewer Exemplar

Use this as the compact pattern for a basic Viewer integration.

## Viewer Module

```js
async function getAccessToken(callback) {
  const resp = await fetch('/api/auth/token')
  if (!resp.ok) throw new Error(await resp.text())
  const { access_token, expires_in } = await resp.json()
  callback(access_token, expires_in)
}

export function initViewer(container) {
  return new Promise((resolve) => {
    Autodesk.Viewing.Initializer({
      env: 'AutodeskProduction2',
      api: 'streamingV2',
      getAccessToken,
    }, () => {
      const viewer = new Autodesk.Viewing.GuiViewer3D(container, {
        extensions: ['Autodesk.DocumentBrowser'],
      })
      viewer.start()
      viewer.setTheme('light-theme')
      resolve(viewer)
    })
  })
}

export function loadModel(viewer, urn) {
  return new Promise((resolve, reject) => {
    Autodesk.Viewing.Document.load(
      `urn:${urn}`,
      (doc) => resolve(viewer.loadDocumentNode(doc, doc.getRoot().getDefaultGeometry())),
      (code, message, errors) => reject({ code, message, errors })
    )
  })
}
```

## Selection and Status Loop

```js
async function onModelSelected(viewer, urn) {
  window.location.hash = urn
  const resp = await fetch(`/api/models/${urn}/status`)
  if (!resp.ok) throw new Error(await resp.text())
  const status = await resp.json()

  if (status.status === 'inprogress') {
    showNotification(`Model is being translated (${status.progress})`)
    window.setTimeout(() => onModelSelected(viewer, urn), 5000)
    return
  }

  if (status.status === 'failed') {
    showNotification(`Translation failed`)
    return
  }

  clearNotification()
  await loadModel(viewer, urn)
}
```

## Checks

- `/api/auth/token` returns only `{ access_token, expires_in }`.
- Public token scope is normally `viewables:read`.
- Status endpoint checks Model Derivative manifest before Viewer loading.
- Viewer container has stable dimensions before `start()`.
- `env/api` matches derivative format and region.

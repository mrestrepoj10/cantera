# Templates

Ready-to-deploy Next.js apps, one per cantera template. Each directory is generated from the
registry by `pnpm registry:build` and is what the Deploy button on the site clones. Pro
templates carry no deploy button: their source ships only through the license-gated registry.

| Template | What it is | Links |
| --- | --- | --- |
| [Model Viewer Page](./model-viewer-page) | A complete APS project-tree and Autodesk Viewer page: scoped Autodesk sign-in, lazy 3-legged Data Management browsing, recursive project and folder search, a full-bleed native viewer, account controls, and untranslated-model states. | Pro · [Get access](https://canteraui.vercel.app/pro) · [Docs](https://canteraui.vercel.app/components/model-viewer-page) |
| [Model Upload Page](./model-upload-page) | A two-legged upload and viewing page over the app's own OSS bucket: drag-and-drop signed S3 uploads with archive support, translation options and tracking with manifest diagnostics, a sidebar model list with search, and a shareable full-bleed viewer. | Pro · [Get access](https://canteraui.vercel.app/pro) · [Docs](https://canteraui.vercel.app/components/model-upload-page) |

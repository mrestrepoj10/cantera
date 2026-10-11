# Templates

Ready-to-deploy Next.js apps, one per cantera template. Each directory is generated from the
registry by `pnpm registry:build` and is what the Deploy button on the site clones. Pro
templates carry no deploy button: their source ships only through the license-gated registry.

| Template | What it is | Links |
| --- | --- | --- |
| [Model Viewer Page](./model-viewer-page) | A complete APS project-tree and Autodesk Viewer page: scoped Autodesk sign-in, lazy 3-legged Data Management browsing, recursive project and folder search, a full-bleed native viewer, account controls, and untranslated-model states. | Pro · [Get access](https://canteraui.vercel.app/pro) · [Docs](https://canteraui.vercel.app/components/model-viewer-page) |
| [Model Upload Page](./model-upload-page) | A two-legged upload and viewing page over the app's own OSS bucket: drag-and-drop signed S3 uploads with archive support, translation options and tracking with manifest diagnostics, a sidebar model list with search, and a shareable full-bleed viewer. | Pro · [Get access](https://canteraui.vercel.app/pro) · [Docs](https://canteraui.vercel.app/components/model-upload-page) |
| [Model Agent Page](./model-agent-page) | An already-translated model in a full-bleed Autodesk Viewer next to the fx coding agent as a terminal that drives it: libfx running in the browser, a sandboxed bash workspace whose viewer command runs a typed viewer tool catalog, model traffic through a same-origin AI Gateway proxy, and a colour legend for what the agent paints. | [Deploy](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fmrestrepoj10%2Fcantera%2Ftree%2Fmain%2Ftemplates%2Fmodel-agent-page&project-name=cantera-model-agent-page&repository-name=cantera-model-agent-page&env=APS_CLIENT_ID%2CAPS_CLIENT_SECRET%2CAPS_MODEL_URN%2CAI_GATEWAY_API_KEY&envDescription=The+keys+this+template+needs.+The+README+explains+each+one.&envLink=https%3A%2F%2Fcanteraui.vercel.app%2Fcomponents%2Fmodel-agent-page) · [Docs](https://canteraui.vercel.app/components/model-agent-page) |

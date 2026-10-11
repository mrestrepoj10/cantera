# canterafx (`@cantera/model-agent-page`)

An already-translated model in a full-bleed Autodesk Viewer with the fx coding agent docked beside it as a terminal. libfx runs in the browser, a sandboxed bash workspace gives fx a viewer command over a typed tool catalog, model traffic goes through a same-origin AI Gateway proxy, and a colour legend explains what the agent paints.

- Type: template
- Install: `npx shadcn@latest add @cantera/model-agent-page`
- Docs: https://canteraui.vercel.app/components/model-agent-page
- Registry item: https://canteraui.vercel.app/r/model-agent-page.json
- Registry dependencies: button, sheet, @cantera/aps-viewer, @cantera/viewer-types, @cantera/viewer-extension-types, @cantera/viewer-agent-tools, @cantera/agent-types, @cantera/libfx-types, @cantera/fx-terminal, @cantera/status-tokens, @cantera/token-status
- npm dependencies: aec-auth, lucide-react, libfx@0.0.13

Files written into the consumer project:

- `app/agent/page.tsx`
- `app/agent/loading.tsx`
- `components/model-agent.tsx`
- `app/api/viewer-token/route.ts`
- `app/api/agent/gateway/[...path]/route.ts`

Environment variables added to `.env.local`:

- `APS_CLIENT_ID`
- `APS_CLIENT_SECRET`
- `APS_MODEL_URN`
- `AI_GATEWAY_API_KEY`

## Install notes

Installed at /agent: the canterafx page, its loading UI, the two-legged /api/viewer-token route, and /api/agent/gateway, the proxy that holds AI_GATEWAY_API_KEY and lets only anthropic/claude-haiku-5.5 through. ModelAgent docks the fx terminal beside the viewer; fx runs in the browser on libfx (WebAssembly with JSPI: Chrome or Edge 137+, Safari 27+) and drives the model through a viewer command. No sign-in is installed: add your own access control before shipping beyond a trusted team.

Next:
1. Fill .env.local: APS_CLIENT_ID and APS_CLIENT_SECRET from aps.autodesk.com; APS_MODEL_URN, the base64 URN of a translated model; AI_GATEWAY_API_KEY from Vercel AI Gateway.
2. Run next dev and open /agent.

Reference: https://canteraui.vercel.app/components/model-agent-page

## Notes

ModelAgent fetches from viewerTokenEndpoint (default /api/viewer-token) and sends every model request to gatewayBase (default /api/agent/gateway), the two routes this template ships; the browser never sees AI_GATEWAY_API_KEY. The header carries only the canterafx wordmark and the Agent button; it never shows the model's name. The page mounts the fx terminal: docked beside the viewer with a resize handle, a bottom sheet below 768px, opened and closed by the Agent button. Closing it ends the fx session and reopening starts a new one, but the viewer tool catalog is created once, so element sets and colours carry over; the colour legend over the viewer reads the catalog's colour ledger. fx keeps its model choice and prompt history in localStorage under cantera.fx.*, the viewer settings live under cantera:model-agent-page:viewer-settings, and the docked width under cantera:model-agent-page:panel-width. The routes run on the app’s credentials with no sign-in, so add your own access control before exposing them.

## ModelAgent props

- `urn` (`string`) — Base64 Model Derivative URN of an already translated model, with or without the urn: prefix. The page reads it from APS_MODEL_URN.
- `viewerTokenEndpoint` (`string`, default `'/api/viewer-token'`) — Two-legged viewer token route, scoped to viewables:read.
- `gatewayBase` (`string`, default `'/api/agent/gateway'`) — Same-origin AI Gateway proxy that holds AI_GATEWAY_API_KEY. Every model request from the browser goes here.
- `embedded` (`boolean`, default `false`) — Renders a div instead of main and positions the screen inside a docs or preview frame. Leave false for the full-page route.
- `className` (`string`) — Merged onto the root.

## Gateway route

- `GET /coding-agent/v1/models` (`cached 10 min`) — The AI Gateway model catalog fx reads for model capabilities.
- `POST /v4/ai/language-model` (`≤ 1 MiB body`) — Forwarded only when the ai-language-model-id header is anthropic/claude-haiku-5.5; 60 requests a minute per IP.
- `error body` (`{ error: { type, message } }`) — type is not-found, not-configured, rate-limited, too-large, invalid-request, model-not-allowed, or upstream-error; the terminal shows it as a banner.

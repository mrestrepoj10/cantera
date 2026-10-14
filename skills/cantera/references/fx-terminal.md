# fx Terminal (`@cantera/fx-terminal`)

The fx coding agent as a terminal next to a model viewer: libfx's WebAssembly terminal in xterm.js, model traffic through a same-origin gateway proxy, and a sandboxed bash workspace whose viewer command runs the typed viewer tool catalog.

- Type: block
- Install: `npx shadcn@latest add @cantera/fx-terminal`
- Docs: https://canteraui.vercel.app/components/fx-terminal
- Registry item: https://canteraui.vercel.app/r/fx-terminal.json
- Registry dependencies: button, @cantera/libfx-types, @cantera/agent-types, @cantera/viewer-agent-tools, @cantera/status-tokens, @cantera/token-status
- npm dependencies: libfx@0.0.13, @xterm/xterm, @xterm/addon-fit, just-bash, lucide-react

Files written into the consumer project:

- `components/ui/fx-terminal/fx-terminal.tsx`
- `components/ui/fx-terminal/runtime.ts`
- `components/ui/fx-terminal/workspace.ts`
- `components/ui/fx-terminal/images.ts`
- `components/ui/fx-terminal/index.ts`

## Notes

Client-only and browser-only: fx runs as WebAssembly with JSPI, so it needs Chrome or Edge 137+ or Safari 27+; other browsers get a notice instead of a terminal. Model traffic goes to gatewayBase (default /api/agent/gateway), a same-origin route you must mount that holds AI_GATEWAY_API_KEY, allows only the two AI Gateway paths fx uses, and enforces the model — @cantera/viewer-agent ships it. Its typed refusals (not configured, rate limited, model not allowed) render as a banner above the terminal. libfx's browser entry loads fx-term.wasm through new URL(..., import.meta.url), which Next bundles as a hashed static asset, so no copy step or wasm route is needed. The component imports @xterm/xterm/css/xterm.css itself.

The agent's shell is just-bash over an in-memory filesystem at /model, with no network. Its one extra command, viewer, maps flags to the tool's input schema (viewer find_elements --category Walls, --ids 1,2,3, --set set-1, @last for the newest set) and prints the tool's text; viewer help and viewer <tool> --help are generated from the schemas. A tool that needs more than 25 seconds returns exit 75 and keeps running as a job for viewer wait. fx's model choice and prompt history persist in localStorage under cantera.fx.*. The browser build of fx reads no effort from its environment or launch arguments, so the component types /model <model> <effort> and /clear while the starting spinner still covers the terminal. When gatewayBase's model catalog prices a fast mode for the model (pricing.fast, or a <model>-fast entry), fx asks for a speed as well, so the component appends speed (normal by default) as a third word; if the catalog cannot be read it sends two.

The shell cannot hand pixels to the model, so viewer take_screenshot saves the image under /model/shots/ (shot-1.jpg, shot-2.jpg, or --name) and prints its path and size; viewer shots lists them. viewer describe_image <path> [--question] is experimental: the model gets a text description, not the pixels, and each call costs one extra model request. It sends one PNG, JPEG, WebP, or GIF from the workspace (up to 3.75 MB) to gatewayBase as a separate non-streaming request for the same model and prints the reply; the shipped gateway route caps request bodies at 1 MiB, which leaves room for roughly 750 KB of image.

## FxTerminal props

- `tools` (`ViewerAgentTools`) — The catalog from createViewerAgentTools. The workspace exposes it as the viewer command (viewer <tool> --flag value), and README.md is generated from it. Keep the instance stable: a new one restarts the terminal.
- `gatewayBase` (`string`, default `'/api/agent/gateway'`) — Same-origin proxy that holds AI_GATEWAY_API_KEY. Requests fx makes to https://ai-gateway.vercel.sh are rewritten under it; every other origin is refused locally.
- `model` (`string`, default `'anthropic/claude-haiku-5.5'`) — Passed as FX_MODEL. A model saved by an earlier /model choice is ignored unless it matches, since the proxy refuses other models.
- `effort` (`string`, default `'low'`) — Reasoning effort, applied with /model before the terminal is shown; fx's own status line shows it with the model.
- `speed` (`'normal' | 'fast'`, default `'normal'`) — Sent with /model only when the model catalog prices a fast mode for the model, since fx then asks for a speed. fast keeps the model id, so the proxy allows it, and bills at the catalog's fast pricing.
- `colorScheme` (`'light' | 'dark'`) — Omit to follow the .dark class on the document. A change recolours the running terminal without restarting it. The frame follows the scheme: a bordered, rounded light surface inset in its container when light, flush to its container when dark.
- `onExec` (`(event: { command: string; exitCode: number; ms: number }) => void`) — Every shell command the agent ran, after it finished — for a trace.
- `onReady` (`() => void`) — fx reached its input loop.
- `ref` (`Ref<{ focus(): void; fit(): void }>`) — Focus the terminal, or refit it after its container changes size outside a resize the component can observe.

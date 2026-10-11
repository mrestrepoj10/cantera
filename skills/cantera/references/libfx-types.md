# libfx Types (`@cantera/libfx-types`)

TypeScript declarations for libfx 0.0.13's browser entry, which ships none: the agent (createFxAgent, turns, events, usage, host tools with image results), listModels, and the terminal (createFxTerminal, xtermAdapter, terminal, workspace, and store adapters).

- Type: types
- Install: `npx shadcn@latest add @cantera/libfx-types`
- Docs: https://canteraui.vercel.app/components/libfx-types
- Registry item: https://canteraui.vercel.app/r/libfx-types.json

Files written into the consumer project:

- `lib/libfx-browser.d.ts`

## Notes

Ambient declarations for the module libfx/browser, pinned to libfx 0.0.13 — newer libfx releases change these shapes, so install that exact version. lib/libfx-browser.d.ts only needs to be inside your tsconfig include. XtermTerminal is structural, so the declarations compile without @xterm/xterm installed.

## Usage

libfx 0.0.13 publishes no TypeScript types. These declarations type its browser entry as documented for that version — the headless agent and its turn events, host tools with image results, the model catalog, and the embeddable terminal with its adapters — so libfx code typechecks under strict mode without any.

```tsx
import { createFxAgent, supportsJspi, type HostTool } from 'libfx/browser'

const tools: HostTool[] = [
  {
    name: 'count_rooms',
    description: 'Count the rooms on a level.',
    inputSchema: { type: 'object', properties: { level: { type: 'string' } } },
    execute: async (input, { signal }) => ({ rooms: 12 }),
  },
]

if (supportsJspi()) {
  const agent = await createFxAgent({ apiKey: 'proxy', tools, fetch: gatewayFetch })
  const turn = agent.prompt('How many rooms are on level 2?')
  for await (const event of turn) if (event.type === 'text_delta') write(event.delta)
  const { stopReason, usage } = await turn.result
}
```

## Exports

- `createFxAgent / Agent / Turn` (`(options: AgentOptions) => Promise<Agent>`) — One in-browser conversation: prompt(input) returns a Turn to iterate for TurnEvents, steer, or cancel, with result resolving to the stopReason and token usage; checkpoint() exports opaque bytes of at most 4 MiB.
- `TurnEvent` (`type`) — text_delta, reasoning_delta, user_message (steering accepted), tool_start (id, name, input or a preview over 64 KiB), and tool_end (id, name, text content, isError).
- `HostTool / RichToolResult` (`interface`) — A tool's name, description, JSON Schema, and execute(input, { signal }) returning JSON, a string, or { type: 'libfx.tool-result', text, images } so the model sees up to eight base64 images.
- `AgentOptions` (`interface`) — apiKey, model (an id or { id, effort, fast, ultrafast }), instructions, tools (up to 64), checkpoint, fetch, onEvent, resizeImage, wasm.
- `createFxTerminal / TerminalOptions / TerminalRuntime` (`(options: TerminalOptions) => Promise<TerminalRuntime>`) — The interactive fx terminal: a TerminalAdapter, env and args, fetch, the config, prompt-history, session, and OAuth stores, openUrl, and a WorkspaceAdapter that adds shell.run. The runtime exposes interactive, exited, write, resize, and abort.
- `xtermAdapter / encodeXtermKeyEvent` (`function`) — Connects an @xterm/xterm Terminal (typed structurally as XtermTerminal, so the declarations need no xterm install) and encodes the extra keys fx understands.
- `supportsJspi / listModels` (`function`) — Feature-check WebAssembly JSPI before creating anything; list the Gateway catalog’s language-model ids without loading a runtime.

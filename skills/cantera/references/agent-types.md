# Agent Types (`@cantera/agent-types`)

Provider-neutral types for AI agents in cantera surfaces: ordered message parts, tool actions with undo and outcome states, named element sets, runtime and turn status, unavailable-state notices, and the runtime-agnostic tool contract.

- Type: types
- Install: `npx shadcn@latest add @cantera/agent-types`
- Docs: https://canteraui.vercel.app/components/agent-types
- Registry item: https://canteraui.vercel.app/r/agent-types.json

Files written into the consumer project:

- `lib/agent-types.ts`

## Notes

Pure types plus one copy helper — no runtime and no fetching. Message parts keep the order the runtime produced them in, so a transcript renders text, reasoning, and action cards interleaved. AgentAction.undoId is the key the tool catalog’s undo stack knows the action by; offer Undo only when undoable is true.

## Usage

The lingua franca for AI agents in cantera surfaces — messages made of ordered parts, tool actions with outcome states and undo keys, named element sets, and the notices an unavailable agent shows. Chat panels, command bars, and terminals render these shapes; an adapter translates its runtime’s events into them, so a different agent runtime renders with the same components.

```tsx
import { describeAgentUnavailableReason, type AgentMessage } from '@/lib/agent-types'

const messages: AgentMessage[] = [
  {
    id: 'm1',
    role: 'user',
    createdAt: Date.now(),
    parts: [{ type: 'text', text: 'Colour the level 2 walls red' }],
  },
]

const notice = describeAgentUnavailableReason('unsupported-browser')
```

## Exports

- `AgentMessage` (`interface`) — One turn's message: id, role ('user' | 'assistant'), createdAt in epoch milliseconds, and parts in the order the runtime produced them — text, reasoning, action, image.
- `AgentAction` (`interface`) — One tool call as the UI shows it: tool name, the tool's own label and detail, status, start and end times, raw input and output, undoable with its undoId, and the set, colour, or image it produced.
- `AgentActionStatus` (`type`) — 'running' | 'succeeded' | 'failed' | 'cancelled' | 'partial'. Render failed as danger, partial as warning, and cancelled as neutral status tokens.
- `ElementSet` (`interface`) — A named group of viewer elements (set-1, set-2) the agent and the user both refer to: label, readonly dbIds, createdAt, and the tool that produced it.
- `AgentSelectionContext` (`interface`) — What the viewer has selected right now, with a short summary for a chip.
- `AgentTurnStatus / AgentRuntimeStatus` (`type`) — 'idle' | 'running' | 'cancelling' for one turn; 'starting' | 'ready' | 'unavailable' | 'error' for the runtime as a whole.
- `AgentUnavailableReason / AgentNotice` (`type / interface`) — Why the agent cannot run (unsupported browser, no model, not configured, rate limited, model not allowed, runtime error) and the title, description, and tone a notice renders.
- `describeAgentUnavailableReason` (`(reason: AgentUnavailableReason) => AgentNotice`) — Default copy for each reason. Recoverable states are warning, operator fixes are danger, and no-model is neutral.
- `AgentTool / AgentToolResult / AgentToolSchema` (`interface / type`) — The runtime-agnostic tool contract: a closed JSON Schema, a mutates flag, and execute(input, { signal, actionId? }) resolving to the text the model reads plus the label, set, colour, image, and undo key the UI shows.
- `JsonValue` (`type`) — Any JSON-serializable value.

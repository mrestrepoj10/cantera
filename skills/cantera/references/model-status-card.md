# Model Status Card (`@cantera/model-status-card`)

The translation state of one design: whether the model is viewable yet, how far along it is, and what failed — with a retry on the async-pending contract.

- Type: component
- Install: `npx shadcn@latest add @cantera/model-status-card`
- Docs: https://canteraui.xyz/components/model-status-card
- Registry item: https://canteraui.xyz/r/model-status-card.json
- Registry dependencies: badge, button, card, @cantera/token-status, @cantera/status-tokens, @cantera/project-types
- npm dependencies: lucide-react
- Working example page: `npx shadcn@latest add @cantera/model-status-card-demo` — installs app/examples/model-status-card/page.tsx

Files written into the consumer project:

- `model-status-card.tsx`

## Props

- `translation` (`ModelTranslation`) — The design to summarize: name (or URN fallback), status badge, progress, outputs, error text.
- `onRetry` (`() => void | Promise<void>`) — Retry for a failed or timed-out translation. Promise-returning handlers drive the pending state; the button keeps its label, spins, and stays put.
- `retryPending` (`boolean`, default `false`) — Pending state for the retry action, drivable from outside.
- `showOutputs` (`boolean`, default `true`) — Render each produced output format as an outline badge while ready.
- `...props` (`ComponentProps<typeof Card>`) — Everything else lands on the root Card.

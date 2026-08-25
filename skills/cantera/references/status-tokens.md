# Status Tokens (`@cantera/status-tokens`)

Semantic status colors — success, warning, danger, neutral — each with a foreground and a surface companion, contrast-verified in light and dark. The palette every cantera status surface renders from.

- Type: tokens
- Install: `npx shadcn@latest add @cantera/status-tokens`
- Docs: https://canteraui.vercel.app/components/status-tokens
- Registry item: https://canteraui.vercel.app/r/status-tokens.json
- Working example page: `npx shadcn@latest add @cantera/status-tokens-demo` — installs app/examples/status-tokens/page.tsx

Files written into the consumer project:

- `lib/status-tokens.ts`

Installs CSS variables into the consumer theme (light and dark).

## Install notes

Status tokens installed. The solid pairs (bg-status-* with text-status-*-foreground) are the default treatment; the -surface companions are for soft rows and callouts and must always carry text-status-* ink. If your theme redefines :root without these variables, the utilities fall back to foreground / destructive / muted so nothing renders invisible. lib/status-tokens.ts ships the same twelve tokens as typed var() strings (statusCssVars) for the places a class cannot reach: inline styles, chart series, canvas fills.

## Tokens

- `--status-success` (`bg-status-success · text-status-success`) — Healthy. A live grant, a passing check, a connection that needs nothing.
- `--status-warning` (`bg-status-warning · text-status-warning`) — Recoverable and needs attention. Expiring soon and expired both live here — a refresh away, not a failure.
- `--status-danger` (`bg-status-danger · text-status-danger`) — A failure the user must act on: a revoked grant, a rejected scope.
- `--status-neutral` (`bg-status-neutral · text-status-neutral`) — Absence. Never connected, nothing to report — not an error.
- `-foreground` (`text-status-*-foreground`) — Ink for text sitting on the solid fill. Every pair clears 4.5:1 in both appearances.
- `-surface` (`bg-status-*-surface`) — Soft background for rows and callouts. Always carries text-status-* ink, never the -foreground ink.

## Exports

- `statusCssVars` (`Record<StatusCssVar, string>`) — The twelve tokens as typed var() strings — success, successForeground, successSurface, and the same three for warning, danger, and neutral. For the places a class cannot reach: an inline style, a chart series color, a canvas fill. Each value carries the same fallback chain the utilities use, so an unthemed project degrades instead of rendering invisible.
- `StatusCssVar` (`type`) — The twelve token names, for a Record keyed by token or a prop that takes one.

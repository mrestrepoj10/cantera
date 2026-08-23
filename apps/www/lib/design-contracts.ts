/**
 * The canonical design-contract text. This is the single source: the llms.txt
 * artifacts (`scripts/build-llms.mts`) and the agent skill
 * (`scripts/build-skill.mts`) both render from it, and AGENTS.md carries a
 * one-line summary of each contract pointing here. Edit this file, then run
 * `pnpm registry:build` — the generated outputs are committed and
 * `registry:verify` fails on drift.
 *
 * Bodies are single-flow paragraphs (no manual wrapping) so every surface
 * renders the same text; formatting belongs to the generator.
 */

export interface DesignContract {
  title: string
  body: string
}

export function designContracts(
  namespace: string,
): Record<
  'statusVocabulary' | 'asyncPending' | 'fieldDensity' | 'installedSpecifiers' | 'iconSizing',
  DesignContract
> {
  return {
    statusVocabulary: {
      title: 'Status vocabulary',
      body: `Every status renders from the \`${namespace}/status-tokens\` variables: \`--status-success\`, \`--status-warning\`, \`--status-danger\`, \`--status-neutral\`, each with a \`-foreground\` companion (ink on the solid fill) and a \`-surface\` companion (soft background, which always carries \`text-status-*\` ink, never the \`-foreground\` ink). One color, one meaning: success is healthy, warning is recoverable and needs attention, danger is a failure the user must act on, neutral is absence. Recoverable states — expired, expiring soon — are warning, not danger: a refresh away, not a failure. Never substitute a generic badge variant for a status: \`secondary\` reads as gray nothing, and \`destructive\` collapses "expired" and "broken" into one color. Status uses solid fills, not low-alpha tints. \`statusCssVars\` (from \`lib/status-tokens.ts\`) gives the same twelve tokens as typed \`var()\` strings for inline styles, chart series, and canvas fills — never hand-type a variable name.`,
    },
    asyncPending: {
      title: 'Async pending',
      body: `Every component with an async callback exposes a pending state, and pending means disabled-with-spinner-while-keeping-the-label — never a label swapped for "Loading…", never a collapsed control. A pressed control is never unmounted and never changes element type mid-action. Pending is both a prop the consumer drives (\`loading\`, \`disconnectPending\`, \`reconnectPending\`, \`loadingProvider\` — for server actions, where no promise comes back) and an internal state: a callback that returns a promise drives it automatically. Disabled controls render \`aria-disabled\`, not the native attribute, so they stay focusable and a screen reader user can still find them.`,
    },
    fieldDensity: {
      title: 'Field density and a11y',
      body: `This UI is used with gloves, on a tablet, on site. Primary actions carry a 44px minimum touch target; comfortable density is the default and compact is opt-in. 12px is the text floor — there is no \`text-[10px]\` anywhere in the registry. Focus indicators are 3:1 against their surroundings (\`focus-visible:border-ring\` plus a full-alpha ring). Every block ships a real heading, every description is wired with \`aria-describedby\`, and \`Intl\` formatting is locale-neutral (\`Intl.RelativeTimeFormat(undefined, ...)\`, with an optional \`locale\` prop).`,
    },
    installedSpecifiers: {
      title: 'Installed specifiers',
      body: `Distributed files import what the install produces: \`@/components/ui/connection-card\`, \`@/lib/oauth-types\`. Never \`@/registry/...\` — that path exists only in the cantera repo and installs broken.`,
    },
    iconSizing: {
      title: 'Icon sizing',
      body: `Preset provider marks carry their own \`className="size-4"\`, so one renders correctly wherever it is dropped. A \`[&_svg]:size-*\` wrapper still wins on specificity where a surface wants another size — use the wrapper, not a rewritten mark, and keep \`aria-hidden\` on decorative marks.`,
    },
  }
}

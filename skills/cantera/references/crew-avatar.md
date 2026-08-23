# Crew Avatar (`@cantera/crew-avatar`)

Deterministic construction-crew SVG avatars — hard hats, hi-vis vests, safety glasses, ear defenders — generated from a name with zero dependencies, boring-avatars style.

- Type: component
- Install: `npx shadcn@latest add @cantera/crew-avatar`
- Docs: https://canteraui.xyz/components/crew-avatar
- Registry item: https://canteraui.xyz/r/crew-avatar.json

Files written into the consumer project:

- `lib/crew-avatar.ts`
- `crew-avatar.tsx`

## Install notes

The same name always renders the same worker — a salted FNV-1a hash drives every trait, so avatars are SSR-safe and hydration-identical with no randomness at render time. The disc is self-contained: every backdrop clears 3:1 against both white and near-black surfaces, so it needs no theme awareness. Pass title for a meaningful image (role=img); omit it next to a visible name and the mark stays decorative (aria-hidden). crewAvatarSvg(name) returns standalone markup for non-React surfaces; colors overrides the backdrop palette.

## Props

- `name` (`string`) — The seed. Casing and surrounding whitespace are normalized, so the same person always gets the same worker.
- `size` (`number`, default `32`) — Rendered square in pixels. Shapes are tuned to stay legible down to 24px.
- `colors` (`string[]`) — Backdrop palette override. The defaults clear 3:1 against both white and near-black surfaces; overrides own that contrast responsibility.
- `title` (`string`) — Accessible name — renders role="img" with a <title>. Omit next to a visible name and the mark stays decorative (aria-hidden).

## Library exports

- `crewAvatarSvg` (`(name, { size?, colors?, title? }) => string`) — Standalone <svg> markup for non-React surfaces — emails, canvases, OG images.
- `crewAvatarSpec / crewAvatarShapes` (`functions`) — The resolved trait spec (headwear, vest, eyewear, palette) and the renderer-neutral shape tree both renderers share, for custom rendering.

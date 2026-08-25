# Crew Avatar (`@cantera/crew-avatar`)

Deterministic construction-crew SVG avatars — monochrome disc, geometric figure, one accent for the trade on the hard hat — generated from a name with zero dependencies, boring-avatars style.

- Type: component
- Install: `npx shadcn@latest add @cantera/crew-avatar`
- Docs: https://canteraui.xyz/components/crew-avatar
- Registry item: https://canteraui.xyz/r/crew-avatar.json

Files written into the consumer project:

- `lib/crew-avatar-spec.ts`
- `crew-avatar.tsx`

## Install notes

The same name always renders the same worker — a salted FNV-1a hash drives every trait, so avatars are SSR-safe and hydration-identical with no randomness at render time. The mark is monochrome by construction: a near-black or near-white canvas, the figure drawn in whichever end the canvas is not, and exactly one chroma — the hard hat, whose color codes the trade and is repeated as text on spec.role, so nothing depends on reading the color alone. The disc needs no theme awareness: it carries a hairline ring one step off its own canvas, so a light disc keeps its edge on a light page. Pass title for a meaningful image (role=img); omit it next to a visible name and the mark stays decorative (aria-hidden). crewAvatarSvg(name) returns standalone markup for non-React surfaces; colors overrides the canvas palette. Not a photo component: when a person has a real picture, compose shadcn's Avatar/AvatarImage/AvatarFallback instead — crew-avatar is for the names that don't.

## Props

- `name` (`string`) — The seed. Casing and surrounding whitespace are normalized, so the same person always gets the same worker.
- `size` (`number`, default `32`) — Rendered square in pixels. Shapes are tuned to stay legible down to 24px.
- `colors` (`string[]`) — Canvas palette override. The defaults are the two ends of the neutral scale, never the middle; the figure is drawn in whichever end the canvas is not, so an override of mid-tones owns its own contrast.
- `title` (`string`) — Accessible name — renders role="img" with a <title>. Omit next to a visible name and the mark stays decorative (aria-hidden).

## Library exports

- `crewAvatarSvg` (`(name, { size?, colors?, title? }) => string`) — Standalone <svg> markup for non-React surfaces — emails, canvases, OG images.
- `crewAvatarSpec / crewAvatarShapes` (`functions`) — The resolved trait spec — headwear, vest, eyewear, tones, and role, the trade the hat color codes for — plus the renderer-neutral shape tree both renderers share, for custom rendering.

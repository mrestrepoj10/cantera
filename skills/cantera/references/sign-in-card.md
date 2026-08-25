# Sign-In Card (`@cantera/sign-in-card`)

A multi-provider sign-in chooser card. Server-renderable via an href template, or client-driven via a callback.

- Type: component
- Install: `npx shadcn@latest add @cantera/sign-in-card`
- Docs: https://canteraui.vercel.app/components/sign-in-card
- Registry item: https://canteraui.vercel.app/r/sign-in-card.json
- Registry dependencies: card, @cantera/provider-sign-in-button, @cantera/oauth-types
- Working example page: `npx shadcn@latest add @cantera/sign-in-card-demo` — installs app/examples/sign-in-card/page.tsx

Files written into the consumer project:

- `sign-in-card.tsx`

## Props

- `providers` (`OAuthProvider[]`) — Providers to offer, rendered as one ProviderSignInLink (with hrefTemplate) or ProviderSignInButton each.
- `hrefTemplate` (`string`) — Href for a provider auth route; "{provider}" is replaced with the provider id, e.g. "/api/auth/{provider}". Serializable, so the card can be rendered from a server component.
- `onSignIn` (`(providerId: string) => void | Promise<void>`) — Click handler alternative to hrefTemplate, for client-side flows. A returned promise drives the pending state for that provider.
- `loadingProvider` (`string`) — Id of the provider currently authenticating, to show its spinner. While one provider is pending its siblings lock — one OAuth flow at a time, since a second redirect would race the first.
- `title` (`ReactNode`, default `'Sign in'`) — Card title.
- `titleAs` (`'h1' | … | 'h6' | 'div'`, default `'h2'`) — Heading element for the title — a card dropped onto a page needs a real heading. Pick the level that fits the page outline, or pass "div" when the surrounding page already provides one.
- `description` (`ReactNode`) — Optional text under the title.
- `footer` (`ReactNode`) — Optional muted footer content.
- `...props` (`ComponentProps<typeof Card>`) — Remaining props are spread onto the underlying Card.

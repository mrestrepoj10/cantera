# Provider Sign-In Button (`@cantera/provider-sign-in-button`)

A sign-in button for a single OAuth provider: brand icon, label, loading state. Works as a link or a click handler.

- Type: component
- Install: `npx shadcn@latest add @cantera/provider-sign-in-button`
- Docs: https://canteraui.xyz/components/provider-sign-in-button
- Registry item: https://canteraui.xyz/r/provider-sign-in-button.json
- Registry dependencies: button, @cantera/oauth-types
- npm dependencies: lucide-react
- Working example page: `npx shadcn@latest add @cantera/provider-sign-in-button-demo` — installs app/examples/provider-sign-in-button/page.tsx

Files written into the consumer project:

- `provider-sign-in-button.tsx`

## Props

- `provider` (`OAuthProvider`) — The provider to render: id, name, and an optional brand icon.
- `href` (`string`) — Navigate to an auth route instead of handling a click; renders an anchor, and stays an anchor while pending. Mutually exclusive with onSignIn — passing both is a type error.
- `onSignIn` (`() => void | Promise<void>`) — Called with no arguments on click; renders a button. A returned promise drives the pending state for you. Mutually exclusive with href.
- `loading` (`boolean`, default `false`) — Pending: the label stays, the icon crossfades to a spinner over 150ms, and activation is blocked via aria-disabled so focus is never dropped.
- `disabled` (`boolean`, default `false`) — Rendered as aria-disabled, never the native attribute, so the control keeps focus and a screen reader user can still find it.
- `variant` (`'default' | 'outline' | 'secondary' | 'ghost'`, default `'outline'`) — Button variant, forwarded to the shadcn button styles.
- `size` (`'default' | 'sm' | 'lg'`, default `'lg'`) — Button size. Everything but sm carries the 44px minimum touch target; sm is the opt-in compact escape hatch.
- `children` (`ReactNode`, default `'Continue with {provider.name}'`) — Custom label replacing the default text.
- `...props` (`ComponentProps<'a'> | ComponentProps<'button'>`) — Remaining props go to whichever element renders — anchor props with href, button props without — and are typed for it.

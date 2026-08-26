# ACC Sign-In (`@cantera/acc-sign-in`)

A ready-made /sign-in page on acc-auth-routes: the scoped sign-in when signed out, and a live connection panel — account, token expiry, held scopes — once connected.

- Type: block
- Install: `npx shadcn@latest add @cantera/acc-sign-in`
- Docs: https://canteraui.vercel.app/components/acc-sign-in
- Registry item: https://canteraui.vercel.app/r/acc-sign-in.json
- Registry dependencies: @cantera/acc-auth-routes, @cantera/connection-card, @cantera/aps-oauth-preset, @cantera/oauth-types
- npm dependencies: aec-auth, lucide-react

Files written into the consumer project:

- `app/sign-in/page.tsx`
- `app/sign-in/loading.tsx`
- `components/acc-connection-panel.tsx`

## Install notes

Installed: app/sign-in/page.tsx with its loading skeleton and AccConnectionPanel. The acc-auth-routes dependency supplies the /api/auth/* handlers, lib/acc-auth.ts, and the scoped sign-in component, plus the environment keys.

Signed out, the page renders ScopedAutodeskSignIn and forwards the selection to the consent redirect; /sign-in?next=/your-page returns there after the callback, and an already-signed-in visitor with a next is redirected on arrival. Signed in with no next, the page shows the connection panel.

ACC_AUTH_DEMO=1 is the escape hatch that allows the insecure fallback session secret in production. It exists for emulator-backed showcases only — never set it anywhere real accounts exist.

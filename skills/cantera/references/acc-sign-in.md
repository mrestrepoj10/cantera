# ACC Sign-In (`@cantera/acc-sign-in`)

A ready-made /sign-in page on acc-auth-routes: the scoped sign-in when signed out, and a live connection panel — account, token expiry, held scopes — once connected.

- Type: block
- Install: `npx shadcn@latest add @cantera/acc-sign-in`
- Docs: https://canteraui.vercel.app/components/acc-sign-in
- Registry item: https://canteraui.vercel.app/r/acc-sign-in.json
- Registry dependencies: @cantera/acc-auth-routes, @cantera/acc-connection-panel, @cantera/aps-oauth-preset, @cantera/oauth-types
- npm dependencies: aec-auth, lucide-react

Files written into the consumer project:

- `app/sign-in/page.tsx`
- `app/sign-in/loading.tsx`

## Install notes

Installed at /sign-in: the page and its loading skeleton. Signed out, it renders ScopedAutodeskSignIn; /sign-in?next=/your-page returns there after the callback. Signed in, it shows AccConnectionPanel.

Next:
1. Fill the keys acc-auth-routes added to .env.local (see its notes above).
2. Run next dev and open /sign-in.

Never set ACC_AUTH_DEMO=1 where real accounts exist.
Reference: https://canteraui.vercel.app/components/acc-sign-in

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

## Notes

Installs a /sign-in page and its loading skeleton on the acc-auth-routes kit, so fill the keys that kit adds to .env.local first. Signed out, the page renders ScopedAutodeskSignIn, and /sign-in?next=/your-page returns there after the callback; signed in, it shows AccConnectionPanel. Never set ACC_AUTH_DEMO=1 where real accounts exist.

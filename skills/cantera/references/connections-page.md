# Connections Page (`@cantera/connections-page`)

The page that manages every provider grant: one card per connection, with connect, reconnect, and disconnect — plus the designed empty, loading, and error states a real fetch needs.

- Type: template
- Install: `npx shadcn@latest add @cantera/connections-page`
- Docs: https://canteraui.vercel.app/components/connections-page
- Registry item: https://canteraui.vercel.app/r/connections-page.json
- Registry dependencies: @cantera/connections-view, @cantera/acc-auth-routes, @cantera/aps-oauth-preset, @cantera/oauth-types
- npm dependencies: aec-auth, lucide-react

Files written into the consumer project:

- `app/connections/page.tsx`
- `app/connections/loading.tsx`
- `components/connections-manager.tsx`

Environment variables added to `.env.local`:

- `APS_CLIENT_ID`
- `APS_CLIENT_SECRET`
- `SESSION_SECRET`
- `APP_ORIGIN`
- `APS_AUTH_BASE_URL`

## Install notes

Installed at /connections: the page, its loading skeleton, and ConnectionsManager, the wiring over @cantera/connections-view. acc-auth-routes supplies the /api/auth/* routes; no /sign-in page is installed.

Next:
1. Fill the keys acc-auth-routes added to .env.local (see its notes above).
2. Run next dev and open /connections.

List a provider only after lib/acc-auth.ts knows it: an unwired Connect fails at the route on purpose.
Reference: https://canteraui.vercel.app/components/connections-page

## AccConnections props

- `providers` (`OAuthProvider[]`, default `[apsProvider]`) — Providers to list. Autodesk is the wired one; an extra entry renders as "not connected" and its Connect button hits /api/auth/<id>, which 404s until lib/acc-auth.ts knows that provider.
- `nextPath` (`string`, default `'/connections'`) — Where the consent flow returns to.
- `headingLevel` (`'h1' | 'h2' | 'h3'`, default `'h1'`) — Heading level for the block title, forwarded to ConnectionsView.

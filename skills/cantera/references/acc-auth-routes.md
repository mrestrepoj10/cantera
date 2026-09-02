# ACC Auth Routes (`@cantera/acc-auth-routes`)

The headless half of Autodesk sign-in on aec-auth: consent start, code exchange, and sign-out route handlers, the signed session library, and the scoped sign-in component — no pages.

- Type: kit
- Install: `npx shadcn@latest add @cantera/acc-auth-routes`
- Docs: https://canteraui.vercel.app/components/acc-auth-routes
- Registry item: https://canteraui.vercel.app/r/acc-auth-routes.json
- Registry dependencies: card, @cantera/provider-sign-in-button, @cantera/scope-picker, @cantera/aps-oauth-preset, @cantera/oauth-types
- npm dependencies: aec-auth

Files written into the consumer project:

- `lib/acc-auth.ts`
- `components/scoped-autodesk-sign-in.tsx`
- `app/api/auth/[provider]/route.ts`
- `app/api/auth/callback/[provider]/route.ts`
- `app/api/auth/signout/route.ts`

Environment variables added to `.env.local`:

- `APS_CLIENT_ID`
- `APS_CLIENT_SECRET`
- `SESSION_SECRET`
- `APP_ORIGIN`
- `APS_AUTH_BASE_URL`

## Install notes

Installed: the /api/auth/* route handlers, lib/acc-auth.ts (aec-auth vault wiring and the signed session cookie), and ScopedAutodeskSignIn. No page: pair with @cantera/acc-sign-in, or mount the component with a nextPath.

Next:
1. Fill .env.local: APS_CLIENT_ID and APS_CLIENT_SECRET from aps.autodesk.com; SESSION_SECRET from `openssl rand -base64 32` (required in production); APP_ORIGIN, your canonical public origin (required in production); APS_AUTH_BASE_URL only for an emulator.
2. The default vault store is in-memory. Swap in a durable VaultStore before real users connect.
Reference: https://canteraui.vercel.app/components/acc-auth-routes

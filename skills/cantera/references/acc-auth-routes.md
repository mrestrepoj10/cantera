# ACC Auth Routes (`@cantera/acc-auth-routes`)

The headless half of Autodesk sign-in on aec-auth: consent start, code exchange, and sign-out route handlers, the signed session library, and the scoped sign-in component — no pages.

- Type: block
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
- `APS_AUTH_BASE_URL`

## Install notes

Installed: the /api/auth/* route handlers, lib/acc-auth.ts (aec-auth vault wiring and the signed session cookie), and ScopedAutodeskSignIn — render it anywhere with a nextPath and the callback returns there. No pages: pair with @cantera/acc-sign-in for a ready-made /sign-in, or mount the component in your own page the way model-viewer-page does.

Environment (added to .env.local as empty keys — fill them in):
- APS_CLIENT_ID / APS_CLIENT_SECRET — your APS app credentials.
- SESSION_SECRET — HMAC key for the session cookie. Generate one with `openssl rand -base64 32`. In production the routes fail closed without it.
- APS_AUTH_BASE_URL — optional auth-origin override, absolute or relative ("/emulate/aps") for an embedded emulator. Leave it unset to talk to real APS.

The default vault store is in-memory: correct for a demo, wrong for production. Swap in a durable VaultStore (see the aec-auth README) before you ship.

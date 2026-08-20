# ACC Sign-In (`@cantera/acc-sign-in`)

Complete Autodesk (APS / ACC) sign-in flow on aec-auth: consent redirect, code exchange, vault-managed refresh, signed session, and a live connection panel.

- Type: block
- Install: `npx shadcn@latest add @cantera/acc-sign-in`
- Docs: https://canteraui.xyz/components/acc-sign-in
- Registry item: https://canteraui.xyz/r/acc-sign-in.json
- Registry dependencies: @cantera/sign-in-card, @cantera/connection-card, @cantera/aps-oauth-preset, @cantera/oauth-types
- npm dependencies: aec-auth

Files written into the consumer project:

- `app/sign-in/page.tsx`
- `components/acc-connection-panel.tsx`
- `lib/acc-auth.ts`
- `app/api/auth/[provider]/route.ts`
- `app/api/auth/callback/[provider]/route.ts`
- `app/api/auth/signout/route.ts`

Environment variables added to `.env.local`:

- `APS_CLIENT_ID`
- `APS_CLIENT_SECRET`
- `SESSION_SECRET`
- `APS_AUTH_BASE_URL`

## Install notes

Installed: app/sign-in/page.tsx, the /api/auth/* route handlers, and lib/acc-auth.ts (aec-auth vault wiring).

Environment (added to .env.local as empty keys — fill them in):
- APS_CLIENT_ID / APS_CLIENT_SECRET — your APS app credentials.
- SESSION_SECRET — HMAC key for the session cookie. Generate one with `openssl rand -base64 32`. In production the block fails closed without it: a shared default key would let anyone mint a session for any user.
- APS_AUTH_BASE_URL — optional auth-origin override, absolute or relative ("/emulate/aps") for an embedded emulator. Leave it unset to talk to real APS.

ACC_AUTH_DEMO=1 is the escape hatch that allows the insecure fallback session secret in production. It exists for emulator-backed showcases only — never set it anywhere real accounts exist.

The default vault store is in-memory: correct for a demo, wrong for production. Swap in a durable VaultStore (see the aec-auth README) before you ship.

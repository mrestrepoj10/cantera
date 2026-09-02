# ACC Sign-In

A ready-made /sign-in page on acc-auth-routes: the scoped sign-in when signed out, and a live connection panel — account, token expiry, held scopes — once connected.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fmrestrepoj10%2Fcantera%2Ftree%2Fmain%2Ftemplates%2Facc-sign-in&project-name=cantera-acc-sign-in&repository-name=cantera-acc-sign-in&env=APS_CLIENT_ID%2CAPS_CLIENT_SECRET%2CSESSION_SECRET&envDescription=APS+app+credentials+and+a+session+secret.+The+README+explains+each+key.&envLink=https%3A%2F%2Fcanteraui.vercel.app%2Fcomponents%2Facc-sign-in)

The deploy prompts for the keys marked required below. Register
`<your-deployment-url>/api/auth/callback/aps` as a callback URL on your APS app if the
template signs users in. Everything else has a default.

## Run locally

```sh
pnpm install
cp .env.example .env.local
pnpm dev
```

Then open /sign-in. The home route redirects there.

## Environment

| Key | Required | Meaning |
| --- | --- | --- |
| `APS_CLIENT_ID` | yes | Client ID of your APS app (aps.autodesk.com). |
| `APS_CLIENT_SECRET` | yes | Client secret of the same APS app. |
| `SESSION_SECRET` | yes | HMAC key for the session cookie. Generate one with `openssl rand -base64 32`. |
| `APP_ORIGIN` | no | Canonical public origin, such as https://app.example.com. On Vercel it defaults to the production URL. |
| `APS_AUTH_BASE_URL` | no | Optional APS origin override, absolute or relative (/emulate/aps) for an embedded emulator. Leave unset for real APS. |

## What is inside

Routes and handlers:

- `app/api/auth/[provider]/route.ts`
- `app/api/auth/callback/[provider]/route.ts`
- `app/api/auth/signout/route.ts`
- `app/sign-in/loading.tsx`
- `app/sign-in/page.tsx`

Components and libraries:

- `components/acc-connection-panel.tsx`
- `components/scoped-autodesk-sign-in.tsx`
- `components/ui/avatar.tsx`
- `components/ui/badge.tsx`
- `components/ui/button.tsx`
- `components/ui/card.tsx`
- `components/ui/checkbox.tsx`
- `components/ui/connection-card.tsx`
- `components/ui/input.tsx`
- `components/ui/label.tsx`
- `components/ui/provider-sign-in-button.tsx`
- `components/ui/scope-picker.tsx`
- `components/ui/token-status.tsx`
- `components/ui/user-account-badge.tsx`
- `lib/acc-auth.ts`
- `lib/aps-oauth-preset.tsx`
- `lib/oauth-types.ts`
- `lib/status-tokens.ts`
- `lib/utils.ts`

## Keep it current

This directory is generated from the cantera registry by `pnpm registry:build`; edit the
registry sources, not these files. The same code installs into an existing app with
`npx shadcn@latest add @cantera/acc-sign-in`. Reference: https://canteraui.vercel.app/components/acc-sign-in

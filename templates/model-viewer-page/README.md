# Model Viewer Page

A complete APS project-tree and Autodesk Viewer page: scoped Autodesk sign-in, lazy 3-legged Data Management browsing, recursive project and folder search, a full-bleed native viewer, account controls, and untranslated-model states.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fmrestrepoj10%2Fcantera%2Ftree%2Fmain%2Ftemplates%2Fmodel-viewer-page&project-name=cantera-model-viewer-page&repository-name=cantera-model-viewer-page&env=APS_CLIENT_ID%2CAPS_CLIENT_SECRET%2CSESSION_SECRET&envDescription=APS+app+credentials+and+a+session+secret.+The+README+explains+each+key.&envLink=https%3A%2F%2Fcanteraui.vercel.app%2Fcomponents%2Fmodel-viewer-page)

The deploy prompts for the keys marked required below. Register
`<your-deployment-url>/api/auth/callback/aps` as a callback URL on your APS app if the
template signs users in. Everything else has a default. On a serverless host, add the Upstash
Redis integration and set `VAULT_KEY` so sign-in grants outlive one instance; until then they
live in memory.

## Run locally

```sh
pnpm install
cp .env.example .env.local
pnpm dev
```

Then open /models. The home route redirects there.

## Environment

| Key | Required | Meaning |
| --- | --- | --- |
| `APS_CLIENT_ID` | yes | Client ID of your APS app (aps.autodesk.com). |
| `APS_CLIENT_SECRET` | yes | Client secret of the same APS app. |
| `SESSION_SECRET` | yes | HMAC key for the session cookie. Generate one with `openssl rand -base64 32`. |
| `APP_ORIGIN` | no | Canonical public origin, such as https://app.example.com. On Vercel it defaults to the production URL. |
| `APS_AUTH_BASE_URL` | no | Optional APS origin override, absolute or relative (/emulate/aps) for an embedded emulator. Leave unset for real APS. |
| `UPSTASH_REDIS_REST_URL` | no | Upstash Redis REST URL. With the token and VAULT_KEY set, grants persist across serverless instances instead of living in memory. |
| `UPSTASH_REDIS_REST_TOKEN` | no | Upstash Redis REST token, paired with the URL above. |
| `VAULT_KEY` | no | AES-256 key that encrypts grants at rest in Upstash. Generate one with `openssl rand -base64 32`. |

## What is inside

Routes and handlers:

- `app/api/auth/[provider]/route.ts`
- `app/api/auth/callback/[provider]/route.ts`
- `app/api/auth/signout/route.ts`
- `app/api/models/tree/route.ts`
- `app/api/viewer-token/route.ts`
- `app/models/loading.tsx`
- `app/models/page.tsx`

Components and libraries:

- `components/model-browser.tsx`
- `components/model-finder.ts`
- `components/scoped-autodesk-sign-in.tsx`
- `components/ui/aps-viewer/aps-viewer.tsx`
- `components/ui/aps-viewer/context.ts`
- `components/ui/aps-viewer/hooks.ts`
- `components/ui/aps-viewer/index.ts`
- `components/ui/aps-viewer/loader.ts`
- `components/ui/aps-viewer/settings.tsx`
- `components/ui/aps-viewer/store.ts`
- `components/ui/aps-viewer/toolbar.ts`
- `components/ui/avatar.tsx`
- `components/ui/badge.tsx`
- `components/ui/button.tsx`
- `components/ui/card.tsx`
- `components/ui/checkbox.tsx`
- `components/ui/command.tsx`
- `components/ui/dialog.tsx`
- `components/ui/dropdown-menu.tsx`
- `components/ui/finder.tsx`
- `components/ui/hub-sidebar.tsx`
- `components/ui/hub-tree.tsx`
- `components/ui/input-group.tsx`
- `components/ui/input.tsx`
- `components/ui/label.tsx`
- `components/ui/model-status-card.tsx`
- `components/ui/provider-sign-in-button.tsx`
- `components/ui/scope-picker.tsx`
- `components/ui/separator.tsx`
- `components/ui/sheet.tsx`
- `components/ui/sidebar.tsx`
- `components/ui/skeleton.tsx`
- `components/ui/textarea.tsx`
- `components/ui/token-status.tsx`
- `components/ui/tooltip.tsx`
- `components/ui/user-account-badge.tsx`
- `hooks/use-mobile.ts`
- `lib/acc-auth.ts`
- `lib/aps-data-preset.ts`
- `lib/aps-oauth-preset.tsx`
- `lib/forge-viewer.d.ts`
- `lib/oauth-types.ts`
- `lib/project-types.ts`
- `lib/status-tokens.ts`
- `lib/upload-types.ts`
- `lib/utils.ts`
- `lib/viewer-extension-types.ts`
- `lib/viewer-types.ts`

## Keep it current

This directory is generated from the cantera registry by `pnpm registry:build`; edit the
registry sources, not these files. The same code installs into an existing app with
`npx shadcn@latest add @cantera/model-viewer-page`. Reference: https://canteraui.vercel.app/components/model-viewer-page

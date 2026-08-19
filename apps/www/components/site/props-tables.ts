/**
 * Hand-authored API tables for the docs pages, kept in sync with the actual
 * prop interfaces in registry/ui and the exports in registry/lib.
 */

export interface ApiRow {
  name: string
  type: string
  defaultValue?: string
  description: string
}

export interface ApiTable {
  /** Table caption: "Props" for components, "Exports" for lib items. */
  caption: 'Props' | 'Exports'
  rows: ApiRow[]
}

export const apiTables: Record<string, ApiTable> = {
  'provider-sign-in-button': {
    caption: 'Props',
    rows: [
      {
        name: 'provider',
        type: 'OAuthProvider',
        description: 'The provider to render: id, name, and an optional brand icon.',
      },
      {
        name: 'href',
        type: 'string',
        description:
          'Navigate to an auth route instead of handling a click. Renders an anchor and takes precedence over onSignIn.',
      },
      {
        name: 'onSignIn',
        type: '() => void | Promise<void>',
        description:
          'Called with no arguments when the button is clicked. Ignored when href is set.',
      },
      {
        name: 'loading',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Swaps the icon for a spinner and disables the button.',
      },
      {
        name: 'variant',
        type: "'default' | 'outline' | 'secondary'",
        defaultValue: "'outline'",
        description: 'Button variant, forwarded to the shadcn button styles.',
      },
      {
        name: 'size',
        type: "'default' | 'sm' | 'lg'",
        defaultValue: "'lg'",
        description: 'Button size.',
      },
      {
        name: 'children',
        type: 'ReactNode',
        defaultValue: "'Continue with {provider.name}'",
        description: 'Custom label replacing the default text.',
      },
      {
        name: '...props',
        type: "ComponentProps<'button'>",
        description: 'Remaining props are spread onto the underlying button element.',
      },
    ],
  },
  'sign-in-card': {
    caption: 'Props',
    rows: [
      {
        name: 'providers',
        type: 'OAuthProvider[]',
        description: 'Providers to offer, rendered as one ProviderSignInButton each.',
      },
      {
        name: 'hrefTemplate',
        type: 'string',
        description:
          'Href for a provider auth route; "{provider}" is replaced with the provider id, e.g. "/api/auth/{provider}". Serializable, so the card can be rendered from a server component.',
      },
      {
        name: 'onSignIn',
        type: '(providerId: string) => void | Promise<void>',
        description: 'Click handler alternative to hrefTemplate, for client-side flows.',
      },
      {
        name: 'loadingProvider',
        type: 'string',
        description: 'Id of the provider currently authenticating, to show its spinner.',
      },
      {
        name: 'title',
        type: 'ReactNode',
        defaultValue: "'Sign in'",
        description: 'Card title.',
      },
      { name: 'description', type: 'ReactNode', description: 'Optional text under the title.' },
      { name: 'footer', type: 'ReactNode', description: 'Optional muted footer content.' },
      {
        name: '...props',
        type: 'ComponentProps<typeof Card>',
        description: 'Remaining props are spread onto the underlying Card.',
      },
    ],
  },
  'scope-picker': {
    caption: 'Props',
    rows: [
      {
        name: 'scopes',
        type: 'OAuthScope[]',
        description:
          'The scope catalog to render. Scopes marked required are always selected and cannot be deselected.',
      },
      {
        name: 'value',
        type: 'string[]',
        description: 'Selected scope ids. Controlled — pair with onChange.',
      },
      {
        name: 'onChange',
        type: '(value: string[]) => void',
        description: 'Called with the next selection, in catalog order, on every change.',
      },
      {
        name: 'presets',
        type: 'OAuthScopePreset[]',
        description: 'Named bundles shown as one-click preset badges above the list.',
      },
      {
        name: 'disabled',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Disables the presets and every checkbox.',
      },
      {
        name: '...props',
        type: "ComponentProps<'div'>",
        description: 'Remaining props are spread onto the wrapping div.',
      },
    ],
  },
  'user-account-badge': {
    caption: 'Props',
    rows: [
      {
        name: 'account',
        type: 'OAuthAccount',
        description:
          'The account to show. Falls back from name to email; the avatar falls back to initials.',
      },
      {
        name: 'provider',
        type: 'OAuthProvider',
        description: 'When set, the provider mark is shown at the end of the chip.',
      },
      {
        name: 'size',
        type: "'sm' | 'default'",
        defaultValue: "'default'",
        description: 'Compact or regular sizing.',
      },
      {
        name: '...props',
        type: "ComponentProps<'div'>",
        description: 'Remaining props are spread onto the wrapping div.',
      },
    ],
  },
  'token-status': {
    caption: 'Props',
    rows: [
      {
        name: 'connection',
        type: 'OAuthConnection',
        description: 'The grant to summarize: status badge, expiry, error text, scopes.',
      },
      {
        name: 'showExpiry',
        type: 'boolean',
        defaultValue: 'true',
        description:
          'Show a relative expiry time while connected; it turns destructive when expiring soon.',
      },
      {
        name: 'showScopes',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Render each held scope as an outline badge.',
      },
      {
        name: '...props',
        type: "ComponentProps<'div'>",
        description: 'Remaining props are spread onto the wrapping div.',
      },
    ],
  },
  'connection-card': {
    caption: 'Props',
    rows: [
      {
        name: 'connection',
        type: 'OAuthConnection',
        description: 'The provider grant to show: provider, account, status, scopes, expiry.',
      },
      {
        name: 'onDisconnect',
        type: '() => void | Promise<void>',
        description: 'When set, a Disconnect button is shown while the connection is connected.',
      },
      {
        name: 'onReconnect',
        type: '() => void | Promise<void>',
        description:
          'When set, a Connect / Reconnect button is shown while expired, errored, or disconnected.',
      },
      {
        name: 'showScopes',
        type: 'boolean',
        defaultValue: 'true',
        description: 'Forwarded to the embedded TokenStatus.',
      },
      {
        name: '...props',
        type: 'ComponentProps<typeof Card>',
        description: 'Remaining props are spread onto the underlying Card.',
      },
    ],
  },
  'oauth-types': {
    caption: 'Exports',
    rows: [
      {
        name: 'OAuthProvider',
        type: 'interface',
        description: 'A provider identity: id, name, optional icon and docsUrl.',
      },
      {
        name: 'OAuthScope',
        type: 'interface',
        description:
          'One grantable scope: id (the literal scope string), label, description, required.',
      },
      {
        name: 'OAuthScopePreset',
        type: 'interface',
        description: 'A named bundle of scope ids for a common task, e.g. "Viewer".',
      },
      {
        name: 'OAuthConnectionStatus',
        type: 'type',
        description: "'connected' | 'expired' | 'error' | 'disconnected'.",
      },
      {
        name: 'OAuthAccount',
        type: 'interface',
        description: 'The human behind a grant: name, email, avatarUrl — all optional.',
      },
      {
        name: 'OAuthConnection',
        type: 'interface',
        description:
          'A provider grant: provider, status, and optional account, scopes, expiresAt, error.',
      },
      {
        name: 'connectionExpiry',
        type: '(connection: OAuthConnection) => Date | null',
        description:
          'Normalizes expiresAt (Date, string, or number) into a Date, or null when absent.',
      },
      {
        name: 'isExpiringSoon',
        type: '(connection: OAuthConnection, withinMs?: number) => boolean',
        description: 'True when the connection expires within withinMs — five minutes by default.',
      },
      {
        name: 'accountInitials',
        type: '(account?: OAuthAccount) => string',
        description: 'Initials for avatar fallbacks: "Dana Alvarez" becomes "DA".',
      },
    ],
  },
  'aps-oauth-preset': {
    caption: 'Exports',
    rows: [
      {
        name: 'apsProvider',
        type: 'OAuthProvider',
        description: 'Autodesk provider metadata: id "aps", name, brand mark, OAuth docs link.',
      },
      {
        name: 'apsScopeCatalog',
        type: 'OAuthScope[]',
        description:
          'The APS scope catalog — data, viewables, buckets, account admin, OpenID — with human explanations.',
      },
      {
        name: 'apsScopePresets',
        type: 'OAuthScopePreset[]',
        description:
          "Common bundles mirrored from aec-auth's apsScopes recipes: viewer, data-read, data-write, account-admin.",
      },
      {
        name: 'ApsUserInfo',
        type: 'interface',
        description: 'The subset of the APS userinfo response the adapter reads.',
      },
      {
        name: 'fromApsUserInfo',
        type: '(userInfo: ApsUserInfo) => OAuthAccount',
        description: 'Adapter from an APS userinfo payload into a cantera OAuthAccount.',
      },
    ],
  },
}

export interface LibUsage {
  intro: string
  example: string
}

/** Code-oriented explanations for lib items, shown in place of a live preview. */
export const libUsage: Record<string, LibUsage> = {
  'oauth-types': {
    intro:
      'The lingua franca every cantera component speaks. Components take these shapes as props and never fetch data themselves — adapters translate provider payloads into them, so Autodesk, Procore, or your own provider all render with the same components.',
    example: `import type { OAuthConnection, OAuthProvider } from '@/lib/oauth-types'

const fieldlink: OAuthProvider = {
  id: 'fieldlink',
  name: 'FieldLink',
}

const connection: OAuthConnection = {
  provider: fieldlink,
  status: 'connected',
  account: { name: 'Dana Alvarez', email: 'dana@ridgelinebuilders.com' },
  scopes: ['rfis:read', 'submittals:read'],
  expiresAt: Date.now() + 55 * 60_000,
}`,
  },
  'aps-oauth-preset': {
    intro:
      'Everything Autodesk-specific in one data-only item: provider metadata, the APS scope catalog with human explanations, the scope bundles aec-auth uses, and an adapter from the APS userinfo payload. Drop it into any component that takes oauth types — no client, no fetching, no tokens.',
    example: `import { apsProvider, apsScopeCatalog, apsScopePresets } from '@/lib/aps-oauth-preset'
import { ScopePicker } from '@/components/ui/scope-picker'
import { SignInCard } from '@/components/ui/sign-in-card'

<SignInCard providers={[apsProvider]} hrefTemplate="/api/auth/{provider}" />

<ScopePicker
  scopes={apsScopeCatalog}
  presets={apsScopePresets}
  value={selected}
  onChange={setSelected}
/>`,
  },
}

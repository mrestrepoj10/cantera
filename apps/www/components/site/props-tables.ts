/**
 * Hand-authored API tables for the docs pages.
 *
 * Deliberately hand-written rather than generated: the props that matter most
 * here are the ones a type printer renders worst — `ProviderSignInButton` is a
 * discriminated union whose whole point is that `href` and `onSignIn` exclude
 * each other, and the pending/disabled props carry contracts (aria-disabled,
 * label preserved, control never unmounted) that live in the doc comment, not
 * in the type. Generating these would cost a docgen pipeline and lose exactly
 * the information the tables exist to convey. Keep them in sync by hand with
 * the interfaces in registry/ui and the exports in registry/lib.
 */

export interface ApiRow {
  name: string
  type: string
  defaultValue?: string
  description: string
}

export interface ApiTable {
  /** Section heading, e.g. "Props" or "Exports". */
  caption: string
  /** Header for the first column, e.g. "Prop", "Export", "Token". */
  nameHeader: string
  /** Header for the second column. */
  typeHeader?: string
  /** Whether to render a Default column. */
  showDefault?: boolean
  rows: ApiRow[]
}

export const apiTables: Record<string, ApiTable[]> = {
  'provider-sign-in-button': [
    {
      caption: 'Props',
      nameHeader: 'Prop',
      showDefault: true,
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
            'Navigate to an auth route instead of handling a click; renders an anchor, and stays an anchor while pending. Mutually exclusive with onSignIn — passing both is a type error.',
        },
        {
          name: 'onSignIn',
          type: '() => void | Promise<void>',
          description:
            'Called with no arguments on click; renders a button. A returned promise drives the pending state for you. Mutually exclusive with href.',
        },
        {
          name: 'loading',
          type: 'boolean',
          defaultValue: 'false',
          description:
            'Pending: the label stays, the icon crossfades to a spinner over 150ms, and activation is blocked via aria-disabled so focus is never dropped.',
        },
        {
          name: 'disabled',
          type: 'boolean',
          defaultValue: 'false',
          description:
            'Rendered as aria-disabled, never the native attribute, so the control keeps focus and a screen reader user can still find it.',
        },
        {
          name: 'variant',
          type: "'default' | 'outline' | 'secondary' | 'ghost'",
          defaultValue: "'outline'",
          description: 'Button variant, forwarded to the shadcn button styles.',
        },
        {
          name: 'size',
          type: "'default' | 'sm' | 'lg'",
          defaultValue: "'lg'",
          description:
            'Button size. Everything but sm carries the 44px minimum touch target; sm is the opt-in compact escape hatch.',
        },
        {
          name: 'children',
          type: 'ReactNode',
          defaultValue: "'Continue with {provider.name}'",
          description: 'Custom label replacing the default text.',
        },
        {
          name: '...props',
          type: "ComponentProps<'a'> | ComponentProps<'button'>",
          description:
            'Remaining props go to whichever element renders — anchor props with href, button props without — and are typed for it.',
        },
      ],
    },
  ],
  'sign-in-card': [
    {
      caption: 'Props',
      nameHeader: 'Prop',
      showDefault: true,
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
          description:
            'Click handler alternative to hrefTemplate, for client-side flows. A returned promise drives the pending state for that provider.',
        },
        {
          name: 'loadingProvider',
          type: 'string',
          description:
            'Id of the provider currently authenticating, to show its spinner. While one provider is pending its siblings lock — one OAuth flow at a time, since a second redirect would race the first.',
        },
        {
          name: 'title',
          type: 'ReactNode',
          defaultValue: "'Sign in'",
          description: 'Card title.',
        },
        {
          name: 'titleAs',
          type: "'h1' | … | 'h6' | 'div'",
          defaultValue: "'h2'",
          description:
            'Heading element for the title — a card dropped onto a page needs a real heading. Pick the level that fits the page outline, or pass "div" when the surrounding page already provides one.',
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
  ],
  'scope-picker': [
    {
      caption: 'Props',
      nameHeader: 'Prop',
      showDefault: true,
      rows: [
        {
          name: 'scopes',
          type: 'OAuthScope[]',
          description:
            'The scope catalog to render. Scopes marked required render checked and cannot be deselected — they stay focusable via aria-disabled and announce why.',
        },
        {
          name: 'value',
          type: 'string[]',
          description:
            'Selected scope ids. Controlled and taken literally: the picker never calls onChange on mount to backfill required scopes. Union them in where the value is used with withRequiredScopes.',
        },
        {
          name: 'onChange',
          type: '(value: string[]) => void',
          description:
            'Called with the next selection on every change — catalog order first, custom scopes trailing in insertion order.',
        },
        {
          name: 'presets',
          type: 'OAuthScopePreset[]',
          description:
            'Named bundles rendered as toggle buttons above the list, each showing its label and description, with aria-pressed reflecting whether the current selection matches the bundle.',
        },
        {
          name: 'allowCustomScopes',
          type: 'boolean',
          defaultValue: 'false',
          description:
            'Adds a field for scopes outside the catalog — granular resource scopes like data:read:<urn>, or anything the provider added since. Custom scopes render with a "custom" badge and round-trip through value / onChange like any other.',
        },
        {
          name: 'customScopeLabel',
          type: 'string',
          defaultValue: "'Add a scope'",
          description: 'Label for the custom-scope field.',
        },
        {
          name: 'disabled',
          type: 'boolean',
          defaultValue: 'false',
          description: 'Disables the presets, every checkbox, and the custom-scope field.',
        },
        {
          name: '...props',
          type: "ComponentProps<'div'>",
          description: 'Remaining props are spread onto the wrapping div.',
        },
      ],
    },
    {
      caption: 'Exports',
      nameHeader: 'Export',
      rows: [
        {
          name: 'withRequiredScopes',
          type: '(scopes: OAuthScope[], value: string[]) => string[]',
          description:
            'The required scopes of the catalog, unioned into a picker value, in catalog order with custom scopes appended. Call it at submit time, or when building the authorize URL, so required scopes are never silently dropped.',
        },
      ],
    },
  ],
  'user-account-badge': [
    {
      caption: 'Props',
      nameHeader: 'Prop',
      showDefault: true,
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
          description: 'Compact or regular sizing. Text never drops below 12px in either.',
        },
        {
          name: '...props',
          type: "ComponentProps<'div'>",
          description: 'Remaining props are spread onto the wrapping div.',
        },
      ],
    },
  ],
  'token-status': [
    {
      caption: 'Props',
      nameHeader: 'Prop',
      showDefault: true,
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
            'Show a relative expiry while connected. Expiry is recoverable, so it takes the warning tone — never danger — as the deadline approaches.',
        },
        {
          name: 'showScopes',
          type: 'boolean',
          defaultValue: 'false',
          description: 'Render each held scope as an outline badge.',
        },
        {
          name: 'locale',
          type: 'string | string[]',
          defaultValue: 'runtime locale',
          description:
            'BCP 47 locale(s) for the relative expiry. Left undefined, Intl resolves the runtime locale — nothing is hardcoded to English.',
        },
        {
          name: 'expiringSoonMs',
          type: 'number',
          defaultValue: '300000',
          description:
            'How far ahead counts as "expiring soon", in milliseconds. Five minutes by default.',
        },
        {
          name: '...props',
          type: "ComponentProps<'div'>",
          description: 'Remaining props are spread onto the wrapping div.',
        },
      ],
    },
    {
      caption: 'Exports',
      nameHeader: 'Export',
      rows: [
        {
          name: 'StatusTone',
          type: "'success' | 'warning' | 'danger' | 'neutral'",
          description:
            'The four semantic tones. One color, one meaning — reuse this type instead of inventing a parallel vocabulary.',
        },
        {
          name: 'statusToneClasses',
          type: 'Record<StatusTone, string>',
          description:
            'Solid fill plus its ink, e.g. "bg-status-success text-status-success-foreground". Solid, not a low-alpha tint, so it survives direct sunlight.',
        },
        {
          name: 'statusInkClasses',
          type: 'Record<StatusTone, string>',
          description:
            'The same tones as text color, for ink on the page or on a -surface companion.',
        },
      ],
    },
    {
      caption: 'Data attributes',
      nameHeader: 'Attribute',
      typeHeader: 'Values',
      rows: [
        {
          name: 'data-status',
          type: "'connected' | 'expired' | 'error' | 'disconnected'",
          description: 'The raw connection status, for styling or querying from the outside.',
        },
        {
          name: 'data-tone',
          type: "'success' | 'warning' | 'danger' | 'neutral'",
          description:
            'The tone actually rendered — connected but expiring soon resolves to warning, not success.',
        },
      ],
    },
  ],
  'connection-card': [
    {
      caption: 'Props',
      nameHeader: 'Prop',
      showDefault: true,
      rows: [
        {
          name: 'connection',
          type: 'OAuthConnection',
          description: 'The provider grant to show: provider, account, status, scopes, expiry.',
        },
        {
          name: 'onDisconnect',
          type: '() => void | Promise<void>',
          description:
            'When set, a Disconnect button is shown while the connection is connected. Disconnecting revokes a grant, so it renders destructive. A returned promise drives the pending state.',
        },
        {
          name: 'onReconnect',
          type: '() => void | Promise<void>',
          description:
            'When set, a Connect / Reconnect button is shown while expired, errored, or disconnected. A returned promise drives the pending state.',
        },
        {
          name: 'disconnectPending',
          type: 'boolean',
          defaultValue: 'false',
          description:
            'Consumer-driven pending for the disconnect action — for a server action, where no promise comes back. The button stays mounted, keeps its label, and shows a spinner.',
        },
        {
          name: 'reconnectPending',
          type: 'boolean',
          defaultValue: 'false',
          description: 'Consumer-driven pending for the connect / reconnect action.',
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
  ],
  'status-tokens': [
    {
      caption: 'Tokens',
      nameHeader: 'Token',
      typeHeader: 'Utilities',
      rows: [
        {
          name: '--status-success',
          type: 'bg-status-success · text-status-success',
          description: 'Healthy. A live grant, a passing check, a connection that needs nothing.',
        },
        {
          name: '--status-warning',
          type: 'bg-status-warning · text-status-warning',
          description:
            'Recoverable and needs attention. Expiring soon and expired both live here — a refresh away, not a failure.',
        },
        {
          name: '--status-danger',
          type: 'bg-status-danger · text-status-danger',
          description: 'A failure the user must act on: a revoked grant, a rejected scope.',
        },
        {
          name: '--status-neutral',
          type: 'bg-status-neutral · text-status-neutral',
          description: 'Absence. Never connected, nothing to report — not an error.',
        },
        {
          name: '-foreground',
          type: 'text-status-*-foreground',
          description:
            'Ink for text sitting on the solid fill. Every pair clears 4.5:1 in both appearances.',
        },
        {
          name: '-surface',
          type: 'bg-status-*-surface',
          description:
            'Soft background for rows and callouts. Always carries text-status-* ink, never the -foreground ink.',
        },
      ],
    },
  ],
  'oauth-types': [
    {
      caption: 'Exports',
      nameHeader: 'Export',
      rows: [
        {
          name: 'OAuthProvider',
          type: 'interface',
          description:
            'A provider identity: id, name, optional icon and docsUrl. Marks carry their own default size, so one renders correctly wherever it is dropped; a [&_svg]:size-* wrapper still wins.',
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
          description:
            'True when the connection expires within withinMs — five minutes by default.',
        },
        {
          name: 'accountInitials',
          type: '(account?: OAuthAccount) => string',
          description: 'Initials for avatar fallbacks: "Dana Alvarez" becomes "DA".',
        },
      ],
    },
  ],
  'aps-oauth-preset': [
    {
      caption: 'Exports',
      nameHeader: 'Export',
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
  ],
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
import { ScopePicker, withRequiredScopes } from '@/components/ui/scope-picker'
import { SignInCard } from '@/components/ui/sign-in-card'

<SignInCard providers={[apsProvider]} hrefTemplate="/api/auth/{provider}" />

<ScopePicker
  scopes={apsScopeCatalog}
  presets={apsScopePresets}
  value={selected}
  onChange={setSelected}
  allowCustomScopes
/>

// Required scopes are unioned in where the value is used, never on mount.
const scope = withRequiredScopes(apsScopeCatalog, selected).join(' ')`,
  },
}

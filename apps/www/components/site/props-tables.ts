// Hand-authored on purpose: the pending/disabled props carry contracts a type
// printer cannot render. Keep in sync with registry/ui interfaces and
// registry/lib exports.

export interface ApiRow {
  name: string
  type: string
  defaultValue?: string
  description: string
}

export interface ApiTable {
  caption: string
  nameHeader: string
  typeHeader?: string
  showDefault?: boolean
  rows: ApiRow[]
}

interface ApiTablesByItem {
  [item: string]: ApiTable[]
}

export const apiTables: ApiTablesByItem = {
  'provider-sign-in-button': [
    {
      caption: 'ProviderSignInButton props',
      nameHeader: 'Prop',
      showDefault: true,
      rows: [
        {
          name: 'provider',
          type: 'OAuthProvider',
          description: 'The provider to render: id, name, and an optional brand icon.',
        },
        {
          name: 'onSignIn',
          type: '() => void | Promise<void>',
          description:
            'Called with no arguments on click. A returned promise drives the pending state for you. For navigation to an auth route, use ProviderSignInLink instead.',
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
          type: "ComponentProps<'button'>",
          description: 'Remaining props go to the button element and are typed for it.',
        },
      ],
    },
    {
      caption: 'ProviderSignInLink props',
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
            'The provider auth route to navigate to. Always renders an anchor — loading included — so the browser semantics of a link are never lost.',
        },
        {
          name: 'loading',
          type: 'boolean',
          defaultValue: 'false',
          description:
            'Pending: the label stays, the icon crossfades to a spinner over 150ms, and navigation is blocked via aria-disabled so focus is never dropped.',
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
          type: "ComponentProps<'a'>",
          description: 'Remaining props go to the anchor element and are typed for it.',
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
          description:
            'Providers to offer, rendered as one ProviderSignInLink (with hrefTemplate) or ProviderSignInButton each.',
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
          name: 'presetsLabel',
          type: 'string',
          defaultValue: "'Presets'",
          description:
            'Legend for the preset group. Use a task-oriented label such as “Access level” when presets represent user-facing permission tiers.',
        },
        {
          name: 'collapsibleScopes',
          type: 'boolean',
          defaultValue: 'false',
          description:
            'Keeps presets prominent while placing the individual scope controls in a native disclosure. The summary reports the selected scope count.',
        },
        {
          name: 'scopeListLabel',
          type: 'string',
          defaultValue: "'Advanced permissions'",
          description: 'Summary label for the scope disclosure when collapsibleScopes is enabled.',
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
    {
      caption: 'Exports',
      nameHeader: 'Export',
      rows: [
        {
          name: 'statusCssVars',
          type: 'Record<StatusCssVar, string>',
          description:
            'The twelve tokens as typed var() strings — success, successForeground, successSurface, and the same three for warning, danger, and neutral. For the places a class cannot reach: an inline style, a chart series color, a canvas fill. Each value carries the same fallback chain the utilities use, so an unthemed project degrades instead of rendering invisible.',
        },
        {
          name: 'StatusCssVar',
          type: 'type',
          description:
            'The twelve token names, for a Record keyed by token or a prop that takes one.',
        },
      ],
    },
  ],
  'connections-page': [
    {
      caption: 'ConnectionsView props',
      nameHeader: 'Prop',
      showDefault: true,
      rows: [
        {
          name: 'providers',
          type: 'OAuthProvider[]',
          description:
            'Every provider this app can connect to, in display order. A provider with no grant renders as a "not connected" row, and a page where none of them has a grant renders the empty state.',
        },
        {
          name: 'connections',
          type: 'OAuthConnection[]',
          description:
            'The grants that exist, matched to providers by connection.provider.id. A grant for a provider outside the catalog is appended rather than dropped, so a removed provider never vanishes silently.',
        },
        {
          name: 'status',
          type: "'ready' | 'loading' | 'error'",
          defaultValue: "'ready'",
          description:
            'The fetch state. Loading and error replace the list while the heading stays put — the page never shifts under a resolve. A single provider that failed is not this state: that is a row with status "error", which keeps its healthy siblings visible.',
        },
        {
          name: 'error',
          type: 'string',
          description:
            'Page-level failure detail, shown with the retry when status is "error". Wired to the retry button with aria-describedby.',
        },
        {
          name: 'account',
          type: 'OAuthAccount',
          description:
            'Who these grants belong to. Rendered as a UserAccountBadge beside the heading when set.',
        },
        {
          name: 'onConnect',
          type: '(providerId: string) => void | Promise<void>',
          description:
            "Starts consent for one provider. Connect and reconnect are the same act, so one callback serves the empty-state chooser and every row button. A returned promise drives that row's pending state.",
        },
        {
          name: 'onDisconnect',
          type: '(providerId: string) => void | Promise<void>',
          description:
            "Revokes one grant. A returned promise drives the pending state on that card's Disconnect button.",
        },
        {
          name: 'onRetry',
          type: '() => void | Promise<void>',
          description: 'Retries the whole fetch. Shown only in the error state.',
        },
        {
          name: 'pending',
          type: '{ connecting?: string; disconnecting?: string; retrying?: boolean }',
          description:
            'Consumer-driven pending, for wiring where no promise comes back — a server action, or a navigation that never resolves. One provider id, not a set: a second consent redirect would race the first.',
        },
        {
          name: 'title',
          type: 'ReactNode',
          defaultValue: "'Connections'",
          description: 'Page heading text.',
        },
        {
          name: 'titleAs',
          type: "'h1' | 'h2' | 'h3'",
          defaultValue: "'h1'",
          description:
            'Heading element for the title — a block ships a real heading, not a styled div. Drop to h2 when embedding under one.',
        },
        {
          name: 'description',
          type: 'ReactNode',
          defaultValue: "'The accounts this app can read from…'",
          description: 'Sentence under the heading. Pass null to drop it.',
        },
        {
          name: 'showScopes',
          type: 'boolean',
          defaultValue: 'true',
          description: 'Forwarded to every ConnectionCard, and through it to TokenStatus.',
        },
        {
          name: '...props',
          type: "ComponentProps<'section'>",
          description: 'Remaining props are spread onto the page section.',
        },
      ],
    },
    {
      caption: 'AccConnections props',
      nameHeader: 'Prop',
      showDefault: true,
      rows: [
        {
          name: 'providers',
          type: 'OAuthProvider[]',
          defaultValue: '[apsProvider]',
          description:
            'Providers to list. Autodesk is the wired one; an extra entry renders as "not connected" and its Connect button hits /api/auth/<id>, which 404s until lib/acc-auth.ts knows that provider.',
        },
        {
          name: 'nextPath',
          type: 'string',
          defaultValue: "'/connections'",
          description: 'Where the consent flow returns to.',
        },
        {
          name: 'headingLevel',
          type: "'h1' | 'h2' | 'h3'",
          defaultValue: "'h1'",
          description: 'Heading level for the block title, forwarded to ConnectionsView.',
        },
      ],
    },
    {
      caption: 'Exports',
      nameHeader: 'Export',
      typeHeader: 'Kind',
      rows: [
        {
          name: 'ConnectionsView',
          type: 'component',
          description:
            'The presentational page: heading, summary, and whichever of the four states applies. Data in, callbacks out, no fetching.',
        },
        {
          name: 'ConnectionsList',
          type: 'component',
          description:
            'The ready state — one ConnectionCard per row, where the whole status vocabulary shows up at once.',
        },
        {
          name: 'ConnectionsEmpty',
          type: 'component',
          description:
            'The empty state: the provider chooser itself, with one sentence on what a connection buys. No illustration — the system is monochrome.',
        },
        {
          name: 'ConnectionsLoading',
          type: 'component',
          description:
            'The loading state: static skeleton rows built from the ConnectionCard box model, so nothing shifts on resolve, plus one spinner in a live region.',
        },
        {
          name: 'ConnectionsError',
          type: 'component',
          description:
            'The page-level failure: message in danger ink plus a retry on the async-pending contract, wired with aria-describedby.',
        },
        {
          name: 'resolveConnections',
          type: '(providers, connections?) => OAuthConnection[]',
          description:
            'The data model: one row per provider in catalog order, a disconnected placeholder where no grant exists, and unknown grants appended.',
        },
        {
          name: 'ConnectionsManager',
          type: 'component',
          description:
            'The client wiring: connect navigates to the consent route, disconnect posts to the revoke route, and both settle by re-rendering the server page. Swap it for your own backend and ConnectionsView does not change.',
        },
        {
          name: 'AccConnections',
          type: 'async component',
          description:
            'The wired server component, on the lib and routes the acc-sign-in block installs. Render it from any server page; the default export is a ready-made /connections page with a streamed loading.tsx beside it.',
        },
      ],
    },
    {
      caption: 'Data attributes',
      nameHeader: 'Attribute',
      typeHeader: 'Values',
      rows: [
        {
          name: 'data-slot',
          type: 'connections-view · connections-list · connections-empty · connections-loading · connections-error',
          description: 'Which state is on the page, for styling and for tests.',
        },
        {
          name: 'data-status',
          type: 'ready · loading · error',
          description: 'On the page section: the fetch state it was rendered with.',
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
  'project-types': [
    {
      caption: 'Exports',
      nameHeader: 'Export',
      rows: [
        {
          name: 'Hub',
          type: 'interface',
          description:
            'An account-level container of projects — an ACC hub, a Procore company: id, name, optional region.',
        },
        {
          name: 'Project',
          type: 'interface',
          description: 'One project: id, name, and the hubId pickers group by when present.',
        },
        {
          name: 'BrowsePathSegment',
          type: 'interface',
          description:
            "One controlled breadcrumb level: id, name, and type 'hub' | 'project' | 'folder'.",
        },
        {
          name: 'Folder / Item / FolderEntry',
          type: 'interface / union',
          description:
            'Folder-like navigation rows and file-like item rows. FolderEntry is their rendering union; Hub and Project are structurally compatible with Folder.',
        },
        {
          name: 'ItemVersion',
          type: 'interface',
          description:
            'An immutable file version: id, version number, display name, creator/time, storage size, and nullable derivative URN.',
        },
        {
          name: 'isItem',
          type: '(entry: FolderEntry) => entry is Item',
          description: 'Narrows a browser row to its file-like Item shape.',
        },
        {
          name: 'normalizeSearchText',
          type: '(value: string) => string',
          description: 'Case-folds and strips diacritics for consistent client and server search.',
        },
        {
          name: 'ModelTranslationStatus',
          type: 'type',
          description: "'pending' | 'inprogress' | 'success' | 'failed' | 'timeout'.",
        },
        {
          name: 'ModelTranslation',
          type: 'interface',
          description:
            'The translation state of one design: urn, status, and optional name, progress, outputs, error.',
        },
        {
          name: 'SheetVersionSet',
          type: 'interface',
          description: 'A named issuance of construction sheets: id, name, and when it was issued.',
        },
        {
          name: 'versionSetIssuance',
          type: '(versionSet: SheetVersionSet) => Date | null',
          description:
            'Normalizes issuanceDate (Date, string, or number) into a Date, or null when absent.',
        },
        {
          name: 'groupProjectsByHub',
          type: '(hubs: Hub[], projects: Project[]) => { hub: Hub | null; projects: Project[] }[]',
          description:
            'Projects grouped in hub catalog order; projects referencing no known hub land in a trailing hub: null group rather than being dropped.',
        },
      ],
    },
  ],
  'aps-data-preset': [
    {
      caption: 'Exports',
      nameHeader: 'Export',
      rows: [
        {
          name: 'fromApsHub',
          type: '(doc: ApsHubDoc) => Hub',
          description: 'Adapter from a Data Management hub resource into a cantera Hub.',
        },
        {
          name: 'fromApsProject',
          type: '(doc: ApsProjectDoc) => Project',
          description:
            'Adapter from a Data Management project resource into a cantera Project, hub relationship included.',
        },
        {
          name: 'fromApsFolder',
          type: '(doc: ApsFolderDoc) => Folder',
          description:
            'Adapter from a Data Management folder resource, including modified metadata and object count.',
        },
        {
          name: 'fromApsItem',
          type: '(doc: ApsItemDoc, tip?: ApsVersionDoc) => Item',
          description:
            'Adapter from an item resource plus its optional JSON:API included tip version.',
        },
        {
          name: 'fromApsVersion',
          type: '(doc: ApsVersionDoc) => ItemVersion',
          description:
            'Adapter from a version resource, reading the nullable Model Derivative URN from the derivatives relationship.',
        },
        {
          name: 'fromApsManifest',
          type: '(doc: ApsManifestDoc) => ModelTranslation',
          description:
            'Adapter from a Model Derivative manifest: normalizes status, reads the design name from the first named derivative, lists outputs once each.',
        },
        {
          name: 'toTranslationStatus',
          type: '(status?: string) => ModelTranslationStatus',
          description:
            'Normalizes a manifest status string; unknown strings read as "pending", the one state that promises nothing.',
        },
        {
          name: 'fromAccVersionSet',
          type: '(doc: AccVersionSetDoc) => SheetVersionSet',
          description: 'Adapter from an ACC Sheets version set into a cantera SheetVersionSet.',
        },
        {
          name: 'ApsHubDoc / ApsProjectDoc / ApsFolderDoc / ApsItemDoc / ApsVersionDoc / ApsManifestDoc / AccVersionSetDoc',
          type: 'interface',
          description:
            'The structural subsets of the API responses each adapter reads — any payload with these fields adapts, the APS emulator included.',
        },
      ],
    },
  ],
  'hub-switcher': [
    {
      caption: 'Props',
      nameHeader: 'Prop',
      showDefault: true,
      rows: [
        {
          name: 'hubs',
          type: 'Hub[]',
          description: 'The hubs to offer, in the order they render.',
        },
        {
          name: 'value',
          type: 'string',
          description: 'Selected hub id (controlled). Leave undefined to let the switcher own it.',
        },
        {
          name: 'defaultValue',
          type: 'string',
          description: 'Initially selected hub id (uncontrolled).',
        },
        {
          name: 'onValueChange',
          type: '(hubId: string) => void | Promise<void>',
          description:
            'Called with the chosen hub id. Return a promise and the switcher drives its own pending state for the duration.',
        },
        {
          name: 'pending',
          type: 'boolean',
          defaultValue: 'false',
          description:
            'The trigger keeps showing the current hub, crossfades in a spinner, and goes read-only — still focusable, never unmounted.',
        },
        {
          name: 'disabled',
          type: 'boolean',
          defaultValue: 'false',
          description: 'Disables the whole select.',
        },
        {
          name: 'placeholder',
          type: 'string',
          defaultValue: "'Select hub'",
          description: 'Shown while no hub is selected.',
        },
        {
          name: 'emptyMessage',
          type: 'string',
          defaultValue: "'No hubs available.'",
          description: 'Shown inside the open list when there are no hubs at all.',
        },
        {
          name: "'aria-label'",
          type: 'string',
          defaultValue: "'Hub'",
          description:
            'Accessible name for the trigger. A combobox never takes its name from its content, so without one the control announces its value but not what it is.',
        },
      ],
    },
  ],
  'project-picker': [
    {
      caption: 'Props',
      nameHeader: 'Prop',
      showDefault: true,
      rows: [
        {
          name: 'projects',
          type: 'Project[]',
          description: 'The projects to offer. Search matches their visible names.',
        },
        {
          name: 'hubs',
          type: 'Hub[]',
          description:
            'Hubs to group by, in catalog order. Omit for a flat list; projects referencing no known hub still render, never silently dropped.',
        },
        {
          name: 'value',
          type: 'string',
          description: 'Selected project id (controlled).',
        },
        {
          name: 'defaultValue',
          type: 'string',
          description: 'Initially selected project id (uncontrolled).',
        },
        {
          name: 'onValueChange',
          type: '(projectId: string) => void | Promise<void>',
          description:
            'Called with the chosen project id. Return a promise and the picker drives its own pending state.',
        },
        {
          name: 'status',
          type: "'ready' | 'loading' | 'error'",
          defaultValue: "'ready'",
          description:
            'Where the project list stands. Loading renders a still skeleton, error the message wired to a retry — both inside the open picker, so the trigger never unmounts.',
        },
        {
          name: 'error',
          type: 'string',
          description: 'Human-readable fetch failure, shown when status is "error".',
        },
        {
          name: 'onRetry',
          type: '() => void | Promise<void>',
          description:
            'Retry for the failed fetch, rendered on the async-pending contract at the 44px floor.',
        },
        {
          name: 'retryPending',
          type: 'boolean',
          defaultValue: 'false',
          description: 'Pending state for the retry action, drivable from outside.',
        },
        {
          name: 'pending',
          type: 'boolean',
          defaultValue: 'false',
          description:
            'The trigger keeps its label, crossfades in a spinner, and stays focusable while a selection lands.',
        },
        {
          name: 'emptyMessage',
          type: 'string',
          defaultValue: "'No projects yet.'",
          description: 'Shown when the list is ready but holds no projects at all.',
        },
        {
          name: "'aria-label'",
          type: 'string',
          defaultValue: "'Project'",
          description:
            'Accessible name for the trigger. A combobox never takes its name from its content, so without one the control announces its value but not what it is.',
        },
      ],
    },
  ],
  'version-set-select': [
    {
      caption: 'Props',
      nameHeader: 'Prop',
      showDefault: true,
      rows: [
        {
          name: 'versionSets',
          type: 'SheetVersionSet[]',
          description:
            'The issuances to offer, in the order they render — each option carries its issuance date.',
        },
        {
          name: 'value',
          type: 'string',
          description: 'Selected version set id (controlled).',
        },
        {
          name: 'defaultValue',
          type: 'string',
          description: 'Initially selected version set id (uncontrolled).',
        },
        {
          name: 'onValueChange',
          type: '(versionSetId: string) => void | Promise<void>',
          description:
            'Called with the chosen version set id. Return a promise and the select drives its own pending state.',
        },
        {
          name: 'pending',
          type: 'boolean',
          defaultValue: 'false',
          description:
            'The trigger keeps showing the current set, crossfades in a spinner, and goes read-only — still focusable, never unmounted.',
        },
        {
          name: 'disabled',
          type: 'boolean',
          defaultValue: 'false',
          description: 'Disables the whole select.',
        },
        {
          name: 'locale',
          type: 'string | string[]',
          defaultValue: 'runtime locale',
          description:
            'BCP 47 locale(s) for the issuance dates. Left undefined, Intl resolves the runtime locale — nothing is hardcoded to English.',
        },
        {
          name: 'emptyMessage',
          type: 'string',
          defaultValue: "'No version sets published yet.'",
          description: 'Shown inside the open list when there are no version sets at all.',
        },
        {
          name: "'aria-label'",
          type: 'string',
          defaultValue: "'Version set'",
          description:
            'Accessible name for the trigger. A combobox never takes its name from its content, so without one the control announces its value but not what it is.',
        },
      ],
    },
  ],
  'hub-browser': [
    {
      caption: 'Props',
      nameHeader: 'Prop',
      showDefault: true,
      rows: [
        {
          name: 'path',
          type: 'BrowsePathSegment[]',
          description:
            'Controlled hub → project → folder breadcrumb. An empty array is the hub list.',
        },
        {
          name: 'entries',
          type: 'FolderEntry[]',
          description:
            'Rows at the current level. Hub and Project arrays fit structurally at their levels.',
        },
        {
          name: 'status',
          type: "'ready' | 'loading' | 'error'",
          defaultValue: "'ready'",
          description:
            'Loading keeps a still row skeleton and one announced spinner; error renders the supplied message.',
        },
        {
          name: 'error',
          type: 'string',
          description: 'Human-readable current-level failure, shown when status is error.',
        },
        {
          name: 'onNavigate',
          type: '(segment: BrowsePathSegment) => void | Promise<void>',
          description:
            'Folder-row and breadcrumb navigation. The Hubs crumb passes ROOT_BROWSE_SEGMENT, whose id is empty.',
        },
        {
          name: 'onItemOpen',
          type: '(item: Item, version?: ItemVersion) => void | Promise<void>',
          description:
            'Opens the tip when version is absent, or the exact version picked from history.',
        },
        {
          name: 'pending',
          type: '{ navigatingTo?: string; openingItem?: string; loadingMore?: boolean }',
          description:
            'Consumer-driven pending, including pagination for handlers that return void (a server action or a transition). Controls stay mounted, keep their labels, spin, and remain focusable.',
        },
        {
          name: 'versions',
          type: "{ itemId: string; status: 'loading' | 'ready' | 'error'; versions: ItemVersion[] }",
          description:
            'The one item whose on-demand history is currently loaded. A single-item shape prevents stale histories from crossing rows.',
        },
        {
          name: 'onRequestVersions',
          type: '(itemId: string) => void | Promise<void>',
          description:
            'Called when a row version affordance opens; feed the result back through versions.',
        },
        {
          name: 'hasMore / onLoadMore',
          type: 'boolean / () => void | Promise<void>',
          defaultValue: 'false / undefined',
          description: 'Controlled pagination rendered as a final Load more row.',
        },
        {
          name: 'locale',
          type: 'string',
          defaultValue: 'runtime locale',
          description:
            'BCP 47 locale for relative modified times. Undefined delegates to Intl — nothing is hardcoded to English.',
        },
        {
          name: 'title / titleAs',
          type: "string / 'h2' | 'h3' | 'h4'",
          defaultValue: "'Browse files' / 'h2'",
          description: 'Visible real heading and the level it occupies in the surrounding outline.',
        },
      ],
    },
  ],
  'hub-tree': [
    {
      caption: 'Props',
      nameHeader: 'Prop',
      showDefault: true,
      rows: [
        {
          name: 'nodes',
          type: 'HubTreeNode[]',
          description:
            'Controlled hub → project → folder → item → version tree. Each node keeps a globally unique tree id and its typed domain object in value.',
        },
        {
          name: 'expandedIds',
          type: 'string[]',
          description: 'Controlled ids of branches whose children are visible.',
        },
        {
          name: 'selectedId',
          type: 'string',
          description: 'Tree id of the selected item or version.',
        },
        {
          name: 'pendingId',
          type: 'string',
          description:
            'Branch currently loading children. Its label stays mounted while the disclosure icon crossfades to a spinner.',
        },
        {
          name: 'pendingIds',
          type: 'string[]',
          description:
            'Branches concurrently loading children. Each keeps its own mounted label and spinner.',
        },
        {
          name: 'density',
          type: "'comfortable' | 'compact'",
          defaultValue: "'comfortable'",
          description:
            'Row density. Comfortable keeps the 44px field target; compact is the explicit desktop escape hatch.',
        },
        {
          name: 'empty',
          type: 'ReactNode',
          description:
            'Rendered instead of the default "No projects found." when nodes is empty — the place for loading, error, and reconnect states.',
        },
        {
          name: 'onExpand / onCollapse',
          type: '(node: HubTreeBranchNode) => void | Promise<void>',
          description:
            'Controlled disclosure callbacks. Fetch children in onExpand, then feed the updated nodes and expandedIds back.',
        },
        {
          name: 'onItemOpen',
          type: '(item: Item, version?: ItemVersion) => void | Promise<void>',
          description:
            'Opens the item tip when version is absent, or the exact immutable version activated below it.',
        },
      ],
    },
    {
      caption: 'Node types',
      nameHeader: 'Type',
      rows: [
        {
          name: 'HubTreeNode',
          type: 'HubTreeHubNode | HubTreeProjectNode | HubTreeFolderNode | HubTreeItemNode | HubTreeVersionNode',
          description:
            'Discriminated by type. Branches may receive children and hasChildren; versions are always leaves.',
        },
      ],
    },
  ],
  finder: [
    {
      caption: 'Props',
      nameHeader: 'Prop',
      showDefault: true,
      rows: [
        {
          name: 'query / onQueryChange',
          type: 'string / (query: string) => void',
          description:
            'Controlled query. The finder never fetches: the consumer owns the search call, the debounce, and the scope.',
        },
        {
          name: 'groups',
          type: 'FinderGroup[]',
          description:
            'Result groups in render order — recents, pins, the current level, an async deep search. Each carries id, label, status (ready | loading | error), error, and entries; loading keeps existing entries visible under a spinner-labeled heading, and error renders in warning ink because retyping retries.',
        },
        {
          name: 'entries (FinderEntry)',
          type: '{ item: Item; version?: ItemVersion; path?: BrowsePathSegment[]; caption?: string }',
          description:
            'Entries carry their address: path renders as the location line and powers onReveal; caption replaces it for recents ("opened 5 minutes ago").',
        },
        {
          name: 'onItemOpen',
          type: '(entry: FinderEntry) => void | Promise<void>',
          description:
            'Open the entry (tip, or the carried version). A returned promise drives the per-row pending spinner; the row keeps its label and never unmounts.',
        },
        {
          name: 'onReveal',
          type: '(entry: FinderEntry) => void',
          description:
            'Show the entry where it lives. Map entry.path to a hub-tree (expandedIds + selectedId) or a hub-browser location in one state update. The affordance renders only when the entry has a path.',
        },
        {
          name: 'pending',
          type: '{ openingId?: string }',
          description:
            'Consumer-driven pending for server actions, keyed by finderEntryKey(entry). Promise-returning callbacks drive it automatically.',
        },
        {
          name: 'placeholder / label / emptyLabel',
          type: 'string',
          defaultValue: "'Find a file' / 'Find a file' / 'No matches.'",
          description:
            'Input placeholder, the accessible name of the query box, and the no-matches line shown once a query has no entries anywhere.',
        },
        {
          name: 'scope',
          type: 'string',
          description:
            'Name of what a search reaches (the scoped project). Renders as a persistent "Searching in" notice under the input, wired to it with aria-describedby, so the reach stays visible while typing.',
        },
      ],
    },
    {
      caption: 'Exports',
      nameHeader: 'Export',
      rows: [
        {
          name: 'FinderDialog',
          type: 'FinderProps & { open; onOpenChange; shortcut?; title?; description? }',
          description:
            'The \u2318K palette over the same controlled surface. shortcut (default true) binds \u2318K / Ctrl+K to toggle; selecting or revealing an entry closes it — the palette is a jump, not a workspace.',
        },
        {
          name: 'FinderTrigger',
          type: "ComponentProps<'button'> & { placeholder?; showShortcut? }",
          description:
            'Input-shaped button that opens the palette — the visible, tappable entry point with the shortcut as decoration. Compacts to an icon inside a sidebar collapsed to icon mode.',
        },
        {
          name: 'finderEntryKey',
          type: '(entry: FinderEntry) => string',
          description:
            'Stable key for an entry — item id, plus the version id when the entry means a specific version. Use it for pending.openingId and list keys.',
        },
        {
          name: 'FinderEntry / FinderGroup / FinderGroupStatus / FinderPending',
          type: 'types',
          description: 'The full controlled surface, importable for consumer wiring.',
        },
      ],
    },
  ],
  'crew-avatar': [
    {
      caption: 'Props',
      nameHeader: 'Prop',
      showDefault: true,
      rows: [
        {
          name: 'name',
          type: 'string',
          description:
            'The seed. Casing and surrounding whitespace are normalized, so the same person always gets the same worker.',
        },
        {
          name: 'size',
          type: 'number',
          defaultValue: '32',
          description: 'Rendered square in pixels. Shapes are tuned to stay legible down to 24px.',
        },
        {
          name: 'colors',
          type: 'string[]',
          description:
            'Canvas palette override. The defaults are the two ends of the neutral scale, never the middle; the figure is drawn in whichever end the canvas is not, so an override of mid-tones owns its own contrast.',
        },
        {
          name: 'title',
          type: 'string',
          description:
            'Accessible name — renders role="img" with a <title>. Omit next to a visible name and the mark stays decorative (aria-hidden).',
        },
      ],
    },
    {
      caption: 'Library exports',
      nameHeader: 'Export',
      rows: [
        {
          name: 'crewAvatarSvg',
          type: '(name, { size?, colors?, title? }) => string',
          description:
            'Standalone <svg> markup for non-React surfaces — emails, canvases, OG images.',
        },
        {
          name: 'crewAvatarSpec / crewAvatarShapes',
          type: 'functions',
          description:
            'The resolved trait spec — headwear, vest, eyewear, tones, and role, the trade the hat color codes for — plus the renderer-neutral shape tree both renderers share, for custom rendering.',
        },
      ],
    },
  ],
  'hub-sidebar': [
    {
      caption: 'Props',
      nameHeader: 'Prop',
      rows: [
        {
          name: 'finder',
          type: "Omit<FinderProps, 'className'>",
          description:
            'Powers the \u2318K FinderDialog; the header renders a FinderTrigger reusing its placeholder. The fast paths — query, recents, deep search — sit above the tree on purpose.',
        },
        {
          name: 'tree',
          type: 'HubTreeProps',
          description:
            'Forwarded to the HubTree in the content slot. Reveal wiring stays in the consumer: a finder entry path becomes expandedIds + selectedId in one update.',
        },
        {
          name: 'user',
          type: '{ name: string; detail?: string; avatar?: ReactNode; actions?: HubSidebarUserAction[] }',
          description:
            'Identity row pinned at the very top — avatar (initials fallback) plus name and detail, with the collapse toggle inline on its right; the toggle stays reachable when the rail collapses to icon mode.',
        },
        {
          name: 'user.actions',
          type: '{ id, label, icon?, onSelect, destructive?, separatorBefore?, disabled? }[]',
          description:
            'Account menu items. With any, the identity row becomes the menu trigger (chevron affordance, menu anchored beside the rail — below it on mobile) and repeats the identity as the menu header; with none the row stays a plain label. separatorBefore opens a group; destructive carries the sign-out ink.',
        },
        {
          name: 'treeLabel',
          type: 'ReactNode',
          description:
            'Names the tree group ("Models · 4"); renders as the sidebar group label above the tree.',
        },
        {
          name: 'treeAction',
          type: 'ReactElement',
          description:
            'One quiet control beside the group label — an icon button element with an aria-label, positioned as the sidebar group action.',
        },
        {
          name: 'header / footer',
          type: 'ReactNode',
          description:
            'Rendered between the identity row and the finder trigger, and in the sidebar footer.',
        },
        {
          name: '...props',
          type: 'ComponentProps<typeof Sidebar>',
          description:
            'Remaining props reach the shadcn Sidebar — side, variant, collapsible (the trigger compacts to an icon in icon mode). Render inside your own SidebarProvider with page content in SidebarInset.',
        },
      ],
    },
  ],
  'model-upload-page': [
    {
      caption: 'ModelUpload props',
      nameHeader: 'Prop',
      showDefault: true,
      rows: [
        {
          name: 'uploadEndpoint',
          type: 'string',
          defaultValue: "'/api/models/upload'",
          description:
            'Two-legged route implementing the models, start, finish, and status contract over the app bucket.',
        },
        {
          name: 'viewerTokenEndpoint',
          type: 'string',
          defaultValue: "'/api/viewer-token'",
          description:
            'Separate two-legged viewer token route, scoped to viewables:read. Upload-scoped tokens never cross into the viewer.',
        },
        {
          name: 'embedded',
          type: 'boolean',
          defaultValue: 'false',
          description:
            'Constrains the desktop sidebar and shell height to the nearest positioned preview container, and skips writing ?urn= to the URL. Leave false for the full-page route.',
        },
      ],
    },
    {
      caption: 'Upload route',
      nameHeader: 'Request',
      rows: [
        {
          name: 'kind=models',
          type: 'GET',
          description:
            'Ensures the app bucket exists and lists its objects as { name, urn, size } models.',
        },
        {
          name: 'kind=start',
          type: 'POST · name, size',
          description:
            'Returns signed S3 part URLs for the object the browser uploads to directly.',
        },
        {
          name: 'kind=finish',
          type: 'POST · objectId, uploadKey, views, masterViews, zipEntrypoint',
          description:
            'Completes the signed upload and submits the svf2 job — compressed with the archive root when zipEntrypoint is set.',
        },
        {
          name: 'kind=status',
          type: 'GET · urn',
          description:
            'Reads the Model Derivative manifest into the translation status vocabulary, with the derivative diagnostic messages.',
        },
      ],
    },
  ],
  'model-viewer-page': [
    {
      caption: 'ModelBrowser props',
      nameHeader: 'Prop',
      showDefault: true,
      rows: [
        {
          name: 'account',
          type: 'OAuthAccount',
          description: 'Signed-in account shown in the fixed top-right account control.',
        },
        {
          name: 'initialNodes',
          type: 'HubTreeNode[]',
          defaultValue: '[]',
          description:
            'Optional normalized roots. When empty, the client starts by requesting hubs from treeEndpoint.',
        },
        {
          name: 'treeEndpoint',
          type: 'string',
          defaultValue: "'/api/models/tree'",
          description:
            'Session-backed lazy Data Management route implementing the shared kind and id query contract.',
        },
        {
          name: 'viewerTokenEndpoint',
          type: 'string',
          defaultValue: "'/api/viewer-token'",
          description:
            'Separate two-legged viewer token route, scoped to viewables:read. Three-legged Data Management tokens never cross into the viewer.',
        },
        {
          name: 'signOutHref',
          type: 'string',
          defaultValue: "'/api/auth/signout?next=/sign-in'",
          description:
            'POST route used by the account control to revoke the grant and clear the session.',
        },
        {
          name: 'embedded',
          type: 'boolean',
          defaultValue: 'false',
          description:
            'Constrains the desktop sidebar and shell height to the nearest positioned preview container. Leave false for the full-page route.',
        },
      ],
    },
    {
      caption: 'Tree route',
      nameHeader: 'Query',
      rows: [
        {
          name: 'kind=hubs',
          type: 'no ids',
          description: 'Loads the signed-in account’s hubs.',
        },
        {
          name: 'kind=projects',
          type: 'hubId',
          description: 'Loads projects under one hub.',
        },
        {
          name: 'kind=top-folders',
          type: 'hubId, projectId',
          description: 'Loads a project’s top folders.',
        },
        {
          name: 'kind=folder-contents',
          type: 'projectId, folderId',
          description: 'Loads folders and items under one folder.',
        },
        {
          name: 'kind=versions',
          type: 'projectId, itemId',
          description: 'Loads immutable versions under one item.',
        },
        {
          name: 'kind=search',
          type: 'projectId, folderId, q',
          description:
            'Recursively searches unopened descendants of one folder and returns matching tip versions for the scoped finder.',
        },
        {
          name: 'kind=path',
          type: 'projectId, itemId, topFolderId',
          description:
            'Walks a found item’s parent folders up to the searched top folder and returns the intermediate segments, so picking a search result can expand and select it in the tree.',
        },
      ],
    },
  ],
  'file-picker-dialog': [
    {
      caption: 'Props',
      nameHeader: 'Prop',
      showDefault: true,
      rows: [
        {
          name: '...HubBrowserProps',
          type: 'HubBrowserProps',
          description:
            'The same controlled path, entries, status, pending, pagination, and version-history props.',
        },
        {
          name: 'open / defaultOpen / onOpenChange',
          type: 'boolean / boolean / (open: boolean) => void',
          description: 'Controlled or uncontrolled dialog visibility.',
        },
        {
          name: 'trigger',
          type: 'ReactElement',
          description: 'Optional element enhanced as the dialog trigger without an extra wrapper.',
        },
        {
          name: 'onSelect',
          type: '(item: Item, version?: ItemVersion) => void | Promise<void>',
          description: 'Selection callback for the tip or exact version.',
        },
        {
          name: 'onCancel',
          type: '() => void',
          description: 'Called from the explicit Cancel action.',
        },
        {
          name: 'title / description',
          type: 'string / string',
          defaultValue: "'Choose a file' / browser guidance",
          description: 'Accessible dialog title and description.',
        },
      ],
    },
  ],
  'viewer-types': [
    {
      caption: 'Exports',
      nameHeader: 'Export',
      rows: [
        {
          name: 'GetAccessToken',
          type: '() => Promise<{ accessToken: string; expiresInSeconds: number }>',
          description:
            'Promise-based backend token supplier adapted by APSViewer to the Autodesk callback contract.',
        },
        {
          name: 'APSViewer3D / APSModel / APSDocument',
          type: 'interface',
          description:
            'Structural subsets of the Viewer global objects used by the component and hooks.',
        },
        {
          name: 'APSViewerExtension / APSViewingNamespace / AutodeskGlobal',
          type: 'interface',
          description:
            'Public extension and global-runtime surfaces, including the extension manager and toolbar lifecycle.',
        },
        {
          name: 'APSCameraState / APSPropertyResult / APSContextMenuItem',
          type: 'interface',
          description: 'Typed values returned by the camera, property, and context-menu hooks.',
        },
      ],
    },
  ],
  'viewer-extension-types': [
    {
      caption: 'Exports',
      nameHeader: 'Export',
      rows: [
        {
          name: 'VIEWER_EXTENSIONS',
          type: 'Record<KnownViewerExtensionId, ViewerExtensionInfo>',
          description:
            'The catalog: every public extension id with what it adds, whether GuiViewer3D auto-loads it, toolbar and 2D/3D flags, AEC-model-data requirements, and deprecated/removedIn markers.',
        },
        {
          name: 'viewerExtension(id, options?)',
          type: 'ViewerExtensionEntry',
          description:
            'Typed entry builder for the APSViewer extensions prop: the id is checked against the catalog and the options against that extension’s interface.',
        },
        {
          name: 'ViewerExtensionOptionsMap',
          type: 'interface',
          description:
            'Extension id to the options loadExtension actually reads — MeasureExtensionOptions, LevelsExtensionOptions, DocumentBrowserExtensionOptions, and the rest.',
        },
        {
          name: 'AEC_STARTER_EXTENSIONS',
          type: 'readonly ViewerExtensionEntry[]',
          description:
            'A field-tested starter set for AEC models: levels, measurement, markup, and the sheet browser, ordered so options can reach auto-loaded dependencies.',
        },
        {
          name: 'KnownViewerExtensionId / ViewerExtensionInfo / ViewerExtensionEntry',
          type: 'types',
          description:
            'The catalog’s id union, per-extension metadata shape, and the { id, options } entry shape the viewer accepts.',
        },
      ],
    },
  ],
  'aps-viewer': [
    {
      caption: 'Props',
      nameHeader: 'Prop',
      showDefault: true,
      rows: [
        {
          name: 'urn',
          type: 'string',
          description:
            'Model Derivative URN with or without the urn: prefix. Changes reuse the live WebGL viewer.',
        },
        {
          name: 'getAccessToken',
          type: 'GetAccessToken',
          description:
            'Fetches a short-lived token from your backend. APS credentials must never enter the browser.',
        },
        {
          name: 'toolbar',
          type: "'native' | 'none'",
          defaultValue: "'native'",
          description:
            'Chooses the GuiViewer3D native toolbar or the core Viewer3D; ViewCube remains independently controllable.',
        },
        {
          name: 'toolbarPosition',
          type: "'bottom' | 'top' | 'left' | 'right'",
          defaultValue: "'bottom'",
          description:
            'Docks the native toolbar to an edge. Left and right derive a vertical layout; changes apply live.',
        },
        {
          name: 'toolbarScale',
          type: "'sm' | 'md' | 'lg' | number",
          defaultValue: "'md'",
          description:
            'Native-toolbar button box: compact 36px, comfortable 44px, gloved 52px, or an exact number clamped to 32–64. Changes apply live.',
        },
        {
          name: 'viewCube',
          type: 'boolean',
          defaultValue: 'true',
          description:
            "Shows Autodesk's ViewCube and companion controls. Changes apply live without recreating the viewer.",
        },
        {
          name: 'radius',
          type: 'number',
          description:
            'Clips the viewer frame to a pixel radius clamped to 0–32. Omit to leave frame styling to the consumer.',
        },
        {
          name: 'theme',
          type: "'light' | 'dark'",
          defaultValue: 'app appearance',
          description:
            'Optional forced appearance. Undefined follows the document class and system preference live.',
        },
        {
          name: 'autoResize',
          type: 'boolean',
          defaultValue: 'true',
          description: 'ResizeObserver keeps the WebGL canvas matched to its container.',
        },
        {
          name: 'version / env / api',
          type: 'string',
          defaultValue: "'7.*' / 'AutodeskProduction2' / 'streamingV2'",
          description:
            'Viewer CDN and Initializer settings. The first mounted runtime consumer wins.',
        },
        {
          name: 'extensions / viewerConfig',
          type: 'readonly APSExtensionRequest[] / Record<string, unknown>',
          description:
            'Extensions to load — bare ids or { id, options } entries — and extra constructor configuration, captured when the viewer mounts. Load progress is observable via useAPSExtensions(); viewer-extension-types catalogs the public ids and types their options.',
        },
        {
          name: 'profile',
          type: "'aec' | 'default' | 'fluent' | 'navis'",
          description:
            "Named Autodesk settings profile applied at creation. 'aec' is the Construction (AEC) tuning: reversed zoom, edge rendering, AEC light preset.",
        },
        {
          name: 'shutdownOnUnmount',
          type: 'boolean',
          defaultValue: 'false',
          description:
            'Shuts down the global SDK only after its last consumer releases; false keeps it warm across routes.',
        },
        {
          name: 'onViewerReady / onModelLoaded / onError / onExtensionError',
          type: 'callbacks',
          description:
            'Lifecycle callbacks. Inline functions do not recreate the viewer. onExtensionError reports a failed extension load without tearing the viewer down.',
        },
        {
          name: 'children',
          type: 'ReactNode',
          description:
            'Overlay UI inside the viewer context. Descendants can use every exported APS hook.',
        },
      ],
    },
    {
      caption: 'Hooks and runtime exports',
      nameHeader: 'Export',
      rows: [
        {
          name: 'useAPSViewer / useAPSModelLoaded',
          type: 'hooks',
          description: 'Live viewer identity and model-geometry readiness.',
        },
        {
          name: 'useAPSSelection / useAPSCamera / useAPSProperties',
          type: 'hooks',
          description: 'Event-driven selection, camera, and cancellable property state.',
        },
        {
          name: 'useAPSViewerEvent / useAPSContextMenu',
          type: 'hooks',
          description: 'Raw event and context-menu escape hatches.',
        },
        {
          name: 'useAPSExtension / useAPSExtensions',
          type: 'hooks',
          description:
            'Per-extension load with status, instance, and setOptions re-application on option change; and the load lifecycle of every extension requested through the extensions prop.',
        },
        {
          name: 'acquireViewerRuntime / releaseViewerRuntime / loadViewerScript',
          type: 'functions',
          description:
            'Deduplicated CDN and Initializer lifecycle, exposed for advanced imperative composition.',
        },
      ],
    },
    {
      caption: 'APSViewerSettings props',
      nameHeader: 'Prop',
      showDefault: true,
      rows: [
        {
          name: 'value',
          type: 'APSViewerSettingsValue',
          description:
            'Controlled settings: toolbar on/off, toolbarPosition, toolbarScale (a preset or an exact pixel box the density slider drives across 32–64), viewCube, and theme. Spread apsViewerPropsFor(value) onto APSViewer to apply them.',
        },
        {
          name: 'onValueChange',
          type: '(value: APSViewerSettingsValue) => void',
          description: 'Called with the next settings object when the user changes a control.',
        },
        {
          name: 'open / onOpenChange / defaultOpen',
          type: 'boolean / callback / boolean',
          defaultValue: 'false',
          description:
            'Panel visibility, controlled or uncontrolled. The panel starts collapsed; the trigger sits in the SDK toolbar, or a corner button when the native toolbar is off.',
        },
        {
          name: 'label',
          type: 'string',
          defaultValue: "'Viewer settings'",
          description: 'Names the trigger, its tooltip, and the panel heading.',
        },
        {
          name: 'children',
          type: 'ReactNode',
          description: 'Extra sections appended below the built-in controls.',
        },
        {
          name: 'APSViewerSettingsTrigger',
          type: 'component',
          description:
            'The toolbar-mounted trigger alone — our control group appended to the SDK toolbar after a divider, inheriting toolbar position and scale — for wiring a custom panel.',
        },
        {
          name: 'DEFAULT_APS_VIEWER_SETTINGS / apsViewerPropsFor',
          type: 'constant / function',
          description:
            'The starting settings object, and the mapping from a settings object to APSViewer props.',
        },
      ],
    },
  ],
  'model-status-card': [
    {
      caption: 'Props',
      nameHeader: 'Prop',
      showDefault: true,
      rows: [
        {
          name: 'translation',
          type: 'ModelTranslation',
          description:
            'The design to summarize: name (or URN fallback), status badge, progress, outputs, error text.',
        },
        {
          name: 'onRetry',
          type: '() => void | Promise<void>',
          description:
            'Retry for a failed or timed-out translation. Promise-returning handlers drive the pending state; the button keeps its label, spins, and stays put.',
        },
        {
          name: 'retryPending',
          type: 'boolean',
          defaultValue: 'false',
          description: 'Pending state for the retry action, drivable from outside.',
        },
        {
          name: 'showOutputs',
          type: 'boolean',
          defaultValue: 'true',
          description: 'Render each produced output format as an outline badge while ready.',
        },
        {
          name: '...props',
          type: 'ComponentProps<typeof Card>',
          description: 'Everything else lands on the root Card.',
        },
      ],
    },
  ],
  'upload-types': [
    {
      caption: 'Exports',
      nameHeader: 'Export',
      rows: [
        {
          name: 'UploadPhase',
          type: 'type',
          description:
            "'queued' | 'uploading' | 'processing' | 'complete' | 'error'. Processing is the provider working after the bytes arrived — translation, extraction — usually without a progress signal.",
        },
        {
          name: 'UploadFile',
          type: 'interface',
          description:
            'One tracked file: stable id, name, optional byte size, phase, 0–1 progress while uploading, a processingLabel, and error text with a retryable flag that decides warning versus danger.',
        },
        {
          name: 'UploadRejection / UploadRejectionReason',
          type: 'interface / type',
          description:
            "A refused browser File plus the rule it broke: 'file-type', 'file-size', or 'file-count'.",
        },
        {
          name: 'MODEL_FILE_ACCEPT',
          type: 'string',
          description:
            'Accept preset for the design formats APS translates most often: .rvt, .ifc, .dwg, .dxf, .nwd, .nwc, .pdf.',
        },
        {
          name: 'matchesAccept',
          type: '(file: File, accept?: string) => boolean',
          description:
            'Whether a File satisfies an accept string — extensions, exact MIME types, and type/* wildcards, the native file-input grammar.',
        },
        {
          name: 'formatBytes',
          type: '(bytes: number, locale?: string) => string',
          description:
            'Bytes as a localized short unit string, e.g. 248 MB. Locale-neutral Intl by default; decimal units, matching what storage providers report.',
        },
      ],
    },
  ],
  'file-drop-zone': [
    {
      caption: 'Props',
      nameHeader: 'Prop',
      showDefault: true,
      rows: [
        {
          name: 'files',
          type: 'UploadFile[]',
          defaultValue: '[]',
          description:
            'The tracked files, controlled by the consumer. The grid surface derives its phase from them: uploading plots the grid, processing starts the ambient glow, settled files tint it.',
        },
        {
          name: 'onDropFiles',
          type: '(files: File[]) => void | Promise<void>',
          description:
            'Files that passed validation, from a drop or the picker. The component never uploads — start the transfer here and drive files as it moves.',
        },
        {
          name: 'onReject',
          type: '(rejections: UploadRejection[]) => void',
          description: 'Files refused before any upload started, with the rule each broke.',
        },
        {
          name: 'onRetry',
          type: '(file: UploadFile) => void | Promise<void>',
          description:
            'Retry for a failed file. Promise-returning handlers drive the pending state; the button keeps its label, spins, and stays put.',
        },
        {
          name: 'onRemove',
          type: '(file: UploadFile) => void',
          description:
            "Remove a file's row. While the file is queued or uploading the same control reads as cancel.",
        },
        {
          name: 'accept',
          type: 'string',
          description:
            'Native accept grammar: extensions, MIME types, type/* wildcards. MODEL_FILE_ACCEPT covers the common APS design formats.',
        },
        {
          name: 'maxFiles',
          type: 'number',
          description: 'Cap on tracked files; extras reject as file-count.',
        },
        {
          name: 'maxSize',
          type: 'number',
          description: 'Per-file byte ceiling; larger files reject as file-size.',
        },
        {
          name: 'multiple',
          type: 'boolean',
          defaultValue: 'true',
          description: 'Accept several files per gesture. Drops usually batch.',
        },
        {
          name: 'disabled',
          type: 'boolean',
          defaultValue: 'false',
          description: 'Ignores drops and the picker while keeping the zone focusable.',
        },
        {
          name: 'label',
          type: 'string',
          defaultValue: "'Drag files here or browse'",
          description: 'Idle headline. The zone swaps it for phase copy while work is running.',
        },
        {
          name: 'hint',
          type: 'string',
          description:
            'Caption under the headline. Defaults to a summary of the accept and size rules.',
        },
        {
          name: 'showList',
          type: 'boolean',
          defaultValue: 'true',
          description:
            'Render the built-in file rows. Files keep driving the grid either way; turn this off to lay rows out yourself with FileDropZoneItem.',
        },
        {
          name: 'density',
          type: "'comfortable' | 'compact'",
          defaultValue: "'comfortable'",
          description:
            'Comfortable keeps the 44px field target on rows; compact is the explicit desktop escape hatch.',
        },
        {
          name: 'locale',
          type: 'string',
          description: 'BCP 47 tag for sizes and percentages. Defaults locale-neutral.',
        },
        {
          name: '...props',
          type: "ComponentProps<'div'>",
          description: 'Everything else lands on the root element.',
        },
      ],
    },
    {
      caption: 'Data attributes',
      nameHeader: 'Attribute',
      rows: [
        {
          name: 'data-phase',
          type: "'idle' | 'dragover' | 'uploading' | 'processing' | 'complete' | 'error'",
          description:
            'The derived surface phase, on the root and each file row (rows carry their own file phase).',
        },
        {
          name: 'data-tone',
          type: "'success' | 'warning' | 'danger'",
          description:
            'Present once work settles: success on complete; a retryable-only failure is warning, a terminal one danger.',
        },
        {
          name: 'data-density',
          type: "'comfortable' | 'compact'",
          description: 'The active density, for consumer styling hooks.',
        },
      ],
    },
    {
      caption: 'FileDropZoneItem props',
      nameHeader: 'Prop',
      showDefault: true,
      rows: [
        {
          name: 'file',
          type: 'UploadFile',
          description:
            'The file to render: name, format and size chip, and the phase treatment — progressbar, shimmer label, check, or error with retry.',
        },
        {
          name: 'onRetry',
          type: '(file: UploadFile) => void | Promise<void>',
          description:
            'Retry for a failed file. Promise-returning handlers drive the pending state; the button keeps its label, spins, and stays put.',
        },
        {
          name: 'retryPending',
          type: 'boolean',
          defaultValue: 'false',
          description: 'Pending state for the retry action, drivable from outside.',
        },
        {
          name: 'onRemove',
          type: '(file: UploadFile) => void',
          description: 'Remove the row — cancel in flight, clear it after it settled.',
        },
        {
          name: 'density',
          type: "'comfortable' | 'compact'",
          defaultValue: "'comfortable'",
          description: 'Comfortable keeps the 44px field target; compact is the escape hatch.',
        },
        {
          name: 'locale',
          type: 'string',
          description: 'BCP 47 tag for sizes and percentages. Defaults locale-neutral.',
        },
        {
          name: '...props',
          type: "ComponentProps<'li'>",
          description: 'Everything else lands on the root li.',
        },
      ],
    },
    {
      caption: 'Exports',
      nameHeader: 'Export',
      rows: [
        {
          name: 'FileDropZoneItem',
          type: 'component',
          description:
            'The file row on its own, for laying rows out anywhere — a table, a sidebar, next to model-status-card — with identical styling. Pair with showList false.',
        },
        {
          name: 'FILE_DROP_ZONE_CSS',
          type: 'string',
          description:
            'The drafting-grid stylesheet the component hoists via React 19 style precedence — exported for custom surfaces that reuse the grid outside the zone.',
        },
      ],
    },
  ],
}

export interface LibUsage {
  intro: string
  example: string
}

interface LibUsageByItem {
  [item: string]: LibUsage
}

export const libUsage: LibUsageByItem = {
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
  'project-types': {
    intro:
      'The lingua franca for project context — hubs, projects, browsable folders and items, immutable versions, model translations, and sheet version sets. Components take these shapes as props and never fetch; adapters translate provider payloads into them.',
    example: `import type { FolderEntry, Hub, ItemVersion, Project } from '@/lib/project-types'

const hub: Hub = { id: 'b.ridgeline-us', name: 'Ridgeline Builders', region: 'US' }

const projects: Project[] = [
  { id: 'b.summit-tower', name: 'Summit Tower', hubId: hub.id },
  { id: 'b.cedar-mill', name: 'Cedar Mill Campus', hubId: hub.id },
]

const entries: FolderEntry[] = [{ id: 'folder-1', name: 'Project Files', type: 'folder' }]
const versions: ItemVersion[] = []`,
  },
  'aps-data-preset': {
    intro:
      'Everything ACC-data-specific in one data-only item: adapters from the Data Management, Model Derivative, and ACC Sheets payloads into cantera project types. Each input interface is the structural subset the adapter actually reads, so any payload with those fields adapts — the APS emulator included. Fetching and tokens stay in your auth layer.',
    example: `import { fromApsFolder, fromApsHub, fromApsItem, fromApsProject } from '@/lib/aps-data-preset'
import { ProjectPicker } from '@/components/ui/project-picker'

// GET /project/v1/hubs and /project/v1/hubs/{hub}/projects, fetched by you.
const hubs = hubsResponse.data.map(fromApsHub)
const projects = projectsResponse.data.map(fromApsProject)
const folders = topFoldersResponse.data.map(fromApsFolder)
const items = contentsResponse.data.map((item) => fromApsItem(item, includedTips.get(item.id)))

<ProjectPicker hubs={hubs} projects={projects} onValueChange={setProjectId} />`,
  },
  'viewer-extension-types': {
    intro:
      'The Autodesk Viewer grows real capability through extensions, but the SDK leaves their ids as bare strings and their options as untyped bags — and ids circulating in old blog posts include extensions that no longer exist. This catalog types both, verified against the shipped viewer source, so a wrong id or option is a compile error instead of a silent runtime 404.',
    example: `import { viewerExtension } from '@/lib/viewer-extension-types'
import { APSViewer } from '@/components/ui/aps-viewer'

<APSViewer
  urn={urn}
  getAccessToken={getAccessToken}
  profile="aec"
  extensions={[
    viewerExtension('Autodesk.AEC.LevelsExtension', { ifcLevelsEnabled: true }),
    viewerExtension('Autodesk.Viewing.MarkupsGui'),
    'MyProject.CustomExtension',
  ]}
/>`,
  },
  'viewer-types': {
    intro:
      "The Autodesk Viewer ships as a browser global rather than an ESM package. These types re-export Autodesk's official @types/forge-viewer definitions (a dev dependency — the full Autodesk.Viewing namespace, typed) under stable APS* names, plus cantera's domain types for cameras, properties, and token callbacks.",
    example: `import type { GetAccessToken } from '@/lib/viewer-types'

const getAccessToken: GetAccessToken = async () => {
  const response = await fetch('/api/viewer-token')
  if (!response.ok) throw new Error('Viewer token unavailable')
  return response.json()
}`,
  },
  'upload-types': {
    intro:
      'The lifecycle of a file on its way into a project. Construction files are heavy and "uploaded" is not "done" — providers translate a design after the bytes land. Components render these shapes and never upload; adapters drive the phases and report back through them.',
    example: `import { formatBytes, MODEL_FILE_ACCEPT, type UploadFile } from '@/lib/upload-types'

const files: UploadFile[] = [
  { id: 'v1', name: 'summit-tower.rvt', size: 248_000_000, phase: 'complete' },
  { id: 'v2', name: 'cedar-mill-site.nwd', size: 612_000_000, phase: 'uploading', progress: 0.42 },
  {
    id: 'v3',
    name: 'dockside-mep.ifc',
    phase: 'processing',
    processingLabel: 'Translating model',
  },
]

const caption = \`\${MODEL_FILE_ACCEPT} · up to \${formatBytes(800_000_000)}\``,
  },
}

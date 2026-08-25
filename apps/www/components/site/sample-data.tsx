import type { OAuthAccount, OAuthProvider } from '@/lib/oauth-types'

export const procoreProvider: OAuthProvider = {
  id: 'procore',
  name: 'Procore',
  icon: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-4">
      <path d="M3 4h18v7h-4.6V8.4H7.6v7.2h8.8V13H21v7H3z" />
    </svg>
  ),
}

export const sampleAccount: OAuthAccount = {
  name: 'Dana Alvarez',
  email: 'dana@ridgelinebuilders.com',
}

export const sampleForeman: OAuthAccount = {
  name: 'Luis Ibarra',
}

export const fieldlinkProvider: OAuthProvider = {
  id: 'fieldlink',
  name: 'FieldLink',
  icon: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-4">
      <path d="M12 2 3 7v10l9 5 9-5V7zm0 2.3 6.5 3.6L12 11.5 5.5 7.9zM5 9.6l6 3.3v6.5l-6-3.3zm8 9.8v-6.5l6-3.3v6.5z" />
    </svg>
  ),
}

/** No mark: every surface must render a provider without one. */
export const siteworksProvider: OAuthProvider = {
  id: 'siteworks',
  name: 'Siteworks',
}

export const sampleInspector: OAuthAccount = {
  name: 'Priya Raman',
  email: 'priya@summittower.build',
}

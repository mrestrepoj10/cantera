import type { OAuthAccount, OAuthProvider } from '@/lib/oauth-types'

/**
 * Sample data for the site demos. The Autodesk side comes from the real
 * aps-oauth-preset registry item; this hand-rolled provider proves the
 * components are data-agnostic — any OAuthProvider shape renders.
 */
export const procoreProvider: OAuthProvider = {
  id: 'procore',
  name: 'Procore',
  // Same sizing contract as the preset marks: a default size, overridable by
  // a `[&_svg]:size-*` wrapper.
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

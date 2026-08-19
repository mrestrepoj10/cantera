import type { OAuthAccount, OAuthProvider, OAuthScope, OAuthScopePreset } from '@/lib/oauth-types'

/**
 * Autodesk Platform Services (APS / ACC) preset for the cantera oauth
 * components: provider metadata, the APS scope catalog, common scope bundles,
 * and adapters from APS payloads into cantera's oauth types.
 *
 * This is data, not a client — token handling belongs to your auth layer
 * (e.g. aec-auth, https://github.com/mrestrepoj10/aec-auth).
 */

export const apsProvider: OAuthProvider = {
  id: 'aps',
  name: 'Autodesk',
  docsUrl: 'https://aps.autodesk.com/en/docs/oauth/v2',
  icon: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.2 4 2 20h4.8l6.14-9.9c.1-.17.35-.17.45 0l3.9 6.36c.1.17-.02.39-.22.39h-3.16l2.03 3.15H22z" />
    </svg>
  ),
}

/** The APS scope catalog, with human explanations. */
export const apsScopeCatalog: OAuthScope[] = [
  {
    id: 'user-profile:read',
    label: 'Read profile',
    description: 'View basic user profile information.',
  },
  {
    id: 'user:read',
    label: 'Read user data',
    description: 'View user data within Autodesk products.',
  },
  { id: 'user:write', label: 'Write user data', description: 'Create and update user data.' },
  {
    id: 'viewables:read',
    label: 'Read viewables',
    description: 'Load translated models in the APS Viewer.',
  },
  {
    id: 'data:read',
    label: 'Read data',
    description: 'Read hubs, projects, folders, items, and versions.',
  },
  { id: 'data:write', label: 'Write data', description: 'Update and delete project data.' },
  {
    id: 'data:create',
    label: 'Create data',
    description: 'Create new project data such as files and folders.',
  },
  { id: 'data:search', label: 'Search data', description: 'Search across project data.' },
  { id: 'bucket:create', label: 'Create buckets', description: 'Create OSS storage buckets.' },
  { id: 'bucket:read', label: 'Read buckets', description: 'List and read OSS storage buckets.' },
  { id: 'bucket:update', label: 'Update buckets', description: 'Modify OSS bucket settings.' },
  { id: 'bucket:delete', label: 'Delete buckets', description: 'Delete OSS storage buckets.' },
  {
    id: 'code:all',
    label: 'Design Automation',
    description: 'Author and run Design Automation work items.',
  },
  {
    id: 'account:read',
    label: 'Read account',
    description: 'Read ACC / BIM 360 account administration data.',
  },
  {
    id: 'account:write',
    label: 'Write account',
    description: 'Manage ACC / BIM 360 account administration.',
  },
  {
    id: 'openid',
    label: 'OpenID',
    description: 'Include an OpenID Connect id_token in the response.',
  },
]

/**
 * Common scope bundles, mirrored from aec-auth's `apsScopes` recipes so the
 * picker and the token layer speak the same presets.
 */
export const apsScopePresets: OAuthScopePreset[] = [
  {
    id: 'viewer',
    label: 'Viewer',
    description: 'Load models in the APS Viewer.',
    scopes: ['data:read', 'viewables:read'],
  },
  {
    id: 'data-read',
    label: 'Read project data',
    description: 'Read hubs, projects, folders, and items.',
    scopes: ['data:read'],
  },
  {
    id: 'data-write',
    label: 'Read and write data',
    description: 'Read and write project data.',
    scopes: ['data:read', 'data:write', 'data:create'],
  },
  {
    id: 'account-admin',
    label: 'Account admin',
    description: 'ACC / BIM 360 account administration.',
    scopes: ['account:read', 'account:write'],
  },
]

/** Subset of the APS userinfo response the adapter reads. */
export interface ApsUserInfo {
  sub?: string
  name?: string
  email?: string
  picture?: string
}

/** Translate an APS userinfo payload into a cantera OAuthAccount. */
export function fromApsUserInfo(userInfo: ApsUserInfo): OAuthAccount {
  return {
    name: userInfo.name,
    email: userInfo.email,
    avatarUrl: userInfo.picture,
  }
}

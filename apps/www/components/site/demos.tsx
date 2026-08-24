'use client'

import dynamic from 'next/dynamic'
import type { ComponentType } from 'react'

/**
 * Docs-page entry point for the live demos. Every demo lives in its own module
 * under `demos/` and loads through `dynamic()`, so a docs page ships exactly
 * the one demo it renders — never the whole demo graph. A page that composes a
 * specific demo statically (the landing preview strip) imports its module
 * directly instead of going through this map.
 */

const demos: Record<string, ComponentType> = {
  'provider-sign-in-button': dynamic(() =>
    import('./demos/provider-sign-in-button-demo').then((m) => m.ProviderSignInButtonDemo),
  ),
  'sign-in-card': dynamic(() => import('./demos/sign-in-card-demo').then((m) => m.SignInCardDemo)),
  'scope-picker': dynamic(() => import('./demos/scope-picker-demo').then((m) => m.ScopePickerDemo)),
  'user-account-badge': dynamic(() =>
    import('./demos/user-account-badge-demo').then((m) => m.UserAccountBadgeDemo),
  ),
  'token-status': dynamic(() => import('./demos/token-status-demo').then((m) => m.TokenStatusDemo)),
  'connection-card': dynamic(() =>
    import('./demos/connection-card-demo').then((m) => m.ConnectionCardDemo),
  ),
  'status-tokens': dynamic(() =>
    import('./demos/status-tokens-demo').then((m) => m.StatusTokensDemo),
  ),
  'acc-sign-in': dynamic(() => import('./demos/acc-sign-in-demo').then((m) => m.AccSignInDemo)),
  'connections-page': dynamic(() =>
    import('./demos/connections-page-demo').then((m) => m.ConnectionsPageDemo),
  ),
  'hub-switcher': dynamic(() => import('./demos/hub-switcher-demo').then((m) => m.HubSwitcherDemo)),
  'project-picker': dynamic(() =>
    import('./demos/project-picker-demo').then((m) => m.ProjectPickerDemo),
  ),
  'version-set-select': dynamic(() =>
    import('./demos/version-set-select-demo').then((m) => m.VersionSetSelectDemo),
  ),
  'model-status-card': dynamic(() =>
    import('./demos/model-status-card-demo').then((m) => m.ModelStatusCardDemo),
  ),
  'hub-browser': dynamic(() =>
    import('@/components/examples/hub-browser-demo').then((m) => m.HubBrowserDemo),
  ),
  'hub-tree': dynamic(() => import('./demos/hub-tree-demo').then((m) => m.HubTreeDemo)),
  finder: dynamic(() => import('./demos/finder-demo').then((m) => m.FinderDemo)),
  'crew-avatar': dynamic(() => import('./demos/crew-avatar-demo').then((m) => m.CrewAvatarDemo)),
  'hub-sidebar': dynamic(() => import('./demos/hub-sidebar-demo').then((m) => m.HubSidebarDemo)),
  'model-viewer-page': dynamic(() =>
    import('./demos/model-viewer-page-demo').then((m) => m.ModelViewerPageDemo),
  ),
  'file-picker-dialog': dynamic(() =>
    import('@/components/examples/file-picker-dialog-demo').then((m) => m.FilePickerDialogDemo),
  ),
  'file-drop-zone': dynamic(() =>
    import('@/components/examples/file-drop-zone-demo').then((m) => m.FileDropZoneDemo),
  ),
}

const APSViewerDemo = dynamic(() =>
  import('@/components/site/aps-viewer-demo').then((module) => module.APSViewerDemo),
)

/** Renders the demo for a registry item, or nothing for lib items. */
export function ComponentDemo({ name, viewerUrn }: { name: string; viewerUrn?: string }) {
  if (name === 'aps-viewer') {
    return <APSViewerDemo urn={viewerUrn} />
  }
  const Demo = demos[name]
  if (!Demo) return null
  return <Demo />
}

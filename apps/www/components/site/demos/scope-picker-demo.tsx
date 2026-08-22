'use client'

import { useState } from 'react'
import { ScopePicker, withRequiredScopes } from '@/components/ui/scope-picker'
import { apsScopeCatalog, apsScopePresets } from '@/lib/aps-oauth-preset'

/**
 * The APS catalog marks nothing required, so the demo pins one scope on. That
 * is what a provider with a mandatory scope looks like, and it makes
 * withRequiredScopes visible in the scope line below.
 */
const demoScopeCatalog = apsScopeCatalog.map((scope) =>
  scope.id === 'user-profile:read' ? { ...scope, required: true } : scope,
)

/** Hoisted: the catalog is static, so the compact subset never changes between
 * renders — filtering it per keystroke bought nothing. */
const compactScopeCatalog = demoScopeCatalog.filter((scope) =>
  ['user-profile:read', 'data:read', 'data:write', 'viewables:read'].includes(scope.id),
)

export function ScopePickerDemo({ compact = false }: { compact?: boolean }) {
  const [value, setValue] = useState<string[]>(['data:read', 'viewables:read'])
  const scopes = compact ? compactScopeCatalog : demoScopeCatalog
  // What actually goes on the wire: the selection, plus the scopes the catalog
  // requires. The picker never backfills those into `value` itself.
  const scope = withRequiredScopes(scopes, value)

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <ScopePicker
        scopes={scopes}
        value={value}
        onChange={setValue}
        presets={compact ? undefined : apsScopePresets}
        allowCustomScopes
      />
      <p className="border-border border-t pt-3 font-mono text-muted-foreground text-xs">
        scope={scope.length > 0 ? scope.join(' ') : '(none)'}
      </p>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { ScopePicker, withRequiredScopes } from '@/components/ui/scope-picker'
import { apsScopeCatalog, apsScopePresets } from '@/lib/aps-oauth-preset'

const demoScopeCatalog = apsScopeCatalog.map((scope) =>
  scope.id === 'user-profile:read' ? { ...scope, required: true } : scope,
)

const compactScopeCatalog = demoScopeCatalog.filter((scope) =>
  ['user-profile:read', 'data:read', 'data:write', 'viewables:read'].includes(scope.id),
)

export function ScopePickerDemo({ compact = false }: { compact?: boolean }) {
  const [value, setValue] = useState<string[]>(['data:read', 'viewables:read'])
  const scopes = compact ? compactScopeCatalog : demoScopeCatalog
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

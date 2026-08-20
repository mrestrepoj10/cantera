'use client'

import { useState } from 'react'

import { ScopePicker, withRequiredScopes } from '@/components/ui/scope-picker'
import { apsScopeCatalog, apsScopePresets } from '@/lib/aps-oauth-preset'

export function ScopePickerDemo() {
  const [value, setValue] = useState<string[]>(['data:read', 'viewables:read'])
  // What actually goes on the wire: the selection, plus whatever the catalog
  // marks required. The picker never backfills required scopes into `value`.
  const scope = withRequiredScopes(apsScopeCatalog, value)

  return (
    <div className="flex w-full flex-col gap-4">
      <ScopePicker
        scopes={apsScopeCatalog}
        presets={apsScopePresets}
        value={value}
        onChange={setValue}
        allowCustomScopes
      />
      <p className="border-border border-t pt-3 font-mono text-muted-foreground text-xs">
        scope={scope.length > 0 ? scope.join(' ') : '(none)'}
      </p>
    </div>
  )
}

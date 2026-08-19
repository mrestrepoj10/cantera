'use client'

import type * as React from 'react'
import { useEffect, useId } from 'react'

import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import type { OAuthScope, OAuthScopePreset } from '@/lib/oauth-types'
import { cn } from '@/lib/utils'

interface ScopePickerProps extends Omit<React.ComponentProps<'div'>, 'onChange'> {
  scopes: OAuthScope[]
  /** Selected scope ids. Controlled. */
  value: string[]
  onChange: (value: string[]) => void
  /** Named bundles shown as one-click presets above the list. */
  presets?: OAuthScopePreset[]
  disabled?: boolean
}

/**
 * A controlled picker for OAuth scopes: checkbox list with descriptions,
 * optional one-click presets, and required scopes pinned on. Data-agnostic —
 * pass any scope catalog (see the aps-oauth-preset for Autodesk's).
 */
function ScopePicker({
  scopes,
  value,
  onChange,
  presets,
  disabled = false,
  className,
  ...props
}: ScopePickerProps) {
  const baseId = useId()
  const required = scopes.filter((scope) => scope.required).map((scope) => scope.id)
  const selected = new Set([...value, ...required])

  // Required scopes are rendered checked, so keep them in the controlled value
  // too — otherwise a submit with no interaction would omit them. Guarded, so
  // it fires only until the parent's value includes every required scope.
  useEffect(() => {
    if (required.every((id) => value.includes(id))) return
    const merged = new Set([...value, ...required])
    onChange(scopes.filter((scope) => merged.has(scope.id)).map((scope) => scope.id))
  })

  function toggle(scopeId: string, checked: boolean) {
    const next = new Set(selected)
    if (checked) next.add(scopeId)
    else next.delete(scopeId)
    for (const id of required) next.add(id)
    onChange(scopes.filter((scope) => next.has(scope.id)).map((scope) => scope.id))
  }

  function applyPreset(preset: OAuthScopePreset) {
    const next = new Set([...preset.scopes, ...required])
    onChange(scopes.filter((scope) => next.has(scope.id)).map((scope) => scope.id))
  }

  function presetActive(preset: OAuthScopePreset) {
    const target = new Set([...preset.scopes, ...required])
    return target.size === selected.size && [...target].every((id) => selected.has(id))
  }

  return (
    <div data-slot="scope-picker" className={cn('flex flex-col gap-4', className)} {...props}>
      {presets && presets.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {presets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              disabled={disabled}
              onClick={() => applyPreset(preset)}
              title={preset.description}
              className="rounded-4xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
            >
              <Badge variant={presetActive(preset) ? 'default' : 'outline'}>{preset.label}</Badge>
            </button>
          ))}
        </div>
      )}
      <div className="flex flex-col gap-3">
        {scopes.map((scope) => {
          const id = `${baseId}-${scope.id}`
          const isRequired = Boolean(scope.required)
          return (
            <div key={scope.id} className="flex items-start gap-3">
              <Checkbox
                id={id}
                checked={selected.has(scope.id)}
                disabled={disabled || isRequired}
                onCheckedChange={(checked) => toggle(scope.id, checked === true)}
              />
              <div className="grid gap-0.5 leading-none">
                <Label htmlFor={id} className="flex items-center gap-2">
                  {scope.label}
                  <code className="rounded bg-muted px-1 py-px font-mono text-[0.7rem] text-muted-foreground">
                    {scope.id}
                  </code>
                  {isRequired && <span className="text-xs text-muted-foreground">required</span>}
                </Label>
                {scope.description && (
                  <p className="text-xs text-muted-foreground">{scope.description}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export { ScopePicker, type ScopePickerProps }

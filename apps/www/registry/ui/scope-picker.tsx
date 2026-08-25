'use client'

import { PlusIcon, XIcon } from 'lucide-react'
import type * as React from 'react'
import { useId, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { OAuthScope, OAuthScopePreset } from '@/lib/oauth-types'
import { cn } from '@/lib/utils'

/** ScopePicker keeps `value` pure — it never backfills required scopes through
 * `onChange` (a memoizing parent would loop). Call this where the value is
 * used (submit, the authorize URL) so required scopes are never dropped. */
function withRequiredScopes(scopes: OAuthScope[], value: string[]): string[] {
  const required = scopes.filter((scope) => scope.required).map((scope) => scope.id)
  const merged = new Set([...value, ...required])
  const catalogIds = new Set(scopes.map((scope) => scope.id))
  return [
    ...scopes.filter((scope) => merged.has(scope.id)).map((scope) => scope.id),
    ...[...merged].filter((id) => !catalogIds.has(id)),
  ]
}

interface ScopePickerProps extends Omit<React.ComponentProps<'div'>, 'onChange'> {
  scopes: OAuthScope[]
  /** Required scopes render checked whether or not they appear here — union
   * them in at submit time with `withRequiredScopes`. */
  value: string[]
  onChange: (value: string[]) => void
  presets?: OAuthScopePreset[]
  presetsLabel?: string
  collapsibleScopes?: boolean
  scopeListLabel?: string
  allowCustomScopes?: boolean
  customScopeLabel?: string
  disabled?: boolean
}

function ScopePicker({
  scopes,
  value,
  onChange,
  presets,
  presetsLabel = 'Presets',
  collapsibleScopes = false,
  scopeListLabel = 'Advanced permissions',
  allowCustomScopes = false,
  customScopeLabel = 'Add a scope',
  disabled = false,
  className,
  ...props
}: ScopePickerProps) {
  const baseId = useId()
  const [draft, setDraft] = useState('')
  const catalogIds = new Set(scopes.map((scope) => scope.id))
  const required = scopes.filter((scope) => scope.required).map((scope) => scope.id)
  const selected = new Set([...value, ...required])
  const customScopes = value.filter((id) => !catalogIds.has(id))

  function emit(next: Set<string>) {
    onChange([
      ...scopes.filter((scope) => next.has(scope.id)).map((scope) => scope.id),
      ...[...next].filter((id) => !catalogIds.has(id)),
    ])
  }

  function toggle(scopeId: string, checked: boolean) {
    const next = new Set(selected)
    if (checked) next.add(scopeId)
    else next.delete(scopeId)
    for (const id of required) next.add(id)
    emit(next)
  }

  function applyPreset(preset: OAuthScopePreset) {
    emit(new Set([...preset.scopes, ...required, ...customScopes]))
  }

  function presetActive(preset: OAuthScopePreset) {
    const target = new Set([...preset.scopes, ...required, ...customScopes])
    return target.size === selected.size && [...target].every((id) => selected.has(id))
  }

  function addCustomScope() {
    const scopeId = draft.trim()
    if (!scopeId || selected.has(scopeId)) {
      setDraft('')
      return
    }
    emit(new Set([...selected, scopeId]))
    setDraft('')
  }

  const customFieldId = `${baseId}-custom`
  const ScopeControls = collapsibleScopes ? 'details' : 'div'

  return (
    <div data-slot="scope-picker" className={cn('flex flex-col gap-4', className)} {...props}>
      {presets && presets.length > 0 && (
        <fieldset>
          <legend className="mb-2 font-medium text-sm">{presetsLabel}</legend>
          <div
            className={cn('grid gap-2', presets.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2')}
            data-slot="scope-picker-presets"
          >
            {presets.map((preset) => {
              const active = presetActive(preset)
              return (
                <button
                  key={preset.id}
                  type="button"
                  aria-pressed={active}
                  aria-disabled={disabled || undefined}
                  onClick={() => {
                    if (disabled) return
                    applyPreset(preset)
                  }}
                  className={cn(
                    'flex min-h-11 flex-col items-start justify-center gap-0.5 rounded-lg',
                    'border border-border bg-background px-3 py-2 text-left transition-colors',
                    'outline-none focus-visible:border-ring focus-visible:ring-3',
                    'focus-visible:ring-ring/50 hover:bg-muted',
                    'aria-disabled:pointer-events-none aria-disabled:opacity-50',
                    active && 'border-primary bg-primary text-primary-foreground hover:bg-primary',
                  )}
                >
                  <span className="font-medium text-sm">{preset.label}</span>
                  {preset.description && (
                    <span
                      className={cn(
                        'text-xs',
                        active ? 'text-primary-foreground/80' : 'text-muted-foreground',
                      )}
                    >
                      {preset.description}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </fieldset>
      )}
      <ScopeControls
        data-slot={collapsibleScopes ? 'scope-picker-disclosure' : 'scope-picker-controls'}
        className={collapsibleScopes ? 'rounded-lg border border-border bg-muted/30' : undefined}
      >
        {collapsibleScopes && (
          <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-3 px-3 py-2 font-medium text-sm">
            {scopeListLabel}
            <span className="font-normal text-muted-foreground text-xs">
              {selected.size} scopes
            </span>
          </summary>
        )}
        <div
          className={cn(
            'flex flex-col gap-4',
            collapsibleScopes && 'border-border border-t px-3 py-3',
          )}
        >
          <div className="flex flex-col gap-1">
            {scopes.map((scope) => {
              const id = `${baseId}-${scope.id}`
              const descriptionId = scope.description ? `${id}-description` : undefined
              // aria-labelledby, not htmlFor alone: the checkbox primitive is
              // nameless in server markup until its client association wires up.
              const labelId = `${id}-label`
              const isRequired = Boolean(scope.required)
              return (
                <div key={scope.id} className="flex items-start gap-3 py-1.5">
                  <Checkbox
                    id={id}
                    className="mt-1"
                    checked={selected.has(scope.id)}
                    disabled={disabled}
                    // Required scopes stay in the tab order and announce why they
                    // cannot change, instead of vanishing behind `disabled`.
                    aria-disabled={isRequired || undefined}
                    aria-labelledby={labelId}
                    aria-describedby={descriptionId}
                    onCheckedChange={(checked) => {
                      if (isRequired) return
                      toggle(scope.id, checked === true)
                    }}
                  />
                  <div className="flex min-h-9 flex-col justify-center gap-1">
                    <Label id={labelId} htmlFor={id} className="flex-wrap gap-2">
                      {scope.label}
                      {/* status-neutral ink, not muted-foreground: muted ink on
                          bg-muted misses AA on a stock theme. */}
                      <code className="rounded bg-muted px-1 py-px font-mono text-status-neutral text-xs">
                        {scope.id}
                      </code>
                      {isRequired && (
                        <span className="text-muted-foreground text-xs">required</span>
                      )}
                    </Label>
                    {scope.description && (
                      <p id={descriptionId} className="text-muted-foreground text-xs">
                        {scope.description}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
            {customScopes.map((scopeId) => (
              <div key={scopeId} className="flex items-start gap-3 py-1.5">
                <Checkbox
                  id={`${baseId}-custom-${scopeId}`}
                  className="mt-1"
                  checked
                  disabled={disabled}
                  aria-labelledby={`${baseId}-custom-${scopeId}-label`}
                  onCheckedChange={() => toggle(scopeId, false)}
                />
                <div className="flex min-h-9 flex-1 flex-col justify-center gap-1">
                  <Label
                    id={`${baseId}-custom-${scopeId}-label`}
                    htmlFor={`${baseId}-custom-${scopeId}`}
                    className="flex-wrap gap-2"
                  >
                    <code className="rounded bg-muted px-1 py-px font-mono text-status-neutral text-xs">
                      {scopeId}
                    </code>
                    <Badge variant="outline">custom</Badge>
                  </Label>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-11 shrink-0"
                  disabled={disabled}
                  onClick={() => toggle(scopeId, false)}
                >
                  <XIcon />
                  <span className="sr-only">Remove {scopeId}</span>
                </Button>
              </div>
            ))}
          </div>
          {allowCustomScopes && (
            <div className="flex flex-col gap-2" data-slot="scope-picker-custom">
              <Label htmlFor={customFieldId}>{customScopeLabel}</Label>
              <div className="flex items-start gap-2">
                <Input
                  id={customFieldId}
                  value={draft}
                  disabled={disabled}
                  placeholder="data:read:urn:adsk.wipprod:dm.lineage:abc"
                  aria-describedby={`${customFieldId}-hint`}
                  className="min-h-11 flex-1 font-mono"
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key !== 'Enter') return
                    event.preventDefault()
                    addCustomScope()
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="min-h-11 gap-2 px-4"
                  disabled={disabled || draft.trim().length === 0}
                  onClick={addCustomScope}
                >
                  <PlusIcon />
                  Add
                </Button>
              </div>
              <p id={`${customFieldId}-hint`} className="text-muted-foreground text-xs">
                Scopes outside the catalog — granular resource scopes, or anything this provider
                added since. Sent verbatim.
              </p>
            </div>
          )}
        </div>
      </ScopeControls>
    </div>
  )
}

export { ScopePicker, type ScopePickerProps, withRequiredScopes }

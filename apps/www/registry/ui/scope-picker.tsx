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

/**
 * Union of a picker value with the catalog's required scopes, in catalog order
 * with custom scopes appended.
 *
 * `ScopePicker` keeps `value` pure — it never calls `onChange` on mount to
 * backfill required scopes, because a parent that memoizes or filters would
 * loop. Call this where the value is actually used (submit, or building the
 * authorize URL) so required scopes are never silently dropped.
 */
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
  /**
   * Selected scope ids. Controlled, and taken literally: required scopes are
   * rendered checked whether or not they appear here. Union them in at submit
   * time with `withRequiredScopes`.
   */
  value: string[]
  onChange: (value: string[]) => void
  /** Named bundles shown as one-click presets above the list. */
  presets?: OAuthScopePreset[]
  /**
   * Let the user enter a scope that is not in the catalog — granular scopes
   * like `data:read:<urn>`, or anything the provider added after this catalog
   * was written. Custom scopes round-trip through value / onChange like any
   * other and render distinguishably.
   */
  allowCustomScopes?: boolean
  /** Label for the custom-scope field. */
  customScopeLabel?: string
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
  // Anything selected that the catalog does not describe, in the order it was added.
  const customScopes = value.filter((id) => !catalogIds.has(id))

  /** Emit in catalog order, with custom scopes trailing in insertion order. */
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

  return (
    <div data-slot="scope-picker" className={cn('flex flex-col gap-4', className)} {...props}>
      {presets && presets.length > 0 && (
        <fieldset>
          <legend className="mb-2 font-medium text-sm">Presets</legend>
          <div className="grid gap-2 sm:grid-cols-2" data-slot="scope-picker-presets">
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
      <div className="flex flex-col gap-1">
        {scopes.map((scope) => {
          const id = `${baseId}-${scope.id}`
          const descriptionId = scope.description ? `${id}-description` : undefined
          // The checkbox renders as a role="checkbox" element next to its own
          // hidden input, so `htmlFor` alone leaves it nameless until the
          // primitive wires the association up on the client. Naming it
          // explicitly means it is named in the server markup too.
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
                  {/* Foreground at 60% rather than muted-foreground: on a stock
                      shadcn theme muted ink on bg-muted measures 4.35:1, under
                      AA. This renders within a shade of the same gray and
                      clears 5:1 on any theme whose foreground contrasts its own
                      muted surface. */}
                  <code className="rounded bg-muted px-1 py-px font-mono text-foreground/60 text-xs">
                    {scope.id}
                  </code>
                  {isRequired && <span className="text-muted-foreground text-xs">required</span>}
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
                <code className="rounded bg-muted px-1 py-px font-mono text-foreground/60 text-xs">
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
            Scopes outside the catalog — granular resource scopes, or anything this provider added
            since. Sent verbatim.
          </p>
        </div>
      )}
    </div>
  )
}

export { ScopePicker, type ScopePickerProps, withRequiredScopes }

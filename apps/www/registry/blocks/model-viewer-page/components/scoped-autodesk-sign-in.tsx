'use client'

import type { ReactNode } from 'react'
import { useState } from 'react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ProviderSignInLink } from '@/components/ui/provider-sign-in-button'
import { ScopePicker, withRequiredScopes } from '@/components/ui/scope-picker'
import { apsProvider, apsScopeCatalog, apsScopePresets } from '@/lib/aps-oauth-preset'
import type { OAuthScopePreset } from '@/lib/oauth-types'

const REQUIRED_SCOPE_IDS = new Set(['user-profile:read', 'data:read', 'viewables:read'])
const OPTIONAL_SCOPE_IDS = new Set(['data:write', 'data:create', 'account:read', 'account:write'])

const modelViewerScopes = apsScopeCatalog
  .filter((scope) => REQUIRED_SCOPE_IDS.has(scope.id) || OPTIONAL_SCOPE_IDS.has(scope.id))
  .map((scope) => (REQUIRED_SCOPE_IDS.has(scope.id) ? { ...scope, required: true } : scope))

const modelViewerPresets: OAuthScopePreset[] = apsScopePresets
  .filter((preset) => ['viewer', 'data-write', 'account-admin'].includes(preset.id))
  .map((preset) => {
    if (preset.id === 'viewer') {
      return {
        ...preset,
        label: 'View models',
        description: 'Browse projects and view translated models.',
      }
    }
    if (preset.id === 'data-write') {
      return {
        ...preset,
        label: 'Manage files',
        description: 'Create and update project files and folders.',
      }
    }
    return {
      ...preset,
      label: 'Account administration',
      description: 'Read and manage ACC account settings.',
    }
  })

interface ScopedAutodeskSignInProps {
  nextPath: string
  title?: ReactNode
  titleAs?: 'h1' | 'h2' | 'h3'
  description?: ReactNode
}

function ScopedAutodeskSignIn({
  nextPath,
  title = 'Connect Autodesk',
  titleAs: Title = 'h1',
  description = 'Choose the access this workspace should request.',
}: ScopedAutodeskSignInProps) {
  const [value, setValue] = useState<string[]>(modelViewerPresets[0]?.scopes ?? [])
  const selectedScopes = withRequiredScopes(modelViewerScopes, value)
  const params = new URLSearchParams({ next: nextPath, scopes: selectedScopes.join(' ') })
  const signInHref = `/api/auth/${apsProvider.id}?${params}`

  return (
    <Card data-slot="scoped-autodesk-sign-in" className="w-full max-w-2xl">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">
          <Title>{title}</Title>
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <ScopePicker
          scopes={modelViewerScopes}
          value={value}
          onChange={setValue}
          presets={modelViewerPresets}
          presetsLabel="Access level"
          collapsibleScopes
        />

        <ProviderSignInLink provider={apsProvider} href={signInHref}>
          Continue with Autodesk
        </ProviderSignInLink>
        <p className="text-center text-muted-foreground text-xs">
          Autodesk will show these permissions again before granting access.
        </p>
      </CardContent>
    </Card>
  )
}

export { ScopedAutodeskSignIn }

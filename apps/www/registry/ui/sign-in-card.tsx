'use client'

import type * as React from 'react'
import { useState } from 'react'

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ProviderSignInButton } from '@/components/ui/provider-sign-in-button'
import type { OAuthProvider } from '@/lib/oauth-types'
import { cn } from '@/lib/utils'

interface SignInCardProps extends Omit<React.ComponentProps<typeof Card>, 'title'> {
  providers: OAuthProvider[]
  /**
   * Href for a provider's auth route. "{provider}" is replaced with the
   * provider id, e.g. "/api/auth/{provider}". Serializable, so the card can be
   * rendered from a server component.
   */
  hrefTemplate?: string
  /** Click handler alternative to hrefTemplate, for client-side flows. */
  onSignIn?: (providerId: string) => void | Promise<void>
  /** Id of the provider currently authenticating, to show its spinner. */
  loadingProvider?: string
  title?: React.ReactNode
  /**
   * Heading element for the title. A card dropped onto a page needs a real
   * heading, not a styled div — pick the level that fits the page outline, or
   * pass "div" to opt out when the surrounding page already provides one.
   */
  titleAs?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'div'
  description?: React.ReactNode
  footer?: React.ReactNode
}

/**
 * A multi-provider sign-in chooser. Data-agnostic: pass any providers and
 * either an hrefTemplate (server-rendered flows) or an onSignIn callback.
 */
function SignInCard({
  providers,
  hrefTemplate,
  onSignIn,
  loadingProvider,
  title = 'Sign in',
  titleAs: TitleTag = 'h2',
  description,
  footer,
  className,
  ...props
}: SignInCardProps) {
  const [pendingProvider, setPendingProvider] = useState<string>()
  // Consumer-driven pending wins; otherwise an async onSignIn drives it.
  const activeProvider = loadingProvider ?? pendingProvider

  function handleSignIn(providerId: string) {
    const result = onSignIn?.(providerId)
    if (!(result instanceof Promise)) return
    setPendingProvider(providerId)
    result.then(
      () => setPendingProvider(undefined),
      () => setPendingProvider(undefined),
    )
  }

  return (
    <Card data-slot="sign-in-card" className={cn('w-full max-w-sm', className)} {...props}>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">
          <TitleTag>{title}</TitleTag>
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {providers.map((provider) => {
          const href = hrefTemplate?.replaceAll('{provider}', provider.id)
          const loading = activeProvider === provider.id
          // One OAuth flow at a time: a second redirect would race the first.
          const disabled = activeProvider !== undefined && !loading

          return href !== undefined ? (
            <ProviderSignInButton
              key={provider.id}
              provider={provider}
              href={href}
              loading={loading}
              disabled={disabled}
            />
          ) : (
            <ProviderSignInButton
              key={provider.id}
              provider={provider}
              onSignIn={onSignIn ? () => handleSignIn(provider.id) : undefined}
              loading={loading}
              disabled={disabled}
            />
          )
        })}
      </CardContent>
      {footer && (
        <CardFooter className="justify-center text-center text-xs text-muted-foreground">
          {footer}
        </CardFooter>
      )}
    </Card>
  )
}

export { SignInCard, type SignInCardProps }

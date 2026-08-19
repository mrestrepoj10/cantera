'use client'

import type * as React from 'react'

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
  description,
  footer,
  className,
  ...props
}: SignInCardProps) {
  return (
    <Card data-slot="sign-in-card" className={cn('w-full max-w-sm', className)} {...props}>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {providers.map((provider) => (
          <ProviderSignInButton
            key={provider.id}
            provider={provider}
            href={hrefTemplate?.replaceAll('{provider}', provider.id)}
            onSignIn={onSignIn ? () => onSignIn(provider.id) : undefined}
            loading={loadingProvider === provider.id}
          />
        ))}
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

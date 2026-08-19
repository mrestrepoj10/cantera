'use client'

import { LoaderCircleIcon } from 'lucide-react'
import type * as React from 'react'

import { buttonVariants } from '@/components/ui/button'
import type { OAuthProvider } from '@/lib/oauth-types'
import { cn } from '@/lib/utils'

interface ProviderSignInButtonProps extends React.ComponentProps<'button'> {
  provider: OAuthProvider
  /** Navigate to an auth route instead of handling a click. Renders an anchor. */
  href?: string
  /** Called with no arguments when the button is clicked. Ignored when href is set. */
  onSignIn?: () => void | Promise<void>
  loading?: boolean
  variant?: 'default' | 'outline' | 'secondary'
  size?: 'default' | 'sm' | 'lg'
}

/**
 * A sign-in button for a single OAuth provider: brand icon, label, and a
 * loading state. Works for any provider — pass an OAuthProvider shape.
 */
function ProviderSignInButton({
  provider,
  href,
  onSignIn,
  loading = false,
  variant = 'outline',
  size = 'lg',
  className,
  children,
  disabled,
  ...props
}: ProviderSignInButtonProps) {
  const content = (
    <>
      {loading ? (
        <LoaderCircleIcon aria-hidden className="animate-spin" />
      ) : (
        provider.icon && (
          <span aria-hidden className="flex [&_svg]:size-4 [&_svg]:shrink-0">
            {provider.icon}
          </span>
        )
      )}
      {children ?? `Continue with ${provider.name}`}
    </>
  )

  const classes = cn(buttonVariants({ variant, size }), 'w-full justify-center gap-2', className)

  if (href && !loading && !disabled) {
    return (
      <a data-slot="provider-sign-in-button" href={href} className={classes}>
        {content}
      </a>
    )
  }

  return (
    <button
      data-slot="provider-sign-in-button"
      type="button"
      className={classes}
      disabled={disabled || loading}
      onClick={onSignIn ? () => void onSignIn() : undefined}
      {...props}
    >
      {content}
    </button>
  )
}

export { ProviderSignInButton, type ProviderSignInButtonProps }

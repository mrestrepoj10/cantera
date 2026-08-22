'use client'

import { LoaderCircleIcon } from 'lucide-react'
import type * as React from 'react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import type { OAuthProvider } from '@/lib/oauth-types'
import { cn } from '@/lib/utils'

interface ProviderSignInButtonBaseProps {
  provider: OAuthProvider
  /**
   * Pending: the control stays mounted, keeps its label, and crossfades its
   * icon to a spinner. Drive it from a server action, or let the component
   * derive it from an `onSignIn` that returns a promise.
   */
  loading?: boolean
  /**
   * Rendered as `aria-disabled`, never the native attribute, so the control
   * keeps focus and stays discoverable to a screen reader.
   */
  disabled?: boolean
  variant?: 'default' | 'outline' | 'secondary' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
}

/**
 * One element per mode, in every state: with `href` this is always an anchor —
 * loading included — and without it always a button. Props are forwarded to
 * whichever element renders, and typed for it.
 */
type ProviderSignInButtonProps = ProviderSignInButtonBaseProps &
  (
    | ({
        /** Navigate to an auth route instead of handling a click. Renders an anchor. */
        href: string
        onSignIn?: never
      } & Omit<React.ComponentProps<'a'>, 'href'>)
    | ({
        href?: never
        /** Called with no arguments when the button is clicked. */
        onSignIn?: () => void | Promise<void>
      } & Omit<React.ComponentProps<'button'>, 'disabled'>)
  )

/** Thenable check, not `instanceof Promise`: a polyfilled or cross-realm
 * promise is still a pending round trip the button must reflect. */
function isPromiseLike(value: void | Promise<void>): value is Promise<void> {
  return value != null && typeof (value as Promise<void>).then === 'function'
}

/**
 * The icon slot is always reserved — same box whether the provider has a mark
 * or not — so starting a sign-in never shifts the label. Icon and spinner
 * stack in one grid cell and crossfade over 150ms.
 */
function ProviderSignInIcon({ provider, loading }: { provider: OAuthProvider; loading: boolean }) {
  return (
    <span aria-hidden className="grid size-4 shrink-0 place-items-center">
      {/* The spin lives on a wrapper: transform animations on the <svg>
          itself skip the compositor in some engines. */}
      <span className="col-start-1 row-start-1 grid size-4 animate-spin place-items-center">
        <LoaderCircleIcon
          className={cn(
            'size-4 transition-opacity duration-150 ease-out',
            loading ? 'opacity-100' : 'opacity-0',
          )}
        />
      </span>
      {provider.icon && (
        <span
          className={cn(
            'col-start-1 row-start-1 flex transition-opacity duration-150 ease-out',
            '[&_svg]:size-4 [&_svg]:shrink-0',
            loading ? 'opacity-0' : 'opacity-100',
          )}
        >
          {provider.icon}
        </span>
      )}
    </span>
  )
}

/**
 * A sign-in button for a single OAuth provider: brand icon, label, and a
 * pending state. Works for any provider — pass an OAuthProvider shape.
 */
function ProviderSignInButton(props: ProviderSignInButtonProps) {
  const [asyncPending, setAsyncPending] = useState(false)
  const {
    provider,
    loading = false,
    disabled = false,
    variant = 'outline',
    size = 'lg',
    className,
    children,
  } = props

  const pending = loading || asyncPending
  const inert = pending || disabled
  const label = children ?? `Continue with ${provider.name}`
  const classes = cn(
    'w-full justify-center gap-2',
    // 44px minimum touch target: this is a primary action, used with gloves on
    // a tablet. `size="sm"` is the opt-in compact escape hatch.
    size !== 'sm' && 'min-h-11',
    'aria-disabled:pointer-events-none',
    disabled && !pending && 'opacity-50',
    className,
  )
  const icon = <ProviderSignInIcon provider={provider} loading={pending} />

  if (props.href !== undefined) {
    const {
      provider: _provider,
      loading: _loading,
      disabled: _disabled,
      variant: _variant,
      size: _size,
      className: _className,
      children: _children,
      onSignIn: _onSignIn,
      href,
      ...anchorProps
    } = props

    return (
      <Button
        // The anchor stays an anchor while loading. `focusableWhenDisabled`
        // renders aria-disabled instead of dropping the element, and blocks
        // both the pointer and the Enter key without dumping focus.
        render={<a {...anchorProps} href={href} />}
        nativeButton={false}
        // The primitive assumes button semantics for a non-native element;
        // this is a navigation link, so keep the link role it earns from href.
        role="link"
        disabled={inert}
        focusableWhenDisabled
        data-slot="provider-sign-in-button"
        aria-busy={pending || undefined}
        variant={variant}
        size={size}
        className={classes}
      >
        {icon}
        {label}
      </Button>
    )
  }

  const {
    provider: _provider,
    loading: _loading,
    disabled: _disabled,
    variant: _variant,
    size: _size,
    className: _className,
    children: _children,
    href: _href,
    onSignIn,
    ...buttonProps
  } = props

  return (
    <Button
      type="button"
      {...buttonProps}
      disabled={inert}
      focusableWhenDisabled
      data-slot="provider-sign-in-button"
      aria-busy={pending || undefined}
      variant={variant}
      size={size}
      className={classes}
      onClick={(event) => {
        buttonProps.onClick?.(event)
        const result = onSignIn?.()
        if (!isPromiseLike(result)) return
        setAsyncPending(true)
        result.then(
          () => setAsyncPending(false),
          () => setAsyncPending(false),
        )
      }}
    >
      {icon}
      {label}
    </Button>
  )
}

export { ProviderSignInButton, type ProviderSignInButtonProps }

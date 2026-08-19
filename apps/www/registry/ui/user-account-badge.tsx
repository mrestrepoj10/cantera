import type * as React from 'react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { accountInitials, type OAuthAccount, type OAuthProvider } from '@/lib/oauth-types'
import { cn } from '@/lib/utils'

interface UserAccountBadgeProps extends React.ComponentProps<'div'> {
  account: OAuthAccount
  /** When set, the provider mark is shown next to the account. */
  provider?: OAuthProvider
  size?: 'sm' | 'default'
}

/**
 * An avatar-and-name chip for a connected account. Server-safe: no handlers,
 * plain data in.
 */
function UserAccountBadge({
  account,
  provider,
  size = 'default',
  className,
  ...props
}: UserAccountBadgeProps) {
  return (
    <div
      data-slot="user-account-badge"
      className={cn('flex min-w-0 items-center gap-2', className)}
      {...props}
    >
      <Avatar className={size === 'sm' ? 'size-6' : 'size-8'}>
        {account.avatarUrl && <AvatarImage src={account.avatarUrl} alt="" />}
        <AvatarFallback className={size === 'sm' ? 'text-[0.6rem]' : 'text-xs'}>
          {accountInitials(account)}
        </AvatarFallback>
      </Avatar>
      <div className="grid min-w-0 leading-tight">
        <span className={cn('truncate font-medium', size === 'sm' ? 'text-xs' : 'text-sm')}>
          {account.name ?? account.email ?? 'Unknown account'}
        </span>
        {account.name && account.email && (
          <span className="truncate text-xs text-muted-foreground">{account.email}</span>
        )}
      </div>
      {provider?.icon && (
        <span
          role="img"
          aria-label={provider.name}
          title={provider.name}
          className="ml-auto flex text-muted-foreground [&_svg]:size-3.5 [&_svg]:shrink-0"
        >
          {provider.icon}
        </span>
      )}
    </div>
  )
}

export { UserAccountBadge, type UserAccountBadgeProps }

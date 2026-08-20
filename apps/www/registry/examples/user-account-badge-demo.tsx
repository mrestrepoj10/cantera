import { UserAccountBadge } from '@/components/ui/user-account-badge'
import { apsProvider } from '@/lib/aps-oauth-preset'

/** Server-safe: no state, no effects, nothing to hydrate. */
export function UserAccountBadgeDemo() {
  return (
    <div className="flex w-full flex-col gap-4">
      <UserAccountBadge
        account={{ name: 'Dana Alvarez', email: 'dana@ridgelinebuilders.com' }}
        provider={apsProvider}
      />
      <UserAccountBadge account={{ name: 'Luis Ibarra' }} size="sm" />
      {/* No name, no avatar: the badge falls back to the email. */}
      <UserAccountBadge account={{ email: 'inspector@citypermits.gov' }} size="sm" />
    </div>
  )
}

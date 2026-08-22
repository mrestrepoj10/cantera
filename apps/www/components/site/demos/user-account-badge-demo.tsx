'use client'

import { procoreProvider, sampleAccount, sampleForeman } from '@/components/site/sample-data'
import { UserAccountBadge } from '@/components/ui/user-account-badge'
import { apsProvider } from '@/lib/aps-oauth-preset'

export function UserAccountBadgeDemo() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-4">
      <UserAccountBadge account={sampleAccount} provider={apsProvider} />
      <UserAccountBadge account={sampleForeman} provider={procoreProvider} size="sm" />
      <UserAccountBadge account={{ email: 'inspector@citypermits.gov' }} size="sm" />
    </div>
  )
}

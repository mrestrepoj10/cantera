'use client'

import { Button } from '@/components/ui/button'
import { ProvisioningNotice } from '@/components/ui/provisioning-notice'

export function ProvisioningNoticeDemo() {
  return (
    <ProvisioningNotice
      appName="Summit Field"
      clientId="Q2xpZW50SWRGb3JTdW1taXRUb3dlcg"
      footer={
        <Button type="button" variant="ghost" size="sm">
          Disconnect Autodesk account
        </Button>
      }
    />
  )
}

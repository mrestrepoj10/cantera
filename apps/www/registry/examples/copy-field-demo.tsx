'use client'

import { CopyField } from '@/components/ui/copy-field'

export function CopyFieldDemo() {
  return (
    <div className="flex w-full flex-col gap-4">
      <CopyField label="client ID" value="Q2xpZW50SWRGb3JTdW1taXRUb3dlcg" />
      <CopyField label="callback URL" value="https://summit-tower.example/api/auth/callback/aps" />
    </div>
  )
}

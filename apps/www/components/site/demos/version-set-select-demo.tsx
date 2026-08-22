'use client'

import { useState } from 'react'
import { VersionSetSelect } from '@/components/ui/version-set-select'
import type { SheetVersionSet } from '@/lib/project-types'

const demoVersionSets: SheetVersionSet[] = [
  { id: 'vs-ifc-03', name: 'IFC 2026-03', issuanceDate: '2026-03-12' },
  { id: 'vs-permit', name: 'Permit Set', issuanceDate: '2025-11-04' },
  { id: 'vs-gmp', name: 'GMP Set', issuanceDate: '2025-08-22' },
]

export function VersionSetSelectDemo() {
  const [versionSetId, setVersionSetId] = useState('vs-ifc-03')

  return (
    <VersionSetSelect
      versionSets={demoVersionSets}
      value={versionSetId}
      onValueChange={setVersionSetId}
    />
  )
}

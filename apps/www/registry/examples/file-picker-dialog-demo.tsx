'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { FilePickerDialog } from '@/components/ui/file-picker-dialog'
import type { BrowsePathSegment, Folder, Item, ItemVersion } from '@/lib/project-types'

const path: BrowsePathSegment[] = [
  { id: 'b.ridgeline-us', name: 'Ridgeline Builders', type: 'hub' },
  { id: 'b.summit-tower', name: 'Summit Tower', type: 'project' },
  { id: 'folder-project-files', name: 'Project Files', type: 'folder' },
]

const designFolder: Folder = {
  id: 'folder-design',
  name: 'Design',
  type: 'folder',
  objectCount: 4,
  lastModifiedTime: '2026-08-21T13:10:00.000Z',
  modifiedBy: 'Luis Romero',
}

const version: ItemVersion = {
  id: 'version-model-7',
  versionNumber: 7,
  displayName: 'Summit Tower Coordination.rvt',
  createTime: '2026-08-21T13:10:00.000Z',
  createdBy: 'Luis Romero',
  storageSize: 184_200_000,
  derivativeUrn: 'dXJuOmFkc2sud2lwcHJvZDpmcy5maWxlOnZlcnNpb24tbW9kZWwtNw',
}

const item: Item = {
  id: 'item-model',
  name: version.displayName,
  type: 'item',
  lastModifiedTime: version.createTime,
  modifiedBy: version.createdBy,
  tip: version,
  translationStatus: 'success',
}

export function FilePickerDialogDemo() {
  const [selection, setSelection] = useState('No file selected.')

  return (
    <div className="flex flex-col items-start gap-3">
      <FilePickerDialog
        path={path}
        entries={[designFolder, item]}
        trigger={<Button className="min-h-11">Choose a model</Button>}
        onSelect={(selected, selectedVersion) => {
          setSelection(
            `${selected.name} — ${selectedVersion ? `version ${selectedVersion.versionNumber}` : 'tip'}`,
          )
        }}
      />
      <output className="text-muted-foreground text-xs">{selection}</output>
    </div>
  )
}

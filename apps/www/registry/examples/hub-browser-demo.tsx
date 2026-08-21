'use client'

import { useState } from 'react'

import {
  HubBrowser,
  type HubBrowserVersions,
  ROOT_BROWSE_SEGMENT,
} from '@/components/ui/hub-browser'
import type {
  BrowsePathSegment,
  Folder,
  FolderEntry,
  Hub,
  Item,
  ItemVersion,
  Project,
} from '@/lib/project-types'

const hub: Hub = { id: 'b.ridgeline-us', name: 'Ridgeline Builders', region: 'US' }
const projects: Project[] = [
  { id: 'b.summit-tower', name: 'Summit Tower', hubId: hub.id },
  { id: 'b.cedar-mill', name: 'Cedar Mill Campus', hubId: hub.id },
]
const projectFiles: Folder = {
  id: 'folder-project-files',
  name: 'Project Files',
  type: 'folder',
  objectCount: 3,
  lastModifiedTime: '2026-08-21T14:20:00.000Z',
  modifiedBy: 'Maya Chen',
}
const designFolder: Folder = {
  id: 'folder-design',
  name: 'Design',
  type: 'folder',
  objectCount: 2,
  lastModifiedTime: '2026-08-21T13:10:00.000Z',
  modifiedBy: 'Luis Romero',
}

const modelVersions: ItemVersion[] = [
  {
    id: 'version-model-7',
    versionNumber: 7,
    displayName: 'Summit Tower Coordination.rvt',
    createTime: '2026-08-21T13:10:00.000Z',
    createdBy: 'Luis Romero',
    storageSize: 184_200_000,
    derivativeUrn: 'dXJuOmFkc2sud2lwcHJvZDpmcy5maWxlOnZlcnNpb24tbW9kZWwtNw',
  },
  {
    id: 'version-model-6',
    versionNumber: 6,
    displayName: 'Summit Tower Coordination.rvt',
    createTime: '2026-08-18T16:40:00.000Z',
    createdBy: 'Luis Romero',
    storageSize: 181_900_000,
    derivativeUrn: 'dXJuOmFkc2sud2lwcHJvZDpmcy5maWxlOnZlcnNpb24tbW9kZWwtNg',
  },
  {
    id: 'version-model-5',
    versionNumber: 5,
    displayName: 'Summit Tower Coordination.rvt',
    createTime: '2026-08-14T11:25:00.000Z',
    createdBy: 'Luis Romero',
    storageSize: 179_600_000,
    derivativeUrn: null,
  },
]

const model: Item = {
  id: 'item-model',
  name: 'Summit Tower Coordination.rvt',
  type: 'item',
  lastModifiedTime: modelVersions[0]?.createTime,
  modifiedBy: modelVersions[0]?.createdBy,
  tip: modelVersions[0],
  translationStatus: 'success',
}
const logistics: Item = {
  id: 'item-logistics',
  name: 'Site Logistics Plan.pdf',
  type: 'item',
  lastModifiedTime: '2026-08-20T18:05:00.000Z',
  modifiedBy: 'Maya Chen',
  tip: {
    id: 'version-logistics-3',
    versionNumber: 3,
    displayName: 'Site Logistics Plan.pdf',
    createTime: '2026-08-20T18:05:00.000Z',
    createdBy: 'Maya Chen',
    storageSize: 8_450_000,
    derivativeUrn: null,
  },
  translationStatus: 'pending',
}

const hubSegment: BrowsePathSegment = { id: hub.id, name: hub.name, type: 'hub' }
const projectSegment: BrowsePathSegment = {
  id: projects[0]?.id ?? '',
  name: projects[0]?.name ?? '',
  type: 'project',
}
const filesSegment: BrowsePathSegment = {
  id: projectFiles.id,
  name: projectFiles.name,
  type: 'folder',
}
const designSegment: BrowsePathSegment = {
  id: designFolder.id,
  name: designFolder.name,
  type: 'folder',
}

function wait(ms = 650): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

export function HubBrowserDemo() {
  const [path, setPath] = useState<BrowsePathSegment[]>([hubSegment, projectSegment, filesSegment])
  const [entries, setEntries] = useState<FolderEntry[]>([designFolder, logistics])
  const [versions, setVersions] = useState<HubBrowserVersions>()
  const [opened, setOpened] = useState('Nothing opened yet.')

  async function navigate(segment: BrowsePathSegment): Promise<void> {
    await wait()
    if (segment.id === ROOT_BROWSE_SEGMENT.id) {
      setPath([])
      setEntries([hub])
      return
    }
    if (segment.type === 'hub') {
      setPath([hubSegment])
      setEntries(projects)
      return
    }
    if (segment.type === 'project') {
      setPath([hubSegment, { ...segment, type: 'project' }])
      setEntries([projectFiles])
      return
    }
    if (segment.id === projectFiles.id) {
      setPath([hubSegment, projectSegment, filesSegment])
      setEntries([designFolder, logistics])
      return
    }
    setPath([hubSegment, projectSegment, filesSegment, designSegment])
    setEntries([model])
  }

  return (
    <div className="flex w-full flex-col gap-3">
      <HubBrowser
        path={path}
        entries={entries}
        title="Summit Tower files"
        titleAs="h3"
        versions={versions}
        onNavigate={navigate}
        onRequestVersions={async (itemId) => {
          setVersions({ itemId, status: 'loading', versions: [] })
          await wait()
          setVersions({
            itemId,
            status: 'ready',
            versions: itemId === model.id ? modelVersions : [logistics.tip as ItemVersion],
          })
        }}
        onItemOpen={async (item, version) => {
          await wait()
          setOpened(`${item.name} — ${version ? `version ${version.versionNumber}` : 'tip'}`)
        }}
      />
      <output className="text-muted-foreground text-xs">{opened}</output>
    </div>
  )
}

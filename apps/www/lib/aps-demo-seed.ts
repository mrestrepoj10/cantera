import type { ApsManifestDerivative, ApsSeedConfig } from '@emulators/aps'

const DEMO_USER_EMAILS = ['maria@builders.example', 'sam@builders.example']

// ACC Sheets refuses non-members, so grant membership in the emulator's own
// default projects or that hub answers 403 on every project.
const EMULATOR_DEFAULT_PROJECT_IDS = ['b.emulate-project', 'b.emulate-infrastructure']

interface DemoSheet {
  number: string
  title: string
  design: string
}

interface DemoVersionSet {
  id: string
  name: string
  issuanceDate: string
  sheets: DemoSheet[]
}

interface DemoProject {
  id: string
  hubId: string
  name: string
  versionSets: DemoVersionSet[]
}

// base64url of `urn:adsk.objects:os.object:cantera-demo/<file>` — the form APS
// keys manifests on. A design absent from `demoManifests` renders as queued
// (the manifest endpoint 404s).
interface UrnByFileName {
  [fileName: string]: string
}

const designUrns: UrnByFileName = {
  'summit-tower-arch.rvt':
    'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6Y2FudGVyYS1kZW1vL3N1bW1pdC10b3dlci1hcmNoLnJ2dA',
  'summit-tower-struct.rvt':
    'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6Y2FudGVyYS1kZW1vL3N1bW1pdC10b3dlci1zdHJ1Y3QucnZ0',
  'summit-tower-permit.pdf':
    'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6Y2FudGVyYS1kZW1vL3N1bW1pdC10b3dlci1wZXJtaXQucGRm',
  'summit-tower-gmp.pdf':
    'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6Y2FudGVyYS1kZW1vL3N1bW1pdC10b3dlci1nbXAucGRm',
  'cedar-mill-site.nwd':
    'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6Y2FudGVyYS1kZW1vL2NlZGFyLW1pbGwtc2l0ZS5ud2Q',
  'cedar-mill-mep.rvt':
    'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6Y2FudGVyYS1kZW1vL2NlZGFyLW1pbGwtbWVwLnJ2dA',
  'cedar-mill-arch.rvt':
    'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6Y2FudGVyYS1kZW1vL2NlZGFyLW1pbGwtYXJjaC5ydnQ',
  'dockside-demo.rvt':
    'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6Y2FudGVyYS1kZW1vL2RvY2tzaWRlLWRlbW8ucnZ0',
  'dockside-notes.pdf':
    'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6Y2FudGVyYS1kZW1vL2RvY2tzaWRlLW5vdGVzLnBkZg',
  'harbor-point-struct.rvt':
    'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6Y2FudGVyYS1kZW1vL2hhcmJvci1wb2ludC1zdHJ1Y3QucnZ0',
  'harbor-point-elec.dwg':
    'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6Y2FudGVyYS1kZW1vL2hhcmJvci1wb2ludC1lbGVjLmR3Zw',
  'harbor-point-arch.rvt':
    'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6Y2FudGVyYS1kZW1vL2hhcmJvci1wb2ludC1hcmNoLnJ2dA',
  'kanalhaus-west-arch.rvt':
    'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6Y2FudGVyYS1kZW1vL2thbmFsaGF1cy13ZXN0LWFyY2gucnZ0',
  'kanalhaus-west-concept.pdf':
    'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6Y2FudGVyYS1kZW1vL2thbmFsaGF1cy13ZXN0LWNvbmNlcHQucGRm',
}

// The emulator seeds its own hub first; without this a first-time visitor
// lands on its sample projects instead of the seeded account.
export const DEMO_LANDING_HUB_ID = 'b.ridgeline-us'

const demoHubs: NonNullable<ApsSeedConfig['hubs']> = [
  { id: DEMO_LANDING_HUB_ID, name: 'Ridgeline Builders', region: 'US' },
  { id: 'b.ridgeline-emea', name: 'Ridgeline Europe', region: 'EMEA' },
]

const demoProjects: DemoProject[] = [
  {
    id: 'b.summit-tower',
    hubId: 'b.ridgeline-us',
    name: 'Summit Tower',
    versionSets: [
      {
        id: 'vs-summit-ifc-2603',
        name: 'IFC 2026-03',
        issuanceDate: '2026-03-12',
        sheets: [
          { number: 'A-101', title: 'Level 1 Floor Plan', design: 'summit-tower-arch.rvt' },
          { number: 'A-102', title: 'Level 2 Floor Plan', design: 'summit-tower-arch.rvt' },
          { number: 'S-201', title: 'Core Wall Elevations', design: 'summit-tower-struct.rvt' },
        ],
      },
      {
        id: 'vs-summit-permit',
        name: 'Permit Set',
        issuanceDate: '2025-11-04',
        sheets: [
          { number: 'A-001', title: 'Cover Sheet', design: 'summit-tower-permit.pdf' },
          { number: 'A-101', title: 'Level 1 Floor Plan', design: 'summit-tower-permit.pdf' },
        ],
      },
      {
        id: 'vs-summit-gmp',
        name: 'GMP Set',
        issuanceDate: '2025-08-22',
        sheets: [{ number: 'G-001', title: 'Drawing Index', design: 'summit-tower-gmp.pdf' }],
      },
    ],
  },
  {
    id: 'b.cedar-mill',
    hubId: 'b.ridgeline-us',
    name: 'Cedar Mill Campus',
    versionSets: [
      {
        id: 'vs-cedar-ifc-2605',
        name: 'IFC 2026-05',
        issuanceDate: '2026-05-08',
        sheets: [
          { number: 'C-101', title: 'Overall Site Plan', design: 'cedar-mill-site.nwd' },
          { number: 'M-301', title: 'Mechanical Roof Plan', design: 'cedar-mill-mep.rvt' },
        ],
      },
      {
        id: 'vs-cedar-bid',
        name: 'Bid Set',
        issuanceDate: '2026-01-15',
        sheets: [
          { number: 'A-201', title: 'Building Elevations', design: 'cedar-mill-arch.rvt' },
          { number: 'A-202', title: 'Building Sections', design: 'cedar-mill-arch.rvt' },
        ],
      },
    ],
  },
  {
    id: 'b.dockside',
    hubId: 'b.ridgeline-us',
    name: 'Dockside Renovation',
    versionSets: [
      {
        id: 'vs-dockside-ifc-2602',
        name: 'IFC 2026-02',
        issuanceDate: '2026-02-19',
        sheets: [
          { number: 'D-101', title: 'Level 1 Demolition Plan', design: 'dockside-demo.rvt' },
        ],
      },
      {
        id: 'vs-dockside-demolition',
        name: 'Demolition Set',
        issuanceDate: '2025-12-03',
        sheets: [
          { number: 'D-001', title: 'Demolition Notes', design: 'dockside-notes.pdf' },
          { number: 'D-002', title: 'Abatement Schedule', design: 'dockside-notes.pdf' },
        ],
      },
    ],
  },
  {
    id: 'b.harbor-point',
    hubId: 'b.ridgeline-emea',
    name: 'Harbor Point Garage',
    versionSets: [
      {
        id: 'vs-harbor-ifc-2604',
        name: 'IFC 2026-04',
        issuanceDate: '2026-04-02',
        sheets: [
          { number: 'S-101', title: 'Foundation Plan', design: 'harbor-point-struct.rvt' },
          { number: 'E-201', title: 'Level P1 Lighting Plan', design: 'harbor-point-elec.dwg' },
        ],
      },
      {
        id: 'vs-harbor-permit',
        name: 'Permit Set',
        issuanceDate: '2025-10-16',
        sheets: [{ number: 'A-101', title: 'Level P1 Plan', design: 'harbor-point-arch.rvt' }],
      },
    ],
  },
  {
    // Deliberately untranslated: no manifests, so every design reads as queued.
    id: 'b.kanal-west',
    hubId: 'b.ridgeline-emea',
    name: 'Kanalhaus West',
    versionSets: [
      {
        id: 'vs-kanal-tender',
        name: 'Tender Set',
        issuanceDate: '2026-06-11',
        sheets: [
          { number: 'A-101', title: 'Ground Floor Plan', design: 'kanalhaus-west-arch.rvt' },
          { number: 'A-102', title: 'First Floor Plan', design: 'kanalhaus-west-arch.rvt' },
        ],
      },
      {
        id: 'vs-kanal-concept',
        name: 'Concept Set',
        issuanceDate: '2026-01-29',
        sheets: [{ number: 'A-001', title: 'Title Sheet', design: 'kanalhaus-west-concept.pdf' }],
      },
    ],
  },
]

function svfDerivative(name: string, status: string, progress = 'complete'): ApsManifestDerivative {
  return {
    name,
    hasThumbnail: 'true',
    status,
    progress,
    outputType: 'svf2',
    children: [],
  }
}

function thumbnailDerivative(status: string): ApsManifestDerivative {
  return { status, progress: 'complete', outputType: 'thumbnail', children: [] }
}

const demoViewerUrn = process.env.APS_VIEWER_DEMO_URN

const demoManifests: NonNullable<ApsSeedConfig['manifests']> = {
  [designUrns['summit-tower-arch.rvt']]: {
    status: 'success',
    progress: 'complete',
    hasThumbnail: 'true',
    derivatives: [
      svfDerivative('summit-tower-arch.rvt', 'success'),
      thumbnailDerivative('success'),
    ],
  },
  [designUrns['summit-tower-struct.rvt']]: {
    status: 'inprogress',
    progress: '62% complete',
    derivatives: [svfDerivative('summit-tower-struct.rvt', 'inprogress', '62% complete')],
  },
  [designUrns['summit-tower-permit.pdf']]: {
    status: 'success',
    progress: 'complete',
    derivatives: [svfDerivative('summit-tower-permit.pdf', 'success')],
  },
  [designUrns['summit-tower-gmp.pdf']]: {
    // Deliberate: timed out, with the in-flight derivative left failed.
    status: 'timeout',
    progress: 'complete',
    derivatives: [svfDerivative('summit-tower-gmp.pdf', 'failed')],
  },
  [designUrns['cedar-mill-site.nwd']]: {
    status: 'failed',
    progress: 'complete',
    derivatives: [svfDerivative('cedar-mill-site.nwd', 'failed')],
  },
  [designUrns['cedar-mill-mep.rvt']]: {
    status: 'success',
    progress: 'complete',
    hasThumbnail: 'true',
    derivatives: [svfDerivative('cedar-mill-mep.rvt', 'success'), thumbnailDerivative('success')],
  },
  [designUrns['cedar-mill-arch.rvt']]: {
    status: 'success',
    progress: 'complete',
    derivatives: [svfDerivative('cedar-mill-arch.rvt', 'success')],
  },
  [designUrns['dockside-demo.rvt']]: {
    status: 'inprogress',
    progress: '18% complete',
    derivatives: [svfDerivative('dockside-demo.rvt', 'inprogress', '18% complete')],
  },
  [designUrns['dockside-notes.pdf']]: {
    status: 'success',
    progress: 'complete',
    hasThumbnail: 'true',
    derivatives: [svfDerivative('dockside-notes.pdf', 'success'), thumbnailDerivative('success')],
  },
  [designUrns['harbor-point-struct.rvt']]: {
    status: 'success',
    progress: 'complete',
    hasThumbnail: 'true',
    region: 'EMEA',
    derivatives: [
      svfDerivative('harbor-point-struct.rvt', 'success'),
      thumbnailDerivative('success'),
    ],
  },
  [designUrns['harbor-point-elec.dwg']]: {
    status: 'failed',
    progress: 'complete',
    region: 'EMEA',
    derivatives: [svfDerivative('harbor-point-elec.dwg', 'failed')],
  },
  [designUrns['harbor-point-arch.rvt']]: {
    status: 'success',
    progress: 'complete',
    region: 'EMEA',
    derivatives: [svfDerivative('harbor-point-arch.rvt', 'success')],
  },
}

// The live-viewer URN comes from the environment, so its manifest joins the
// seed only when the demo is configured.
if (demoViewerUrn) {
  demoManifests[demoViewerUrn] = {
    status: 'success',
    progress: 'complete',
    hasThumbnail: 'true',
    derivatives: [
      svfDerivative('cantera-viewer-sample', 'success'),
      thumbnailDerivative('success'),
    ],
  }
}

const projectIds = [...demoProjects.map((project) => project.id), ...EMULATOR_DEFAULT_PROJECT_IDS]

const accProjectUsers: NonNullable<ApsSeedConfig['acc_project_users']> = projectIds.flatMap(
  (projectId) =>
    DEMO_USER_EMAILS.map((email) => ({
      project_id: projectId,
      user_email: email,
      role: 'project_admin' as const,
      issue_permission: 'manage' as const,
      rfi_roles: ['project_admin'],
    })),
)

const sheetVersionSets: NonNullable<ApsSeedConfig['sheet_version_sets']> = demoProjects.flatMap(
  (project) =>
    project.versionSets.map((versionSet) => ({
      id: versionSet.id,
      project_id: project.id,
      name: versionSet.name,
      issuance_date: versionSet.issuanceDate,
      created_by: DEMO_USER_EMAILS[0],
      created_by_name: 'Maria Renteria',
    })),
)

const sheets: NonNullable<ApsSeedConfig['sheets']> = demoProjects.flatMap((project) =>
  project.versionSets.flatMap((versionSet) =>
    versionSet.sheets.map((sheet) => ({
      id: `${versionSet.id}-${sheet.number.toLowerCase()}`,
      project_id: project.id,
      number: sheet.number,
      title: sheet.title,
      version_set_id: versionSet.id,
      tags: [],
      upload_file_name: sheet.design,
      is_current: true,
      viewable_urn: designUrns[sheet.design],
      viewable_guid: `${versionSet.id}-${sheet.number.toLowerCase()}-view`,
      created_by: DEMO_USER_EMAILS[0],
      created_by_name: 'Maria Renteria',
    })),
  ),
)

function documentId(value: string): string {
  return value.replaceAll(/[^a-zA-Z0-9]+/g, '-').replaceAll(/^-|-$/g, '')
}

function projectFolderId(projectId: string, name: 'root' | 'design' | 'published'): string {
  return `urn:adsk.wipprod:fs.folder:co.cantera-${documentId(projectId)}-${name}`
}

function projectDesigns(project: DemoProject): string[] {
  return [
    ...new Set(
      project.versionSets.flatMap((versionSet) => versionSet.sheets.map((sheet) => sheet.design)),
    ),
  ]
}

function documentItemId(projectId: string, displayName: string): string {
  return `urn:adsk.wipprod:dm.lineage:cantera-${documentId(projectId)}-${documentId(displayName)}`
}

function documentVersionId(projectId: string, displayName: string, version: number): string {
  return `urn:adsk.wipprod:fs.file:vf.cantera-${documentId(projectId)}-${documentId(displayName)}?version=${version}`
}

export const DEMO_VIEWER_ITEM_ID = documentItemId('b.summit-tower', 'summit-tower-arch.rvt')

export const DEMO_VIEWER_VERSION_ID = documentVersionId(
  'b.summit-tower',
  'summit-tower-arch.rvt',
  3,
)

const documentFolders: NonNullable<ApsSeedConfig['document_folders']> = demoProjects.flatMap(
  (project) => {
    const root = projectFolderId(project.id, 'root')
    return [
      {
        id: root,
        project_id: project.id,
        name: 'Project Files',
        created_by: DEMO_USER_EMAILS[0],
        created_by_name: 'Maria Renteria',
        create_time: '2025-08-12T14:00:00.000Z',
        last_modified_time: '2026-08-21T14:20:00.000Z',
      },
      {
        id: projectFolderId(project.id, 'design'),
        project_id: project.id,
        parent_folder_id: root,
        name: 'Design',
        created_by: DEMO_USER_EMAILS[0],
        created_by_name: 'Maria Renteria',
        create_time: '2025-08-12T14:05:00.000Z',
        last_modified_by: DEMO_USER_EMAILS[1],
        last_modified_by_name: 'Sam Ito',
        last_modified_time: '2026-08-21T13:10:00.000Z',
      },
      {
        id: projectFolderId(project.id, 'published'),
        project_id: project.id,
        parent_folder_id: root,
        name: 'Published Sheets',
        created_by: DEMO_USER_EMAILS[0],
        created_by_name: 'Maria Renteria',
        create_time: '2025-08-12T14:10:00.000Z',
        last_modified_time: '2026-08-20T18:05:00.000Z',
      },
    ]
  },
)

const documentItems: NonNullable<ApsSeedConfig['document_items']> = demoProjects.flatMap(
  (project) =>
    projectDesigns(project).map((displayName, index) => ({
      id: documentItemId(project.id, displayName),
      project_id: project.id,
      folder_id: projectFolderId(project.id, displayName.endsWith('.pdf') ? 'published' : 'design'),
      display_name: displayName,
      created_by: index % 2 === 0 ? DEMO_USER_EMAILS[0] : DEMO_USER_EMAILS[1],
      created_by_name: index % 2 === 0 ? 'Maria Renteria' : 'Sam Ito',
      create_time: `2026-08-${String(10 + index).padStart(2, '0')}T12:00:00.000Z`,
      last_modified_by: DEMO_USER_EMAILS[index % 2],
      last_modified_by_name: index % 2 === 0 ? 'Maria Renteria' : 'Sam Ito',
      last_modified_time: `2026-08-${String(18 + index).padStart(2, '0')}T14:20:00.000Z`,
    })),
)

const documentVersions: NonNullable<ApsSeedConfig['document_versions']> = demoProjects.flatMap(
  (project) =>
    projectDesigns(project).flatMap((displayName, itemIndex) => {
      const count = itemIndex === 0 ? 3 : itemIndex === 1 ? 2 : 1
      return Array.from({ length: count }, (_, index) => {
        const versionNumber = index + 1
        const versionId = documentVersionId(project.id, displayName, versionNumber)
        return {
          version_id: versionId,
          item_id: documentItemId(project.id, displayName),
          project_id: project.id,
          version_number: versionNumber,
          display_name: displayName,
          storage_size: 24_000_000 + itemIndex * 8_500_000 + versionNumber * 1_200_000,
          // The embedded emulator cannot serve SVF geometry: exactly one tip
          // links to the real translated sample; every other file deliberately
          // exercises the no-geometry state.
          bubble_urn: versionId === DEMO_VIEWER_VERSION_ID ? (demoViewerUrn ?? null) : null,
          created_by: versionNumber % 2 === 0 ? DEMO_USER_EMAILS[1] : DEMO_USER_EMAILS[0],
          created_by_name: versionNumber % 2 === 0 ? 'Sam Ito' : 'Maria Renteria',
          create_time: `2026-08-${String(15 + versionNumber + itemIndex).padStart(2, '0')}T13:10:00.000Z`,
          last_modified_time: `2026-08-${String(15 + versionNumber + itemIndex).padStart(2, '0')}T13:10:00.000Z`,
        }
      })
    }),
)

// Adds to the emulator's own default seed rather than replacing it.
export const apsDemoSeed = {
  users: [
    { name: 'Maria Renteria', email: 'maria@builders.example' },
    { name: 'Sam Ito', email: 'sam@builders.example' },
  ],
  clients: [
    {
      name: 'cantera demo',
      // Real APS credentials, when present, are seeded into the embedded OAuth
      // emulator: sign-in stays local while the token route talks to real APS.
      client_id: process.env.APS_CLIENT_ID ?? 'cantera-demo-client',
      client_secret: process.env.APS_CLIENT_SECRET ?? 'cantera-demo-secret',
      redirect_uris: ['/api/auth/callback/aps'],
    },
  ],
  hubs: demoHubs,
  projects: demoProjects.map((project) => ({
    id: project.id,
    hub_id: project.hubId,
    name: project.name,
  })),
  acc_project_users: accProjectUsers,
  sheet_version_sets: sheetVersionSets,
  sheets,
  manifests: demoManifests,
  document_folders: documentFolders,
  document_items: documentItems,
  document_versions: documentVersions,
  // The default 25 MB object cap rejects realistic model uploads in the demo.
  upload: { maxObjectBytes: 200 * 1024 * 1024 },
} satisfies ApsSeedConfig

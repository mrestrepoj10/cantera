// src/helpers.ts
import { createHash, randomBytes } from "crypto";
var DEFAULT_CONFIDENTIAL_CLIENT_ID = "aps-test-client";
var DEFAULT_CONFIDENTIAL_CLIENT_SECRET = "aps-test-secret";
var DEFAULT_PUBLIC_CLIENT_ID = "aps-test-app";
var DEFAULT_USER_EMAIL = "testuser@autodesk.local";
var DEFAULT_HUB_ID = "b.emulate-hub";
var DEFAULT_PROJECT_ID = "b.emulate-project";
var DEFAULT_MANIFEST_URN = "dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6ZW11bGF0ZS1idWNrZXQvc2FtcGxlLnJ2dA";
var DEFAULT_SECOND_MANIFEST_URN = "dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6ZW11bGF0ZS1idWNrZXQvc3RydWN0dXJhbC5ydnQ";
var DEFAULT_WEBHOOK_FOLDER_ID = "urn:adsk.wipprod:fs.folder:co.emulate-documents";
var DEFAULT_WEBHOOK_CHILD_FOLDER_ID = "urn:adsk.wipprod:fs.folder:co.emulate-plans";
var DEFAULT_COORDINATION_FOLDER_ID = "urn:adsk.wipprod:fs.folder:co.emulate-coordination";
var DEFAULT_SHARED_FOLDER_ID = "urn:adsk.wipprod:fs.folder:co.emulate-shared";
var DEFAULT_WEBHOOK_ITEM_ID = "urn:adsk.wipprod:dm.lineage:emulate-sample-model";
var DEFAULT_WEBHOOK_VERSION_ID = "urn:adsk.wipprod:fs.file:vf.emulate-sample-model?version=1";
var DEFAULT_SECOND_DOCUMENT_ITEM_ID = "urn:adsk.wipprod:dm.lineage:emulate-structural-model";
var DEFAULT_SECOND_DOCUMENT_VERSION_ID = "urn:adsk.wipprod:fs.file:vf.emulate-structural-model?version=1";
var SUPPORTED_SCOPES = [
  "user-profile:read",
  "user:read",
  "user:write",
  "viewables:read",
  "data:read",
  "data:write",
  "data:create",
  "data:search",
  "bucket:create",
  "bucket:read",
  "bucket:update",
  "bucket:delete",
  "code:all",
  "account:read",
  "account:write",
  "openid"
];
var ALPHANUMERIC = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
var UPPER_ALPHANUMERIC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
function randomString(alphabet, length) {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += alphabet[bytes[i] % alphabet.length];
  }
  return out;
}
function generateAuthorizationCode() {
  return randomBytes(30).toString("base64url");
}
function generateRefreshToken() {
  return randomString(ALPHANUMERIC, 42);
}
function generateJti() {
  return randomString(ALPHANUMERIC, 64);
}
function generateUserId() {
  return randomString(UPPER_ALPHANUMERIC, 12);
}
function analyticsIdFor(userId2) {
  return createHash("sha256").update(userId2).digest("hex").slice(0, 32);
}
function stableDerivativeGuid(value) {
  const digest = createHash("sha1").update(value).digest("hex");
  return `${digest.slice(0, 8)}-${digest.slice(8, 12)}-${digest.slice(12, 16)}-${digest.slice(16, 20)}-${digest.slice(20, 32)}`;
}
function isRecordObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
async function jsonObjectBody(c) {
  try {
    const body = await c.req.json();
    return isRecordObject(body) ? body : null;
  } catch {
    return null;
  }
}
function optionalString(value) {
  return typeof value === "string" && value.trim() ? value : void 0;
}
function parseScope(scope) {
  return scope.split(/\s+/).map((part) => part.trim()).filter(Boolean);
}
function isSupportedScope(scope) {
  if (SUPPORTED_SCOPES.includes(scope)) return true;
  return /^data:read:[^*\\"]+$/.test(scope);
}
function splitName(name, email) {
  const trimmed = name.trim();
  if (!trimmed) {
    const local = email.split("@")[0] ?? "Test";
    return { first_name: local, last_name: "User" };
  }
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return { first_name: parts[0], last_name: "" };
  return { first_name: parts.slice(0, -1).join(" "), last_name: parts[parts.length - 1] };
}
function userNameFor(user) {
  return user.email.split("@")[0] ?? user.email;
}
function normalizeClientType(type, fallback) {
  if (type === "confidential" || type === "public") return type;
  return fallback;
}
function createDefaultConfidentialClient() {
  return {
    client_id: DEFAULT_CONFIDENTIAL_CLIENT_ID,
    client_secret: DEFAULT_CONFIDENTIAL_CLIENT_SECRET,
    name: "Sample APS Web App",
    type: "confidential",
    redirect_uris: [
      "http://localhost:3000/api/auth/callback/aps",
      "http://localhost:3000/api/auth/oauth2/callback/aps",
      "http://localhost:3000/callback"
    ]
  };
}
function createDefaultPublicClient() {
  return {
    client_id: DEFAULT_PUBLIC_CLIENT_ID,
    client_secret: "",
    name: "Sample APS Desktop App",
    type: "public",
    redirect_uris: ["http://localhost:3000/callback"]
  };
}
function createDefaultUser() {
  return {
    user_id: generateUserId(),
    email: DEFAULT_USER_EMAIL,
    name: "Test User",
    first_name: "Test",
    last_name: "User",
    picture: null
  };
}

// src/config.ts
var DEFAULT_UPLOAD_CONFIG = {
  maxObjectBytes: 25 * 1024 * 1024
};
var DEFAULT_TRANSLATION_CONFIG = {
  autoTranslateOnVersionAdd: true,
  durationMs: 15e3,
  failForExtensions: ["zip"]
};
var DEFAULT_MODEL_COORDINATION_TIMING = {
  processing_ms: 25,
  signed_url_ttl_ms: 6e4
};
var DEFAULT_WEBHOOK_TIMING = {
  max_retries: 8,
  retry_base_ms: 25,
  retry_max_ms: 1e3,
  failed_events_before_inactive: 5,
  reactivate_after_ms: 1e3,
  max_reactivation_cycles: 5,
  delivery_timeout_ms: 6e3
};
var DEFAULT_DERIVATIVE_BASE = `urn:adsk.viewing:fs.file:${DEFAULT_MANIFEST_URN}/output`;
var DEFAULT_SECOND_DERIVATIVE_BASE = `urn:adsk.viewing:fs.file:${DEFAULT_SECOND_MANIFEST_URN}/output`;
var DEFAULT_ACC_TIMESTAMP = "2026-08-19T12:00:00.000Z";
var DEFAULT_ISSUE_TYPE_ID = "11111111-1111-4111-8111-111111111111";
var DEFAULT_ISSUE_SUBTYPE_ID = "22222222-2222-4222-8222-222222222222";
var DEFAULT_RFI_TYPE_ID = "55555555-5555-4555-8555-555555555555";
var DEFAULT_SHEET_COLLECTION_ID = "99999999-9999-4999-8999-999999999999";
var DEFAULT_VERSION_SET_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
var DEFAULT_DATA_SEED = {
  hubs: [{ id: DEFAULT_HUB_ID, name: "Emulate Construction Hub", region: "US" }],
  projects: [
    { id: DEFAULT_PROJECT_ID, hub_id: DEFAULT_HUB_ID, name: "Sample Building" },
    { id: "b.emulate-infrastructure", hub_id: DEFAULT_HUB_ID, name: "Sample Infrastructure" }
  ],
  acc_project_users: [
    {
      project_id: DEFAULT_PROJECT_ID,
      user_email: "testuser@autodesk.local",
      role: "project_admin",
      issue_permission: "manage",
      rfi_roles: ["project_admin", "projectGC", "projectSC"]
    }
  ],
  issue_types: [
    {
      id: DEFAULT_ISSUE_TYPE_ID,
      project_id: DEFAULT_PROJECT_ID,
      title: "Coordination",
      is_active: true,
      order_index: 1,
      subtypes: [
        {
          id: DEFAULT_ISSUE_SUBTYPE_ID,
          title: "Clash",
          code: "CLASH",
          is_active: true,
          order_index: 1
        }
      ]
    }
  ],
  issues: [
    {
      id: "33333333-3333-4333-8333-333333333333",
      project_id: DEFAULT_PROJECT_ID,
      title: "Door clearance conflict",
      description: "The door conflicts with the adjacent wall finish.",
      display_id: 1,
      issue_type_id: DEFAULT_ISSUE_TYPE_ID,
      issue_subtype_id: DEFAULT_ISSUE_SUBTYPE_ID,
      status: "open",
      assigned_to: "testuser@autodesk.local",
      assigned_to_type: "user",
      due_date: "2026-08-26",
      location_details: "Level 1 corridor",
      published: true,
      created_by: "testuser@autodesk.local",
      created_at: DEFAULT_ACC_TIMESTAMP,
      updated_by: "testuser@autodesk.local",
      updated_at: DEFAULT_ACC_TIMESTAMP
    },
    {
      id: "44444444-4444-4444-8444-444444444444",
      project_id: DEFAULT_PROJECT_ID,
      title: "Verify ceiling access panel",
      description: "Confirm the access panel location before closeout.",
      display_id: 2,
      issue_type_id: DEFAULT_ISSUE_TYPE_ID,
      issue_subtype_id: DEFAULT_ISSUE_SUBTYPE_ID,
      status: "closed",
      assigned_to: "testuser@autodesk.local",
      assigned_to_type: "user",
      due_date: "2026-08-20",
      location_details: "Level 2 mechanical room",
      published: true,
      created_by: "testuser@autodesk.local",
      created_at: DEFAULT_ACC_TIMESTAMP,
      updated_by: "testuser@autodesk.local",
      updated_at: DEFAULT_ACC_TIMESTAMP
    }
  ],
  rfi_types: [
    {
      id: DEFAULT_RFI_TYPE_ID,
      project_id: DEFAULT_PROJECT_ID,
      name: "Design clarification",
      status: "active",
      is_default: true,
      workflow_type: "US",
      due_date_offset: 7,
      manager: [{ id: "testuser@autodesk.local" }],
      reviewers: [{ id: "testuser@autodesk.local" }],
      watchers: [{ id: "testuser@autodesk.local" }]
    }
  ],
  rfi_attributes: [
    {
      id: "66666666-6666-4666-8666-666666666666",
      project_id: DEFAULT_PROJECT_ID,
      name: "Specification section",
      type: "text",
      description: "Related specification section",
      status: "active"
    }
  ],
  rfis: [
    {
      id: "77777777-7777-4777-8777-777777777777",
      project_id: DEFAULT_PROJECT_ID,
      rfi_type_id: DEFAULT_RFI_TYPE_ID,
      custom_identifier: "RFI-001",
      title: "Confirm structural opening",
      question: "What dimensions should be used for the structural opening?",
      status: "open",
      previous_status: "submitted",
      workflow_type: "US",
      assigned_to: [{ id: "testuser@autodesk.local" }],
      manager_id: "testuser@autodesk.local",
      due_date: "2026-08-27T12:00:00.000Z",
      location_description: "Level 1 electrical room",
      priority: "High",
      discipline: ["Structural"],
      category: ["Constructability"],
      reference: "S-101",
      created_by: "testuser@autodesk.local",
      created_at: DEFAULT_ACC_TIMESTAMP,
      updated_by: "testuser@autodesk.local",
      updated_at: DEFAULT_ACC_TIMESTAMP
    },
    {
      id: "88888888-8888-4888-8888-888888888888",
      project_id: DEFAULT_PROJECT_ID,
      rfi_type_id: DEFAULT_RFI_TYPE_ID,
      custom_identifier: "RFI-002",
      title: "Clarify finish transition",
      question: "Which finish transition detail applies at the lobby?",
      status: "draft",
      workflow_type: "US",
      assigned_to: [{ id: "testuser@autodesk.local" }],
      priority: "Normal",
      discipline: ["Architectural"],
      category: ["Design"],
      reference: "A-201",
      created_by: "testuser@autodesk.local",
      created_at: DEFAULT_ACC_TIMESTAMP,
      updated_by: "testuser@autodesk.local",
      updated_at: DEFAULT_ACC_TIMESTAMP
    }
  ],
  sheet_collections: [
    {
      id: DEFAULT_SHEET_COLLECTION_ID,
      project_id: DEFAULT_PROJECT_ID,
      name: "Issued for Construction",
      created_by: "testuser@autodesk.local",
      created_by_name: "Test User",
      created_at: DEFAULT_ACC_TIMESTAMP,
      updated_by: "testuser@autodesk.local",
      updated_by_name: "Test User",
      updated_at: DEFAULT_ACC_TIMESTAMP
    }
  ],
  sheet_version_sets: [
    {
      id: DEFAULT_VERSION_SET_ID,
      project_id: DEFAULT_PROJECT_ID,
      name: "August 2026 Issue",
      issuance_date: "2026-08-19",
      collection_id: DEFAULT_SHEET_COLLECTION_ID,
      created_by: "testuser@autodesk.local",
      created_by_name: "Test User",
      created_at: DEFAULT_ACC_TIMESTAMP,
      updated_by: "testuser@autodesk.local",
      updated_by_name: "Test User",
      updated_at: DEFAULT_ACC_TIMESTAMP
    }
  ],
  sheets: [
    {
      id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      project_id: DEFAULT_PROJECT_ID,
      number: "A-101",
      title: "Level 1 Floor Plan",
      version_set_id: DEFAULT_VERSION_SET_ID,
      collection_id: DEFAULT_SHEET_COLLECTION_ID,
      tags: ["architectural", "floor-plan"],
      upload_file_name: "architectural-set.pdf",
      upload_id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
      paper_size: [1200, 800],
      is_current: true,
      viewable_urn: "urn:adsk.bimdocs:seed:emulate-architectural-set",
      viewable_guid: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
      created_by: "testuser@autodesk.local",
      created_by_name: "Test User",
      created_at: DEFAULT_ACC_TIMESTAMP,
      updated_by: "testuser@autodesk.local",
      updated_by_name: "Test User",
      updated_at: DEFAULT_ACC_TIMESTAMP
    },
    {
      id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      project_id: DEFAULT_PROJECT_ID,
      number: "S-101",
      title: "Foundation Plan",
      version_set_id: DEFAULT_VERSION_SET_ID,
      collection_id: DEFAULT_SHEET_COLLECTION_ID,
      tags: ["structural", "foundation"],
      upload_file_name: "structural-set.pdf",
      upload_id: "ffffffff-ffff-4fff-8fff-ffffffffffff",
      paper_size: [1200, 800],
      is_current: true,
      viewable_urn: "urn:adsk.bimdocs:seed:emulate-structural-set",
      viewable_guid: "12121212-1212-4121-8121-121212121212",
      created_by: "testuser@autodesk.local",
      created_by_name: "Test User",
      created_at: DEFAULT_ACC_TIMESTAMP,
      updated_by: "testuser@autodesk.local",
      updated_by_name: "Test User",
      updated_at: DEFAULT_ACC_TIMESTAMP
    }
  ],
  document_folders: [
    {
      id: DEFAULT_WEBHOOK_FOLDER_ID,
      project_id: DEFAULT_PROJECT_ID,
      name: "Project Files",
      create_time: DEFAULT_ACC_TIMESTAMP
    },
    {
      id: DEFAULT_WEBHOOK_CHILD_FOLDER_ID,
      project_id: DEFAULT_PROJECT_ID,
      parent_folder_id: DEFAULT_WEBHOOK_FOLDER_ID,
      name: "Plans",
      create_time: DEFAULT_ACC_TIMESTAMP
    },
    {
      id: DEFAULT_COORDINATION_FOLDER_ID,
      project_id: DEFAULT_PROJECT_ID,
      parent_folder_id: DEFAULT_WEBHOOK_CHILD_FOLDER_ID,
      name: "Coordination",
      create_time: DEFAULT_ACC_TIMESTAMP
    },
    {
      id: DEFAULT_SHARED_FOLDER_ID,
      project_id: DEFAULT_PROJECT_ID,
      parent_folder_id: DEFAULT_WEBHOOK_FOLDER_ID,
      name: "Shared",
      create_time: DEFAULT_ACC_TIMESTAMP
    },
    {
      id: "urn:adsk.wipprod:fs.folder:co.emulate-infrastructure-root",
      project_id: "b.emulate-infrastructure",
      name: "Project Files",
      create_time: DEFAULT_ACC_TIMESTAMP
    },
    {
      id: "urn:adsk.wipprod:fs.folder:co.emulate-infrastructure-design",
      project_id: "b.emulate-infrastructure",
      parent_folder_id: "urn:adsk.wipprod:fs.folder:co.emulate-infrastructure-root",
      name: "Design",
      create_time: DEFAULT_ACC_TIMESTAMP
    },
    {
      id: "urn:adsk.wipprod:fs.folder:co.emulate-infrastructure-shared",
      project_id: "b.emulate-infrastructure",
      parent_folder_id: "urn:adsk.wipprod:fs.folder:co.emulate-infrastructure-root",
      name: "Shared",
      create_time: DEFAULT_ACC_TIMESTAMP
    }
  ],
  document_items: [
    {
      id: DEFAULT_WEBHOOK_ITEM_ID,
      project_id: DEFAULT_PROJECT_ID,
      folder_id: DEFAULT_COORDINATION_FOLDER_ID,
      display_name: "sample.rvt",
      create_time: DEFAULT_ACC_TIMESTAMP
    },
    {
      id: DEFAULT_SECOND_DOCUMENT_ITEM_ID,
      project_id: DEFAULT_PROJECT_ID,
      folder_id: DEFAULT_COORDINATION_FOLDER_ID,
      display_name: "structural.rvt",
      create_time: DEFAULT_ACC_TIMESTAMP
    },
    {
      id: "urn:adsk.wipprod:dm.lineage:emulate-coordination-report",
      project_id: DEFAULT_PROJECT_ID,
      folder_id: DEFAULT_WEBHOOK_CHILD_FOLDER_ID,
      display_name: "coordination-report.pdf",
      create_time: DEFAULT_ACC_TIMESTAMP
    },
    {
      id: "urn:adsk.wipprod:dm.lineage:emulate-road-model",
      project_id: "b.emulate-infrastructure",
      folder_id: "urn:adsk.wipprod:fs.folder:co.emulate-infrastructure-design",
      display_name: "road-design.dwg",
      create_time: DEFAULT_ACC_TIMESTAMP
    },
    {
      id: "urn:adsk.wipprod:dm.lineage:emulate-infrastructure-report",
      project_id: "b.emulate-infrastructure",
      folder_id: "urn:adsk.wipprod:fs.folder:co.emulate-infrastructure-shared",
      display_name: "site-report.pdf",
      create_time: DEFAULT_ACC_TIMESTAMP
    }
  ],
  document_versions: [
    {
      version_id: DEFAULT_WEBHOOK_VERSION_ID,
      item_id: DEFAULT_WEBHOOK_ITEM_ID,
      project_id: DEFAULT_PROJECT_ID,
      version_number: 1,
      display_name: "sample.rvt",
      file_type: "rvt",
      mime_type: "application/vnd.autodesk.revit",
      storage_size: 4096,
      storage_urn: "urn:adsk.objects:os.object:emulate-bucket/sample.rvt",
      region: "US",
      create_time: DEFAULT_ACC_TIMESTAMP
    },
    {
      version_id: DEFAULT_SECOND_DOCUMENT_VERSION_ID,
      item_id: DEFAULT_SECOND_DOCUMENT_ITEM_ID,
      project_id: DEFAULT_PROJECT_ID,
      version_number: 1,
      display_name: "structural.rvt",
      file_type: "rvt",
      mime_type: "application/vnd.autodesk.revit",
      storage_size: 6144,
      storage_urn: "urn:adsk.objects:os.object:emulate-bucket/structural.rvt",
      region: "US",
      bubble_urn: DEFAULT_SECOND_MANIFEST_URN,
      viewable_id: "emulate-structural-3d-view",
      viewable_guid: "14141414-1414-4141-8141-141414141414",
      create_time: DEFAULT_ACC_TIMESTAMP
    },
    ...[1, 2, 3].map((version) => ({
      version_id: `urn:adsk.wipprod:fs.file:vf.emulate-coordination-report?version=${version}`,
      item_id: "urn:adsk.wipprod:dm.lineage:emulate-coordination-report",
      project_id: DEFAULT_PROJECT_ID,
      version_number: version,
      display_name: "coordination-report.pdf",
      file_type: "pdf",
      mime_type: "application/pdf",
      storage_size: 1024 * version,
      storage_urn: `urn:adsk.objects:os.object:emulate-bucket/coordination-report-v${version}.pdf`,
      region: "US",
      bubble_urn: null,
      create_time: `2026-08-${String(16 + version).padStart(2, "0")}T12:00:00.000Z`
    })),
    ...[1, 2].map((version) => ({
      version_id: `urn:adsk.wipprod:fs.file:vf.emulate-road-model?version=${version}`,
      item_id: "urn:adsk.wipprod:dm.lineage:emulate-road-model",
      project_id: "b.emulate-infrastructure",
      version_number: version,
      display_name: "road-design.dwg",
      file_type: "dwg",
      mime_type: "application/acad",
      storage_size: 2048 * version,
      storage_urn: `urn:adsk.objects:os.object:emulate-bucket/road-design-v${version}.dwg`,
      region: "US",
      bubble_urn: null,
      create_time: `2026-08-${String(17 + version).padStart(2, "0")}T12:00:00.000Z`
    })),
    {
      version_id: "urn:adsk.wipprod:fs.file:vf.emulate-infrastructure-report?version=1",
      item_id: "urn:adsk.wipprod:dm.lineage:emulate-infrastructure-report",
      project_id: "b.emulate-infrastructure",
      version_number: 1,
      display_name: "site-report.pdf",
      file_type: "pdf",
      mime_type: "application/pdf",
      storage_size: 1536,
      storage_urn: "urn:adsk.objects:os.object:emulate-bucket/site-report.pdf",
      region: "US",
      bubble_urn: null,
      create_time: DEFAULT_ACC_TIMESTAMP
    }
  ],
  manifests: {
    [DEFAULT_MANIFEST_URN]: {
      type: "manifest",
      hasThumbnail: "true",
      status: "success",
      progress: "complete",
      region: "US",
      version: "1.0",
      derivatives: [
        {
          name: "sample.rvt",
          hasThumbnail: "true",
          status: "success",
          progress: "complete",
          outputType: "svf2",
          children: [
            {
              guid: "6fac95cb-af5d-3e4f-b943-8a7f55847ff1",
              type: "resource",
              role: "Autodesk.CloudPlatform.PropertyDatabase",
              urn: `${DEFAULT_DERIVATIVE_BASE}/Resource/model.sdb`,
              mime: "application/autodesk-db",
              status: "success"
            },
            {
              guid: "d8e734a8-6e9e-4f4d-9a4f-000000000001",
              type: "geometry",
              role: "3d",
              name: "{3D}",
              viewableID: "emulate-3d-view",
              status: "success",
              hasThumbnail: "true",
              progress: "complete",
              children: [
                {
                  guid: "emulate-3d-view",
                  type: "view",
                  role: "3d",
                  name: "{3D}",
                  status: "success",
                  progress: "complete"
                }
              ]
            }
          ]
        },
        {
          status: "success",
          progress: "complete",
          outputType: "thumbnail",
          children: [
            {
              guid: "d8e734a8-6e9e-4f4d-9a4f-000000000002",
              type: "resource",
              role: "thumbnail",
              urn: `${DEFAULT_DERIVATIVE_BASE}/preview4.png`,
              resolution: [400, 400],
              mime: "image/png",
              status: "success"
            }
          ]
        }
      ]
    },
    [DEFAULT_SECOND_MANIFEST_URN]: {
      type: "manifest",
      hasThumbnail: "true",
      status: "success",
      progress: "complete",
      region: "US",
      version: "1.0",
      derivatives: [
        {
          name: "structural.rvt",
          hasThumbnail: "true",
          status: "success",
          progress: "complete",
          outputType: "svf2",
          children: [
            {
              guid: "15151515-1515-4151-8151-151515151515",
              type: "resource",
              role: "Autodesk.CloudPlatform.PropertyDatabase",
              urn: `${DEFAULT_SECOND_DERIVATIVE_BASE}/Resource/model.sdb`,
              mime: "application/autodesk-db",
              status: "success"
            },
            {
              guid: "14141414-1414-4141-8141-141414141414",
              type: "geometry",
              role: "3d",
              name: "{3D}",
              viewableID: "emulate-structural-3d-view",
              status: "success",
              hasThumbnail: "true",
              progress: "complete",
              children: [
                {
                  guid: "emulate-structural-3d-view",
                  type: "view",
                  role: "3d",
                  name: "{3D}",
                  status: "success",
                  progress: "complete"
                }
              ]
            }
          ]
        }
      ]
    }
  },
  model_sets: [
    {
      id: "13131313-1313-4131-8131-131313131313",
      project_id: DEFAULT_PROJECT_ID,
      name: "Sample Building Coordination",
      description: "Architectural and structural coordination model set",
      root_folder_urn: DEFAULT_WEBHOOK_FOLDER_ID,
      folder_urns: [DEFAULT_COORDINATION_FOLDER_ID],
      document_version_ids: [DEFAULT_WEBHOOK_VERSION_ID, DEFAULT_SECOND_DOCUMENT_VERSION_ID],
      created_by: "testuser@autodesk.local",
      created_time: DEFAULT_ACC_TIMESTAMP,
      test_id: "16161616-1616-4161-8161-161616161616"
    }
  ]
};

// src/dm-tree.ts
var DEFAULT_TIMESTAMP = "2026-08-19T12:00:00.000Z";
function actorName(aps, actor, configuredName) {
  if (configuredName) return configuredName;
  return aps.users.findOneBy("email", actor)?.name ?? aps.users.findOneBy("user_id", actor)?.name ?? "Test User";
}
function projectFolderId(projectId) {
  return `urn:adsk.wipprod:fs.folder:co.${Buffer.from(projectId).toString("base64url")}`;
}
function documentFileType(displayName) {
  const separator = displayName.lastIndexOf(".");
  return separator < 0 ? "" : displayName.slice(separator + 1).toLowerCase();
}
function documentMimeType(extension) {
  switch (extension) {
    case "dwg":
      return "application/acad";
    case "pdf":
      return "application/pdf";
    case "rvt":
      return "application/vnd.autodesk.revit";
    default:
      return "application/octet-stream";
  }
}
function createDocumentItem(aps, data) {
  const folder = aps.documentFolders.findOneBy("folder_id", data.folder_id);
  if (!folder || folder.project_id !== data.project_id) {
    throw new Error(`APS document item '${data.item_id}' references unknown folder '${data.folder_id}'.`);
  }
  if (aps.documentItems.findOneBy("item_id", data.item_id)) {
    throw new Error(`APS document item '${data.item_id}' already exists.`);
  }
  return aps.documentItems.insert(data);
}
function createDocumentVersion(aps, data) {
  const item = aps.documentItems.findOneBy("item_id", data.item_id);
  if (!item || item.project_id !== data.project_id) {
    throw new Error(`APS document version '${data.version_id}' references unknown item '${data.item_id}'.`);
  }
  if (!Number.isInteger(data.version_number) || data.version_number < 1) {
    throw new Error(`APS document version '${data.version_id}' must have a positive integer version number.`);
  }
  if (aps.documentVersions.findOneBy("version_id", data.version_id)) {
    throw new Error(`APS document version '${data.version_id}' already exists.`);
  }
  if (aps.documentVersions.findBy("item_id", data.item_id).some((version) => version.version_number === data.version_number)) {
    throw new Error(`APS document item '${data.item_id}' has more than one version numbered ${data.version_number}.`);
  }
  return aps.documentVersions.insert(data);
}
function versionNumber(versionId, configured) {
  if (configured !== void 0) return configured;
  const match = /[?&]version=(\d+)(?:&|$)/.exec(versionId);
  return match ? Number(match[1]) : 1;
}
function insertFolder(aps, seed) {
  const actor = seed.created_by ?? DEFAULT_USER_EMAIL;
  const actorDisplayName = actorName(aps, actor, seed.created_by_name);
  const created = seed.create_time ?? DEFAULT_TIMESTAMP;
  const modifier = seed.last_modified_by ?? actor;
  return aps.documentFolders.insert({
    folder_id: seed.id,
    project_id: seed.project_id,
    parent_folder_id: seed.parent_folder_id ?? null,
    name: seed.name,
    hidden: seed.hidden ?? false,
    created_by: actor,
    created_by_name: actorDisplayName,
    create_time: created,
    last_modified_by: modifier,
    last_modified_by_name: actorName(aps, modifier, seed.last_modified_by_name),
    last_modified_time: seed.last_modified_time ?? created
  });
}
function validateFolders(aps) {
  for (const folder of aps.documentFolders.all()) {
    if (!aps.projects.findOneBy("project_id", folder.project_id)) {
      throw new Error(`APS document folder '${folder.folder_id}' references unknown project '${folder.project_id}'.`);
    }
    if (folder.parent_folder_id) {
      const parent = aps.documentFolders.findOneBy("folder_id", folder.parent_folder_id);
      if (!parent) {
        throw new Error(
          `APS document folder '${folder.folder_id}' references unknown parent '${folder.parent_folder_id}'.`
        );
      }
      if (parent.project_id !== folder.project_id) {
        throw new Error(`APS document folder '${folder.folder_id}' references a parent from another project.`);
      }
    }
    folderAncestors(aps, folder.project_id, folder.folder_id);
  }
}
function materializeLegacyFolders(aps, projectId, folderId, ancestorFolderIds) {
  const configuredFolder = aps.documentFolders.findOneBy("folder_id", folderId);
  if (ancestorFolderIds.length === 0 && configuredFolder?.project_id === projectId) return;
  const lineage = [...ancestorFolderIds, folderId];
  let parentFolderId;
  lineage.forEach((id, index) => {
    const existing = aps.documentFolders.findOneBy("folder_id", id);
    if (existing) {
      if (existing.project_id !== projectId) throw new Error(`APS document folder '${id}' belongs to another project.`);
      if ((existing.parent_folder_id ?? void 0) !== parentFolderId) {
        throw new Error(`APS legacy document lineage for folder '${id}' conflicts with the configured tree.`);
      }
    } else {
      insertFolder(aps, {
        id,
        project_id: projectId,
        parent_folder_id: parentFolderId,
        name: index === lineage.length - 1 ? "Plans" : `Ancestor ${index + 1}`
      });
    }
    parentFolderId = id;
  });
}
function rootFolderForProject(aps, projectId) {
  return aps.documentFolders.findBy("project_id", projectId).find((folder) => folder.parent_folder_id === null);
}
function folderAncestors(aps, projectId, folderId) {
  const folder = aps.documentFolders.findOneBy("folder_id", folderId);
  if (!folder || folder.project_id !== projectId) return [];
  const ancestors = [];
  const visited = /* @__PURE__ */ new Set([folder.folder_id]);
  let parentId = folder.parent_folder_id;
  while (parentId) {
    if (visited.has(parentId)) throw new Error(`APS document folder tree contains a cycle at '${parentId}'.`);
    visited.add(parentId);
    const parent = aps.documentFolders.findOneBy("folder_id", parentId);
    if (!parent || parent.project_id !== projectId) return [];
    ancestors.unshift(parent);
    parentId = parent.parent_folder_id;
  }
  return ancestors;
}
function folderSubtree(aps, projectId, folderId) {
  const root = aps.documentFolders.findOneBy("folder_id", folderId);
  if (!root || root.project_id !== projectId) return [];
  const folders = [];
  const pending = [root];
  const visited = /* @__PURE__ */ new Set();
  for (let index = 0; index < pending.length; index += 1) {
    const folder = pending[index];
    if (visited.has(folder.folder_id)) {
      throw new Error(`APS document folder tree contains a cycle at '${folder.folder_id}'.`);
    }
    visited.add(folder.folder_id);
    folders.push(folder);
    pending.push(
      ...aps.documentFolders.findBy("parent_folder_id", folder.folder_id).filter((candidate) => candidate.project_id === projectId)
    );
  }
  return folders;
}
function documentItemForVersion(aps, version) {
  const item = aps.documentItems.findOneBy("item_id", version.item_id);
  return item?.project_id === version.project_id ? item : void 0;
}
function itemTip(aps, itemId) {
  return aps.documentVersions.findBy("item_id", itemId).sort((left, right) => right.version_number - left.version_number)[0];
}
function seedDocumentTreeFromConfig(aps, config) {
  for (const seed of config.document_folders ?? []) {
    if (aps.documentFolders.findOneBy("folder_id", seed.id)) continue;
    insertFolder(aps, seed);
  }
  for (const project of aps.projects.all()) {
    if (aps.documentFolders.findBy("project_id", project.project_id).length > 0) continue;
    insertFolder(aps, {
      id: projectFolderId(project.project_id),
      project_id: project.project_id,
      name: "Project Files"
    });
  }
  validateFolders(aps);
  for (const seed of config.document_items ?? []) {
    if (aps.documentItems.findOneBy("item_id", seed.id)) continue;
    const actor = seed.created_by ?? DEFAULT_USER_EMAIL;
    const created = seed.create_time ?? DEFAULT_TIMESTAMP;
    const modifier = seed.last_modified_by ?? actor;
    createDocumentItem(aps, {
      item_id: seed.id,
      project_id: seed.project_id,
      folder_id: seed.folder_id,
      display_name: seed.display_name,
      hidden: seed.hidden ?? false,
      reserved: seed.reserved ?? false,
      reserved_time: seed.reserved_time ?? null,
      reserved_by: seed.reserved_by ?? null,
      reserved_by_name: seed.reserved_by_name ?? null,
      created_by: actor,
      created_by_name: actorName(aps, actor, seed.created_by_name),
      create_time: created,
      last_modified_by: modifier,
      last_modified_by_name: actorName(aps, modifier, seed.last_modified_by_name),
      last_modified_time: seed.last_modified_time ?? created,
      extension_type: seed.extension_type ?? "items:autodesk.bim360:File"
    });
  }
  const versions = [...config.document_versions ?? [], ...config.webhook_dm_versions ?? []];
  for (const seed of versions) {
    if (aps.documentItems.findOneBy("item_id", seed.item_id)) continue;
    if (!seed.folder_id) {
      throw new Error(`APS document version '${seed.version_id}' references unknown item '${seed.item_id}'.`);
    }
    materializeLegacyFolders(aps, seed.project_id, seed.folder_id, seed.ancestor_folder_ids ?? []);
    const displayName = seed.display_name ?? "model.rvt";
    const actor = seed.created_by ?? DEFAULT_USER_EMAIL;
    const created = seed.create_time ?? DEFAULT_TIMESTAMP;
    const modifier = seed.last_modified_by ?? actor;
    createDocumentItem(aps, {
      item_id: seed.item_id,
      project_id: seed.project_id,
      folder_id: seed.folder_id,
      display_name: displayName,
      hidden: false,
      reserved: false,
      reserved_time: null,
      reserved_by: null,
      reserved_by_name: null,
      created_by: actor,
      created_by_name: actorName(aps, actor, seed.created_by_name),
      create_time: created,
      last_modified_by: modifier,
      last_modified_by_name: actorName(aps, modifier, seed.last_modified_by_name),
      last_modified_time: seed.last_modified_time ?? created,
      extension_type: "items:autodesk.bim360:File"
    });
  }
  validateFolders(aps);
  for (const seed of versions) {
    if (aps.documentVersions.findOneBy("version_id", seed.version_id)) continue;
    const item = aps.documentItems.findOneBy("item_id", seed.item_id);
    if (!item || item.project_id !== seed.project_id) {
      throw new Error(`APS document version '${seed.version_id}' references unknown item '${seed.item_id}'.`);
    }
    if (seed.folder_id && item.folder_id !== seed.folder_id) {
      throw new Error(`APS document version '${seed.version_id}' conflicts with its item's folder.`);
    }
    const displayName = seed.display_name ?? item.display_name;
    const extension = seed.file_type ?? documentFileType(displayName);
    const number = versionNumber(seed.version_id, seed.version_number);
    const bubbleUrn = seed.bubble_urn === void 0 ? DEFAULT_MANIFEST_URN : seed.bubble_urn;
    if (bubbleUrn && !aps.manifests.findOneBy("urn", bubbleUrn)) {
      throw new Error(`APS document version '${seed.version_id}' references unknown manifest '${bubbleUrn}'.`);
    }
    const actor = seed.created_by ?? DEFAULT_USER_EMAIL;
    const created = seed.create_time ?? item.create_time;
    const modifier = seed.last_modified_by ?? actor;
    createDocumentVersion(aps, {
      version_id: seed.version_id,
      item_id: seed.item_id,
      project_id: seed.project_id,
      version_number: number,
      display_name: displayName,
      file_type: extension,
      mime_type: seed.mime_type ?? documentMimeType(extension),
      storage_size: seed.storage_size ?? 0,
      storage_urn: seed.storage_urn ?? `urn:adsk.objects:os.object:emulate-bucket/${encodeURIComponent(seed.version_id)}`,
      region: (seed.region ?? "US").toUpperCase(),
      bubble_urn: bubbleUrn,
      viewable_id: seed.viewable_id ?? "emulate-3d-view",
      viewable_guid: seed.viewable_guid ?? "d8e734a8-6e9e-4f4d-9a4f-000000000001",
      created_by: actor,
      created_by_name: actorName(aps, actor, seed.created_by_name),
      create_time: created,
      last_modified_by: modifier,
      last_modified_by_name: actorName(aps, modifier, seed.last_modified_by_name),
      last_modified_time: seed.last_modified_time ?? created
    });
  }
}

// src/model-coordination.ts
import { createHash as createHash2, randomUUID } from "crypto";
import { gzipSync } from "zlib";

// src/auth.ts
import { generateKeyPair, jwtVerify } from "jose";
var APS_TOKEN_KID = "emulate-aps-1";
var APS_TOKEN_ISSUER = "https://developer.api.autodesk.com";
var APS_TOKEN_AUDIENCE = "https://autodesk.com";
function getApsKeyPair(store) {
  let pair = store.getData("aps.oauth.keyPair");
  if (!pair) {
    pair = generateKeyPair("RS256");
    store.setData("aps.oauth.keyPair", pair);
  }
  return pair;
}
function getAccessTokens(store) {
  let map = store.getData("aps.oauth.accessTokens");
  if (!map) {
    map = /* @__PURE__ */ new Map();
    store.setData("aps.oauth.accessTokens", map);
  }
  return map;
}
function invalidToken(c) {
  return c.json(
    {
      developerMessage: "Access token provided is invalid or expired.",
      moreInfo: "https://forge.autodesk.com/en/docs/oauth/v2/developers_guide/error_handling/",
      errorCode: "AUTH-006"
    },
    401
  );
}
function insufficientPrivilege(c) {
  return c.json(
    {
      developerMessage: "Token does not have the privilege for this request.",
      moreInfo: "https://aps.autodesk.com/en/docs/oauth/v2/developers_guide/error_handling/",
      errorCode: "AUTH-010"
    },
    403
  );
}
function bearerToken(c) {
  const match = (c.req.header("Authorization") ?? "").match(/^Bearer\s+(\S+)$/i);
  return match?.[1] ?? null;
}
async function findActiveAccessToken(store, token) {
  const record = getAccessTokens(store).get(token);
  if (!record || record.expiresAt <= Math.floor(Date.now() / 1e3)) return null;
  try {
    const { publicKey } = await getApsKeyPair(store);
    await jwtVerify(token, publicKey, {
      algorithms: ["RS256"],
      issuer: APS_TOKEN_ISSUER,
      audience: APS_TOKEN_AUDIENCE
    });
    return record;
  } catch {
    return null;
  }
}
async function accessTokenForRequest(c, store) {
  const token = bearerToken(c);
  return token ? findActiveAccessToken(store, token) : null;
}
function tokenGrantsScopes(record, scopes) {
  const granted = parseScope(record.scope);
  return scopes.every((scope) => granted.includes(scope));
}
function apsAuth(store, options) {
  return async (c, next) => {
    const record = await accessTokenForRequest(c, store);
    if (!record) return invalidToken(c);
    if (!tokenGrantsScopes(record, options.scopes)) {
      return insufficientPrivilege(c);
    }
    if (options.requireUser && !record.apsUserId) {
      return insufficientPrivilege(c);
    }
    await next();
  };
}

// src/acc.ts
function bareProjectId(projectId) {
  return projectId.startsWith("b.") ? projectId.slice(2) : projectId;
}
function projectForAccId(aps, requestedProjectId, rule) {
  if (rule === "bare" && requestedProjectId.startsWith("b.")) return { kind: "invalid" };
  const bareId = bareProjectId(requestedProjectId);
  const project = aps.projects.all().find((candidate) => bareProjectId(candidate.project_id) === bareId);
  return project ? { kind: "found", project } : { kind: "missing" };
}
function integerValue(value) {
  if (typeof value === "number") return Number.isInteger(value) ? value : null;
  if (typeof value !== "string" || value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}
function parseOffsetPagination(limitValue, offsetValue, options) {
  const limit = limitValue === void 0 ? options.defaultLimit : integerValue(limitValue);
  const offset = offsetValue === void 0 ? 0 : integerValue(offsetValue);
  if (limit === null || limit < 1 || limit > options.maxLimit) {
    return { ok: false, message: `limit must be an integer between 1 and ${options.maxLimit}.` };
  }
  if (offset === null || offset < 0) {
    return { ok: false, message: "offset must be a non-negative integer." };
  }
  return { ok: true, value: { limit, offset } };
}
function queryPagination(c, options) {
  return parseOffsetPagination(c.req.query("limit"), c.req.query("offset"), options);
}
function pageItems(items, pagination2) {
  return items.slice(pagination2.offset, pagination2.offset + pagination2.limit);
}
function offsetEnvelope(items, pagination2, totalResults) {
  return {
    pagination: { ...pagination2, totalResults },
    results: items
  };
}
function pageUrl(requestUrl, pagination2, offset) {
  const url = new URL(requestUrl);
  url.searchParams.set("limit", String(pagination2.limit));
  url.searchParams.set("offset", String(offset));
  return url.toString();
}
function sheetsEnvelope(items, pagination2, totalResults, requestUrl) {
  const previousOffset = Math.max(0, pagination2.offset - pagination2.limit);
  const nextOffset = pagination2.offset + pagination2.limit;
  return {
    results: items,
    pagination: {
      ...pagination2,
      previousUrl: pagination2.offset > 0 ? pageUrl(requestUrl, pagination2, previousOffset) : "",
      nextUrl: nextOffset < totalResults ? pageUrl(requestUrl, pagination2, nextOffset) : "",
      totalResults
    }
  };
}
function commaSeparated(value) {
  return (value ?? "").split(",").map((item) => item.trim()).filter(Boolean);
}
async function readJsonObject(c) {
  try {
    const value = await c.req.json();
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return { ok: false, message: "The request body must be a JSON object." };
    }
    return { ok: true, value };
  } catch {
    return { ok: false, message: "The request body must contain valid JSON." };
  }
}
async function userForApsRequest(c, store, aps, allowUserHeader) {
  const token = await accessTokenForRequest(c, store);
  if (!token) return null;
  if (token.apsUserId) return aps.users.findOneBy("user_id", token.apsUserId) ?? null;
  if (!allowUserHeader) return null;
  const requestedUserId = c.req.header("x-user-id");
  return requestedUserId ? aps.users.findOneBy("user_id", requestedUserId) ?? null : null;
}
function accProjectUser(aps, projectId, userId2) {
  return aps.accProjectUsers.findBy("project_id", projectId).find((membership) => membership.user_id === userId2) ?? null;
}
function issuesError(c, status, title, detail) {
  return c.json({ title, detail }, status);
}
function rfiError(c, status, code, message) {
  return c.json({ error: { code, message } }, status);
}
function sheetsError(c, status, errorCode, message) {
  return c.json({ errorCode, message }, status);
}

// src/signed-blobs.ts
import { createHmac, randomBytes as randomBytes2, timingSafeEqual } from "crypto";

// src/problem.ts
function problem(c, status, input) {
  return c.json(
    {
      type: input.type,
      title: input.title,
      detail: input.detail,
      errors: input.errors ?? []
    },
    status,
    { "Content-Type": "application/problem+json" }
  );
}
function badInput(c, field, detail) {
  return problem(c, 400, {
    type: "BadInput",
    title: "One or more input values in the request were bad",
    detail: `The following parameters are invalid: ${field}`,
    errors: [{ field, title: "Invalid parameter", detail, type: "BadInput" }]
  });
}
function notFound(c, resource) {
  return problem(c, 404, {
    type: "NotFound",
    title: "The requested resource was not found",
    detail: `${resource} was not found.`
  });
}
function forbidden(c, detail) {
  return problem(c, 403, {
    type: "Forbidden",
    title: "The request is forbidden",
    detail
  });
}
function payloadTooLarge(c, detail) {
  return problem(c, 413, {
    type: "PayloadTooLarge",
    title: "The request payload is too large",
    detail
  });
}

// src/store.ts
function getApsStore(store) {
  return {
    clients: store.collection("aps.clients", ["client_id"]),
    users: store.collection("aps.users", ["user_id", "email"]),
    hubs: store.collection("aps.hubs", ["hub_id"]),
    projects: store.collection("aps.projects", ["project_id", "hub_id"]),
    manifests: store.collection("aps.manifests", ["urn"]),
    accProjectUsers: store.collection("aps.accProjectUsers", ["project_id", "user_id"]),
    issueTypes: store.collection("aps.issueTypes", ["project_id", "issue_type_id"]),
    issues: store.collection("aps.issues", ["project_id", "issue_id"]),
    rfiTypes: store.collection("aps.rfiTypes", ["project_id", "rfi_type_id"]),
    rfiAttributes: store.collection("aps.rfiAttributes", ["project_id", "attribute_id"]),
    rfis: store.collection("aps.rfis", ["project_id", "rfi_id"]),
    sheetCollections: store.collection("aps.sheetCollections", ["project_id", "collection_id"]),
    sheetVersionSets: store.collection("aps.sheetVersionSets", ["project_id", "version_set_id"]),
    sheets: store.collection("aps.sheets", ["project_id", "sheet_id"]),
    webhookHooks: store.collection("aps.webhookHooks", ["hook_id"]),
    webhookSecrets: store.collection("aps.webhookSecrets", ["identity_key"]),
    webhookDeliveries: store.collection("aps.webhookDeliveries"),
    documentFolders: store.collection("aps.documentFolders", [
      "folder_id",
      "project_id",
      "parent_folder_id"
    ]),
    documentItems: store.collection("aps.documentItems", ["item_id", "project_id", "folder_id"]),
    documentVersions: store.collection("aps.documentVersions", ["version_id", "item_id"]),
    storageObjects: store.collection("aps.storageObjects", [
      "object_id",
      "bucket_key",
      "object_key",
      "project_id",
      "folder_id"
    ]),
    uploadSessions: store.collection("aps.uploadSessions", [
      "upload_key",
      "bucket_key",
      "object_key"
    ]),
    translationJobs: store.collection("aps.translationJobs", ["urn", "status"]),
    modelSets: store.collection("aps.modelSets", ["project_id", "model_set_id"]),
    modelSetVersions: store.collection("aps.modelSetVersions", ["model_set_id", "version"]),
    modelSetViews: store.collection("aps.modelSetViews", ["model_set_id", "version"]),
    clashTests: store.collection("aps.clashTests", ["project_id", "test_id", "model_set_id"]),
    clashGroups: store.collection("aps.clashGroups", ["test_id", "disposition"]),
    signedBlobs: store.collection("aps.signedBlobs", ["blob_id"])
  };
}

// src/signed-blobs.ts
var SIGNING_SECRET_KEY = "aps.signedBlobSecret";
function signingSecret(store) {
  const existing = store.getData(SIGNING_SECRET_KEY);
  if (existing) return existing;
  const secret = randomBytes2(32).toString("base64url");
  store.setData(SIGNING_SECRET_KEY, secret);
  return secret;
}
function signedResourceSignature(store, resourceId, expires, nonce) {
  return createHmac("sha256", signingSecret(store)).update(`${resourceId}
${expires}
${nonce}`).digest("base64url");
}
function signaturesMatch(actual, expected) {
  const left = Buffer.from(actual);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}
function putSignedBlob(aps, input) {
  const data = {
    blob_id: input.blobId,
    filename: input.filename,
    content_type: input.contentType,
    content_base64: input.content.toString("base64")
  };
  const existing = aps.signedBlobs.findOneBy("blob_id", input.blobId);
  if (existing) aps.signedBlobs.update(existing.id, data);
  else aps.signedBlobs.insert(data);
}
function issueSignedBlobUrl(store, baseUrl, blobId, ttlMs) {
  return issueSignedResourceUrl(store, baseUrl, `/_aps/blobs/${encodeURIComponent(blobId)}`, blobId, ttlMs);
}
function issueSignedResourceUrl(store, baseUrl, path, resourceId, ttlMs) {
  const expires = Date.now() + ttlMs;
  const nonce = randomBytes2(12).toString("base64url");
  const signature = signedResourceSignature(store, resourceId, expires, nonce);
  const url = new URL(path, baseUrl);
  url.searchParams.set("expires", String(expires));
  url.searchParams.set("nonce", nonce);
  url.searchParams.set("signature", signature);
  return { url: url.toString(), validUntil: new Date(expires).toISOString() };
}
function validateSignedResource(store, resourceId, values) {
  const expires = values.expires ? Number(values.expires) : Number.NaN;
  if (!Number.isSafeInteger(expires) || !values.nonce || !values.signature || expires <= Date.now()) return false;
  const expected = signedResourceSignature(store, resourceId, expires, values.nonce);
  return signaturesMatch(values.signature, expected);
}
function signedBlobRoutes({ app, store }) {
  const aps = getApsStore(store);
  app.get("/_aps/blobs/:blobId", (c) => {
    const blobId = c.req.param("blobId");
    if (!validateSignedResource(store, blobId, {
      expires: c.req.query("expires"),
      nonce: c.req.query("nonce"),
      signature: c.req.query("signature")
    })) {
      return forbidden(c, "The signed blob URL is invalid or has expired.");
    }
    const blob = aps.signedBlobs.findOneBy("blob_id", blobId);
    if (!blob) return notFound(c, "The requested blob");
    return new Response(Buffer.from(blob.content_base64, "base64"), {
      status: 200,
      headers: {
        "Content-Type": blob.content_type,
        "Content-Disposition": `attachment; filename="${blob.filename}"`
      }
    });
  });
}

// src/model-coordination.ts
var TIMING_KEY = "aps.modelCoordinationTiming";
var IDENTITY_TRANSFORM = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
var CLASH_RESOURCE_TYPES = [
  "scope-version-clash.2.0.0",
  "scope-version-clash-instance.2.0.0",
  "scope-version-document.2.0.0"
];
var CANNED_CLASHES = [
  { id: 1, clash: [0, 1], dist: 0.125, status: "New" },
  { id: 2, clash: [0, 1], dist: 0.25, status: "Existing" },
  { id: 3, clash: [0, 1], dist: 0.5, status: "Resolved" }
];
var RESOLVED_CLASH_IDS = CANNED_CLASHES.filter((clash) => clash.status === "Resolved").map((clash) => clash.id);
var UNRESOLVED_CLASH_IDS = CANNED_CLASHES.filter((clash) => clash.status !== "Resolved").map((clash) => clash.id);
function getModelCoordinationTiming(store) {
  return store.getData(TIMING_KEY) ?? { ...DEFAULT_MODEL_COORDINATION_TIMING };
}
function setModelCoordinationTiming(store, timing) {
  const next = { ...getModelCoordinationTiming(store), ...timing };
  if (!Number.isFinite(next.processing_ms) || next.processing_ms < 0) {
    throw new Error("APS Model Coordination processing_ms must be a non-negative number.");
  }
  if (!Number.isFinite(next.signed_url_ttl_ms) || next.signed_url_ttl_ms < 1) {
    throw new Error("APS Model Coordination signed_url_ttl_ms must be a positive number.");
  }
  store.setData(TIMING_KEY, next);
}
function checksum(value) {
  return createHash2("sha256").update(value).digest("hex");
}
function modelSetDocument(aps, version) {
  const item = documentItemForVersion(aps, version);
  if (!item) throw new Error(`APS document version '${version.version_id}' references an unknown item.`);
  if (!version.bubble_urn) throw new Error(`APS document version '${version.version_id}' has no translated manifest.`);
  const tip = itemTip(aps, item.item_id);
  return {
    stableDocumentId: version.item_id,
    unstableDocumentId: version.version_id,
    documentLineage: {
      lineageUrn: version.item_id,
      parentFolderUrn: item.folder_id,
      isAligned: true,
      tipVersionUrn: tip?.version_id ?? version.version_id
    },
    alignment: {
      transform: [...IDENTITY_TRANSFORM],
      checksum: checksum(`${version.version_id}:alignment`),
      upAxis: [0, 0, 1],
      distanceUnit: "feet"
    },
    isTipVersion: tip?.version_id === version.version_id,
    documentStatus: "Succeeded",
    forgeType: "versions:autodesk.bim360:Document",
    versionUrn: version.version_id,
    displayName: version.display_name,
    revision: String(version.version_number),
    viewableName: "{3D}",
    createUserId: version.created_by,
    createTime: version.create_time,
    viewableGuid: version.viewable_guid,
    viewableId: version.viewable_id,
    viewableMime: "application/autodesk-svf2",
    bubbleUrn: version.bubble_urn,
    isSvf2Supported: true,
    originalSeedFileVersionSize: version.storage_size,
    originalSeedFileVersionUrn: version.storage_urn,
    originalSeedFileVersionName: version.display_name
  };
}
function clashTestPayload(test) {
  return {
    id: test.test_id,
    ...test.completed_on ? { completedOn: test.completed_on } : {},
    modelSetId: test.model_set_id,
    modelSetVersion: test.model_set_version,
    status: test.status
  };
}
function modelSetVersionPayload(version) {
  return {
    modelSetId: version.model_set_id,
    version: version.version,
    createTime: version.create_time,
    status: version.status,
    documentVersions: structuredClone(version.document_versions)
  };
}
function modelSetSummaryPayload(modelSet) {
  return {
    modifiedBy: modelSet.modified_by,
    modifiedTime: modelSet.modified_time,
    modelSetId: modelSet.model_set_id,
    containerId: bareProjectId(modelSet.project_id),
    name: modelSet.name,
    description: modelSet.description,
    createdBy: modelSet.created_by,
    createdTime: modelSet.created_time,
    isDisabled: modelSet.disabled,
    isDeleted: modelSet.deleted,
    includedFolderCount: modelSet.folder_urns.length,
    rootFolder: { folderUrn: modelSet.root_folder_urn },
    hasContentFilters: false,
    clashEngineVersion: "2.0.0",
    isDocumentLimitReached: false
  };
}
function latestModelSetVersion(aps, modelSetId) {
  return aps.modelSetVersions.findBy("model_set_id", modelSetId).sort((left, right) => right.version - left.version)[0];
}
function modelSetPayload(aps, modelSet) {
  const tipVersion = latestModelSetVersion(aps, modelSet.model_set_id)?.version ?? 0;
  return {
    ...modelSetSummaryPayload(modelSet),
    modelSetType: "ProjectFiles",
    folders: modelSet.folder_urns.map((folderUrn) => ({ folderUrn })),
    includedFolders: modelSet.folder_urns.map((folderUrn) => {
      const folder = aps.documentFolders.findOneBy("folder_id", folderUrn);
      return {
        folderUrn,
        folderName: folder?.name ?? "",
        parentFolderUrn: folder?.parent_folder_id ?? modelSet.root_folder_urn
      };
    }),
    accessedTime: modelSet.modified_time,
    isInactive: false,
    tipVersion,
    permission: "Edit",
    contentFilters: [],
    checksum: checksum(`${modelSet.model_set_id}:${tipVersion}`)
  };
}
function clashResourceBlobId(testId, type) {
  return `${testId}.${type}`;
}
function writeClashArtifacts(aps, version, test) {
  const documents = version.document_versions.map((document, id) => ({ id, urn: document.versionUrn }));
  const instances = CANNED_CLASHES.map((clash, index) => ({
    cid: clash.id,
    ldid: 0,
    loid: 1001 + index,
    lvid: 1,
    rdid: 1,
    roid: 2001 + index,
    rvid: 1
  }));
  const values = {
    "scope-version-clash.2.0.0": CANNED_CLASHES,
    "scope-version-clash-instance.2.0.0": instances,
    "scope-version-document.2.0.0": documents
  };
  for (const type of CLASH_RESOURCE_TYPES) {
    putSignedBlob(aps, {
      blobId: clashResourceBlobId(test.test_id, type),
      filename: `${type}.json.gz`,
      contentType: "application/gzip",
      content: gzipSync(JSON.stringify(values[type]))
    });
  }
}
function seedClashTest(aps, modelSet, version, testId) {
  const test = aps.clashTests.insert({
    project_id: modelSet.project_id,
    test_id: testId,
    model_set_id: modelSet.model_set_id,
    model_set_version: version.version,
    status: "Success",
    completed_on: version.create_time
  });
  aps.clashGroups.insert({
    test_id: test.test_id,
    disposition: "assigned",
    group_id: "17171717-1717-4171-8171-171717171717",
    original_clash_test_id: test.test_id,
    created_at_version: version.version,
    existing: [...UNRESOLVED_CLASH_IDS],
    resolved: [...RESOLVED_CLASH_IDS]
  });
  aps.clashGroups.insert({
    test_id: test.test_id,
    disposition: "closed",
    group_id: "18181818-1818-4181-8181-181818181818",
    original_clash_test_id: test.test_id,
    created_at_version: version.version,
    existing: [],
    resolved: [...RESOLVED_CLASH_IDS]
  });
}
function seedModelCoordinationFromConfig(aps, store, config) {
  if (config.model_coordination_timing) setModelCoordinationTiming(store, config.model_coordination_timing);
  for (const seed of config.model_sets ?? []) {
    if (aps.modelSets.findOneBy("model_set_id", seed.id)) continue;
    const project = aps.projects.findOneBy("project_id", seed.project_id);
    if (!project) throw new Error(`APS model set '${seed.id}' references unknown project '${seed.project_id}'.`);
    const documentIds = seed.document_version_ids ?? [];
    const documents = documentIds.map((id) => {
      const document = aps.documentVersions.findOneBy("version_id", id);
      if (!document) throw new Error(`APS model set '${seed.id}' references unknown document version '${id}'.`);
      if (document.project_id !== project.project_id) {
        throw new Error(`APS model set '${seed.id}' references a document version from another project.`);
      }
      if (!document.bubble_urn || !aps.manifests.findOneBy("urn", document.bubble_urn)) {
        throw new Error(`APS document version '${id}' references unknown manifest '${document.bubble_urn}'.`);
      }
      return document;
    });
    if (documents.length < 2) throw new Error(`APS model set '${seed.id}' requires at least two document versions.`);
    const createdTime = seed.created_time ?? (/* @__PURE__ */ new Date()).toISOString();
    const actor = seed.created_by ?? DEFAULT_USER_EMAIL;
    const documentItems = documents.map((document) => documentItemForVersion(aps, document));
    if (documentItems.some((item) => !item)) {
      throw new Error(`APS model set '${seed.id}' references a document with no item.`);
    }
    const firstItem = documentItems[0];
    const rootFolderUrn = seed.root_folder_urn ?? folderAncestors(aps, project.project_id, firstItem.folder_id)[0]?.folder_id ?? firstItem.folder_id;
    const folderUrns = seed.folder_urns ?? [...new Set(documentItems.map((item) => item.folder_id))];
    for (const folderUrn of [rootFolderUrn, ...folderUrns]) {
      const folder = aps.documentFolders.findOneBy("folder_id", folderUrn);
      if (!folder || folder.project_id !== project.project_id) {
        throw new Error(`APS model set '${seed.id}' references unknown folder '${folderUrn}'.`);
      }
    }
    const modelSet = aps.modelSets.insert({
      project_id: project.project_id,
      model_set_id: seed.id,
      name: seed.name,
      description: seed.description ?? "",
      root_folder_urn: rootFolderUrn,
      folder_urns: [...folderUrns],
      created_by: actor,
      created_time: createdTime,
      modified_by: actor,
      modified_time: createdTime,
      disabled: seed.disabled ?? false,
      deleted: seed.deleted ?? false
    });
    const version = aps.modelSetVersions.insert({
      model_set_id: modelSet.model_set_id,
      version: 1,
      create_time: createdTime,
      status: "Successful",
      document_versions: documents.map((document) => modelSetDocument(aps, document))
    });
    aps.modelSetViews.insert({
      model_set_id: modelSet.model_set_id,
      version: version.version,
      view_id: "19191919-1919-4191-8191-191919191919",
      document_versions: version.document_versions.map((document) => document.versionUrn)
    });
    seedClashTest(aps, modelSet, version, seed.test_id ?? randomUUID());
  }
}
function addModelSetVersion(aps, store, modelSet, overrides) {
  const previous = latestModelSetVersion(aps, modelSet.model_set_id);
  if (!previous) throw new Error(`APS model set '${modelSet.model_set_id}' has no source version.`);
  const createTime = (/* @__PURE__ */ new Date()).toISOString();
  const version = aps.modelSetVersions.insert({
    model_set_id: modelSet.model_set_id,
    version: previous.version + 1,
    create_time: createTime,
    status: "Pending",
    document_versions: structuredClone(previous.document_versions)
  });
  aps.modelSetViews.insert({
    model_set_id: modelSet.model_set_id,
    version: version.version,
    view_id: randomUUID(),
    document_versions: version.document_versions.map((document) => document.versionUrn)
  });
  const test = aps.clashTests.insert({
    project_id: modelSet.project_id,
    test_id: randomUUID(),
    model_set_id: modelSet.model_set_id,
    model_set_version: version.version,
    status: "Pending",
    completed_on: null
  });
  aps.modelSets.update(modelSet.id, { modified_time: createTime });
  const processingMs = overrides?.processingMs ?? getModelCoordinationTiming(store).processing_ms;
  setTimeout(() => {
    aps.modelSetVersions.update(version.id, { status: "Processing" });
    aps.clashTests.update(test.id, { status: "Processing" });
    setTimeout(() => {
      aps.modelSetVersions.update(version.id, { status: "Successful" });
      aps.clashTests.update(test.id, { status: "Success", completed_on: (/* @__PURE__ */ new Date()).toISOString() });
    }, processingMs);
  }, processingMs);
  return { version, test };
}

// src/jsonapi.ts
import { randomUUID as randomUUID2 } from "crypto";
var JSON_API_TYPE = "application/vnd.api+json";
function routeId(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
function asRecord(value) {
  return isRecordObject(value) ? value : null;
}
function resourceAttributes(resource) {
  return asRecord(resource.attributes) ?? {};
}
function relationshipId(resource, name) {
  const relationships = asRecord(resource.relationships);
  const relationship = relationships ? asRecord(relationships[name]) : null;
  const data = relationship ? asRecord(relationship.data) : null;
  return data ? optionalString(data.id) : void 0;
}
function jsonApiDocument(c, selfHref, data, options) {
  c.header("Content-Type", JSON_API_TYPE);
  return c.json({
    jsonapi: { version: "1.0" },
    links: options?.links ?? { self: { href: selfHref } },
    data,
    ...options?.included ? { included: options.included } : {}
  });
}
function jsonApiCreated(c, selfHref, data, included) {
  c.header("Content-Type", JSON_API_TYPE);
  return c.json(
    {
      jsonapi: { version: "1.0" },
      links: { self: { href: selfHref } },
      data,
      ...included ? { included } : {}
    },
    201
  );
}
function jsonApiError(c, status, code, detail) {
  c.header("Content-Type", JSON_API_TYPE);
  return c.json(
    { jsonapi: { version: "1.0" }, errors: [{ id: randomUUID2(), status: String(status), code, detail }] },
    status
  );
}
function jsonApiNotFound(c, detail) {
  return jsonApiError(c, 404, "NOT_FOUND", detail);
}

// src/routes/data-management.ts
var FOLDER_EXTENSION_TYPE = "folders:autodesk.bim360:Folder";
var VERSION_EXTENSION_TYPE = "versions:autodesk.bim360:File";
function hubPath(hubId) {
  return `/project/v1/hubs/${encodeURIComponent(hubId)}`;
}
function projectPath(hubId, projectId) {
  return `${hubPath(hubId)}/projects/${encodeURIComponent(projectId)}`;
}
function dataProjectPath(projectId) {
  return `/data/v1/projects/${encodeURIComponent(projectId)}`;
}
function folderPath(projectId, folderId) {
  return `${dataProjectPath(projectId)}/folders/${encodeURIComponent(folderId)}`;
}
function itemPath(projectId, itemId) {
  return `${dataProjectPath(projectId)}/items/${encodeURIComponent(itemId)}`;
}
function versionPath(projectId, versionId) {
  return `${dataProjectPath(projectId)}/versions/${encodeURIComponent(versionId)}`;
}
function requestHref(c, baseUrl) {
  const requestUrl = new URL(c.req.url);
  return `${baseUrl}${requestUrl.pathname}${requestUrl.search}`;
}
function schemaHref(type) {
  return `https://developer.api.autodesk.com/schema/v1/versions/${encodeURIComponent(type)}-1.0`;
}
function hubData(baseUrl, hub) {
  const path = hubPath(hub.hub_id);
  return {
    type: "hubs",
    id: hub.hub_id,
    attributes: {
      name: hub.name,
      extension: {
        type: "hubs:autodesk.bim360:Account",
        version: "1.0",
        schema: { href: schemaHref("hubs:autodesk.bim360:Account") },
        data: {}
      },
      region: hub.region
    },
    links: { self: { href: `${baseUrl}${path}` } },
    relationships: { projects: { links: { related: { href: `${baseUrl}${path}/projects` } } } }
  };
}
function projectData(baseUrl, aps, project) {
  const path = projectPath(project.hub_id, project.project_id);
  const hub = hubPath(project.hub_id);
  const rootFolder = rootFolderForProject(aps, project.project_id);
  return {
    type: "projects",
    id: project.project_id,
    attributes: {
      name: project.name,
      scopes: ["global"],
      extension: {
        type: "projects:autodesk.bim360:Project",
        version: "1.0",
        schema: { href: schemaHref("projects:autodesk.bim360:Project") },
        data: { projectType: "ACC" }
      }
    },
    links: { self: { href: `${baseUrl}${path}` } },
    relationships: {
      hub: {
        data: { type: "hubs", id: project.hub_id },
        links: { related: { href: `${baseUrl}${hub}` } }
      },
      ...rootFolder ? {
        rootFolder: {
          data: { type: "folders", id: rootFolder.folder_id },
          meta: { link: { href: `${baseUrl}${folderPath(project.project_id, rootFolder.folder_id)}` } }
        }
      } : {},
      topFolders: { links: { related: { href: `${baseUrl}${path}/topFolders` } } }
    }
  };
}
function folderData(baseUrl, aps, folder) {
  const path = folderPath(folder.project_id, folder.folder_id);
  const objectCount = aps.documentFolders.findBy("parent_folder_id", folder.folder_id).length + aps.documentItems.findBy("folder_id", folder.folder_id).length;
  const parent = folder.parent_folder_id ? aps.documentFolders.findOneBy("folder_id", folder.parent_folder_id) : void 0;
  return {
    type: "folders",
    id: folder.folder_id,
    attributes: {
      name: folder.name,
      displayName: folder.name,
      objectCount,
      createTime: folder.create_time,
      createUserId: folder.created_by,
      createUserName: folder.created_by_name,
      lastModifiedTime: folder.last_modified_time,
      lastModifiedUserId: folder.last_modified_by,
      lastModifiedUserName: folder.last_modified_by_name,
      lastModifiedTimeRollup: folder.last_modified_time,
      hidden: folder.hidden,
      extension: {
        type: FOLDER_EXTENSION_TYPE,
        version: "1.0",
        schema: { href: schemaHref(FOLDER_EXTENSION_TYPE) },
        data: {
          allowedTypes: ["folders", "items:autodesk.bim360:File"],
          visibleTypes: ["folders", "items:autodesk.bim360:File"],
          namingStandardIds: []
        }
      }
    },
    links: {
      self: { href: `${baseUrl}${path}` },
      webView: { href: `https://acc.autodesk.com/docs/files/projects/${encodeURIComponent(folder.project_id)}` }
    },
    relationships: {
      ...parent ? {
        parent: {
          data: { type: "folders", id: parent.folder_id },
          links: { related: { href: `${baseUrl}${folderPath(folder.project_id, parent.folder_id)}` } }
        }
      } : {},
      contents: { links: { related: { href: `${baseUrl}${path}/contents` } } }
    }
  };
}
function documentItemData(baseUrl, aps, item) {
  const path = itemPath(item.project_id, item.item_id);
  const tip = itemTip(aps, item.item_id);
  return {
    type: "items",
    id: item.item_id,
    attributes: {
      displayName: item.display_name,
      createTime: item.create_time,
      createUserId: item.created_by,
      createUserName: item.created_by_name,
      lastModifiedTime: item.last_modified_time,
      lastModifiedUserId: item.last_modified_by,
      lastModifiedUserName: item.last_modified_by_name,
      hidden: item.hidden,
      reserved: item.reserved,
      ...item.reserved_time ? { reservedTime: item.reserved_time } : {},
      ...item.reserved_by ? { reservedUserId: item.reserved_by } : {},
      ...item.reserved_by_name ? { reservedUserName: item.reserved_by_name } : {},
      extension: {
        type: item.extension_type,
        version: "1.0",
        schema: { href: schemaHref(item.extension_type) },
        data: { sourceFileName: item.display_name }
      }
    },
    links: {
      self: { href: `${baseUrl}${path}` },
      webView: { href: `https://acc.autodesk.com/docs/files/projects/${encodeURIComponent(item.project_id)}` }
    },
    relationships: {
      parent: {
        data: { type: "folders", id: item.folder_id },
        links: { related: { href: `${baseUrl}${folderPath(item.project_id, item.folder_id)}` } }
      },
      ...tip ? {
        tip: {
          data: { type: "versions", id: tip.version_id },
          links: { related: { href: `${baseUrl}${path}/tip` } }
        }
      } : {},
      versions: { links: { related: { href: `${baseUrl}${path}/versions` } } }
    }
  };
}
function documentVersionData(baseUrl, version) {
  const path = versionPath(version.project_id, version.version_id);
  return {
    type: "versions",
    id: version.version_id,
    attributes: {
      name: version.display_name,
      displayName: version.display_name,
      createTime: version.create_time,
      createUserId: version.created_by,
      createUserName: version.created_by_name,
      lastModifiedTime: version.last_modified_time,
      lastModifiedUserId: version.last_modified_by,
      lastModifiedUserName: version.last_modified_by_name,
      versionNumber: version.version_number,
      mimeType: version.mime_type,
      fileType: version.file_type,
      storageSize: version.storage_size,
      extension: {
        type: VERSION_EXTENSION_TYPE,
        version: "1.0",
        schema: { href: schemaHref(VERSION_EXTENSION_TYPE) },
        data: {
          tempUrn: null,
          properties: {},
          storageUrn: version.storage_urn,
          storageType: "OSS",
          conformingStatus: "NONE"
        }
      }
    },
    links: {
      self: { href: `${baseUrl}${path}` },
      webView: { href: `https://acc.autodesk.com/docs/files/projects/${encodeURIComponent(version.project_id)}` }
    },
    relationships: {
      item: {
        data: { type: "items", id: version.item_id },
        links: { related: { href: `${baseUrl}${itemPath(version.project_id, version.item_id)}` } }
      },
      storage: { data: { type: "objects", id: version.storage_urn } },
      ...version.bubble_urn ? {
        derivatives: {
          data: { type: "derivatives", id: version.bubble_urn },
          meta: {
            link: {
              href: `${baseUrl}/modelderivative/v2/designdata/${encodeURIComponent(version.bubble_urn)}/manifest`
            }
          }
        }
      } : {}
    }
  };
}
function projectForDataRoute(aps, projectId) {
  return aps.projects.findOneBy("project_id", routeId(projectId));
}
function folderForDataRoute(c, aps) {
  const project = projectForDataRoute(aps, c.req.param("projectId"));
  const folderId = routeId(c.req.param("folderId"));
  const folder = aps.documentFolders.findOneBy("folder_id", folderId);
  if (!project || !folder || folder.project_id !== project.project_id) {
    return jsonApiNotFound(c, `The folder ${folderId} was not found in project ${c.req.param("projectId")}.`);
  }
  return folder;
}
function queryValues(c, name) {
  return (c.req.queries(name) ?? []).flatMap((value) => value.split(",")).filter(Boolean);
}
function pagination(c) {
  const numberValue = c.req.query("page[number]") ?? "0";
  const limitValue = c.req.query("page[limit]") ?? "200";
  if (!/^\d+$/.test(numberValue)) return "page[number] must be a non-negative integer.";
  if (!/^\d+$/.test(limitValue)) return "page[limit] must be an integer from 1 through 200.";
  const number = Number(numberValue);
  const limit = Number(limitValue);
  if (limit < 1 || limit > 200) return "page[limit] must be an integer from 1 through 200.";
  return { number, limit };
}
function pageLinks(c, baseUrl, number, limit, total) {
  const href = (pageNumber) => {
    const url = new URL(requestHref(c, baseUrl));
    url.searchParams.set("page[number]", String(pageNumber));
    url.searchParams.set("page[limit]", String(limit));
    return { href: url.toString() };
  };
  const last = Math.max(0, Math.ceil(total / limit) - 1);
  return {
    self: { href: requestHref(c, baseUrl) },
    first: href(0),
    ...number > 0 ? { prev: href(number - 1) } : {},
    ...number < last ? { next: href(number + 1) } : {}
  };
}
function includedTipVersions(baseUrl, aps, items) {
  return items.map((item) => itemTip(aps, item.item_id)).filter((version) => Boolean(version)).map((version) => documentVersionData(baseUrl, version));
}
function dataManagementRoutes({ app, store, baseUrl }) {
  const aps = getApsStore(store);
  const auth = apsAuth(store, { scopes: ["data:read"], requireUser: true });
  app.use("/project/v1/*", auth);
  app.get(
    "/project/v1/hubs",
    (c) => jsonApiDocument(
      c,
      `${baseUrl}/project/v1/hubs`,
      aps.hubs.all().map((hub) => hubData(baseUrl, hub))
    )
  );
  app.get("/project/v1/hubs/:hubId", (c) => {
    const hub = aps.hubs.findOneBy("hub_id", routeId(c.req.param("hubId")));
    if (!hub) return jsonApiNotFound(c, `The hub ${c.req.param("hubId")} was not found.`);
    return jsonApiDocument(c, `${baseUrl}${hubPath(hub.hub_id)}`, hubData(baseUrl, hub));
  });
  app.get("/project/v1/hubs/:hubId/projects", (c) => {
    const hubId = routeId(c.req.param("hubId"));
    if (!aps.hubs.findOneBy("hub_id", hubId)) return jsonApiNotFound(c, `The hub ${hubId} was not found.`);
    const path = `${hubPath(hubId)}/projects`;
    return jsonApiDocument(
      c,
      `${baseUrl}${path}`,
      aps.projects.findBy("hub_id", hubId).map((project) => projectData(baseUrl, aps, project))
    );
  });
  app.get("/project/v1/hubs/:hubId/projects/:projectId", (c) => {
    const hubId = routeId(c.req.param("hubId"));
    if (!aps.hubs.findOneBy("hub_id", hubId)) return jsonApiNotFound(c, `The hub ${hubId} was not found.`);
    const projectId = routeId(c.req.param("projectId"));
    const project = aps.projects.findOneBy("project_id", projectId);
    if (!project || project.hub_id !== hubId)
      return jsonApiNotFound(c, `The project ${projectId} was not found in hub ${hubId}.`);
    return jsonApiDocument(
      c,
      `${baseUrl}${projectPath(hubId, project.project_id)}`,
      projectData(baseUrl, aps, project)
    );
  });
  app.get("/project/v1/hubs/:hubId/projects/:projectId/topFolders", (c) => {
    const hubId = routeId(c.req.param("hubId"));
    const projectId = routeId(c.req.param("projectId"));
    const project = aps.projects.findOneBy("project_id", projectId);
    if (!project || project.hub_id !== hubId)
      return jsonApiNotFound(c, `The project ${projectId} was not found in hub ${hubId}.`);
    const folders = aps.documentFolders.findBy("project_id", project.project_id).filter((folder) => folder.parent_folder_id === null && !folder.hidden);
    return jsonApiDocument(
      c,
      requestHref(c, baseUrl),
      folders.map((folder) => folderData(baseUrl, aps, folder))
    );
  });
  app.get("/data/v1/projects/:projectId/folders/:folderId", auth, (c) => {
    const folder = folderForDataRoute(c, aps);
    if (folder instanceof Response) return folder;
    return jsonApiDocument(c, requestHref(c, baseUrl), folderData(baseUrl, aps, folder));
  });
  app.get("/data/v1/projects/:projectId/folders/:folderId/contents", auth, (c) => {
    const folder = folderForDataRoute(c, aps);
    if (folder instanceof Response) return folder;
    const parsedPage = pagination(c);
    if (typeof parsedPage === "string") return jsonApiError(c, 400, "BAD_INPUT", parsedPage);
    const types = queryValues(c, "filter[type]");
    if (types.some((type) => type !== "folders" && type !== "items")) {
      return jsonApiError(c, 400, "BAD_INPUT", "filter[type] accepts only folders and items.");
    }
    const extensions = queryValues(c, "filter[extension.type]");
    const includeHidden = c.req.query("includeHidden") === "true";
    const children = aps.documentFolders.findBy("parent_folder_id", folder.folder_id).filter((child) => includeHidden || !child.hidden).filter(() => types.length === 0 || types.includes("folders")).filter(() => extensions.length === 0 || extensions.includes(FOLDER_EXTENSION_TYPE)).map((child) => ({ kind: "folder", value: child }));
    const items = aps.documentItems.findBy("folder_id", folder.folder_id).filter((item) => includeHidden || !item.hidden).filter(() => types.length === 0 || types.includes("items")).filter((item) => extensions.length === 0 || extensions.includes(item.extension_type)).map((item) => ({ kind: "item", value: item }));
    const resources = [...children, ...items];
    const start = parsedPage.number * parsedPage.limit;
    const page = resources.slice(start, start + parsedPage.limit);
    const included = includedTipVersions(
      baseUrl,
      aps,
      page.filter((entry) => entry.kind === "item").map((entry) => entry.value)
    );
    return jsonApiDocument(
      c,
      requestHref(c, baseUrl),
      page.map(
        (entry) => entry.kind === "folder" ? folderData(baseUrl, aps, entry.value) : documentItemData(baseUrl, aps, entry.value)
      ),
      { included, links: pageLinks(c, baseUrl, parsedPage.number, parsedPage.limit, resources.length) }
    );
  });
  app.get("/data/v1/projects/:projectId/folders/:folderId/search", auth, (c) => {
    const folder = folderForDataRoute(c, aps);
    if (folder instanceof Response) return folder;
    const parsedPage = pagination(c);
    if (typeof parsedPage === "string") return jsonApiError(c, 400, "BAD_INPUT", parsedPage);
    const name = c.req.query("filter[attributes.displayName]")?.toLocaleLowerCase() ?? "";
    const fileTypes = queryValues(c, "filter[fileType]").map((value) => value.trim().toLocaleLowerCase().replace(/^\./, "")).filter(Boolean);
    const folderIds = new Set(folderSubtree(aps, folder.project_id, folder.folder_id).map((entry) => entry.folder_id));
    const items = aps.documentItems.findBy("project_id", folder.project_id).filter((item) => folderIds.has(item.folder_id) && !item.hidden).filter((item) => !name || item.display_name.toLocaleLowerCase().includes(name)).filter((item) => {
      if (fileTypes.length === 0) return true;
      const tip = itemTip(aps, item.item_id);
      return Boolean(tip && fileTypes.includes(tip.file_type.toLocaleLowerCase()));
    });
    const start = parsedPage.number * parsedPage.limit;
    const page = items.slice(start, start + parsedPage.limit);
    return jsonApiDocument(
      c,
      requestHref(c, baseUrl),
      page.map((item) => documentItemData(baseUrl, aps, item)),
      {
        included: includedTipVersions(baseUrl, aps, page),
        links: pageLinks(c, baseUrl, parsedPage.number, parsedPage.limit, items.length)
      }
    );
  });
  app.get("/data/v1/projects/:projectId/items/:itemId", auth, (c) => {
    const project = projectForDataRoute(aps, c.req.param("projectId"));
    const itemId = routeId(c.req.param("itemId"));
    const item = aps.documentItems.findOneBy("item_id", itemId);
    if (!project || !item || item.project_id !== project.project_id) {
      return jsonApiNotFound(c, `The item ${itemId} was not found in project ${c.req.param("projectId")}.`);
    }
    const tip = itemTip(aps, item.item_id);
    return jsonApiDocument(c, requestHref(c, baseUrl), documentItemData(baseUrl, aps, item), {
      included: tip ? [documentVersionData(baseUrl, tip)] : []
    });
  });
  app.get("/data/v1/projects/:projectId/items/:itemId/versions", auth, (c) => {
    const project = projectForDataRoute(aps, c.req.param("projectId"));
    const itemId = routeId(c.req.param("itemId"));
    const item = aps.documentItems.findOneBy("item_id", itemId);
    if (!project || !item || item.project_id !== project.project_id) {
      return jsonApiNotFound(c, `The item ${itemId} was not found in project ${c.req.param("projectId")}.`);
    }
    const parsedPage = pagination(c);
    if (typeof parsedPage === "string") return jsonApiError(c, 400, "BAD_INPUT", parsedPage);
    const extensions = queryValues(c, "filter[extension.type]");
    const versionNumbers = queryValues(c, "filter[versionNumber]");
    const versions = aps.documentVersions.findBy("item_id", item.item_id).filter(() => extensions.length === 0 || extensions.includes(VERSION_EXTENSION_TYPE)).filter((version) => versionNumbers.length === 0 || versionNumbers.includes(String(version.version_number))).sort((left, right) => right.version_number - left.version_number);
    const start = parsedPage.number * parsedPage.limit;
    return jsonApiDocument(
      c,
      requestHref(c, baseUrl),
      versions.slice(start, start + parsedPage.limit).map((version) => documentVersionData(baseUrl, version)),
      { links: pageLinks(c, baseUrl, parsedPage.number, parsedPage.limit, versions.length) }
    );
  });
  app.get("/data/v1/projects/:projectId/items/:itemId/tip", auth, (c) => {
    const project = projectForDataRoute(aps, c.req.param("projectId"));
    const itemId = routeId(c.req.param("itemId"));
    const item = aps.documentItems.findOneBy("item_id", itemId);
    const tip = item ? itemTip(aps, item.item_id) : void 0;
    if (!project || !item || item.project_id !== project.project_id || !tip) {
      return jsonApiNotFound(c, `The tip for item ${itemId} was not found in project ${c.req.param("projectId")}.`);
    }
    return jsonApiDocument(c, requestHref(c, baseUrl), documentVersionData(baseUrl, tip));
  });
  app.get("/data/v1/projects/:projectId/versions/:versionId", auth, (c) => {
    const project = projectForDataRoute(aps, c.req.param("projectId"));
    const versionId = routeId(c.req.param("versionId"));
    const version = aps.documentVersions.findOneBy("version_id", versionId);
    if (!project || !version || version.project_id !== project.project_id) {
      return jsonApiNotFound(c, `The version ${versionId} was not found in project ${c.req.param("projectId")}.`);
    }
    return jsonApiDocument(c, requestHref(c, baseUrl), documentVersionData(baseUrl, version));
  });
}

// src/routes/ingestion.ts
import { createHash as createHash3, randomUUID as randomUUID4 } from "crypto";

// src/webhooks.ts
import { createHmac as createHmac2, randomUUID as randomUUID3 } from "crypto";

// src/webhook-filter.ts
function splitTopLevel(value, delimiter) {
  const parts = [];
  let quote = null;
  let bracketDepth = 0;
  let start = 0;
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (quote) {
      if (char === "\\") index += 1;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === "'" || char === '"') quote = char;
    else if (char === "[") bracketDepth += 1;
    else if (char === "]") bracketDepth -= 1;
    else if (bracketDepth === 0 && value.slice(index, index + delimiter.length) === delimiter) {
      parts.push(value.slice(start, index).trim());
      start = index + delimiter.length;
      index += delimiter.length - 1;
    }
  }
  parts.push(value.slice(start).trim());
  return parts;
}
function parseScalar(value) {
  const trimmed = value.trim();
  if (/^'(?:[^'\\]|\\.)*'$/.test(trimmed) || /^"(?:[^"\\]|\\.)*"$/.test(trimmed)) {
    const inner = trimmed.slice(1, -1);
    return inner.replace(/\\(['"\\])/g, "$1");
  }
  if (/^-?(?:\d+\.?\d*|\.\d+)$/.test(trimmed)) return Number(trimmed);
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (trimmed === "null") return null;
  return void 0;
}
function parseArray(value) {
  const trimmed = value.trim();
  if (!trimmed.startsWith("[") || !trimmed.endsWith("]")) return null;
  const body = trimmed.slice(1, -1).trim();
  if (!body) return [];
  const result = [];
  for (const part of splitTopLevel(body, ",")) {
    const scalar = parseScalar(part);
    if (scalar === void 0) return null;
    result.push(scalar);
  }
  return result;
}
function valueAtPath(payload, path) {
  let value = payload;
  for (const part of path.split(".")) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return void 0;
    value = value[part];
  }
  return value;
}
function evaluateClause(payload, clause) {
  const match = clause.match(/^@\.([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)\s*(==|!=|>=|<=|>|<|in)\s*(.+)$/);
  if (!match) return null;
  const [, path, operator, rawExpected] = match;
  const actual = valueAtPath(payload, path);
  if (operator === "in") {
    const expected2 = parseArray(rawExpected);
    return expected2 ? expected2.some((candidate) => candidate === actual) : null;
  }
  const expected = parseScalar(rawExpected);
  if (expected === void 0) return null;
  if (operator === "==") return actual === expected;
  if (operator === "!=") return actual !== expected;
  if ((typeof actual !== "number" || typeof expected !== "number") && (typeof actual !== "string" || typeof expected !== "string")) {
    return false;
  }
  if (operator === ">") return actual > expected;
  if (operator === ">=") return actual >= expected;
  if (operator === "<") return actual < expected;
  return actual <= expected;
}
function evaluateFilterString(filter, payload) {
  const trimmed = filter.trim();
  if (!trimmed.startsWith("$[?(") || !trimmed.endsWith(")]")) return null;
  const expression = trimmed.slice(4, -2).trim();
  if (!expression) return null;
  const orGroups = splitTopLevel(expression, "||");
  let valid = true;
  let result = false;
  for (const group of orGroups) {
    const clauses = splitTopLevel(group, "&&");
    let groupMatches = true;
    for (const clause of clauses) {
      const clauseResult = evaluateClause(payload, clause);
      if (clauseResult === null) valid = false;
      if (clauseResult !== true) groupMatches = false;
    }
    if (groupMatches) result = true;
  }
  return valid ? result : null;
}
function validateWebhookFilter(filter) {
  const filters = Array.isArray(filter) ? filter : [filter];
  return filters.length > 0 && filters.every((candidate) => evaluateFilterString(candidate, {}) !== null);
}
function webhookFilterMatches(filter, payload) {
  if (filter === null) return true;
  const filters = Array.isArray(filter) ? filter : [filter];
  return filters.every((candidate) => evaluateFilterString(candidate, payload) === true);
}

// src/webhooks.ts
var TIMING_STORE_KEY = "aps.webhooks.timing";
var MAX_DELIVERIES = 1e3;
async function sendWebhookRequest(request) {
  const start = Date.now();
  try {
    const response = await fetch(request.url, {
      method: "POST",
      headers: request.headers,
      body: request.body,
      signal: AbortSignal.timeout(request.timeoutMs)
    });
    return { status_code: response.status, duration: Date.now() - start, success: response.ok };
  } catch {
    return { status_code: null, duration: Date.now() - start, success: false };
  }
}
function userIdentity(userId2) {
  return { key: `user:${userId2}`, createdBy: userId2, creatorType: "O2User" };
}
function appIdentity(clientId) {
  return { key: `app:${clientId}`, createdBy: clientId, creatorType: "Application" };
}
function getWebhookTiming(store) {
  return { ...DEFAULT_WEBHOOK_TIMING, ...store.getData(TIMING_STORE_KEY) ?? {} };
}
function setWebhookTiming(store, timing) {
  store.setData(TIMING_STORE_KEY, { ...getWebhookTiming(store), ...timing });
}
function canonicalWebhookScope(scope) {
  return JSON.stringify(Object.entries(scope).sort(([left], [right]) => left.localeCompare(right)));
}
function createWebhookRecord(aps, input) {
  return aps.webhookHooks.insert({
    hook_id: randomUUID3(),
    // APS derives a hook's tenant from its scope value when none is supplied.
    tenant: input.tenant ?? Object.values(input.scope)[0] ?? "",
    callback_url: input.callbackUrl,
    created_by: input.identity.createdBy,
    creator_type: input.identity.creatorType,
    identity_key: input.identity.key,
    event: input.event,
    system: input.system,
    status: input.status ?? "active",
    auto_reactivate_hook: input.autoReactivateHook ?? false,
    hook_expiry: input.hookExpiry ?? null,
    hook_attribute: structuredClone(input.hookAttribute ?? null),
    filter: structuredClone(input.filter ?? null),
    scope: structuredClone(input.scope),
    hub_id: input.hubId ?? null,
    project_id: input.projectId ?? null,
    token: input.token ?? null,
    region: input.region,
    failed_event_count: 0,
    inactive_at: input.status === "inactive" ? (/* @__PURE__ */ new Date()).toISOString() : null,
    reactivation_count: 0
  });
}
function findDuplicateHook(aps, input) {
  const canonical = canonicalWebhookScope(input.scope);
  return aps.webhookHooks.all().find(
    (hook) => hook.identity_key === input.identity.key && hook.region === input.region && hook.system === input.system && hook.event === input.event && hook.callback_url === input.callbackUrl && canonicalWebhookScope(hook.scope) === canonical
  );
}
function findWebhookSecret(aps, identityKey, region) {
  return aps.webhookSecrets.findBy("identity_key", identityKey).find((secret) => secret.region === region);
}
function webhookDetails(hook) {
  const details = {
    hookId: hook.hook_id,
    tenant: hook.tenant,
    callbackUrl: hook.callback_url,
    createdBy: hook.created_by,
    event: hook.event,
    createdDate: hook.created_at,
    lastUpdatedDate: hook.updated_at,
    system: hook.system,
    creatorType: hook.creator_type,
    status: hook.status,
    autoReactivateHook: hook.auto_reactivate_hook,
    scope: structuredClone(hook.scope),
    urn: `urn:adsk.webhooks:events.hook:${hook.hook_id}`,
    __self__: `/systems/${encodeURIComponent(hook.system)}/events/${encodeURIComponent(hook.event)}/hooks/${encodeURIComponent(hook.hook_id)}`
  };
  if (hook.hook_expiry !== null) details.hookExpiry = hook.hook_expiry;
  if (hook.hook_attribute !== null) details.hookAttribute = structuredClone(hook.hook_attribute);
  if (hook.filter !== null) details.filter = structuredClone(hook.filter);
  if (hook.hub_id !== null) details.hubId = hook.hub_id;
  if (hook.project_id !== null) details.projectId = hook.project_id;
  return details;
}
function webhookEventMatches(pattern, event) {
  if (pattern === "*") return true;
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".+");
  return new RegExp(`^${escaped}$`).test(event);
}
function eventScopeCandidates(input) {
  const eventScope = input.scope ?? {};
  const ancestors = input.folderAncestors ?? [];
  const anyKey = input.scopeValue !== void 0 ? [input.scopeValue] : [];
  const byName = new Map(Object.entries(eventScope).map(([name, value]) => [name, [value]]));
  byName.set("folder", [...byName.get("folder") ?? [], ...ancestors]);
  const tenants = [
    ...input.tenant !== void 0 ? [input.tenant] : [],
    ...anyKey,
    ...Object.values(eventScope),
    ...ancestors
  ];
  return { byName, anyKey, tenants };
}
function webhookScopeMatches(hook, candidates) {
  const scopeMatches = Object.entries(hook.scope).every(
    ([name, value]) => (candidates.byName.get(name) ?? []).includes(value) || candidates.anyKey.includes(value)
  );
  if (!scopeMatches) return false;
  return !hook.tenant || candidates.tenants.includes(hook.tenant);
}
function skippedDelivery(hook, reason) {
  return {
    hookId: hook.hook_id,
    matched: false,
    delivered: false,
    statusCode: null,
    attempts: 0,
    signaturePresent: false,
    reason
  };
}
function webhookStatusAllowsDelivery(store, hook, now = Date.now()) {
  if (hook.status === "active" || hook.status === "reactivated") return true;
  const inactiveAt = hook.inactive_at ? Date.parse(hook.inactive_at) : Number.NaN;
  const timing = getWebhookTiming(store);
  return hook.auto_reactivate_hook && Number.isFinite(inactiveAt) && now - inactiveAt >= timing.reactivate_after_ms && hook.reactivation_count < timing.max_reactivation_cycles;
}
function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
function addDelivery(aps, data) {
  aps.webhookDeliveries.insert(data);
  for (const delivery of aps.webhookDeliveries.all().slice(0, -MAX_DELIVERIES)) {
    aps.webhookDeliveries.delete(delivery.id);
  }
}
async function attemptDelivery(aps, hook, input, token, timeoutMs, attempt) {
  const envelope = {
    version: "1.0",
    resourceUrn: input.resourceUrn,
    hook: webhookDetails(hook),
    payload: input.payload
  };
  const body = JSON.stringify(envelope);
  const deliveryId = randomUUID3();
  const headers = {
    "Content-Type": "application/json",
    "x-adsk-delivery-id": deliveryId
  };
  if (token) {
    headers["x-adsk-signature"] = `sha1hash=${createHmac2("sha1", token).update(body).digest("hex")}`;
  }
  const result = await sendWebhookRequest({ url: hook.callback_url, headers, body, timeoutMs });
  addDelivery(aps, {
    delivery_id: deliveryId,
    hook_id: hook.hook_id,
    system: input.system,
    event: input.event,
    attempt,
    envelope,
    status_code: result.status_code,
    duration: result.duration,
    success: result.success,
    signature_present: Boolean(token)
  });
  return { success: result.success, statusCode: result.status_code, signaturePresent: Boolean(token) };
}
function identityToken(aps, hook) {
  return hook.token ?? findWebhookSecret(aps, hook.identity_key, hook.region)?.token ?? null;
}
async function deliverMatchingHook(aps, store, hook, input) {
  const timing = getWebhookTiming(store);
  let current = hook;
  let reactivationTrial = current.status === "reactivated";
  if (current.status === "inactive") {
    if (!webhookStatusAllowsDelivery(store, current)) return skippedDelivery(current, "inactive");
    current = aps.webhookHooks.update(current.id, {
      status: "reactivated",
      reactivation_count: current.reactivation_count + 1
    });
    reactivationTrial = true;
  }
  const token = identityToken(aps, current);
  const maxAttempts = reactivationTrial ? 1 : timing.max_retries + 1;
  let lastStatus = null;
  let signaturePresent = false;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const result = await attemptDelivery(aps, current, input, token, timing.delivery_timeout_ms, attempt);
    lastStatus = result.statusCode;
    signaturePresent = result.signaturePresent;
    if (result.success) {
      aps.webhookHooks.update(current.id, {
        status: "active",
        failed_event_count: 0,
        inactive_at: null
      });
      return {
        hookId: current.hook_id,
        matched: true,
        delivered: true,
        statusCode: lastStatus,
        attempts: attempt,
        signaturePresent
      };
    }
    if (attempt < maxAttempts) {
      await delay(Math.min(timing.retry_base_ms * 2 ** (attempt - 1), timing.retry_max_ms));
    }
  }
  if (reactivationTrial) {
    const permanent = current.reactivation_count >= timing.max_reactivation_cycles;
    aps.webhookHooks.update(current.id, {
      status: "inactive",
      inactive_at: (/* @__PURE__ */ new Date()).toISOString(),
      auto_reactivate_hook: permanent ? false : current.auto_reactivate_hook
    });
  } else {
    const failedEventCount = current.failed_event_count + 1;
    const inactive = failedEventCount >= timing.failed_events_before_inactive;
    aps.webhookHooks.update(current.id, {
      failed_event_count: failedEventCount,
      status: inactive ? "inactive" : current.status,
      inactive_at: inactive ? (/* @__PURE__ */ new Date()).toISOString() : current.inactive_at
    });
  }
  return {
    hookId: current.hook_id,
    matched: true,
    delivered: false,
    statusCode: lastStatus,
    attempts: maxAttempts,
    signaturePresent,
    reason: "delivery_failed"
  };
}
function deleteExpiredHooks(aps, now = Date.now()) {
  for (const hook of aps.webhookHooks.all()) {
    if (hook.hook_expiry !== null && Date.parse(hook.hook_expiry) <= now) aps.webhookHooks.delete(hook.id);
  }
}
async function simulateWebhookEvent(aps, store, input) {
  deleteExpiredHooks(aps);
  const candidates = eventScopeCandidates(input);
  const hooks = aps.webhookHooks.all().filter((hook) => hook.region === input.region && hook.system === input.system);
  const reports = await Promise.all(
    hooks.map((hook) => {
      if (!webhookEventMatches(hook.event, input.event)) return skippedDelivery(hook, "event");
      if (!webhookScopeMatches(hook, candidates)) return skippedDelivery(hook, "scope");
      if (!webhookStatusAllowsDelivery(store, hook)) return skippedDelivery(hook, "inactive");
      if (!webhookFilterMatches(hook.filter, input.payload)) return skippedDelivery(hook, "filter");
      return deliverMatchingHook(aps, store, hook, input);
    })
  );
  return { system: input.system, event: input.event, resourceUrn: input.resourceUrn, deliveries: reports };
}
function validWebhookStatus(value) {
  return value === "active" || value === "inactive" || value === "reactivated";
}

// src/dm-events.ts
function documentVersionAddedEvent(aps, version) {
  const item = documentItemForVersion(aps, version);
  if (!item) return null;
  const folder = aps.documentFolders.findOneBy("folder_id", item.folder_id);
  if (!folder) return null;
  const ancestors = folderAncestors(aps, version.project_id, folder.folder_id);
  const projectId = bareProjectId(version.project_id);
  return {
    system: "data",
    event: "dm.version.added",
    resourceUrn: version.version_id,
    region: version.region,
    scope: { folder: folder.folder_id, project: version.project_id },
    folderAncestors: ancestors.map((ancestor) => ancestor.folder_id),
    payload: {
      ext: version.file_type,
      modifiedTime: version.last_modified_time,
      creator: version.created_by,
      lineageUrn: version.item_id,
      sizeInBytes: version.storage_size,
      hidden: item.hidden,
      indexable: true,
      project: projectId,
      source: version.version_id,
      version: String(version.version_number),
      user_info: { id: version.created_by },
      name: version.display_name,
      createdTime: version.create_time,
      modifiedBy: version.last_modified_by,
      state: "CONTENT_AVAILABLE",
      parentFolderUrn: folder.folder_id,
      ancestors: [...ancestors, folder].map((ancestor) => ({ urn: ancestor.folder_id, name: ancestor.name })),
      tenant: projectId
    }
  };
}
async function emitDocumentVersionAdded(aps, store, version) {
  const event = documentVersionAddedEvent(aps, version);
  return event ? simulateWebhookEvent(aps, store, event) : null;
}

// src/ingestion-config.ts
var UPLOAD_CONFIG_KEY = "aps.uploadConfig";
var TRANSLATION_CONFIG_KEY = "aps.translationConfig";
function getUploadConfig(store) {
  return { ...DEFAULT_UPLOAD_CONFIG, ...store.getData(UPLOAD_CONFIG_KEY) ?? {} };
}
function setUploadConfig(store, input) {
  if (input.maxObjectBytes !== void 0 && (!Number.isSafeInteger(input.maxObjectBytes) || input.maxObjectBytes < 1)) {
    throw new Error("APS upload.maxObjectBytes must be a positive integer.");
  }
  store.setData(UPLOAD_CONFIG_KEY, { ...getUploadConfig(store), ...input });
}
function getTranslationConfig(store) {
  const configured = store.getData(TRANSLATION_CONFIG_KEY) ?? {};
  return {
    ...DEFAULT_TRANSLATION_CONFIG,
    ...configured,
    failForExtensions: [...configured.failForExtensions ?? DEFAULT_TRANSLATION_CONFIG.failForExtensions]
  };
}
function setTranslationConfig(store, input) {
  if (input.autoTranslateOnVersionAdd !== void 0 && typeof input.autoTranslateOnVersionAdd !== "boolean") {
    throw new Error("APS translation.autoTranslateOnVersionAdd must be a boolean.");
  }
  if (input.durationMs !== void 0 && (!Number.isFinite(input.durationMs) || input.durationMs < 0)) {
    throw new Error("APS translation.durationMs must be a non-negative number.");
  }
  if (input.failForExtensions !== void 0 && (!Array.isArray(input.failForExtensions) || input.failForExtensions.some((value) => typeof value !== "string"))) {
    throw new Error("APS translation.failForExtensions must contain strings.");
  }
  store.setData(TRANSLATION_CONFIG_KEY, {
    ...getTranslationConfig(store),
    ...input,
    ...input.failForExtensions ? { failForExtensions: input.failForExtensions.map((value) => value.toLowerCase().replace(/^\./, "")) } : {}
  });
}

// src/translation.ts
function terminal(status) {
  return status === "success" || status === "failed";
}
function extractionFinishedEvent(job) {
  const workflow = "emulate-translation";
  return {
    system: "derivative",
    event: "extraction.finished",
    resourceUrn: job.urn,
    region: job.region,
    scope: { workflow },
    payload: {
      TimeStamp: Date.now(),
      URN: job.urn,
      EventType: "EXTRACTION_FINISHED",
      Payload: { status: job.status, scope: workflow, registerKey: [] }
    }
  };
}
async function emitTerminalWebhook(aps, store, job) {
  if (!terminal(job.status) || job.webhook_emitted) return job;
  const guarded = aps.translationJobs.update(job.id, { webhook_emitted: true }) ?? job;
  await simulateWebhookEvent(aps, store, extractionFinishedEvent(guarded));
  return guarded;
}
function enqueueTranslation(aps, store, input) {
  const existing = aps.translationJobs.findOneBy("urn", input.urn);
  if (existing && !input.force) {
    const job = !terminal(existing.status) && input.outputFormats ? aps.translationJobs.update(existing.id, { output_formats: structuredClone(input.outputFormats) }) ?? existing : existing;
    return { job, created: false };
  }
  const now = Date.now();
  const durationMs = getTranslationConfig(store).durationMs;
  const data = {
    source_name: input.sourceName,
    region: (input.region ?? "US").toUpperCase(),
    status: "pending",
    progress: "0% complete",
    started_at: new Date(now).toISOString(),
    completes_at: new Date(now + durationMs).toISOString(),
    output_formats: structuredClone(input.outputFormats ?? [{ type: "svf2", views: ["2d", "3d"] }]),
    force_count: existing ? existing.force_count + 1 : 0,
    webhook_emitted: false
  };
  if (existing) {
    return { job: aps.translationJobs.update(existing.id, data) ?? existing, created: true };
  }
  return { job: aps.translationJobs.insert({ urn: input.urn, ...data }), created: true };
}
function successfulDerivative(job, format) {
  if (format.type === "thumbnail") {
    return { name: job.source_name, status: "success", progress: "complete", outputType: "thumbnail" };
  }
  const guid = stableDerivativeGuid(`${job.urn}:3d`);
  return {
    name: job.source_name,
    status: "success",
    progress: "complete",
    outputType: format.type,
    children: [
      {
        guid,
        type: "geometry",
        role: "3d",
        name: "{3D}",
        viewableID: "emulate-3d-view",
        status: "success",
        progress: "complete"
      }
    ]
  };
}
function derivativesForJob(job) {
  switch (job.status) {
    case "success":
      return job.output_formats.map((format) => successfulDerivative(job, format));
    case "failed":
      return [
        {
          name: job.source_name,
          status: "failed",
          progress: "complete",
          outputType: job.output_formats[0]?.type ?? "svf2",
          messages: [
            {
              type: "error",
              code: "TranslationFailed",
              message: `Translation is configured to fail for .${documentFileType(job.source_name)} files.`
            }
          ]
        }
      ];
    default:
      return job.output_formats.map((format) => ({
        name: job.source_name,
        status: job.status,
        progress: job.progress,
        outputType: format.type
      }));
  }
}
function manifestForJob(job) {
  return {
    type: "manifest",
    hasThumbnail: String(job.output_formats.some((format) => format.type === "thumbnail")),
    status: job.status,
    progress: job.progress,
    region: job.region,
    urn: job.urn,
    version: "1.0",
    derivatives: derivativesForJob(job)
  };
}
async function refreshTranslationJob(aps, store, job, now = Date.now()) {
  if (terminal(job.status)) return emitTerminalWebhook(aps, store, job);
  const started = Date.parse(job.started_at);
  const completes = Date.parse(job.completes_at);
  let next = job;
  if (now >= completes) {
    const extension = documentFileType(job.source_name);
    const failed = getTranslationConfig(store).failForExtensions.includes(extension);
    next = aps.translationJobs.update(job.id, {
      status: failed ? "failed" : "success",
      progress: "complete"
    }) ?? job;
  } else {
    const duration = Math.max(1, completes - started);
    const ratio = Math.max(0, Math.min(1, (now - started) / duration));
    if (ratio >= 0.1) {
      const percent = Math.min(75, Math.max(25, Math.floor(ratio * 4) * 25));
      next = aps.translationJobs.update(job.id, { status: "inprogress", progress: `${percent}% complete` }) ?? job;
    }
  }
  return emitTerminalWebhook(aps, store, next);
}
async function forceTranslationTerminal(aps, store, job, status) {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const alreadyEmittedForOutcome = job.status === status ? job.webhook_emitted : false;
  const updated = aps.translationJobs.update(job.id, {
    status,
    progress: "complete",
    completes_at: now,
    webhook_emitted: alreadyEmittedForOutcome
  }) ?? job;
  return emitTerminalWebhook(aps, store, updated);
}

// src/routes/ingestion.ts
var UPLOAD_SESSION_TTL_MS = 24 * 60 * 60 * 1e3;
var DEFAULT_SIGNED_URL_TTL_MINUTES = 2;
var MAX_UPLOAD_PARTS = 100;
function storageForWrite(c, aps, projectId, folderId, storageId) {
  const storage = storageId ? aps.storageObjects.findOneBy("object_id", storageId) : void 0;
  if (!storage || storage.project_id !== projectId || !storage.uploaded_at || storage.content_base64 === null) {
    return jsonApiError(c, 400, "BAD_INPUT", "The storage relationship must reference a finalized object.");
  }
  if (storage.folder_id !== folderId) {
    return jsonApiError(c, 400, "BAD_INPUT", "The storage object must target the item's parent folder.");
  }
  return storage;
}
async function actorForRequest(c, store, aps) {
  const token = await accessTokenForRequest(c, store);
  const user = token?.apsUserId ? aps.users.findOneBy("user_id", token.apsUserId) : void 0;
  return { id: user?.user_id ?? DEFAULT_USER_EMAIL, name: user?.name ?? "Test User" };
}
function itemVersionId(itemId, versionNumber2) {
  const lineage = itemId.split(":").at(-1);
  return `urn:adsk.wipprod:fs.file:vf.${lineage}?version=${versionNumber2}`;
}
function versionValues(item, storage, versionNumber2, actor, displayName) {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const extension = documentFileType(displayName);
  const bubbleUrn = Buffer.from(storage.object_id).toString("base64url");
  return {
    version_id: itemVersionId(item.item_id, versionNumber2),
    item_id: item.item_id,
    project_id: item.project_id,
    version_number: versionNumber2,
    display_name: displayName,
    file_type: extension,
    mime_type: documentMimeType(extension),
    storage_size: storage.size,
    storage_urn: storage.object_id,
    region: "US",
    bubble_urn: bubbleUrn,
    viewable_id: "emulate-3d-view",
    viewable_guid: stableDerivativeGuid(`${bubbleUrn}:3d`),
    created_by: actor.id,
    created_by_name: actor.name,
    create_time: now,
    last_modified_by: actor.id,
    last_modified_by_name: actor.name,
    last_modified_time: now
  };
}
async function finishVersionWrite(aps, store, version) {
  if (version.bubble_urn && getTranslationConfig(store).autoTranslateOnVersionAdd) {
    enqueueTranslation(aps, store, {
      urn: version.bubble_urn,
      sourceName: version.display_name,
      region: version.region
    });
  }
  await emitDocumentVersionAdded(aps, store, version);
}
function ingestionRoutes({ app, store, baseUrl }) {
  const aps = getApsStore(store);
  const readAuth = apsAuth(store, { scopes: ["data:read"] });
  const writeAuth = apsAuth(store, { scopes: ["data:create", "data:write"] });
  const userWriteAuth = apsAuth(store, { scopes: ["data:create", "data:write"], requireUser: true });
  app.post("/data/v1/projects/:projectId/storage", userWriteAuth, async (c) => {
    const projectId = routeId(c.req.param("projectId"));
    if (!aps.projects.findOneBy("project_id", projectId))
      return jsonApiError(c, 404, "NOT_FOUND", "The project was not found.");
    const body = await jsonObjectBody(c);
    const data = body ? asRecord(body.data) : null;
    const name = data ? optionalString(resourceAttributes(data).name) : void 0;
    const folderId = data ? relationshipId(data, "target") : void 0;
    const folder = folderId ? aps.documentFolders.findOneBy("folder_id", folderId) : void 0;
    if (!data || data.type !== "objects" || !name || !folderId) {
      return jsonApiError(c, 400, "BAD_INPUT", "An objects resource with a name and target folder is required.");
    }
    if (!folder || folder.project_id !== projectId) {
      return jsonApiError(c, 404, "NOT_FOUND", "The target folder was not found in this project.");
    }
    const bucketKey = `wip.dm.emulate-${createHash3("sha1").update(projectId).digest("hex").slice(0, 16)}`;
    const safeName = name.replace(/[\\/]/g, "_");
    const objectKey = `${randomUUID4()}-${safeName}`;
    const objectId = `urn:adsk.objects:os.object:${bucketKey}/${objectKey}`;
    aps.storageObjects.insert({
      object_id: objectId,
      bucket_key: bucketKey,
      object_key: objectKey,
      project_id: projectId,
      folder_id: folderId,
      name,
      size: 0,
      sha1: "",
      content_base64: null,
      uploaded_at: null
    });
    const self = `${baseUrl}/data/v1/projects/${encodeURIComponent(projectId)}/storage`;
    return jsonApiCreated(c, self, {
      type: "objects",
      id: objectId,
      attributes: { name },
      relationships: { target: { data: { type: "folders", id: folderId } } }
    });
  });
  app.get("/oss/v2/buckets/:bucketKey/objects/:objectKey/signeds3upload", writeAuth, (c) => {
    const bucketKey = routeId(c.req.param("bucketKey"));
    const objectKey = routeId(c.req.param("objectKey"));
    const storage = aps.storageObjects.findBy("bucket_key", bucketKey).find((candidate) => candidate.object_key === objectKey);
    if (!storage) return notFound(c, "The requested storage object");
    const partsValue = c.req.query("parts") ?? "1";
    const minutesValue = c.req.query("minutesExpiration") ?? String(DEFAULT_SIGNED_URL_TTL_MINUTES);
    if (!/^\d+$/.test(partsValue) || Number(partsValue) < 1 || Number(partsValue) > MAX_UPLOAD_PARTS) {
      return badInput(c, "parts", `parts must be an integer from 1 through ${MAX_UPLOAD_PARTS}.`);
    }
    if (!/^\d+$/.test(minutesValue) || Number(minutesValue) < 1 || Number(minutesValue) > 60) {
      return badInput(c, "minutesExpiration", "minutesExpiration must be an integer from 1 through 60.");
    }
    const now = Date.now();
    for (const session of aps.uploadSessions.all()) {
      if (Date.parse(session.expires_at) <= now) aps.uploadSessions.delete(session.id);
    }
    const expectedParts = Number(partsValue);
    const uploadKey = randomUUID4();
    const expiresAt = new Date(now + UPLOAD_SESSION_TTL_MS).toISOString();
    const ttlMs = Number(minutesValue) * 6e4;
    aps.uploadSessions.insert({
      upload_key: uploadKey,
      object_key: objectKey,
      bucket_key: bucketKey,
      parts_base64: Array.from({ length: expectedParts }, () => null),
      expected_parts: expectedParts,
      expires_at: expiresAt
    });
    const urls = Array.from({ length: expectedParts }, (_, index) => {
      const part = index + 1;
      return issueSignedResourceUrl(
        store,
        baseUrl,
        `/oss/v2/signed-upload/${encodeURIComponent(uploadKey)}/${part}`,
        `aps-upload:${uploadKey}:${part}`,
        ttlMs
      ).url;
    });
    return c.json({
      uploadKey,
      urls,
      urlExpiration: new Date(now + ttlMs).toISOString(),
      uploadExpiration: expiresAt
    });
  });
  app.put("/oss/v2/signed-upload/:uploadKey/:part", async (c) => {
    const uploadKey = c.req.param("uploadKey");
    const part = Number(c.req.param("part"));
    if (!validateSignedResource(store, `aps-upload:${uploadKey}:${part}`, {
      expires: c.req.query("expires"),
      nonce: c.req.query("nonce"),
      signature: c.req.query("signature")
    })) {
      return forbidden(c, "The signed upload URL is invalid or has expired.");
    }
    const session = aps.uploadSessions.findOneBy("upload_key", uploadKey);
    if (!session || Date.parse(session.expires_at) <= Date.now()) {
      return forbidden(c, "The upload session is invalid or has expired.");
    }
    if (!Number.isInteger(part) || part < 1 || part > session.expected_parts) {
      return badInput(c, "part", "The part number is outside the issued upload range.");
    }
    const bytes = Buffer.from(await c.req.arrayBuffer());
    const existingSize = session.parts_base64.reduce(
      (total, value, index) => total + (index === part - 1 || !value ? 0 : Buffer.byteLength(value, "base64")),
      0
    );
    if (existingSize + bytes.length > getUploadConfig(store).maxObjectBytes) {
      return payloadTooLarge(c, `The uploaded object exceeds the ${getUploadConfig(store).maxObjectBytes} byte limit.`);
    }
    const parts = [...session.parts_base64];
    parts[part - 1] = bytes.toString("base64");
    aps.uploadSessions.update(session.id, { parts_base64: parts });
    return c.body(null, 200, { ETag: createHash3("sha1").update(bytes).digest("hex") });
  });
  app.post("/oss/v2/buckets/:bucketKey/objects/:objectKey/signeds3upload", writeAuth, async (c) => {
    const bucketKey = routeId(c.req.param("bucketKey"));
    const objectKey = routeId(c.req.param("objectKey"));
    const body = await jsonObjectBody(c);
    const uploadKey = body ? optionalString(body.uploadKey) : void 0;
    if (!uploadKey) return badInput(c, "uploadKey", "uploadKey is required.");
    const session = aps.uploadSessions.findOneBy("upload_key", uploadKey);
    if (!session || session.bucket_key !== bucketKey || session.object_key !== objectKey) {
      return badInput(c, "uploadKey", "uploadKey does not belong to this object.");
    }
    if (Date.parse(session.expires_at) <= Date.now()) return forbidden(c, "The upload session has expired.");
    if (session.parts_base64.some((part) => part === null)) {
      return badInput(c, "uploadKey", "Every issued upload part must be uploaded before completion.");
    }
    const storage = aps.storageObjects.findBy("bucket_key", bucketKey).find((candidate) => candidate.object_key === objectKey);
    if (!storage) return notFound(c, "The requested storage object");
    const bytes = Buffer.concat(session.parts_base64.map((part) => Buffer.from(part ?? "", "base64")));
    const sha1 = createHash3("sha1").update(bytes).digest("hex");
    aps.storageObjects.update(storage.id, {
      size: bytes.length,
      sha1,
      content_base64: bytes.toString("base64"),
      uploaded_at: (/* @__PURE__ */ new Date()).toISOString()
    });
    aps.uploadSessions.delete(session.id);
    const location = `${baseUrl}/oss/v2/buckets/${encodeURIComponent(bucketKey)}/objects/${encodeURIComponent(objectKey)}`;
    return c.json({
      objectId: storage.object_id,
      objectKey,
      bucketKey,
      size: bytes.length,
      sha1,
      location
    });
  });
  app.post("/oss/v2/buckets/:bucketKey/objects/:objectKey/signeds3download", readAuth, (c) => {
    const bucketKey = routeId(c.req.param("bucketKey"));
    const objectKey = routeId(c.req.param("objectKey"));
    const storage = aps.storageObjects.findBy("bucket_key", bucketKey).find(
      (candidate) => candidate.object_key === objectKey && candidate.uploaded_at && candidate.content_base64 !== null
    );
    if (!storage) return notFound(c, "The requested storage object");
    const minutesValue = c.req.query("minutesExpiration") ?? String(DEFAULT_SIGNED_URL_TTL_MINUTES);
    if (!/^\d+$/.test(minutesValue) || Number(minutesValue) < 1 || Number(minutesValue) > 60) {
      return badInput(c, "minutesExpiration", "minutesExpiration must be an integer from 1 through 60.");
    }
    const token = Buffer.from(storage.object_id).toString("base64url");
    const issued = issueSignedResourceUrl(
      store,
      baseUrl,
      `/oss/v2/signed-download/${token}`,
      `aps-download:${storage.object_id}`,
      Number(minutesValue) * 6e4
    );
    return c.json({
      url: issued.url,
      expiration: issued.validUntil,
      size: storage.size,
      sha1: storage.sha1
    });
  });
  app.get("/oss/v2/signed-download/:token", (c) => {
    let objectId;
    try {
      objectId = Buffer.from(c.req.param("token"), "base64url").toString("utf8");
    } catch {
      return forbidden(c, "The signed download URL is invalid or has expired.");
    }
    if (!validateSignedResource(store, `aps-download:${objectId}`, {
      expires: c.req.query("expires"),
      nonce: c.req.query("nonce"),
      signature: c.req.query("signature")
    })) {
      return forbidden(c, "The signed download URL is invalid or has expired.");
    }
    const storage = aps.storageObjects.findOneBy("object_id", objectId);
    if (!storage || !storage.uploaded_at || storage.content_base64 === null) {
      return notFound(c, "The requested storage object");
    }
    const bytes = Buffer.from(storage.content_base64, "base64");
    return new Response(bytes, {
      status: 200,
      headers: {
        "Content-Type": documentMimeType(documentFileType(storage.name)),
        "Content-Length": String(bytes.length),
        "Content-Disposition": `attachment; filename="${storage.name.replace(/["\r\n]/g, "")}"`
      }
    });
  });
  app.post("/data/v1/projects/:projectId/items", userWriteAuth, async (c) => {
    const projectId = routeId(c.req.param("projectId"));
    if (!aps.projects.findOneBy("project_id", projectId))
      return jsonApiError(c, 404, "NOT_FOUND", "The project was not found.");
    const body = await jsonObjectBody(c);
    const data = body ? asRecord(body.data) : null;
    const included = body && Array.isArray(body.included) ? body.included.map(asRecord).filter(Boolean) : [];
    const includedVersion = included.find((entry) => entry?.type === "versions") ?? null;
    const folderId = data ? relationshipId(data, "parent") : void 0;
    const displayName = data ? optionalString(resourceAttributes(data).displayName) ?? optionalString(resourceAttributes(data).name) : void 0;
    const versionName = includedVersion ? optionalString(resourceAttributes(includedVersion).name) : void 0;
    const storageId = includedVersion ? relationshipId(includedVersion, "storage") : void 0;
    if (!data || data.type !== "items" || !includedVersion || !folderId || !(displayName ?? versionName)) {
      return jsonApiError(c, 400, "BAD_INPUT", "An item with a parent folder and included first version is required.");
    }
    const name = displayName ?? versionName;
    const folder = aps.documentFolders.findOneBy("folder_id", folderId);
    if (!folder || folder.project_id !== projectId)
      return jsonApiError(c, 404, "NOT_FOUND", "The parent folder was not found.");
    if (aps.documentItems.findBy("folder_id", folderId).some((item2) => item2.display_name === name)) {
      return jsonApiError(c, 409, "CONFLICT", "An item with this name already exists in the folder.");
    }
    const storage = storageForWrite(c, aps, projectId, folderId, storageId);
    if (storage instanceof Response) return storage;
    const actor = await actorForRequest(c, store, aps);
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const item = createDocumentItem(aps, {
      item_id: `urn:adsk.wipprod:dm.lineage:${randomUUID4().replaceAll("-", "")}`,
      project_id: projectId,
      folder_id: folderId,
      display_name: name,
      hidden: false,
      reserved: false,
      reserved_time: null,
      reserved_by: null,
      reserved_by_name: null,
      created_by: actor.id,
      created_by_name: actor.name,
      create_time: now,
      last_modified_by: actor.id,
      last_modified_by_name: actor.name,
      last_modified_time: now,
      extension_type: "items:autodesk.bim360:File"
    });
    const version = createDocumentVersion(aps, versionValues(item, storage, 1, actor, versionName ?? name));
    await finishVersionWrite(aps, store, version);
    const self = `${baseUrl}/data/v1/projects/${encodeURIComponent(projectId)}/items/${encodeURIComponent(item.item_id)}`;
    return jsonApiCreated(c, self, documentItemData(baseUrl, aps, item), [documentVersionData(baseUrl, version)]);
  });
  app.post("/data/v1/projects/:projectId/versions", userWriteAuth, async (c) => {
    const projectId = routeId(c.req.param("projectId"));
    if (!aps.projects.findOneBy("project_id", projectId))
      return jsonApiError(c, 404, "NOT_FOUND", "The project was not found.");
    const body = await jsonObjectBody(c);
    const data = body ? asRecord(body.data) : null;
    const itemId = data ? relationshipId(data, "item") : void 0;
    const storageId = data ? relationshipId(data, "storage") : void 0;
    const item = itemId ? aps.documentItems.findOneBy("item_id", itemId) : void 0;
    if (!data || data.type !== "versions" || !itemId || !storageId) {
      return jsonApiError(c, 400, "BAD_INPUT", "A version with item and storage relationships is required.");
    }
    if (!item || item.project_id !== projectId) return jsonApiError(c, 404, "NOT_FOUND", "The item was not found.");
    const storage = storageForWrite(c, aps, projectId, item.folder_id, storageId);
    if (storage instanceof Response) return storage;
    const actor = await actorForRequest(c, store, aps);
    const latest = itemTip(aps, item.item_id);
    const number = (latest?.version_number ?? 0) + 1;
    const name = optionalString(resourceAttributes(data).name) ?? optionalString(resourceAttributes(data).displayName) ?? storage.name;
    const version = createDocumentVersion(aps, versionValues(item, storage, number, actor, name));
    aps.documentItems.update(item.id, {
      display_name: name,
      last_modified_by: actor.id,
      last_modified_by_name: actor.name,
      last_modified_time: version.create_time
    });
    await finishVersionWrite(aps, store, version);
    const self = `${baseUrl}/data/v1/projects/${encodeURIComponent(projectId)}/versions/${encodeURIComponent(version.version_id)}`;
    return jsonApiCreated(c, self, documentVersionData(baseUrl, version));
  });
}

// src/model-coordination-http.ts
function coordinationProject(c, aps) {
  const containerId = c.req.param("containerId");
  const result = projectForAccId(aps, containerId, "bare");
  if (result.kind === "invalid") {
    return badInput(c, "containerId", `The value '${containerId}' must not include the 'b.' prefix.`);
  }
  if (result.kind === "missing") return notFound(c, "The requested container");
  return result.project;
}
function modelSetForProject(c, aps, project) {
  const modelSet = aps.modelSets.findOneBy("model_set_id", c.req.param("modelSetId"));
  if (!modelSet || modelSet.project_id !== project.project_id) return notFound(c, "The requested model set");
  return modelSet;
}
function continuationToken(offset) {
  return Buffer.from(String(offset)).toString("base64url");
}
function continuationOffset(token) {
  if (!token) return 0;
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    if (!/^\d+$/.test(decoded)) return null;
    const offset = Number(decoded);
    return Number.isSafeInteger(offset) ? offset : null;
  } catch {
    return null;
  }
}
function coordinationPage(c, items) {
  const limitValue = c.req.query("pageLimit");
  const limit = limitValue === void 0 ? 20 : Number(limitValue);
  if (!Number.isInteger(limit) || limit < 1 || limit > 20) {
    return badInput(c, "pageLimit", `The value '${limitValue ?? ""}' must be an integer from 1 through 20.`);
  }
  const token = c.req.query("continuationToken");
  const offset = continuationOffset(token);
  if (offset === null) return badInput(c, "continuationToken", `The value '${token}' is not valid.`);
  const nextOffset = offset + limit;
  return {
    items: items.slice(offset, nextOffset),
    page: nextOffset < items.length ? { continuationToken: continuationToken(nextOffset) } : {}
  };
}
function booleanQuery(c, name, fallback) {
  const value = c.req.query(name);
  if (value === void 0) return fallback;
  if (value === "true") return true;
  if (value === "false") return false;
  return badInput(c, name, `The value '${value}' must be true or false.`);
}
function queryValues2(c, name) {
  return (c.req.queries(name) ?? []).flatMap(commaSeparated);
}

// src/routes/clash.ts
var TEST_STATUSES = ["Pending", "Processing", "Success", "Failed"];
function clashTestForProject(c, aps, project) {
  const test = aps.clashTests.findOneBy("test_id", c.req.param("testId"));
  if (!test || test.project_id !== project.project_id) return notFound(c, "The requested clash test");
  return test;
}
function clashRoutes({ app, store, baseUrl }) {
  const aps = getApsStore(store);
  app.use("/bim360/clash/v3/*", apsAuth(store, { scopes: ["data:read"], requireUser: true }));
  app.get("/bim360/clash/v3/containers/:containerId/modelsets/:modelSetId/tests", (c) => {
    const project = coordinationProject(c, aps);
    if (project instanceof Response) return project;
    const modelSet = modelSetForProject(c, aps, project);
    if (modelSet instanceof Response) return modelSet;
    const statuses = queryValues2(c, "status");
    const invalidStatus = statuses.find((status) => !TEST_STATUSES.includes(status));
    if (invalidStatus) return badInput(c, "status", `The value '${invalidStatus}' is not valid.`);
    const tests = aps.clashTests.findBy("model_set_id", modelSet.model_set_id).filter((test) => statuses.length === 0 || statuses.includes(test.status)).sort((left, right) => right.model_set_version - left.model_set_version);
    const page = coordinationPage(c, tests);
    if (page instanceof Response) return page;
    return c.json({ page: page.page, tests: page.items.map(clashTestPayload) });
  });
  app.get("/bim360/clash/v3/containers/:containerId/tests/:testId", (c) => {
    const project = coordinationProject(c, aps);
    if (project instanceof Response) return project;
    const test = clashTestForProject(c, aps, project);
    if (test instanceof Response) return test;
    return c.json(clashTestPayload(test));
  });
  app.get("/bim360/clash/v3/containers/:containerId/tests/:testId/resources", (c) => {
    const project = coordinationProject(c, aps);
    if (project instanceof Response) return project;
    const test = clashTestForProject(c, aps, project);
    if (test instanceof Response) return test;
    if (test.status !== "Success") {
      return problem(c, 409, {
        type: "Conflict",
        title: "The clash test is not complete",
        detail: "Clash resources are available only after the clash test succeeds."
      });
    }
    const version = aps.modelSetVersions.findBy("model_set_id", test.model_set_id).find((candidate) => candidate.version === test.model_set_version);
    if (!version) return notFound(c, "The clash test model set version");
    writeClashArtifacts(aps, version, test);
    const ttl = getModelCoordinationTiming(store).signed_url_ttl_ms;
    const resources = CLASH_RESOURCE_TYPES.map((type) => {
      const signed = issueSignedBlobUrl(store, baseUrl, clashResourceBlobId(test.test_id, type), ttl);
      return { type, extension: "json.gz", url: signed.url, headers: {}, validUntil: signed.validUntil };
    });
    return c.json({ page: {}, resources });
  });
  for (const disposition of ["assigned", "closed"]) {
    app.get(`/bim360/clash/v3/containers/:containerId/tests/:testId/clashes/${disposition}`, (c) => {
      const project = coordinationProject(c, aps);
      if (project instanceof Response) return project;
      const test = clashTestForProject(c, aps, project);
      if (test instanceof Response) return test;
      const groups = aps.clashGroups.findBy("test_id", test.test_id).filter((group) => group.disposition === disposition);
      const page = coordinationPage(c, groups);
      if (page instanceof Response) return page;
      return c.json({
        page: page.page,
        modelSetId: test.model_set_id,
        modelSetVersion: test.model_set_version,
        groups: page.items.map((group) => ({
          id: group.group_id,
          originalClashTestId: group.original_clash_test_id,
          createdAtVersion: group.created_at_version,
          existing: [...group.existing],
          resolved: [...group.resolved]
        }))
      });
    });
  }
}

// src/routes/issues.ts
var ISSUE_STATUSES = [
  "draft",
  "open",
  "pending",
  "in_progress",
  "completed",
  "in_review",
  "not_approved",
  "in_dispute",
  "closed"
];
var ISSUE_ATTRIBUTES = [
  "title",
  "description",
  "issueSubtypeId",
  "status",
  "assignedTo",
  "assignedToType",
  "dueDate",
  "startDate",
  "locationId",
  "locationDetails",
  "published",
  "watchers",
  "customAttributes"
];
async function requestContext(c, route, aps) {
  const projectResult = projectForAccId(aps, c.req.param("projectId"), "bare");
  if (projectResult.kind === "invalid") {
    return issuesError(c, 400, "Bad Request", "Issues project IDs must not include the 'b.' prefix.");
  }
  if (projectResult.kind === "missing") {
    return issuesError(c, 404, "Not Found", "The requested project was not found.");
  }
  const user = await userForApsRequest(c, route.store, aps, false);
  if (!user) return issuesError(c, 403, "Forbidden", "User context is required.");
  const member = accProjectUser(aps, projectResult.project.project_id, user.user_id);
  if (!member) return issuesError(c, 403, "Forbidden", "The user is not a member of this project.");
  return { project: projectResult.project, user, member };
}
function canManageIssues(member) {
  return member.role === "project_admin" || member.issue_permission === "manage";
}
function issuePermissions(member, status) {
  if (!canManageIssues(member)) {
    return {
      permittedStatuses: [status],
      permittedAttributes: [],
      permittedActions: ["add_comment", "add_attachment"]
    };
  }
  return {
    permittedStatuses: status === "closed" ? ["closed", "open"] : ISSUE_STATUSES.filter((value) => value !== "draft"),
    permittedAttributes: ISSUE_ATTRIBUTES,
    permittedActions: ["assign_all", "clear_assignee", "delete", "add_comment", "add_attachment", "remove_attachment"]
  };
}
function issuePayload(issue, member) {
  return {
    ...structuredClone(issue.payload),
    ...issuePermissions(member, issue.status)
  };
}
function matchesAny(value, candidates) {
  return candidates.length === 0 || value !== null && candidates.includes(value);
}
function filterIssues(c, issues) {
  const ids = commaSeparated(c.req.query("filter[id]"));
  const typeIds = commaSeparated(c.req.query("filter[issueTypeId]"));
  const subtypeIds = commaSeparated(c.req.query("filter[issueSubtypeId]"));
  const statuses = commaSeparated(c.req.query("filter[status]"));
  const assignees = commaSeparated(c.req.query("filter[assignedTo]"));
  const displayIds = commaSeparated(c.req.query("filter[displayId]"));
  const search = c.req.query("filter[search]")?.trim().toLocaleLowerCase();
  const deletedFilter = c.req.query("filter[deleted]");
  let filtered = issues.filter((issue) => {
    if (!matchesAny(issue.issue_id, ids)) return false;
    if (!matchesAny(issue.issue_type_id, typeIds)) return false;
    if (!matchesAny(issue.issue_subtype_id, subtypeIds)) return false;
    if (!matchesAny(issue.status, statuses)) return false;
    if (!matchesAny(issue.assigned_to, assignees)) return false;
    if (displayIds.length > 0 && !displayIds.includes(String(issue.display_id))) return false;
    if (deletedFilter === "true" && !issue.deleted) return false;
    if ((deletedFilter === void 0 || deletedFilter === "false") && issue.deleted) return false;
    if (search && !issue.title.toLocaleLowerCase().includes(search) && !String(issue.display_id).includes(search)) {
      return false;
    }
    return true;
  });
  const requestedSort = commaSeparated(c.req.query("sortBy"))[0];
  if (!requestedSort) return filtered;
  const descending = requestedSort.startsWith("-");
  const field = descending ? requestedSort.slice(1) : requestedSort;
  const valueFor = (issue) => {
    if (field === "displayId") return issue.display_id;
    if (field === "title") return issue.title;
    if (field === "status") return issue.status;
    return String(issue.payload[field] ?? "");
  };
  filtered = [...filtered].sort((left, right) => {
    const a = valueFor(left);
    const b = valueFor(right);
    const result = typeof a === "number" && typeof b === "number" ? a - b : String(a).localeCompare(String(b));
    return descending ? -result : result;
  });
  return filtered;
}
function issueRoutes(route) {
  const { app, store } = route;
  const aps = getApsStore(store);
  app.use("/construction/issues/v1/*", apsAuth(store, { scopes: ["data:read"], requireUser: true }));
  app.get("/construction/issues/v1/projects/:projectId/users/me", async (c) => {
    const context = await requestContext(c, route, aps);
    if (context instanceof Response) return context;
    const manageable = canManageIssues(context.member);
    const permittedStatuses = manageable ? ISSUE_STATUSES : ["open", "closed"];
    const permittedAttributes = manageable ? ISSUE_ATTRIBUTES : [];
    const permittedActions2 = manageable ? ["add_comment", "add_attachment", "assign_all"] : ["add_comment"];
    return c.json({
      id: context.user.user_id,
      isProjectAdmin: context.member.role === "project_admin",
      canManageTemplates: manageable,
      issues: {
        new: {
          permittedActions: permittedActions2,
          permittedAttributes,
          permittedStatuses,
          permitted_actions: permittedActions2,
          permitted_attributes: permittedAttributes,
          permitted_statuses: permittedStatuses
        },
        filter: { permittedStatuses }
      },
      permissionLevels: [context.member.issue_permission]
    });
  });
  app.get("/construction/issues/v1/projects/:projectId/issue-types", async (c) => {
    const context = await requestContext(c, route, aps);
    if (context instanceof Response) return context;
    const pagination2 = queryPagination(c, { defaultLimit: 200, maxLimit: 200 });
    if (!pagination2.ok) return issuesError(c, 400, "Bad Request", pagination2.message);
    const isActive = c.req.query("filter[isActive]");
    const includeSubtypes = commaSeparated(c.req.query("include")).includes("subtypes");
    const resources = aps.issueTypes.findBy("project_id", context.project.project_id).filter((issueType) => isActive === void 0 || issueType.is_active === (isActive === "true"));
    const results = pageItems(resources, pagination2.value).map((issueType) => {
      const payload = structuredClone(issueType.payload);
      if (!includeSubtypes) delete payload.subtypes;
      return payload;
    });
    return c.json(offsetEnvelope(results, pagination2.value, resources.length));
  });
  app.get("/construction/issues/v1/projects/:projectId/issues", async (c) => {
    const context = await requestContext(c, route, aps);
    if (context instanceof Response) return context;
    const pagination2 = queryPagination(c, { defaultLimit: 100, maxLimit: 100 });
    if (!pagination2.ok) return issuesError(c, 400, "Bad Request", pagination2.message);
    const filtered = filterIssues(c, aps.issues.findBy("project_id", context.project.project_id));
    const results = pageItems(filtered, pagination2.value).map((issue) => issuePayload(issue, context.member));
    return c.json(offsetEnvelope(results, pagination2.value, filtered.length));
  });
  app.get("/construction/issues/v1/projects/:projectId/issues/:issueId", async (c) => {
    const context = await requestContext(c, route, aps);
    if (context instanceof Response) return context;
    const issue = aps.issues.findBy("project_id", context.project.project_id).find((candidate) => candidate.issue_id === c.req.param("issueId"));
    if (!issue) return issuesError(c, 404, "Not Found", "The requested issue was not found.");
    return c.json(issuePayload(issue, context.member));
  });
}

// src/derivative-resources.ts
import { createHash as createHash4 } from "crypto";
function sourceForUrn(aps, urn, jobName) {
  const version = aps.documentVersions.findBy("bubble_urn", urn)[0];
  if (version) return { urn, name: version.display_name, version };
  const objectId = Buffer.from(urn, "base64url").toString("utf8");
  const storage = objectId ? aps.storageObjects.findOneBy("object_id", objectId) : void 0;
  return { urn, name: jobName ?? storage?.name ?? "model" };
}
async function resolveDerivative(aps, store, urn) {
  const job = aps.translationJobs.findOneBy("urn", urn);
  let manifest;
  if (job) {
    manifest = manifestForJob(await refreshTranslationJob(aps, store, job));
  } else {
    const seeded = aps.manifests.findOneBy("urn", urn);
    if (seeded) {
      const { id: _id, created_at: _created, updated_at: _updated, ...fields } = seeded;
      manifest = fields;
    }
  }
  if (!manifest) return { state: "missing" };
  const source = sourceForUrn(aps, urn, job?.source_name);
  if (manifest.status === "pending" || manifest.status === "inprogress") {
    return { state: "pending", manifest, source };
  }
  return { state: manifest.status === "success" ? "success" : "failed", manifest, source };
}
function metadataViews(aps, source) {
  const version = source.version;
  const threeDimensional = {
    name: version?.display_name ?? source.name,
    role: "3d",
    guid: version?.viewable_guid ?? stableDerivativeGuid(`${source.urn}:3d`)
  };
  if (!version) return [threeDimensional];
  const sheet = aps.sheets.findBy("project_id", version.project_id).find(
    (candidate) => candidate.upload_file_name === version.display_name || candidate.viewable_urn !== "" && (candidate.viewable_urn === version.bubble_urn || candidate.viewable_urn === version.storage_urn)
  );
  if (!sheet) return [threeDimensional];
  return [
    threeDimensional,
    {
      name: `${sheet.number} - ${sheet.title}`,
      role: "2d",
      guid: sheet.viewable_guid || stableDerivativeGuid(`${source.urn}:2d:${sheet.sheet_id}`)
    }
  ];
}
function baseObjectId(urn, guid) {
  return Number.parseInt(createHash4("sha1").update(`${urn}:${guid}`).digest("hex").slice(0, 7), 16) + 1;
}
function derivativeObjectTree(source, view) {
  const first = baseObjectId(source.urn, view.guid);
  return [
    {
      objectid: first,
      name: source.name,
      category: "Model",
      objects: [
        {
          objectid: first + 1,
          name: view.role === "2d" ? "Sheets" : "Model Elements",
          category: "Category",
          objects: [
            {
              objectid: first + 2,
              name: `${source.name} Family`,
              category: "Family",
              objects: [
                { objectid: first + 3, name: `${source.name} Instance 1`, category: "Instance" },
                { objectid: first + 4, name: `${source.name} Instance 2`, category: "Instance" }
              ]
            }
          ]
        }
      ]
    }
  ];
}
function flattenDerivativeObjects(objects) {
  return objects.flatMap((object) => [object, ...flattenDerivativeObjects(object.objects ?? [])]);
}
function derivativeProperties(source, view, objects) {
  return flattenDerivativeObjects(objects).map((object) => ({
    objectid: object.objectid,
    name: object.name,
    externalId: stableDerivativeGuid(`${source.urn}:${view.guid}:${object.objectid}`),
    properties: {
      "Identity Data": { Name: object.name, Category: object.category },
      Emulate: { "Source URN": source.urn, "View GUID": view.guid }
    }
  }));
}

// src/routes/model-derivative.ts
var THUMBNAIL_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64"
);
var VIEWABLE_INPUT_FORMATS = [
  "3dm",
  "3ds",
  "3dxml",
  "a",
  "asm",
  "axm",
  "brd",
  "catpart",
  "catproduct",
  "cgr",
  "collaboration",
  "dae",
  "ddx",
  "ddz",
  "dgk",
  "dgn",
  "dlv3",
  "dmt",
  "dwf",
  "dwfx",
  "dwg",
  "dwt",
  "dxf",
  "emodel",
  "exp",
  "f3d",
  "fbrd",
  "fbx",
  "fsch",
  "g",
  "gbxml",
  "glb",
  "gltf",
  "iam",
  "idw",
  "ifc",
  "ige",
  "iges",
  "igs",
  "ipt",
  "iwm",
  "jt",
  "max",
  "model",
  "mpf",
  "msr",
  "neu",
  "nwc",
  "nwd",
  "obj",
  "osb",
  "par",
  "pdf",
  "pmlprj",
  "pmlprjz",
  "prt",
  "psm",
  "psmodel",
  "rvm",
  "rvt",
  "sab",
  "sat",
  "sch",
  "session",
  "skp",
  "sldasm",
  "sldprt",
  "smb",
  "smt",
  "ste",
  "step",
  "stl",
  "stla",
  "stlb",
  "stp",
  "stpz",
  "usd",
  "usda",
  "usdc",
  "usdz",
  "vpb",
  "vue",
  "wire",
  "x_b",
  "x_t",
  "xas",
  "xpr",
  "zip",
  "asm\\.\\d+$",
  "neu\\.\\d+$",
  "prt\\.\\d+$"
];
var SUPPORTED_FORMATS = {
  formats: {
    annotations: ["rvt"],
    dwg: ["f2d", "f3d", "rvt", "slddrw"],
    f3d: [
      "123dx",
      "3dm",
      "3mf",
      "asm",
      "atfx",
      "bdf",
      "catpart",
      "catproduct",
      "cgr",
      "dwg",
      "dxf",
      "emn",
      "fbx",
      "g",
      "iam",
      "ige",
      "iges",
      "igs",
      "ipt",
      "jt",
      "neu",
      "obj",
      "par",
      "pcbdata",
      "pcbxml",
      "prt",
      "sab",
      "sat",
      "skp",
      "sldasm",
      "sldprt",
      "smb",
      "smt",
      "sta",
      "ste",
      "step",
      "stl",
      "stp",
      "wire",
      "x_b",
      "x_t",
      "xml",
      "asm\\.\\d+$",
      "neu\\.\\d+$",
      "prt\\.\\d+$"
    ],
    fbx: ["f3d"],
    ifc: ["rvt"],
    iges: ["f3d", "fbx", "iam", "ipt", "wire"],
    obj: [
      "asm",
      "f3d",
      "fbx",
      "iam",
      "ipt",
      "neu",
      "prt",
      "sldasm",
      "sldprt",
      "smb",
      "smt",
      "step",
      "stp",
      "stpz",
      "wire",
      "x_b",
      "x_t",
      "asm\\.\\d+$",
      "neu\\.\\d+$",
      "prt\\.\\d+$"
    ],
    step: ["f3d", "fbx", "iam", "ipt", "smb", "smt", "wire"],
    stl: ["f3d", "fbx", "iam", "ipt", "wire"],
    svf: VIEWABLE_INPUT_FORMATS,
    svf2: VIEWABLE_INPUT_FORMATS,
    thumbnail: [...VIEWABLE_INPUT_FORMATS, "axmf", "dwgx", "f2d", "flbr", "fprj", "rva"]
  }
};
var PLAIN_VIEWABLE_EXTENSIONS = new Set(VIEWABLE_INPUT_FORMATS.filter((format) => /^[a-z0-9_]+$/.test(format)));
var PATTERN_VIEWABLE_EXTENSIONS = VIEWABLE_INPUT_FORMATS.filter(
  (format) => !PLAIN_VIEWABLE_EXTENSIONS.has(format)
).map((pattern) => new RegExp(`^(?:${pattern})$`, "i"));
function isViewableInputFormat(sourceName) {
  const basename = sourceName.split(/[\\/]/).at(-1).toLowerCase();
  const segments = basename.split(".");
  const candidates = segments.length < 2 ? [] : [segments.at(-1), segments.slice(-2).join(".")];
  return candidates.some(
    (candidate) => PLAIN_VIEWABLE_EXTENSIONS.has(candidate) || PATTERN_VIEWABLE_EXTENSIONS.some((pattern) => pattern.test(candidate))
  );
}
function translationViews(value) {
  if (value === void 0) return [];
  if (!Array.isArray(value)) return null;
  const views = value.filter((view) => typeof view === "string");
  return views.length === value.length ? views : null;
}
function translationFormats(value) {
  if (!Array.isArray(value) || value.length === 0) return null;
  const formats = [];
  for (const candidate of value) {
    if (!isRecordObject(candidate)) return null;
    const type = optionalString(candidate.type);
    if (type !== "svf2" && type !== "svf" && type !== "thumbnail") return null;
    const views = translationViews(candidate.views);
    if (!views) return null;
    formats.push({ type, views });
  }
  return formats;
}
function modelDerivativeRoutes({ app, store }) {
  const aps = getApsStore(store);
  const readAuth = apsAuth(store, { scopes: ["data:read"] });
  const writeAuth = apsAuth(store, { scopes: ["data:create", "data:write"] });
  const deleteAuth = apsAuth(store, { scopes: ["data:write"] });
  app.get("/modelderivative/v2/designdata/formats", readAuth, (c) => c.json(SUPPORTED_FORMATS));
  app.post("/modelderivative/v2/designdata/job", writeAuth, async (c) => {
    const body = await jsonObjectBody(c);
    const input = body && isRecordObject(body.input) ? body.input : null;
    const output = body && isRecordObject(body.output) ? body.output : null;
    const urn = input ? optionalString(input.urn) : void 0;
    const formats = translationFormats(output?.formats);
    if (!urn) return badInput(c, "input.urn", "input.urn is required.");
    if (!formats) return badInput(c, "output.formats", "At least one svf2, svf, or thumbnail output is required.");
    let objectId;
    try {
      objectId = Buffer.from(urn, "base64url").toString("utf8");
    } catch {
      return badInput(c, "input.urn", "input.urn must be a base64url-encoded storage object ID.");
    }
    const storage = aps.storageObjects.findOneBy("object_id", objectId);
    if (!storage || !storage.uploaded_at) return notFound(c, "The source storage object");
    if (!isViewableInputFormat(storage.name)) {
      return badInput(c, "input.urn", `The .${documentFileType(storage.name)} source format is not viewable.`);
    }
    const force = c.req.header("x-ads-force")?.toLowerCase() === "true";
    const result = enqueueTranslation(aps, store, {
      urn,
      sourceName: storage.name,
      outputFormats: formats,
      force
    });
    return c.json(
      {
        result: result.created ? "created" : "success",
        urn,
        acceptedJobs: { output: formats.map((format) => ({ destination: { region: "us" }, formats: [format] })) }
      },
      result.created ? 201 : 200
    );
  });
  app.get("/modelderivative/v2/designdata/:urn/manifest", readAuth, async (c) => {
    const derivative = await resolveDerivative(aps, store, c.req.param("urn"));
    return derivative.state === "missing" ? c.body(null, 404) : c.json(derivative.manifest);
  });
  app.delete("/modelderivative/v2/designdata/:urn/manifest", deleteAuth, (c) => {
    const urn = c.req.param("urn");
    const job = aps.translationJobs.findOneBy("urn", urn);
    const manifest = aps.manifests.findOneBy("urn", urn);
    if (job) aps.translationJobs.delete(job.id);
    if (manifest) aps.manifests.delete(manifest.id);
    return c.json({ result: "success" });
  });
  const inspectionRoute = (path, handler) => app.get(path, readAuth, async (c) => {
    const derivative = await resolveDerivative(aps, store, c.req.param("urn"));
    if (derivative.state === "pending") return c.body(null, 202, { "Retry-After": "1" });
    if (derivative.state !== "success") return notFound(c, "The requested derivative");
    return handler(c, derivative.source);
  });
  const viewForRequest = (c, source) => metadataViews(aps, source).find((candidate) => candidate.guid === c.req.param("guid"));
  inspectionRoute("/modelderivative/v2/designdata/:urn/thumbnail", () => {
    return new Response(THUMBNAIL_PNG, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Length": String(THUMBNAIL_PNG.length)
      }
    });
  });
  inspectionRoute(
    "/modelderivative/v2/designdata/:urn/metadata",
    (c, source) => c.json({
      data: {
        type: "metadata",
        metadata: metadataViews(aps, source)
      }
    })
  );
  inspectionRoute("/modelderivative/v2/designdata/:urn/metadata/:guid", (c, source) => {
    const view = viewForRequest(c, source);
    if (!view) return notFound(c, "The requested model view");
    return c.json({
      data: {
        type: "objects",
        objects: derivativeObjectTree(source, view)
      }
    });
  });
  inspectionRoute("/modelderivative/v2/designdata/:urn/metadata/:guid/properties", (c, source) => {
    const view = viewForRequest(c, source);
    if (!view) return notFound(c, "The requested model view");
    const objectIdValue = c.req.query("objectid");
    if (objectIdValue !== void 0 && (!/^\d+$/.test(objectIdValue) || Number(objectIdValue) < 1)) {
      return badInput(c, "objectid", "objectid must be a positive integer.");
    }
    const properties = derivativeProperties(source, view, derivativeObjectTree(source, view)).filter(
      (entry) => objectIdValue === void 0 || entry.objectid === Number(objectIdValue)
    );
    return c.json({
      data: {
        type: "properties",
        collection: properties
      }
    });
  });
}

// src/routes/modelset.ts
var VERSION_STATUSES = ["Pending", "Processing", "Successful", "Partial", "Failed"];
function versionForModelSet(c, aps, modelSet, requestedVersion) {
  const version = Number(requestedVersion);
  if (!Number.isInteger(version) || version < 1) {
    return badInput(c, "version", `The value '${requestedVersion}' must be a positive integer.`);
  }
  const result = aps.modelSetVersions.findBy("model_set_id", modelSet.model_set_id).find((candidate) => candidate.version === version);
  return result ?? notFound(c, "The requested model set version");
}
function modelSetRoutes({ app, store }) {
  const aps = getApsStore(store);
  app.use("/bim360/modelset/v3/*", apsAuth(store, { scopes: ["data:read"], requireUser: true }));
  app.get("/bim360/modelset/v3/containers/:containerId/modelsets", (c) => {
    const project = coordinationProject(c, aps);
    if (project instanceof Response) return project;
    const includeDisabled = booleanQuery(c, "includeDisabled", false);
    if (includeDisabled instanceof Response) return includeDisabled;
    const includeDeleted = booleanQuery(c, "includeDeleted", false);
    if (includeDeleted instanceof Response) return includeDeleted;
    const name = c.req.query("name")?.trim().toLocaleLowerCase();
    const folderUrn = c.req.query("folderUrn")?.trim();
    const modelSets = aps.modelSets.findBy("project_id", project.project_id).filter((modelSet) => includeDisabled || !modelSet.disabled).filter((modelSet) => includeDeleted || !modelSet.deleted).filter((modelSet) => !name || modelSet.name.toLocaleLowerCase().includes(name)).filter(
      (modelSet) => !folderUrn || modelSet.root_folder_urn === folderUrn || modelSet.folder_urns.includes(folderUrn)
    ).sort((left, right) => left.name.localeCompare(right.name));
    const page = coordinationPage(c, modelSets);
    if (page instanceof Response) return page;
    return c.json({ page: page.page, modelSets: page.items.map(modelSetSummaryPayload) });
  });
  app.get("/bim360/modelset/v3/containers/:containerId/modelsets/:modelSetId", (c) => {
    const project = coordinationProject(c, aps);
    if (project instanceof Response) return project;
    const modelSet = modelSetForProject(c, aps, project);
    if (modelSet instanceof Response) return modelSet;
    return c.json(modelSetPayload(aps, modelSet));
  });
  app.get("/bim360/modelset/v3/containers/:containerId/modelsets/:modelSetId/versions", (c) => {
    const project = coordinationProject(c, aps);
    if (project instanceof Response) return project;
    const modelSet = modelSetForProject(c, aps, project);
    if (modelSet instanceof Response) return modelSet;
    const statuses = queryValues2(c, "status");
    const invalidStatus = statuses.find((status) => !VERSION_STATUSES.includes(status));
    if (invalidStatus) return badInput(c, "status", `The value '${invalidStatus}' is not valid.`);
    const versions = aps.modelSetVersions.findBy("model_set_id", modelSet.model_set_id).filter((version) => statuses.length === 0 || statuses.includes(version.status)).sort((left, right) => right.version - left.version);
    const page = coordinationPage(c, versions);
    if (page instanceof Response) return page;
    return c.json({
      page: page.page,
      modelSetVersions: page.items.map((version) => ({
        version: version.version,
        createTime: version.create_time,
        status: version.status
      }))
    });
  });
  app.get("/bim360/modelset/v3/containers/:containerId/modelsets/:modelSetId/versions/latest", (c) => {
    const project = coordinationProject(c, aps);
    if (project instanceof Response) return project;
    const modelSet = modelSetForProject(c, aps, project);
    if (modelSet instanceof Response) return modelSet;
    const version = latestModelSetVersion(aps, modelSet.model_set_id);
    return version ? c.json(modelSetVersionPayload(version)) : notFound(c, "The requested model set version");
  });
  app.get("/bim360/modelset/v3/containers/:containerId/modelsets/:modelSetId/versions/:version", (c) => {
    const project = coordinationProject(c, aps);
    if (project instanceof Response) return project;
    const modelSet = modelSetForProject(c, aps, project);
    if (modelSet instanceof Response) return modelSet;
    const version = versionForModelSet(c, aps, modelSet, c.req.param("version"));
    if (version instanceof Response) return version;
    return c.json(modelSetVersionPayload(version));
  });
  app.get("/bim360/modelset/v3/containers/:containerId/modelsets/:modelSetId/versions/:version/views", (c) => {
    const project = coordinationProject(c, aps);
    if (project instanceof Response) return project;
    const modelSet = modelSetForProject(c, aps, project);
    if (modelSet instanceof Response) return modelSet;
    const version = versionForModelSet(c, aps, modelSet, c.req.param("version"));
    if (version instanceof Response) return version;
    const views = aps.modelSetViews.findBy("model_set_id", modelSet.model_set_id).filter((view) => view.version === version.version);
    const page = coordinationPage(c, views);
    if (page instanceof Response) return page;
    return c.json({
      page: page.page,
      modelSetViewVersions: page.items.map((view) => ({
        viewId: view.view_id,
        modelSetId: view.model_set_id,
        documentVersions: [...view.document_versions],
        version: view.version
      }))
    });
  });
}

// src/routes/oauth.ts
import { createHash as createHash5, randomBytes as randomBytes3 } from "crypto";
import { SignJWT, exportJWK } from "jose";

// ../core/dist/index.js
import { jwtVerify as jwtVerify2 } from "jose";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { timingSafeEqual as timingSafeEqual2 } from "crypto";
function createErrorHandler(documentationUrl) {
  return async (c, next) => {
    if (documentationUrl) {
      c.set("docsUrl", documentationUrl);
    }
    await next();
  };
}
var errorHandler = createErrorHandler();
var isDebug = typeof process !== "undefined" && (process.env.DEBUG === "1" || process.env.DEBUG === "true" || process.env.EMULATE_DEBUG === "1");
function debug(label, ...args) {
  if (isDebug) {
    console.log(`[${label}]`, ...args);
  }
}
var __dirname = dirname(fileURLToPath(import.meta.url));
var FONTS = {
  "geist-sans.woff2": readFileSync(join(__dirname, "fonts", "geist-sans.woff2")),
  "GeistPixel-Square.woff2": readFileSync(join(__dirname, "fonts", "GeistPixel-Square.woff2"))
};
var FAVICON = readFileSync(join(__dirname, "fonts", "favicon.ico"));
function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function escapeAttr(s) {
  return escapeHtml(s).replace(/'/g, "&#39;");
}
var CSS = `
@font-face{
  font-family:'Geist';font-style:normal;font-weight:100 900;font-display:swap;
  src:url('/_emulate/fonts/geist-sans.woff2') format('woff2');
}
@font-face{
  font-family:'Geist Pixel';font-style:normal;font-weight:400;font-display:swap;
  src:url('/_emulate/fonts/GeistPixel-Square.woff2') format('woff2');
}
*{box-sizing:border-box;margin:0;padding:0}
body{
  font-family:'Geist',-apple-system,BlinkMacSystemFont,sans-serif;
  background:#000;color:#33ff00;min-height:100vh;
  -webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;
}
.emu-bar{
  border-bottom:1px solid #0a3300;padding:10px 20px;
  display:flex;align-items:center;gap:10px;font-size:.8125rem;color:#1a8c00;
}
.emu-bar-title{font-weight:600;color:#33ff00;font-family:'Geist Pixel',monospace;}
.emu-bar-links{margin-left:auto;display:flex;gap:16px;}
.emu-bar-links a{
  color:#1a8c00;font-size:.75rem;text-decoration:none;transition:color .15s;
}
.emu-bar-links a:hover{color:#33ff00;}
.emu-bar-links a .full{display:inline;}
.emu-bar-links a .short{display:none;}
@media(max-width:600px){
  .emu-bar-links a .full{display:none;}
  .emu-bar-links a .short{display:inline;}
}

.content{
  display:flex;align-items:center;justify-content:center;
  min-height:calc(100vh - 42px);padding:24px 16px;
}
.content-inner{width:100%;max-width:420px;}
.card-title{
  font-family:'Geist Pixel',monospace;
  font-size:1.125rem;font-weight:600;margin-bottom:4px;color:#33ff00;
}
.card-subtitle{color:#1a8c00;font-size:.8125rem;margin-bottom:18px;line-height:1.45;}
.powered-by{
  position:fixed;bottom:0;left:0;right:0;
  text-align:center;padding:12px;font-size:.6875rem;color:#0a3300;
  font-family:'Geist Pixel',monospace;
}
.powered-by a{color:#1a8c00;text-decoration:none;transition:color .15s;}
.powered-by a:hover{color:#33ff00;}

.error-title{
  font-family:'Geist Pixel',monospace;
  color:#ff4444;font-size:1.125rem;font-weight:600;margin-bottom:8px;
}
.error-msg{color:#1a8c00;font-size:.875rem;line-height:1.5;}
.error-card{text-align:center;}

.user-form{margin-bottom:8px;}
.user-form:last-of-type{margin-bottom:0;}
.user-btn{
  width:100%;display:flex;align-items:center;gap:12px;
  padding:10px 12px;border:1px solid #0a3300;border-radius:8px;
  background:#000;color:inherit;cursor:pointer;text-align:left;
  font:inherit;transition:border-color .15s;
}
.user-btn:hover{border-color:#33ff00;}
.avatar{
  width:36px;height:36px;border-radius:50%;
  background:#0a3300;color:#33ff00;font-weight:600;font-size:.875rem;
  display:flex;align-items:center;justify-content:center;flex-shrink:0;
  font-family:'Geist Pixel',monospace;
}
.user-text{min-width:0;}
.user-login{font-weight:600;font-size:.875rem;display:block;color:#33ff00;}
.user-meta{color:#1a8c00;font-size:.75rem;margin-top:1px;}
.user-email{font-size:.6875rem;color:#116600;word-break:break-all;margin-top:1px;}

.settings-layout{
  max-width:920px;margin:0 auto;padding:28px 20px;
  display:flex;gap:28px;
}
.settings-sidebar{width:200px;flex-shrink:0;}
.settings-sidebar a{
  display:block;padding:6px 10px;border-radius:6px;color:#1a8c00;
  text-decoration:none;font-size:.8125rem;transition:color .15s;
}
.settings-sidebar a:hover{color:#33ff00;}
.settings-sidebar a.active{color:#33ff00;font-weight:600;}
.settings-main{flex:1;min-width:0;}

.s-card{
  padding:18px 0;margin-bottom:14px;border-bottom:1px solid #0a3300;
}
.s-card:last-child{border-bottom:none;}
.s-card-header{display:flex;align-items:center;gap:14px;margin-bottom:14px;}
.s-icon{
  width:42px;height:42px;border-radius:8px;
  background:#0a3300;display:flex;align-items:center;justify-content:center;
  font-size:1.125rem;font-weight:700;color:#116600;flex-shrink:0;
  font-family:'Geist Pixel',monospace;
}
.s-title{
  font-family:'Geist Pixel',monospace;
  font-size:1.25rem;font-weight:600;color:#33ff00;
}
.s-subtitle{font-size:.75rem;color:#1a8c00;margin-top:2px;}
.section-heading{
  font-size:.9375rem;font-weight:600;margin-bottom:10px;color:#33ff00;
  display:flex;align-items:center;justify-content:space-between;
}
.perm-list{list-style:none;}
.perm-list li{padding:5px 0;font-size:.8125rem;display:flex;align-items:center;gap:6px;color:#1a8c00;}
.check{color:#33ff00;}
.org-row{
  display:flex;align-items:center;gap:8px;padding:7px 0;
  border-bottom:1px solid #0a3300;font-size:.8125rem;
}
.org-row:last-child{border-bottom:none;}
.org-icon{
  width:22px;height:22px;border-radius:4px;background:#0a3300;
  display:flex;align-items:center;justify-content:center;
  font-size:.625rem;font-weight:700;color:#116600;flex-shrink:0;
  font-family:'Geist Pixel',monospace;
}
.org-name{font-weight:600;color:#33ff00;}
.badge{font-size:.6875rem;padding:1px 7px;border-radius:999px;font-weight:500;}
.badge-granted{background:#0a3300;color:#33ff00;}
.badge-denied{background:#1a0a0a;color:#ff4444;}
.badge-requested{background:#0a3300;color:#1a8c00;}
.btn-revoke{
  display:inline-block;padding:5px 14px;border-radius:6px;
  border:1px solid #0a3300;background:transparent;color:#ff4444;
  font-size:.75rem;font-weight:600;cursor:pointer;transition:border-color .15s;
}
.btn-revoke:hover{border-color:#ff4444;}
.info-text{color:#1a8c00;font-size:.75rem;line-height:1.5;margin-top:10px;}
.app-link{
  display:flex;align-items:center;gap:12px;padding:12px;
  border:1px solid #0a3300;border-radius:8px;background:#000;
  text-decoration:none;color:inherit;margin-bottom:8px;transition:border-color .15s;
}
.app-link:hover{border-color:#33ff00;}
.app-link-name{font-weight:600;font-size:.875rem;color:#33ff00;}
.app-link-scopes{font-size:.6875rem;color:#1a8c00;margin-top:1px;}
.empty{color:#1a8c00;text-align:center;padding:28px 0;font-size:.875rem;}

.inspector-layout{max-width:960px;margin:0 auto;padding:28px 20px;}
.inspector-tabs{display:flex;gap:4px;margin-bottom:20px;}
.inspector-tabs a{
  padding:7px 16px;border-radius:6px;text-decoration:none;
  font-size:.8125rem;color:#1a8c00;border:1px solid transparent;
  transition:color .15s,border-color .15s;
}
.inspector-tabs a:hover{color:#33ff00;}
.inspector-tabs a.active{color:#33ff00;font-weight:600;border-color:#0a3300;background:#0a3300;}
.inspector-section{margin-bottom:24px;}
.inspector-section h2{
  font-family:'Geist Pixel',monospace;
  font-size:1rem;font-weight:600;color:#33ff00;margin-bottom:10px;
}
.inspector-section h3{
  font-family:'Geist Pixel',monospace;
  font-size:.875rem;font-weight:600;color:#1a8c00;margin:16px 0 8px;
}
.inspector-table{width:100%;border-collapse:collapse;margin-bottom:12px;}
.inspector-table th,.inspector-table td{
  text-align:left;padding:8px 12px;border-bottom:1px solid #0a3300;
  font-size:.8125rem;
}
.inspector-table th{color:#1a8c00;font-weight:600;font-size:.75rem;text-transform:uppercase;letter-spacing:.04em;}
.inspector-table td{color:#33ff00;}
.inspector-table tbody tr{transition:background .1s;}
.inspector-table tbody tr:hover{background:#0a3300;}
.inspector-empty{color:#1a8c00;text-align:center;padding:20px 0;font-size:.8125rem;}

.checkout-layout{
  display:flex;min-height:calc(100vh - 42px);
}
.checkout-summary{
  flex:1;background:#020;padding:48px 40px 48px 10%;
  display:flex;flex-direction:column;justify-content:center;
  border-right:1px solid #0a3300;
}
.checkout-form-side{
  flex:1;background:#000;padding:48px 10% 48px 40px;
  display:flex;flex-direction:column;justify-content:center;
}
.checkout-merchant{
  display:flex;align-items:center;gap:10px;margin-bottom:6px;
}
.checkout-merchant-name{
  font-family:'Geist Pixel',monospace;
  font-size:.9375rem;font-weight:600;color:#33ff00;
}
.checkout-test-badge{
  font-size:.625rem;font-weight:700;letter-spacing:.04em;text-transform:uppercase;
  background:#0a3300;color:#1a8c00;padding:2px 8px;border-radius:4px;
}
.checkout-total{
  font-family:'Geist Pixel',monospace;
  font-size:2rem;font-weight:700;color:#33ff00;margin:8px 0 28px;
}
.checkout-line-item{
  display:flex;align-items:center;gap:14px;padding:14px 0;
  border-bottom:1px solid #0a3300;
}
.checkout-line-item:first-child{border-top:1px solid #0a3300;}
.checkout-item-icon{
  width:42px;height:42px;border-radius:6px;background:#0a3300;
  display:flex;align-items:center;justify-content:center;flex-shrink:0;
  font-family:'Geist Pixel',monospace;font-size:.875rem;font-weight:700;color:#116600;
}
.checkout-item-details{flex:1;min-width:0;}
.checkout-item-name{font-size:.875rem;font-weight:600;color:#33ff00;}
.checkout-item-qty{font-size:.75rem;color:#1a8c00;margin-top:2px;}
.checkout-item-price{
  font-size:.875rem;font-weight:600;color:#33ff00;text-align:right;white-space:nowrap;
}
.checkout-item-unit{font-size:.6875rem;color:#1a8c00;text-align:right;margin-top:2px;}
.checkout-totals{margin-top:20px;}
.checkout-totals-row{
  display:flex;justify-content:space-between;padding:6px 0;
  font-size:.8125rem;color:#1a8c00;
}
.checkout-totals-row.total{
  border-top:1px solid #0a3300;margin-top:8px;padding-top:14px;
  font-size:.9375rem;font-weight:600;color:#33ff00;
}
.checkout-form-section{margin-bottom:24px;}
.checkout-form-label{
  font-size:.8125rem;font-weight:600;color:#33ff00;margin-bottom:8px;display:block;
}
.checkout-input{
  width:100%;padding:10px 12px;border:1px solid #0a3300;border-radius:6px;
  background:#020;color:#33ff00;font:inherit;font-size:.875rem;
  transition:border-color .15s;outline:none;
}
.checkout-input:focus{border-color:#33ff00;}
.checkout-input::placeholder{color:#116600;}
.checkout-card-box{
  border:1px solid #0a3300;border-radius:6px;padding:14px;
  background:#020;
}
.checkout-card-row{
  display:flex;gap:12px;margin-top:10px;
}
.checkout-card-row .checkout-input{flex:1;}
.checkout-sim-note{
  font-size:.6875rem;color:#1a8c00;margin-top:10px;text-align:center;
  font-style:italic;
}
.checkout-pay-btn{
  width:100%;padding:14px;border:none;border-radius:8px;
  background:#33ff00;color:#000;font:inherit;font-size:.9375rem;font-weight:700;
  cursor:pointer;transition:background .15s;
  font-family:'Geist Pixel',monospace;
}
.checkout-pay-btn:hover{background:#44ff22;}
.checkout-cancel{
  text-align:center;margin-top:14px;
}
.checkout-cancel a{
  color:#1a8c00;text-decoration:none;font-size:.8125rem;
  transition:color .15s;
}
.checkout-cancel a:hover{color:#33ff00;}
@media(max-width:768px){
  .checkout-layout{flex-direction:column;}
  .checkout-summary{padding:32px 20px;border-right:none;border-bottom:1px solid #0a3300;}
  .checkout-form-side{padding:32px 20px;}
}
`;
var POWERED_BY = `<div class="powered-by">Powered by <a href="https://emulate.dev" target="_blank" rel="noopener">emulate</a></div>`;
function emuBar(service) {
  const title = service ? `${escapeHtml(service)} Emulator` : "Emulator";
  return `<div class="emu-bar">
  <span class="emu-bar-title">${title}</span>
  <nav class="emu-bar-links">
    <a href="https://github.com/vercel-labs/emulate/issues" target="_blank" rel="noopener"><span class="full">Report Issue</span><span class="short">Report</span></a>
    <a href="https://github.com/vercel-labs/emulate" target="_blank" rel="noopener"><span class="full">Source Code</span><span class="short">Source</span></a>
    <a href="https://emulate.dev" target="_blank" rel="noopener"><span class="full">Learn More</span><span class="short">Learn</span></a>
  </nav>
</div>`;
}
function head(title) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<link rel="icon" href="/_emulate/favicon.ico"/>
<title>${escapeHtml(title)} | emulate</title>
<style>${CSS}</style>
</head>`;
}
function renderCardPage(title, subtitle, body, service) {
  return `${head(title)}
<body>
${emuBar(service)}
<div class="content">
  <div class="content-inner">
    <div class="card-title">${escapeHtml(title)}</div>
    <div class="card-subtitle">${subtitle}</div>
    ${body}
  </div>
</div>
${POWERED_BY}
</body></html>`;
}
function renderErrorPage(title, message, service) {
  return `${head(title)}
<body>
${emuBar(service)}
<div class="content">
  <div class="content-inner error-card">
    <div class="error-title">${escapeHtml(title)}</div>
    <div class="error-msg">${escapeHtml(message)}</div>
  </div>
</div>
${POWERED_BY}
</body></html>`;
}
function renderFormPostPage(action, fields, service) {
  const hiddens = Object.entries(fields).filter(([, v]) => v != null).map(([k, v]) => `<input type="hidden" name="${escapeAttr(k)}" value="${escapeAttr(v)}"/>`).join("\n");
  return `${head("Redirecting")}
<body onload="document.forms[0].submit()">
${emuBar(service)}
<div class="content">
  <div class="content-inner" style="text-align:center">
    <div class="card-subtitle">Redirecting&hellip;</div>
    <form method="POST" action="${escapeAttr(action)}">
${hiddens}
    <noscript><button type="submit" class="user-btn" style="margin-top:12px;justify-content:center">
      <span class="user-login">Continue</span>
    </button></noscript>
    </form>
  </div>
</div>
${POWERED_BY}
</body></html>`;
}
function renderUserButton(opts) {
  const hiddens = Object.entries(opts.hiddenFields).map(([k, v]) => `<input type="hidden" name="${escapeAttr(k)}" value="${escapeAttr(v)}"/>`).join("");
  const nameLine = opts.name ? `<div class="user-meta">${escapeHtml(opts.name)}</div>` : "";
  const emailLine = opts.email ? `<div class="user-email">${escapeHtml(opts.email)}</div>` : "";
  return `<form class="user-form" method="post" action="${escapeAttr(opts.formAction)}">
${hiddens}
<button type="submit" class="user-btn">
  <span class="avatar">${escapeHtml(opts.letter)}</span>
  <span class="user-text">
    <span class="user-login">${escapeHtml(opts.login)}</span>
    ${nameLine}${emailLine}
  </span>
</button>
</form>`;
}
function normalizeUri(uri) {
  try {
    const u = new URL(uri);
    return `${u.origin}${u.pathname.replace(/\/+$/, "")}`;
  } catch {
    return uri.replace(/\/+$/, "").split("?")[0];
  }
}
function matchesRedirectUri(incoming, registered) {
  const normalized = normalizeUri(incoming);
  return registered.some((r) => normalizeUri(r) === normalized);
}
function constantTimeSecretEqual(a, b) {
  const bufA = Buffer.from(a, "utf-8");
  const bufB = Buffer.from(b, "utf-8");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual2(bufA, bufB);
}
function bodyStr(v) {
  if (typeof v === "string") return v;
  if (Array.isArray(v) && typeof v[0] === "string") return v[0];
  return "";
}

// src/routes/oauth.ts
var SERVICE_LABEL = "Autodesk Platform Services";
var AUTHORIZATION_CODE_TTL_MS = 5 * 60 * 1e3;
var ACCESS_TOKEN_TTL_SECONDS = 3600;
var ACCESS_TOKEN_EXPIRES_IN = 3599;
var ID_TOKEN_TTL_SECONDS = 60 * 60;
var REFRESH_TOKEN_TTL_MS = 15 * 24 * 60 * 60 * 1e3;
function getPendingCodes(store) {
  let map = store.getData("aps.oauth.pendingCodes");
  if (!map) {
    map = /* @__PURE__ */ new Map();
    store.setData("aps.oauth.pendingCodes", map);
  }
  return map;
}
function getRefreshTokens(store) {
  let map = store.getData("aps.oauth.refreshTokens");
  if (!map) {
    map = /* @__PURE__ */ new Map();
    store.setData("aps.oauth.refreshTokens", map);
  }
  return map;
}
function getConsumedRefreshTokens(store) {
  let map = store.getData("aps.oauth.consumedRefreshTokens");
  if (!map) {
    map = /* @__PURE__ */ new Map();
    store.setData("aps.oauth.consumedRefreshTokens", map);
  }
  return map;
}
function invalidateGrantFamily(store, tokenMap, familyId) {
  const refreshTokens = getRefreshTokens(store);
  for (const [token, record] of refreshTokens) {
    if (record.familyId === familyId) refreshTokens.delete(token);
  }
  const accessTokens = getAccessTokens(store);
  for (const [token, record] of accessTokens) {
    if (record.familyId === familyId) {
      accessTokens.delete(token);
      tokenMap?.delete(token);
    }
  }
}
async function parseTokenLikeBody(c) {
  const contentType = c.req.header("Content-Type") ?? "";
  const raw = await c.req.text();
  if (contentType.includes("application/json")) {
    try {
      const parsed = JSON.parse(raw);
      const out = {};
      for (const [key, value] of Object.entries(parsed)) {
        if (typeof value === "string") out[key] = value;
      }
      return out;
    } catch {
      return {};
    }
  }
  return Object.fromEntries(new URLSearchParams(raw));
}
function oauthError(c, status, error, description) {
  return c.json({ error, error_description: description }, status);
}
function invalidClient(c, description) {
  c.header("WWW-Authenticate", "Basic");
  return c.json({ error: "invalid_client", error_description: description }, 401);
}
function parseBasicAuth(header) {
  if (!header.startsWith("Basic ")) return null;
  const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
  const sep = decoded.indexOf(":");
  if (sep === -1) return null;
  return { clientId: decoded.slice(0, sep), clientSecret: decoded.slice(sep + 1) };
}
function authenticateClient(c, aps, body) {
  const authHeader = c.req.header("Authorization") ?? "";
  if (authHeader && body.client_id) {
    return {
      response: oauthError(
        c,
        400,
        "invalid_request",
        "The 'client_id' is not supported in the request body when Authorization headers are present."
      )
    };
  }
  const basic = parseBasicAuth(authHeader);
  const clientId = basic ? basic.clientId : body.client_id ?? "";
  const clientSecret = basic ? basic.clientSecret : body.client_secret ?? "";
  if (!clientId) {
    return { response: invalidClient(c, "No client credentials found.") };
  }
  const client = aps.clients.findOneBy("client_id", clientId);
  if (!client) {
    return { response: invalidClient(c, "The client credentials are invalid.") };
  }
  if (client.type === "confidential" && !constantTimeSecretEqual(client.client_secret, clientSecret)) {
    return { response: invalidClient(c, "The client credentials are invalid.") };
  }
  return { client };
}
function userProfileError(c) {
  return c.json(
    {
      developerMessage: "The provided access token is invalid, expired, or does not carry a user context.",
      userMessage: " ",
      errorCode: "AUTH-006",
      "more info": "https://developer.api.autodesk.com/documentation/v2/errors/AUTH-006"
    },
    401
  );
}
async function signAccessToken(store, options) {
  const { privateKey } = await getApsKeyPair(store);
  const claims = {
    scope: parseScope(options.scope),
    client_id: options.clientId,
    jti: generateJti()
  };
  if (options.apsUserId) claims.userid = options.apsUserId;
  return new SignJWT(claims).setProtectedHeader({ alg: "RS256", kid: APS_TOKEN_KID }).setIssuer(APS_TOKEN_ISSUER).setAudience(APS_TOKEN_AUDIENCE).setExpirationTime(options.now + ACCESS_TOKEN_TTL_SECONDS).sign(privateKey);
}
async function createIdToken(store, user, clientId, nonce, baseUrl, now) {
  const { privateKey } = await getApsKeyPair(store);
  const claims = {
    sub: user.user_id,
    first_name: user.first_name,
    last_name: user.last_name,
    user_name: userNameFor(user),
    user_email: user.email,
    userid: user.user_id,
    analytics_id: analyticsIdFor(user.user_id)
  };
  if (nonce) claims.nonce = nonce;
  return new SignJWT(claims).setProtectedHeader({ alg: "RS256", kid: APS_TOKEN_KID, typ: "JWT" }).setIssuer(baseUrl).setAudience(clientId).setIssuedAt(now).setExpirationTime(now + ID_TOKEN_TTL_SECONDS).sign(privateKey);
}
function oauthRoutes({ app, store, baseUrl, tokenMap }) {
  const aps = getApsStore(store);
  app.get("/.well-known/openid-configuration", (c) => {
    return c.json({
      issuer: baseUrl,
      authorization_endpoint: `${baseUrl}/authentication/v2/authorize`,
      token_endpoint: `${baseUrl}/authentication/v2/token`,
      userinfo_endpoint: `${baseUrl}/userinfo`,
      jwks_uri: `${baseUrl}/authentication/v2/keys`,
      revoke_endpoint: `${baseUrl}/authentication/v2/revoke`,
      introspect_endpoint: `${baseUrl}/authentication/v2/introspect`,
      scopes_supported: SUPPORTED_SCOPES,
      response_types_supported: ["code", "code id_token", "id_token"],
      response_modes_supported: ["fragment", "form_post", "query"],
      grant_types_supported: ["authorization_code", "client_credentials", "refresh_token"],
      subject_types_supported: ["public"],
      id_token_signing_alg_values_supported: ["RS256"]
    });
  });
  app.get("/authentication/v2/keys", async (c) => {
    const { publicKey } = await getApsKeyPair(store);
    const jwk = await exportJWK(publicKey);
    c.header("Cache-Control", "max-age=604800");
    return c.json({
      keys: [{ kty: jwk.kty, kid: APS_TOKEN_KID, use: "sig", n: jwk.n, e: jwk.e }]
    });
  });
  app.get("/authentication/v2/authorize", (c) => {
    const clientId = c.req.query("client_id") ?? "";
    const redirectUri = c.req.query("redirect_uri") ?? "";
    const responseType = c.req.query("response_type") ?? "";
    const scope = c.req.query("scope") ?? "";
    const state = c.req.query("state") ?? "";
    const nonce = c.req.query("nonce") ?? "";
    const responseMode = c.req.query("response_mode") ?? "query";
    const codeChallenge = c.req.query("code_challenge") ?? "";
    const codeChallengeMethod = c.req.query("code_challenge_method") ?? "";
    if (!clientId) {
      return c.html(renderErrorPage("Missing client_id", "The client_id parameter is required.", SERVICE_LABEL), 400);
    }
    if (!redirectUri) {
      return c.html(
        renderErrorPage("Missing redirect URI", "The redirect_uri parameter is required.", SERVICE_LABEL),
        400
      );
    }
    const client = aps.clients.findOneBy("client_id", clientId);
    if (!client) {
      return c.html(
        renderErrorPage("Application not found", `The client_id '${clientId}' is not registered.`, SERVICE_LABEL),
        400
      );
    }
    if (!matchesRedirectUri(redirectUri, client.redirect_uris)) {
      return c.html(
        renderErrorPage(
          "Redirect URI mismatch",
          "The redirect_uri does not match the callback URL registered for this application.",
          SERVICE_LABEL
        ),
        400
      );
    }
    const redirectWithError = (error, description) => {
      const url = new URL(redirectUri);
      url.searchParams.set("error", error);
      url.searchParams.set("error_description", description);
      url.searchParams.set("state", state);
      return c.redirect(url.toString(), 302);
    };
    if (responseType !== "code") {
      return redirectWithError("unsupported_response_type", "The response_type must be 'code'.");
    }
    if (codeChallenge && codeChallengeMethod !== "S256") {
      return redirectWithError("invalid_request", "The 'code_challenge_method' must be the string 'S256'.");
    }
    if (!codeChallenge && client.type === "public") {
      return redirectWithError("invalid_request", "A 'code_challenge' is required for public clients.");
    }
    const invalidScope = parseScope(scope).find((entry) => !isSupportedScope(entry));
    if (invalidScope) {
      return redirectWithError("invalid_scope", "The scope is invalid.");
    }
    const users = aps.users.all();
    const buttons = users.map(
      (user) => renderUserButton({
        letter: (user.name[0] ?? user.email[0] ?? "?").toUpperCase(),
        login: user.email,
        name: user.name,
        email: user.email,
        formAction: "/authentication/v2/authorize/callback",
        hiddenFields: {
          user_id: user.user_id,
          redirect_uri: redirectUri,
          scope,
          state,
          nonce,
          client_id: clientId,
          response_mode: responseMode,
          code_challenge: codeChallenge
        }
      })
    ).join("\n");
    const subtitle = `Sign in to <strong>${escapeHtml(client.name)}</strong> with your Autodesk account.`;
    return c.html(
      renderCardPage(
        "Sign in with Autodesk",
        subtitle,
        users.length > 0 ? buttons : '<p class="empty">No users in the emulator store.</p>',
        SERVICE_LABEL
      )
    );
  });
  app.post("/authentication/v2/authorize/callback", async (c) => {
    const body = await c.req.parseBody();
    const userId2 = bodyStr(body.user_id);
    const redirectUri = bodyStr(body.redirect_uri);
    const scope = bodyStr(body.scope);
    const state = bodyStr(body.state);
    const nonce = bodyStr(body.nonce);
    const clientId = bodyStr(body.client_id);
    const responseMode = bodyStr(body.response_mode) || "query";
    const codeChallenge = bodyStr(body.code_challenge);
    if (!redirectUri) {
      return c.html(
        renderErrorPage("Missing redirect URI", "The redirect_uri parameter is required.", SERVICE_LABEL),
        400
      );
    }
    const client = aps.clients.findOneBy("client_id", clientId);
    if (!client) {
      return c.html(
        renderErrorPage("Application not found", `The client_id '${clientId}' is not registered.`, SERVICE_LABEL),
        400
      );
    }
    if (!matchesRedirectUri(redirectUri, client.redirect_uris)) {
      return c.html(
        renderErrorPage(
          "Redirect URI mismatch",
          "The redirect_uri does not match the callback URL registered for this application.",
          SERVICE_LABEL
        ),
        400
      );
    }
    const user = aps.users.findOneBy("user_id", userId2);
    if (!user) {
      return c.html(renderErrorPage("Unknown user", "The selected user is not available.", SERVICE_LABEL), 400);
    }
    const code = generateAuthorizationCode();
    getPendingCodes(store).set(code, {
      userId: user.user_id,
      clientId,
      redirectUri,
      scope,
      nonce: nonce || null,
      codeChallenge: codeChallenge || null,
      createdAt: Date.now()
    });
    debug("aps.oauth", `[callback] code=${code.slice(0, 8)}... user=${user.email}`);
    if (responseMode === "form_post") {
      return c.html(renderFormPostPage(redirectUri, { code, state }, SERVICE_LABEL));
    }
    if (responseMode === "fragment") {
      const url2 = new URL(redirectUri);
      url2.hash = new URLSearchParams({ code, state }).toString();
      return c.redirect(url2.toString(), 302);
    }
    const url = new URL(redirectUri);
    url.searchParams.set("code", code);
    url.searchParams.set("state", state);
    return c.redirect(url.toString(), 302);
  });
  app.post("/authentication/v2/token", async (c) => {
    const body = await parseTokenLikeBody(c);
    const auth = authenticateClient(c, aps, body);
    if ("response" in auth) return auth.response;
    const client = auth.client;
    const grantType = body.grant_type ?? "";
    if (grantType === "authorization_code") {
      const code = body.code ?? "";
      const redirectUri = body.redirect_uri ?? "";
      const codeVerifier = body.code_verifier ?? "";
      if (!code) {
        return oauthError(c, 400, "invalid_request", "The request is missing a required parameter 'code'.");
      }
      if (!redirectUri) {
        return oauthError(c, 400, "invalid_request", "The request is missing a required parameter 'redirect_uri'.");
      }
      const pendingCodes = getPendingCodes(store);
      const pending = pendingCodes.get(code);
      if (!pending || Date.now() - pending.createdAt > AUTHORIZATION_CODE_TTL_MS) {
        if (pending) pendingCodes.delete(code);
        return oauthError(c, 400, "invalid_grant", "The authorization code is invalid or has expired.");
      }
      if (pending.clientId !== client.client_id) {
        return oauthError(c, 400, "invalid_grant", "The grant was issued to another client.");
      }
      if (redirectUri !== pending.redirectUri) {
        return oauthError(c, 400, "invalid_grant", "The 'redirect_uri' is invalid.");
      }
      if (pending.codeChallenge) {
        if (!codeVerifier) {
          return oauthError(c, 400, "invalid_request", "The request is missing a required parameter 'code_verifier'.");
        }
        const expected = createHash5("sha256").update(codeVerifier).digest("base64url");
        if (expected !== pending.codeChallenge) {
          return oauthError(c, 400, "invalid_grant", "PKCE verification failed.");
        }
      }
      const user = aps.users.findOneBy("user_id", pending.userId);
      if (!user) {
        return oauthError(c, 400, "invalid_grant", "The authorization code is invalid or has expired.");
      }
      pendingCodes.delete(code);
      const now = Math.floor(Date.now() / 1e3);
      const scope = pending.scope || "data:read";
      const familyId = randomBytes3(16).toString("hex");
      const accessToken = await signAccessToken(store, {
        clientId: client.client_id,
        scope,
        apsUserId: user.user_id,
        now
      });
      const refreshToken = generateRefreshToken();
      getAccessTokens(store).set(accessToken, {
        clientId: client.client_id,
        scope,
        issuedAt: now,
        expiresAt: now + ACCESS_TOKEN_TTL_SECONDS,
        apsUserId: user.user_id,
        familyId
      });
      getRefreshTokens(store).set(refreshToken, {
        clientId: client.client_id,
        scope,
        apsUserId: user.user_id,
        familyId,
        expiresAt: Date.now() + REFRESH_TOKEN_TTL_MS
      });
      tokenMap?.set(accessToken, { login: user.email, id: user.id, scopes: parseScope(scope) });
      debug("aps.oauth", `[token] issued 3-legged token for ${user.email}`);
      const response = {
        access_token: accessToken,
        token_type: "Bearer",
        expires_in: ACCESS_TOKEN_EXPIRES_IN,
        refresh_token: refreshToken
      };
      if (parseScope(scope).includes("openid")) {
        response.id_token = await createIdToken(store, user, client.client_id, pending.nonce, baseUrl, now);
      }
      return c.json(response);
    }
    if (grantType === "refresh_token") {
      const refreshToken = body.refresh_token ?? "";
      if (!refreshToken) {
        return oauthError(c, 400, "invalid_request", "The request is missing a required parameter 'refresh_token'.");
      }
      const consumed = getConsumedRefreshTokens(store);
      const replayedFamily = consumed.get(refreshToken);
      if (replayedFamily) {
        invalidateGrantFamily(store, tokenMap, replayedFamily);
        return oauthError(c, 400, "invalid_grant", "The refresh token is invalid or expired.");
      }
      const refreshTokens = getRefreshTokens(store);
      const record = refreshTokens.get(refreshToken);
      if (!record || record.expiresAt <= Date.now()) {
        if (record) refreshTokens.delete(refreshToken);
        return oauthError(c, 400, "invalid_grant", "The refresh token is invalid or expired.");
      }
      if (record.clientId !== client.client_id) {
        return oauthError(c, 400, "invalid_grant", "The grant was issued to another client.");
      }
      let scope = record.scope;
      const requestedScope = body.scope ?? "";
      if (requestedScope) {
        const granted = new Set(parseScope(record.scope));
        const requested = parseScope(requestedScope);
        if (requested.some((entry) => !granted.has(entry))) {
          return oauthError(
            c,
            400,
            "invalid_scope",
            "The requested scope is invalid, unknown, malformed or exceeds the scope granted by the resource owner."
          );
        }
        scope = requested.join(" ");
      }
      const user = aps.users.findOneBy("user_id", record.apsUserId);
      if (!user) {
        return oauthError(c, 400, "invalid_grant", "The refresh token is invalid or expired.");
      }
      refreshTokens.delete(refreshToken);
      consumed.set(refreshToken, record.familyId);
      const now = Math.floor(Date.now() / 1e3);
      const accessToken = await signAccessToken(store, {
        clientId: client.client_id,
        scope,
        apsUserId: user.user_id,
        now
      });
      const nextRefreshToken = generateRefreshToken();
      getAccessTokens(store).set(accessToken, {
        clientId: client.client_id,
        scope,
        issuedAt: now,
        expiresAt: now + ACCESS_TOKEN_TTL_SECONDS,
        apsUserId: user.user_id,
        familyId: record.familyId
      });
      refreshTokens.set(nextRefreshToken, {
        clientId: client.client_id,
        scope,
        apsUserId: user.user_id,
        familyId: record.familyId,
        expiresAt: Date.now() + REFRESH_TOKEN_TTL_MS
      });
      tokenMap?.set(accessToken, { login: user.email, id: user.id, scopes: parseScope(scope) });
      return c.json({
        access_token: accessToken,
        token_type: "Bearer",
        expires_in: ACCESS_TOKEN_EXPIRES_IN,
        refresh_token: nextRefreshToken
      });
    }
    if (grantType === "client_credentials") {
      if (client.type !== "confidential") {
        return invalidClient(c, "The client credentials are invalid.");
      }
      const scope = body.scope ?? "";
      const scopes = parseScope(scope);
      if (scopes.length === 0 || scopes.some((entry) => !isSupportedScope(entry))) {
        return oauthError(
          c,
          400,
          "invalid_scope",
          "The requested scope is invalid, unknown, malformed or exceeds the scope granted by the resource owner."
        );
      }
      const now = Math.floor(Date.now() / 1e3);
      const accessToken = await signAccessToken(store, {
        clientId: client.client_id,
        scope,
        apsUserId: null,
        now
      });
      getAccessTokens(store).set(accessToken, {
        clientId: client.client_id,
        scope,
        issuedAt: now,
        expiresAt: now + ACCESS_TOKEN_TTL_SECONDS,
        apsUserId: null,
        familyId: null
      });
      tokenMap?.set(accessToken, { login: client.client_id, id: 0, scopes });
      debug("aps.oauth", `[token] issued 2-legged token for ${client.client_id}`);
      return c.json({
        access_token: accessToken,
        token_type: "Bearer",
        expires_in: ACCESS_TOKEN_EXPIRES_IN
      });
    }
    return oauthError(c, 400, "invalid_request", "The token request must specify a valid 'grant_type'.");
  });
  app.post("/authentication/v2/revoke", async (c) => {
    const body = await parseTokenLikeBody(c);
    const auth = authenticateClient(c, aps, body);
    if ("response" in auth) return auth.response;
    const client = auth.client;
    const token = body.token ?? "";
    if (!token) {
      return oauthError(c, 400, "invalid_request", "The request is missing a required parameter 'token'.");
    }
    const accessTokens = getAccessTokens(store);
    const accessRecord = accessTokens.get(token);
    if (accessRecord && accessRecord.clientId === client.client_id) {
      accessTokens.delete(token);
      tokenMap?.delete(token);
    }
    const refreshTokens = getRefreshTokens(store);
    const refreshRecord = refreshTokens.get(token);
    if (refreshRecord && refreshRecord.clientId === client.client_id) {
      refreshTokens.delete(token);
    }
    return c.body(null, 200);
  });
  app.post("/authentication/v2/introspect", async (c) => {
    const body = await parseTokenLikeBody(c);
    const auth = authenticateClient(c, aps, body);
    if ("response" in auth) return auth.response;
    const token = body.token ?? "";
    if (!token) {
      return oauthError(c, 400, "invalid_request", "The request is missing a required parameter 'token'.");
    }
    const access = token ? await findActiveAccessToken(store, token) : null;
    if (access) {
      return c.json({
        active: true,
        scope: access.scope,
        client_id: access.clientId,
        exp: access.expiresAt,
        ...access.apsUserId ? { userid: access.apsUserId } : {}
      });
    }
    const refresh = getRefreshTokens(store).get(token);
    if (refresh && refresh.expiresAt > Date.now()) {
      return c.json({
        active: true,
        scope: refresh.scope,
        client_id: refresh.clientId,
        exp: Math.floor(refresh.expiresAt / 1e3),
        userid: refresh.apsUserId
      });
    }
    return c.json({ active: false });
  });
  app.get("/authentication/v2/logout", (c) => {
    const postLogoutRedirectUri = c.req.query("post_logout_redirect_uri");
    if (!postLogoutRedirectUri) {
      return c.html(renderCardPage("Signed out", "Your Autodesk session has ended.", "", SERVICE_LABEL));
    }
    let allowed = false;
    try {
      const target = new URL(postLogoutRedirectUri);
      allowed = aps.clients.all().some(
        (client) => client.redirect_uris.some((uri) => {
          try {
            return new URL(uri).host === target.host;
          } catch {
            return false;
          }
        })
      );
    } catch {
      allowed = false;
    }
    if (!allowed) {
      return c.html(
        renderErrorPage(
          "Redirect not allowed",
          "The post_logout_redirect_uri domain is not in the allowed list.",
          SERVICE_LABEL
        ),
        400
      );
    }
    return c.redirect(postLogoutRedirectUri, 302);
  });
  app.get("/userinfo", async (c) => {
    const record = await accessTokenForRequest(c, store);
    if (!record?.apsUserId) {
      return userProfileError(c);
    }
    const user = aps.users.findOneBy("user_id", record.apsUserId);
    if (!user) return userProfileError(c);
    const response = {
      sub: user.user_id,
      name: user.name,
      given_name: user.first_name,
      family_name: user.last_name,
      preferred_username: userNameFor(user),
      email: user.email,
      email_verified: true,
      locale: "en-US",
      updated_at: Math.floor(new Date(user.updated_at).getTime() / 1e3),
      eidm_guid: user.user_id
    };
    if (user.picture) {
      response.picture = user.picture;
      response.thumbnails = { sizeX200: user.picture };
    }
    return c.json(response);
  });
}

// src/routes/rfis.ts
async function requestContext2(c, route, aps) {
  const projectResult = projectForAccId(aps, c.req.param("projectId"), "bare");
  if (projectResult.kind === "invalid") {
    return rfiError(c, 400, "BAD_INPUT", "RFI project IDs must not include the 'b.' prefix.");
  }
  if (projectResult.kind === "missing") {
    return rfiError(c, 404, "NOT_FOUND", "The requested project was not found.");
  }
  const user = await userForApsRequest(c, route.store, aps, false);
  if (!user) return rfiError(c, 403, "FORBIDDEN", "User context is required.");
  const member = accProjectUser(aps, projectResult.project.project_id, user.user_id);
  if (!member) return rfiError(c, 403, "FORBIDDEN", "The user is not a member of this project.");
  return { project: projectResult.project, user, member };
}
function canManageRfis(member) {
  return member.role === "project_admin" || member.rfi_roles.some((role) => role !== "reviewer");
}
function transition(status, userId2) {
  return {
    status,
    maxAssignees: 10,
    requiredAttributes: [],
    permittedAttributes: [
      {
        name: "assignedTo",
        values: [{ value: userId2, type: "user" }]
      }
    ]
  };
}
function permittedActions(member, userId2, status) {
  const manageable = canManageRfis(member);
  const statuses = manageable ? ["draft", "submitted", "open", "answered", "closed"] : [status];
  return {
    share: manageable,
    nudge: manageable,
    updateRfi: {
      permittedStatuses: {
        wfUS: statuses.map((value) => transition(value, userId2)),
        wfEU: statuses.map((value) => transition(value, userId2))
      },
      permittedAttributes: manageable ? [
        { name: "title" },
        { name: "question" },
        { name: "assignedTo", values: [{ value: userId2, type: "user" }] },
        { name: "dueDate" }
      ] : [],
      useCustomAttributes: manageable
    },
    createComment: true,
    createResponse: manageable,
    createResponseOnBehalf: manageable,
    remainingReviewers: [{ id: userId2, type: "user" }],
    createDocumentReference: manageable,
    removeDocumentReference: manageable
  };
}
function rfiPayload(rfi, member, userId2, includeDetail) {
  const payload = {
    ...structuredClone(rfi.payload),
    permittedActions: permittedActions(member, userId2, rfi.status)
  };
  if (!includeDetail) {
    delete payload.responses;
    delete payload.draftResponses;
  } else {
    payload.maxAssignees = 10;
  }
  return payload;
}
function stringArray(value) {
  if (Array.isArray(value)) return value.filter((item) => typeof item === "string");
  return typeof value === "string" ? [value] : [];
}
function actorIds(value) {
  if (!Array.isArray(value)) return stringArray(value);
  return value.flatMap((item) => {
    if (typeof item === "string") return [item];
    if (item && typeof item === "object" && typeof item.id === "string") {
      return [item.id];
    }
    return [];
  });
}
function filterRfis(rfis, body) {
  const filter = body.filter && typeof body.filter === "object" && !Array.isArray(body.filter) ? body.filter : {};
  const search = typeof body.search === "string" ? body.search.trim().toLocaleLowerCase() : "";
  const ids = stringArray(filter.id);
  const statuses = stringArray(filter.status);
  const assignees = actorIds(filter.assignedTo);
  const rfiTypeIds = stringArray(filter.rfiTypeId);
  const references = stringArray(filter.reference);
  const priorities = stringArray(filter.priority);
  let results = rfis.filter((rfi) => {
    if (ids.length > 0 && !ids.includes(rfi.rfi_id)) return false;
    if (statuses.length > 0 && !statuses.includes(rfi.status)) return false;
    if (rfiTypeIds.length > 0 && !rfiTypeIds.includes(rfi.rfi_type_id)) return false;
    if (references.length > 0 && !references.includes(rfi.reference)) return false;
    if (priorities.length > 0 && !priorities.includes(rfi.priority)) return false;
    if (assignees.length > 0 && !assignees.some((id) => rfi.assigned_to.includes(id))) return false;
    if (search) {
      const question = String(rfi.payload.question ?? "").toLocaleLowerCase();
      if (!rfi.title.toLocaleLowerCase().includes(search) && !rfi.custom_identifier.toLocaleLowerCase().includes(search) && !question.includes(search)) {
        return false;
      }
    }
    return true;
  });
  const sorts = Array.isArray(body.sort) ? body.sort : [];
  const firstSort = sorts[0];
  if (firstSort && typeof firstSort === "object") {
    const sort = firstSort;
    const field = typeof sort.field === "string" ? sort.field : "";
    const descending = sort.order === "DESC";
    results = [...results].sort((left, right) => {
      const a = String(left.payload[field] ?? "");
      const b = String(right.payload[field] ?? "");
      const comparison = a.localeCompare(b);
      return descending ? -comparison : comparison;
    });
  }
  return results;
}
function nextCustomIdentifier(rfis) {
  if (rfis.length === 0) return { current: null, next: "1" };
  const sorted = [...rfis].sort((left, right) => left.custom_identifier.localeCompare(right.custom_identifier));
  const current = sorted.at(-1)?.custom_identifier ?? "0";
  const match = current.match(/^(.*?)(\d+)$/);
  if (!match) return { current, next: `${current}-1` };
  const prefix = match[1];
  const numeric = match[2];
  return { current, next: `${prefix}${String(Number(numeric) + 1).padStart(numeric.length, "0")}` };
}
function rfiRoutes(route) {
  const { app, store } = route;
  const aps = getApsStore(store);
  app.use("/construction/rfis/v3/*", apsAuth(store, { scopes: ["data:read"], requireUser: true }));
  app.get("/construction/rfis/v3/projects/:projectId/users/me", async (c) => {
    const context = await requestContext2(c, route, aps);
    if (context instanceof Response) return context;
    const defaultType = aps.rfiTypes.findBy("project_id", context.project.project_id).find((candidate) => candidate.payload.isDefault === true);
    return c.json({
      user: {
        id: context.user.user_id,
        name: context.user.name,
        role: context.member.role
      },
      permittedActions: {
        createRfi: {
          permittedStatuses: {
            wfUS: canManageRfis(context.member) ? [transition("draft", context.user.user_id), transition("open", context.user.user_id)] : [],
            wfEU: canManageRfis(context.member) ? [transition("draft", context.user.user_id), transition("open", context.user.user_id)] : []
          }
        }
      },
      workflow: { roles: context.member.rfi_roles, type: "US" },
      defaultRfiType: defaultType?.rfi_type_id ?? null,
      externalUsers: [],
      maintenanceEndDate: null
    });
  });
  app.get("/construction/rfis/v3/projects/:projectId/workflow", async (c) => {
    const context = await requestContext2(c, route, aps);
    if (context instanceof Response) return context;
    return c.json({
      workflowType: "US",
      description: "RFI creation, review, and response workflow.",
      projectRolesMapping: context.member.rfi_roles.map((name) => ({
        name,
        permittedAssignees: [{ id: context.user.user_id, type: "user" }]
      }))
    });
  });
  app.get("/construction/rfis/v3/projects/:projectId/rfi-types", async (c) => {
    const context = await requestContext2(c, route, aps);
    if (context instanceof Response) return context;
    const pagination2 = queryPagination(c, { defaultLimit: 100, maxLimit: 200 });
    if (!pagination2.ok) return rfiError(c, 400, "BAD_INPUT", pagination2.message);
    const status = c.req.query("filter[status]");
    const resources = aps.rfiTypes.findBy("project_id", context.project.project_id).filter((candidate) => !status || candidate.status === status);
    const results = pageItems(resources, pagination2.value).map((candidate) => structuredClone(candidate.payload));
    return c.json(offsetEnvelope(results, pagination2.value, resources.length));
  });
  app.get("/construction/rfis/v3/projects/:projectId/attributes", async (c) => {
    const context = await requestContext2(c, route, aps);
    if (context instanceof Response) return context;
    const pagination2 = queryPagination(c, { defaultLimit: 100, maxLimit: 200 });
    if (!pagination2.ok) return rfiError(c, 400, "BAD_INPUT", pagination2.message);
    const status = c.req.query("filter[status]");
    const resources = aps.rfiAttributes.findBy("project_id", context.project.project_id).filter((candidate) => !status || candidate.status === status);
    const results = pageItems(resources, pagination2.value).map((candidate) => structuredClone(candidate.payload));
    return c.json(offsetEnvelope(results, pagination2.value, resources.length));
  });
  app.get("/construction/rfis/v3/projects/:projectId/rfis/custom-identifier", async (c) => {
    const context = await requestContext2(c, route, aps);
    if (context instanceof Response) return context;
    return c.json(nextCustomIdentifier(aps.rfis.findBy("project_id", context.project.project_id)));
  });
  app.post("/construction/rfis/v3/projects/:projectId/search:rfis", async (c) => {
    const context = await requestContext2(c, route, aps);
    if (context instanceof Response) return context;
    const body = await readJsonObject(c);
    if (!body.ok) return rfiError(c, 400, "BAD_INPUT", body.message);
    const pagination2 = parseOffsetPagination(
      body.value.limit ?? c.req.query("limit"),
      body.value.offset ?? c.req.query("offset"),
      {
        defaultLimit: 100,
        maxLimit: 200
      }
    );
    if (!pagination2.ok) return rfiError(c, 400, "BAD_INPUT", pagination2.message);
    const filtered = filterRfis(aps.rfis.findBy("project_id", context.project.project_id), body.value);
    const results = pageItems(filtered, pagination2.value).map(
      (rfi) => rfiPayload(rfi, context.member, context.user.user_id, false)
    );
    return c.json(offsetEnvelope(results, pagination2.value, filtered.length));
  });
  app.get("/construction/rfis/v3/projects/:projectId/rfis/:rfiId", async (c) => {
    const context = await requestContext2(c, route, aps);
    if (context instanceof Response) return context;
    const rfi = aps.rfis.findBy("project_id", context.project.project_id).find((candidate) => candidate.rfi_id === c.req.param("rfiId"));
    if (!rfi) return rfiError(c, 404, "NOT_FOUND", "The requested RFI was not found.");
    return c.json(rfiPayload(rfi, context.member, context.user.user_id, true));
  });
}

// src/routes/sheets.ts
async function requestContext3(c, route, aps) {
  const projectResult = projectForAccId(aps, c.req.param("projectId"), "bare-or-prefixed");
  if (projectResult.kind !== "found") {
    return sheetsError(c, 404, "ERR_RESOURCE_NOT_EXIST", "The requested project was not found.");
  }
  const token = await accessTokenForRequest(c, route.store);
  const user = await userForApsRequest(c, route.store, aps, true);
  if (!token) return sheetsError(c, 401, "ERR_AUTHENTICATED_ERROR", "Authentication header is not correct.");
  if (!token.apsUserId && c.req.header("x-user-id") && !user) {
    return sheetsError(c, 403, "ERR_NOT_ALLOWED", "The x-user-id does not identify a seeded user.");
  }
  if (user && !accProjectUser(aps, projectResult.project.project_id, user.user_id)) {
    return sheetsError(c, 403, "ERR_NOT_ALLOWED", "The user is not a member of this project.");
  }
  return { project: projectResult.project };
}
function filterSheets(c, sheets) {
  const versionSetIds = commaSeparated(c.req.query("filter[versionSetId]"));
  const tags = commaSeparated(c.req.query("filter[tags]"));
  const searchTerms = commaSeparated(c.req.query("searchText")).map((value) => value.toLocaleLowerCase());
  const collectionId = c.req.query("collectionId");
  const currentOnly = c.req.query("currentOnly") === "true";
  const isDeleted = c.req.query("isDeleted");
  return sheets.filter((sheet) => {
    if (versionSetIds.length > 0 && !versionSetIds.includes(sheet.version_set_id)) return false;
    if (tags.length > 0 && !tags.some((tag) => sheet.tags.includes(tag))) return false;
    if (currentOnly && !sheet.is_current) return false;
    if (isDeleted === "true" && !sheet.deleted) return false;
    if ((isDeleted === void 0 || isDeleted === "false") && sheet.deleted) return false;
    if (collectionId && collectionId !== "*" && sheet.collection_id !== collectionId) return false;
    if (searchTerms.length > 0 && !searchTerms.some(
      (term) => sheet.title.toLocaleLowerCase().includes(term) || sheet.number.toLocaleLowerCase().includes(term)
    )) {
      return false;
    }
    return true;
  });
}
function sheetRoutes(route) {
  const { app, store } = route;
  const aps = getApsStore(store);
  app.use("/construction/sheets/v1/*", apsAuth(store, { scopes: ["data:read"] }));
  app.get("/construction/sheets/v1/projects/:projectId/sheets", async (c) => {
    const context = await requestContext3(c, route, aps);
    if (context instanceof Response) return context;
    const pagination2 = queryPagination(c, { defaultLimit: 100, maxLimit: 200 });
    if (!pagination2.ok) return sheetsError(c, 400, "ERR_BAD_INPUT", pagination2.message);
    const filtered = filterSheets(c, aps.sheets.findBy("project_id", context.project.project_id));
    const results = pageItems(filtered, pagination2.value).map((sheet) => structuredClone(sheet.payload));
    return c.json(sheetsEnvelope(results, pagination2.value, filtered.length, c.req.url));
  });
  app.post("/construction/sheets/v1/projects/:projectId/sheets:batch-get", async (c) => {
    const context = await requestContext3(c, route, aps);
    if (context instanceof Response) return context;
    const body = await readJsonObject(c);
    if (!body.ok) return sheetsError(c, 400, "ERR_BAD_INPUT", body.message);
    const ids = body.value.ids;
    if (!Array.isArray(ids) || ids.some((id) => typeof id !== "string")) {
      return sheetsError(c, 400, "ERR_BAD_INPUT", "ids must be an array of sheet IDs.");
    }
    const projectSheets = aps.sheets.findBy("project_id", context.project.project_id);
    const results = ids.flatMap((id) => {
      const sheet = projectSheets.find((candidate) => candidate.sheet_id === id);
      return sheet ? [structuredClone(sheet.payload)] : [];
    });
    return c.json({ results });
  });
  app.get("/construction/sheets/v1/projects/:projectId/version-sets", async (c) => {
    const context = await requestContext3(c, route, aps);
    if (context instanceof Response) return context;
    const pagination2 = queryPagination(c, { defaultLimit: 100, maxLimit: 200 });
    if (!pagination2.ok) return sheetsError(c, 400, "ERR_BAD_INPUT", pagination2.message);
    const collectionId = c.req.query("collectionId");
    const resources = aps.sheetVersionSets.findBy("project_id", context.project.project_id).filter((versionSet) => !collectionId || collectionId === "*" || versionSet.collection_id === collectionId);
    const results = pageItems(resources, pagination2.value).map((versionSet) => structuredClone(versionSet.payload));
    return c.json(sheetsEnvelope(results, pagination2.value, resources.length, c.req.url));
  });
  app.get("/construction/sheets/v1/projects/:projectId/collections", async (c) => {
    const context = await requestContext3(c, route, aps);
    if (context instanceof Response) return context;
    const pagination2 = queryPagination(c, { defaultLimit: 100, maxLimit: 200 });
    if (!pagination2.ok) return sheetsError(c, 400, "ERR_BAD_INPUT", pagination2.message);
    const resources = aps.sheetCollections.findBy("project_id", context.project.project_id);
    const results = pageItems(resources, pagination2.value).map((collection) => structuredClone(collection.payload));
    return c.json(sheetsEnvelope(results, pagination2.value, resources.length, c.req.url));
  });
  app.get("/construction/sheets/v1/projects/:projectId/collections/:collectionId", async (c) => {
    const context = await requestContext3(c, route, aps);
    if (context instanceof Response) return context;
    const collection = aps.sheetCollections.findBy("project_id", context.project.project_id).find((candidate) => candidate.collection_id === c.req.param("collectionId"));
    if (!collection) {
      return sheetsError(c, 404, "ERR_RESOURCE_NOT_EXIST", "The collection does not exist.");
    }
    return c.json(structuredClone(collection.payload));
  });
}

// src/webhook-events.ts
var APS_WEBHOOK_REGIONS = ["US", "EMEA", "AUS", "CAN", "DEU", "IND", "JPN", "GBR"];
var REGION_SET = new Set(APS_WEBHOOK_REGIONS);
function parseWebhookRegion(value) {
  const normalized = value.toUpperCase();
  return REGION_SET.has(normalized) ? normalized : null;
}
var APS_WEBHOOK_EVENTS = {
  data: [
    "dm.version.added",
    "dm.version.modified",
    "dm.version.deleted",
    "dm.version.moved",
    "dm.version.moved.out",
    "dm.version.copied",
    "dm.version.copied.out",
    "dm.lineage.reserved",
    "dm.lineage.unreserved",
    "dm.lineage.updated",
    "dm.folder.added",
    "dm.folder.modified",
    "dm.folder.deleted",
    "dm.folder.purged",
    "dm.folder.moved",
    "dm.folder.moved.out",
    "dm.folder.copied",
    "dm.folder.copied.out",
    "dm.operation.started",
    "dm.operation.completed"
  ],
  derivative: ["extraction.finished", "extraction.updated"],
  "adsk.c4r": ["model.sync", "model.publish"],
  "adsk.flc.production": [
    "item.clone",
    "item.create",
    "item.lock",
    "item.release",
    "item.unlock",
    "item.update",
    "workflow.transition"
  ],
  "autodesk.construction.cost": [
    "budget.created-1.0",
    "budget.updated-1.0",
    "budget.deleted-1.0",
    "budgetPayment.created-1.0",
    "budgetPayment.updated-1.0",
    "budgetPayment.deleted-1.0",
    "contract.created-1.0",
    "contract.updated-1.0",
    "contract.deleted-1.0",
    "cor.created-1.0",
    "cor.updated-1.0",
    "cor.deleted-1.0",
    "costPayment.created-1.0",
    "costPayment.updated-1.0",
    "costPayment.deleted-1.0",
    "expense.created-1.0",
    "expense.updated-1.0",
    "expense.deleted-1.0",
    "expenseItem.created-1.0",
    "expenseItem.updated-1.0",
    "expenseItem.deleted-1.0",
    "mainContract.created-1.0",
    "mainContract.updated-1.0",
    "mainContract.deleted-1.0",
    "mainContractItem.created-1.0",
    "mainContractItem.updated-1.0",
    "mainContractItem.deleted-1.0",
    "oco.created-1.0",
    "oco.updated-1.0",
    "oco.deleted-1.0",
    "pco.created-1.0",
    "pco.updated-1.0",
    "pco.deleted-1.0",
    "project.initialized-1.0",
    "rfq.created-1.0",
    "rfq.updated-1.0",
    "rfq.deleted-1.0",
    "scheduleOfValue.created-1.0",
    "scheduleOfValue.updated-1.0",
    "scheduleOfValue.deleted-1.0",
    "sco.created-1.0",
    "sco.updated-1.0",
    "sco.deleted-1.0",
    "segmentValue.created-1.0",
    "segmentValue.updated-1.0",
    "segmentValue.deleted-1.0"
  ],
  "autodesk.construction.bc": [
    "bid.created",
    "opportunity.comment.created",
    "opportunity.comment.deleted",
    "opportunity.comment.updated",
    "opportunity.created",
    "opportunity.status.updated"
  ],
  "autodesk.construction.issues": [
    "issue.created-1.0",
    "issue.updated-1.0",
    "issue.deleted-1.0",
    "issue.restored-1.0",
    "issue.unlinked-1.0"
  ],
  "autodesk.construction.reviews": ["review.created-1.0", "review.closed-1.0"],
  "adsk.tandem": ["dt.alert", "dt.mutation", "dt.applyTemplate", "dt.removeTemplate"]
};

// src/routes/simulate.ts
function simulatorError(c, message, status = 400) {
  return c.json({ error: message }, status);
}
function stringRecord(value) {
  if (!isRecordObject(value)) return void 0;
  const entries = Object.entries(value);
  if (entries.some(([, item]) => typeof item !== "string")) return void 0;
  return Object.fromEntries(entries);
}
function simulateRoutes({ app, store }) {
  const aps = getApsStore(store);
  app.post("/_aps/simulate/modelset-version-added", async (c) => {
    const body = await jsonObjectBody(c);
    if (!body) return simulatorError(c, "The request body must be a JSON object.");
    const requestedModelSetId = optionalString(body.modelSetId);
    const modelSet = requestedModelSetId ? aps.modelSets.findOneBy("model_set_id", requestedModelSetId) : aps.modelSets.all()[0];
    if (!modelSet) return simulatorError(c, "The seeded model set was not found.", 404);
    const processingMs = body.processingMs;
    if (processingMs !== void 0 && (typeof processingMs !== "number" || !Number.isFinite(processingMs) || processingMs < 0)) {
      return simulatorError(c, "processingMs must be a non-negative number.");
    }
    const result = addModelSetVersion(aps, store, modelSet, { processingMs });
    return c.json({
      modelSetVersion: modelSetVersionPayload(result.version),
      clashTest: clashTestPayload(result.test)
    });
  });
  app.post("/_aps/simulate/event", async (c) => {
    const body = await jsonObjectBody(c);
    if (!body) return simulatorError(c, "The request body must be a JSON object.");
    const system = optionalString(body.system);
    const event = optionalString(body.event);
    const region = parseWebhookRegion(optionalString(body.region) ?? "US");
    if (!system || !event || !region) return simulatorError(c, "system, event, and a valid region are required.");
    if (body.payload !== void 0 && !isRecordObject(body.payload))
      return simulatorError(c, "payload must be an object.");
    const scope = body.scope === void 0 ? void 0 : stringRecord(body.scope);
    if (body.scope !== void 0 && !scope) return simulatorError(c, "scope values must be strings.");
    if (body.folderAncestors !== void 0 && (!Array.isArray(body.folderAncestors) || body.folderAncestors.some((item) => typeof item !== "string"))) {
      return simulatorError(c, "folderAncestors must contain strings.");
    }
    const resourceUrn = optionalString(body.resourceUrn) ?? `urn:adsk.webhooks:resource:${encodeURIComponent(system)}:${encodeURIComponent(event)}`;
    const report = await simulateWebhookEvent(aps, store, {
      system,
      event,
      resourceUrn,
      region,
      payload: body.payload ?? {},
      tenant: optionalString(body.tenant),
      scopeValue: optionalString(body.scopeValue),
      scope,
      folderAncestors: body.folderAncestors
    });
    return c.json(report);
  });
  app.post("/_aps/simulate/dm-version-added", async (c) => {
    const body = await jsonObjectBody(c);
    if (!body) return simulatorError(c, "The request body must be a JSON object.");
    const requestedVersionId = optionalString(body.versionId);
    const version = requestedVersionId ? aps.documentVersions.findOneBy("version_id", requestedVersionId) : aps.documentVersions.all()[0];
    if (!version) return simulatorError(c, "The seeded Data Management version was not found.", 404);
    const event = documentVersionAddedEvent(aps, version);
    if (!event) return simulatorError(c, "The seeded Data Management item or folder was not found.", 404);
    const report = await simulateWebhookEvent(aps, store, event);
    return c.json(report);
  });
  app.post("/_aps/simulate/extraction-finished", async (c) => {
    const body = await jsonObjectBody(c);
    if (!body) return simulatorError(c, "The request body must be a JSON object.");
    const urn = optionalString(body.urn) ?? DEFAULT_MANIFEST_URN;
    const manifest = aps.manifests.findOneBy("urn", urn);
    if (!manifest) return simulatorError(c, "The seeded manifest was not found.", 404);
    const workflow = optionalString(body.workflow) ?? "emulate-translation";
    const payload = {
      TimeStamp: Date.now(),
      URN: manifest.urn,
      EventType: "EXTRACTION_FINISHED",
      Payload: {
        status: manifest.status,
        scope: workflow,
        registerKey: []
      }
    };
    const report = await simulateWebhookEvent(aps, store, {
      system: "derivative",
      event: "extraction.finished",
      resourceUrn: manifest.urn,
      region: manifest.region,
      scope: { workflow },
      payload
    });
    return c.json(report);
  });
  app.post("/_aps/simulate/translation-complete", async (c) => {
    const body = await jsonObjectBody(c);
    if (!body) return simulatorError(c, "The request body must be a JSON object.");
    const urn = optionalString(body.urn);
    const status = optionalString(body.status) ?? "success";
    if (!urn) return simulatorError(c, "urn is required.");
    if (status !== "success" && status !== "failed") {
      return simulatorError(c, "status must be success or failed.");
    }
    const job = aps.translationJobs.findOneBy("urn", urn);
    if (!job) return simulatorError(c, "The translation job was not found.", 404);
    const completed = await forceTranslationTerminal(aps, store, job, status);
    return c.json(manifestForJob(completed));
  });
  app.post("/_aps/simulate/issue-created", async (c) => {
    const body = await jsonObjectBody(c);
    if (!body) return simulatorError(c, "The request body must be a JSON object.");
    const requestedProjectId = optionalString(body.projectId) ?? bareProjectId(DEFAULT_PROJECT_ID);
    const project = aps.projects.all().find((candidate) => bareProjectId(candidate.project_id) === requestedProjectId);
    if (!project) return simulatorError(c, "The seeded project was not found.", 404);
    const requestedIssueId = optionalString(body.issueId);
    const issue = requestedIssueId ? aps.issues.findBy("project_id", project.project_id).find((candidate) => candidate.issue_id === requestedIssueId) : aps.issues.findBy("project_id", project.project_id)[0];
    if (!issue) return simulatorError(c, "The seeded issue was not found.", 404);
    const projectId = bareProjectId(project.project_id);
    const payload = {
      ...structuredClone(issue.payload),
      projectId
    };
    const report = await simulateWebhookEvent(aps, store, {
      system: "autodesk.construction.issues",
      event: "issue.created-1.0",
      resourceUrn: `urn:adsk.issues:issues.issue:${issue.issue_id}`,
      region: "US",
      scope: { project: projectId },
      payload
    });
    return c.json(report);
  });
}

// src/routes/webhooks.ts
import { randomUUID as randomUUID5 } from "crypto";
var PAGE_SIZE = 200;
var SCOPE_QUOTA = 1e3;
var READ_SCOPES = ["data:read"];
var WRITE_SCOPES = ["data:read", "data:write"];
function webhookError(c, status) {
  return c.json({ id: randomUUID5() }, status);
}
async function webhookContext(c, store, aps, scopes, appOnly = false) {
  const token = await accessTokenForRequest(c, store);
  if (!token) return webhookError(c, 401);
  if (!tokenGrantsScopes(token, scopes)) return webhookError(c, 403);
  if (appOnly && token.apsUserId) return webhookError(c, 403);
  const region = parseWebhookRegion(
    c.req.header("region") ?? c.req.header("x-ads-region") ?? c.req.query("region") ?? "US"
  );
  if (!region) return webhookError(c, 400);
  deleteExpiredHooks(aps);
  const identity = token.apsUserId ? userIdentity(token.apsUserId) : appIdentity(token.clientId);
  return { identity, region };
}
var INVALID = /* @__PURE__ */ Symbol("invalid");
function optional(parse) {
  return (value) => value === void 0 ? void 0 : parse(value);
}
function nullable(parse) {
  return (value) => value === null ? null : parse(value);
}
function asString(value) {
  return typeof value === "string" && value.trim() ? value : INVALID;
}
function asBoolean(value) {
  return typeof value === "boolean" ? value : INVALID;
}
function asHookAttribute(value) {
  return isRecordObject(value) && Buffer.byteLength(JSON.stringify(value), "utf8") < 1024 ? value : INVALID;
}
function asFilter(value) {
  const filter = typeof value === "string" || Array.isArray(value) && value.every((item) => typeof item === "string") ? value : void 0;
  return filter !== void 0 && validateWebhookFilter(filter) ? filter : INVALID;
}
function asExpiry(value) {
  return typeof value === "string" && Number.isFinite(Date.parse(value)) ? value : INVALID;
}
var optString = optional(asString);
var optBoolean = optional(asBoolean);
var optAttribute = optional(asHookAttribute);
var optNullableAttribute = optional(nullable(asHookAttribute));
var optFilter = optional(nullable(asFilter));
var optExpiry = optional(nullable(asExpiry));
function parseHookScope(value) {
  if (!isRecordObject(value)) return null;
  const entries = Object.entries(value);
  if (!entries.length || entries.some(([, item]) => typeof item !== "string" || !item.trim())) return null;
  return Object.fromEntries(entries);
}
function parseHookPayload(body) {
  const callbackUrl = optString(body.callbackUrl);
  const scope = parseHookScope(body.scope);
  const tenant = optString(body.tenant);
  const autoReactivateHook = optBoolean(body.autoReactivateHook);
  const hookAttribute = optAttribute(body.hookAttribute);
  const filter = optFilter(body.filter);
  const hookExpiry = optExpiry(body.hookExpiry);
  const token = optString(body.token);
  const hubId = optString(body.hubId);
  const projectId = optString(body.projectId);
  if (callbackUrl === void 0 || callbackUrl === INVALID || !scope || tenant === INVALID || autoReactivateHook === INVALID || hookAttribute === INVALID || filter === INVALID || hookExpiry === INVALID || token === INVALID || hubId === INVALID || projectId === INVALID) {
    return null;
  }
  return {
    callbackUrl,
    scope,
    tenant,
    autoReactivateHook,
    hookExpiry,
    hookAttribute: hookAttribute ?? null,
    filter: filter ?? null,
    token: token ?? null,
    hubId: hubId ?? null,
    projectId: projectId ?? null
  };
}
function parseHookUpdate(body, hook) {
  const status = body.status === void 0 || body.status === "active" || body.status === "inactive" ? body.status : INVALID;
  const autoReactivateHook = optBoolean(body.autoReactivateHook);
  const filter = optFilter(body.filter);
  const hookAttribute = optNullableAttribute(body.hookAttribute);
  const token = optString(body.token);
  const hookExpiry = optExpiry(body.hookExpiry);
  if (status === INVALID || autoReactivateHook === INVALID || filter === INVALID || hookAttribute === INVALID || token === INVALID || hookExpiry === INVALID) {
    return null;
  }
  const update = {};
  if (status !== void 0) {
    update.status = status;
    update.failed_event_count = status === "active" ? 0 : hook.failed_event_count;
    update.inactive_at = status === "inactive" ? (/* @__PURE__ */ new Date()).toISOString() : null;
  }
  if (autoReactivateHook !== void 0) update.auto_reactivate_hook = autoReactivateHook;
  if (filter !== void 0) update.filter = filter;
  if (hookAttribute !== void 0) update.hook_attribute = hookAttribute;
  if (token !== void 0) update.token = token;
  if (hookExpiry !== void 0) update.hook_expiry = hookExpiry;
  return update;
}
function identityHooks(aps, { identity, region }) {
  return aps.webhookHooks.all().filter((hook) => hook.identity_key === identity.key && hook.region === region);
}
function overQuota(aps, context, scope, additional) {
  const canonical = canonicalWebhookScope(scope);
  const count = identityHooks(aps, context).filter((hook) => canonicalWebhookScope(hook.scope) === canonical).length;
  return count + additional > SCOPE_QUOTA;
}
function visibleHook(aps, context, c) {
  const hook = aps.webhookHooks.findOneBy("hook_id", c.req.param("hookId"));
  return hook && hook.identity_key === context.identity.key && hook.region === context.region && hook.system === c.req.param("system") && hook.event === c.req.param("event") ? hook : void 0;
}
function encodePageState(offset) {
  return Buffer.from(`aps-webhooks:${offset}`, "utf8").toString("base64");
}
function decodePageState(value) {
  if (!value) return 0;
  try {
    const decoded = Buffer.from(value, "base64").toString("utf8");
    const match = decoded.match(/^aps-webhooks:(\d+)$/);
    return match ? Number(match[1]) : null;
  } catch {
    return null;
  }
}
function listResponse(c, hooks) {
  const offset = decodePageState(c.req.query("pageState"));
  if (offset === null) return webhookError(c, 400);
  if (!hooks.length || offset >= hooks.length) return c.body(null, 204);
  const data = hooks.slice(offset, offset + PAGE_SIZE).map(webhookDetails);
  const links = {};
  if (offset + PAGE_SIZE < hooks.length) {
    const url = new URL(c.req.url);
    url.searchParams.set("pageState", encodePageState(offset + PAGE_SIZE));
    const relativePath = url.pathname.replace(/^\/webhooks\/v1/, "") || "/";
    links.next = `${relativePath}?${url.searchParams.toString()}`;
  }
  return c.json({ links, data });
}
function filterStatus(c, hooks) {
  const status = c.req.query("status");
  if (status !== void 0 && !validWebhookStatus(status)) return null;
  return status ? hooks.filter((hook) => hook.status === status) : hooks;
}
function webhookRoutes({ app, store }) {
  const aps = getApsStore(store);
  app.post("/webhooks/v1/systems/:system/events/:event/hooks", async (c) => {
    const context = await webhookContext(c, store, aps, WRITE_SCOPES);
    if (context instanceof Response) return context;
    const body = await jsonObjectBody(c);
    const payload = body ? parseHookPayload(body) : null;
    if (!payload) return webhookError(c, 400);
    const system = c.req.param("system");
    const event = c.req.param("event");
    const input = { ...payload, identity: context.identity, region: context.region, system, event };
    if (findDuplicateHook(aps, input)) return webhookError(c, 409);
    if (overQuota(aps, context, payload.scope, 1)) return webhookError(c, 400);
    const hook = createWebhookRecord(aps, input);
    c.header(
      "Location",
      `/webhooks/v1/systems/${encodeURIComponent(system)}/events/${encodeURIComponent(event)}/hooks/${encodeURIComponent(hook.hook_id)}`
    );
    return c.body(null, 201);
  });
  app.get("/webhooks/v1/systems/:system/events/:event/hooks", async (c) => {
    const context = await webhookContext(c, store, aps, READ_SCOPES);
    if (context instanceof Response) return context;
    let hooks = identityHooks(aps, context).filter(
      (hook) => hook.system === c.req.param("system") && hook.event === c.req.param("event")
    );
    const scopeName = c.req.query("scopeName");
    const scopeValue = c.req.query("scopeValue");
    if (scopeName) hooks = hooks.filter((hook) => scopeName in hook.scope);
    if (scopeName && scopeValue) hooks = hooks.filter((hook) => hook.scope[scopeName] === scopeValue);
    const filtered = filterStatus(c, hooks);
    return filtered ? listResponse(c, filtered) : webhookError(c, 400);
  });
  app.get("/webhooks/v1/systems/:system/events/:event/hooks/:hookId", async (c) => {
    const context = await webhookContext(c, store, aps, READ_SCOPES);
    if (context instanceof Response) return context;
    const hook = visibleHook(aps, context, c);
    return hook ? c.json(webhookDetails(hook)) : webhookError(c, 404);
  });
  app.patch("/webhooks/v1/systems/:system/events/:event/hooks/:hookId", async (c) => {
    const context = await webhookContext(c, store, aps, WRITE_SCOPES);
    if (context instanceof Response) return context;
    const body = await jsonObjectBody(c);
    if (!body) return webhookError(c, 400);
    const hook = visibleHook(aps, context, c);
    if (!hook) return webhookError(c, 404);
    const update = parseHookUpdate(body, hook);
    if (!update) return webhookError(c, 400);
    aps.webhookHooks.update(hook.id, update);
    return c.body(null, 200);
  });
  app.delete("/webhooks/v1/systems/:system/events/:event/hooks/:hookId", async (c) => {
    const context = await webhookContext(c, store, aps, WRITE_SCOPES);
    if (context instanceof Response) return context;
    const hook = visibleHook(aps, context, c);
    if (!hook) return webhookError(c, 404);
    aps.webhookHooks.delete(hook.id);
    return c.body(null, 204);
  });
  app.post("/webhooks/v1/systems/:system/hooks", async (c) => {
    const context = await webhookContext(c, store, aps, WRITE_SCOPES);
    if (context instanceof Response) return context;
    const body = await jsonObjectBody(c);
    const payload = body ? parseHookPayload(body) : null;
    if (!payload) return webhookError(c, 400);
    const system = c.req.param("system");
    const events = APS_WEBHOOK_EVENTS[system] ?? ["*"];
    const inputs = events.map((event) => ({
      ...payload,
      identity: context.identity,
      region: context.region,
      system,
      event
    }));
    if (inputs.some((input) => findDuplicateHook(aps, input))) return webhookError(c, 409);
    if (overQuota(aps, context, payload.scope, events.length)) return webhookError(c, 400);
    const hooks = inputs.map((input) => createWebhookRecord(aps, input));
    return c.json({ hooks: hooks.map(webhookDetails) }, 201);
  });
  app.get("/webhooks/v1/systems/:system/hooks", async (c) => {
    const context = await webhookContext(c, store, aps, READ_SCOPES);
    if (context instanceof Response) return context;
    const hooks = identityHooks(aps, context).filter((hook) => hook.system === c.req.param("system"));
    const filtered = filterStatus(c, hooks);
    return filtered ? listResponse(c, filtered) : webhookError(c, 400);
  });
  app.get("/webhooks/v1/hooks", async (c) => {
    const context = await webhookContext(c, store, aps, READ_SCOPES);
    if (context instanceof Response) return context;
    const filtered = filterStatus(c, identityHooks(aps, context));
    return filtered ? listResponse(c, filtered) : webhookError(c, 400);
  });
  app.get("/webhooks/v1/app/hooks", async (c) => {
    const context = await webhookContext(c, store, aps, READ_SCOPES, true);
    if (context instanceof Response) return context;
    const sort = c.req.query("sort") ?? "desc";
    if (sort !== "asc" && sort !== "desc") return webhookError(c, 400);
    const hooks = identityHooks(aps, context).sort((left, right) => {
      const comparison = Date.parse(left.updated_at) - Date.parse(right.updated_at);
      return sort === "asc" ? comparison : -comparison;
    });
    const filtered = filterStatus(c, hooks);
    return filtered ? listResponse(c, filtered) : webhookError(c, 400);
  });
  app.post("/webhooks/v1/tokens", async (c) => {
    const context = await webhookContext(c, store, aps, WRITE_SCOPES);
    if (context instanceof Response) return context;
    const body = await jsonObjectBody(c);
    const token = body ? optString(body.token) : void 0;
    if (token === void 0 || token === INVALID) return webhookError(c, 400);
    if (findWebhookSecret(aps, context.identity.key, context.region)) return webhookError(c, 400);
    aps.webhookSecrets.insert({ identity_key: context.identity.key, region: context.region, token });
    return c.json({ status: 200, detail: [`Token created successfully for client: ${context.identity.createdBy}`] });
  });
  app.put("/webhooks/v1/tokens/@me", async (c) => {
    const context = await webhookContext(c, store, aps, WRITE_SCOPES);
    if (context instanceof Response) return context;
    const body = await jsonObjectBody(c);
    const token = body ? optString(body.token) : void 0;
    if (token === void 0 || token === INVALID) return webhookError(c, 400);
    const existing = findWebhookSecret(aps, context.identity.key, context.region);
    if (!existing) return webhookError(c, 404);
    aps.webhookSecrets.update(existing.id, { token });
    return c.body(null, 204);
  });
  app.delete("/webhooks/v1/tokens/@me", async (c) => {
    const context = await webhookContext(c, store, aps, WRITE_SCOPES);
    if (context instanceof Response) return context;
    const existing = findWebhookSecret(aps, context.identity.key, context.region);
    if (!existing) return webhookError(c, 404);
    aps.webhookSecrets.delete(existing.id);
    return c.body(null, 204);
  });
}

// src/seed-acc.ts
function seedProjectId(aps, projectId) {
  const result = projectForAccId(aps, projectId, "bare-or-prefixed");
  if (result.kind !== "found") {
    throw new Error(`APS ACC resource references unknown project '${projectId}'.`);
  }
  return result.project.project_id;
}
function userId(aps, value) {
  if (!value) return aps.users.all()[0]?.user_id ?? "";
  return aps.users.findOneBy("email", value)?.user_id ?? aps.users.findOneBy("user_id", value)?.user_id ?? value;
}
function actors(aps, values) {
  return (values ?? []).map((actor) => ({ id: userId(aps, actor.id), type: actor.type ?? "user" }));
}
function resourceExists(resources, projectId, identifier, id) {
  return resources.some((resource) => resource.project_id === projectId && identifier(resource) === id);
}
function seedAccFromConfig(aps, config) {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  for (const member of config.acc_project_users ?? []) {
    const projectId = seedProjectId(aps, member.project_id);
    const user = aps.users.findOneBy("email", member.user_email);
    if (!user) {
      throw new Error(`APS ACC project user references unknown user '${member.user_email}'.`);
    }
    if (resourceExists(aps.accProjectUsers.all(), projectId, (candidate) => candidate.user_id, user.user_id)) {
      continue;
    }
    aps.accProjectUsers.insert({
      project_id: projectId,
      user_id: user.user_id,
      role: member.role ?? "member",
      issue_permission: member.issue_permission ?? "read",
      rfi_roles: structuredClone(member.rfi_roles ?? [])
    });
  }
  for (const issueType of config.issue_types ?? []) {
    const projectId = seedProjectId(aps, issueType.project_id);
    if (resourceExists(aps.issueTypes.all(), projectId, (candidate) => candidate.issue_type_id, issueType.id)) {
      continue;
    }
    const createdBy = aps.accProjectUsers.findBy("project_id", projectId)[0]?.user_id ?? "";
    const subtypes = (issueType.subtypes ?? []).map((subtype) => ({
      id: subtype.id,
      issueTypeId: issueType.id,
      title: subtype.title,
      code: subtype.code ?? "",
      isActive: subtype.is_active ?? true,
      orderIndex: subtype.order_index ?? 1,
      isReadOnly: false,
      permittedActions: ["edit"],
      permittedAttributes: ["title"],
      createdBy,
      createdAt: now,
      updatedBy: createdBy,
      updatedAt: now,
      deletedBy: null,
      deletedAt: null
    }));
    aps.issueTypes.insert({
      project_id: projectId,
      issue_type_id: issueType.id,
      is_active: issueType.is_active ?? true,
      payload: {
        id: issueType.id,
        containerId: bareProjectId(projectId),
        title: issueType.title,
        isActive: issueType.is_active ?? true,
        orderIndex: issueType.order_index ?? 1,
        permittedActions: ["edit"],
        permittedAttributes: ["title"],
        subtypes,
        statusSet: "default",
        createdBy,
        createdAt: now,
        updatedBy: createdBy,
        updatedAt: now,
        deletedBy: null,
        deletedAt: null
      }
    });
  }
  for (const issue of config.issues ?? []) {
    const projectId = seedProjectId(aps, issue.project_id);
    if (resourceExists(aps.issues.all(), projectId, (candidate) => candidate.issue_id, issue.id)) continue;
    const issueType = aps.issueTypes.findBy("project_id", projectId).find((candidate) => candidate.issue_type_id === issue.issue_type_id);
    const subtypes = issueType?.payload.subtypes ?? [];
    if (!issueType || !subtypes.some((subtype) => subtype.id === issue.issue_subtype_id)) {
      throw new Error(`APS issue '${issue.id}' references an unknown issue type or subtype.`);
    }
    const assignedTo = issue.assigned_to ? userId(aps, issue.assigned_to) : null;
    const createdBy = userId(aps, issue.created_by);
    const updatedBy = userId(aps, issue.updated_by ?? issue.created_by);
    const createdAt = issue.created_at ?? now;
    const updatedAt = issue.updated_at ?? createdAt;
    const status = issue.status ?? "open";
    const deleted = issue.deleted ?? false;
    const displayId = issue.display_id ?? aps.issues.findBy("project_id", projectId).length + 1;
    aps.issues.insert({
      project_id: projectId,
      issue_id: issue.id,
      issue_type_id: issue.issue_type_id,
      issue_subtype_id: issue.issue_subtype_id,
      display_id: displayId,
      title: issue.title,
      status,
      assigned_to: assignedTo,
      deleted,
      payload: {
        id: issue.id,
        containerId: bareProjectId(projectId),
        deleted,
        deletedAt: null,
        deletedBy: null,
        displayId,
        title: issue.title,
        description: issue.description ?? "",
        snapshotUrn: "",
        issueTypeId: issue.issue_type_id,
        issueSubtypeId: issue.issue_subtype_id,
        status,
        assignedTo,
        assignedToType: assignedTo ? issue.assigned_to_type ?? "user" : null,
        dueDate: issue.due_date ?? null,
        startDate: issue.start_date ?? null,
        locationId: issue.location_id ?? null,
        locationDetails: issue.location_details ?? "",
        linkedDocuments: [],
        links: [],
        ownerId: null,
        rootCauseId: issue.root_cause_id ?? null,
        officialResponse: null,
        issueTemplateId: null,
        published: issue.published ?? true,
        commentCount: 0,
        attachmentCount: 0,
        openedBy: createdBy,
        openedAt: createdAt,
        closedBy: status === "closed" ? updatedBy : null,
        closedAt: status === "closed" ? updatedAt : null,
        createdBy,
        createdAt,
        updatedBy,
        updatedAt,
        watchers: [],
        customAttributes: [],
        gpsCoordinates: null,
        snapshotHasMarkups: false
      }
    });
  }
  for (const rfiType of config.rfi_types ?? []) {
    const projectId = seedProjectId(aps, rfiType.project_id);
    if (resourceExists(aps.rfiTypes.all(), projectId, (candidate) => candidate.rfi_type_id, rfiType.id)) {
      continue;
    }
    const status = rfiType.status ?? "active";
    aps.rfiTypes.insert({
      project_id: projectId,
      rfi_type_id: rfiType.id,
      status,
      payload: {
        id: rfiType.id,
        name: rfiType.name,
        wfType: rfiType.workflow_type ?? "US",
        status,
        isDefault: rfiType.is_default ?? false,
        projectReviewer: actors(aps, rfiType.reviewers),
        projectCoordinator: actors(aps, rfiType.manager),
        manager: actors(aps, rfiType.manager),
        watchers: actors(aps, rfiType.watchers),
        dueDateOffset: rfiType.due_date_offset ?? 7,
        locationDescription: "",
        costImpact: "Unknown",
        scheduleImpact: "Unknown",
        priority: "Normal",
        discipline: [],
        category: [],
        reference: "",
        bridgeTargetProjectIds: []
      }
    });
  }
  for (const attribute of config.rfi_attributes ?? []) {
    const projectId = seedProjectId(aps, attribute.project_id);
    if (resourceExists(aps.rfiAttributes.all(), projectId, (candidate) => candidate.attribute_id, attribute.id)) {
      continue;
    }
    const status = attribute.status ?? "active";
    aps.rfiAttributes.insert({
      project_id: projectId,
      attribute_id: attribute.id,
      status,
      payload: {
        id: attribute.id,
        name: attribute.name,
        type: attribute.type ?? "text",
        description: attribute.description ?? "",
        status,
        multipleChoice: attribute.multiple_choice ?? false,
        possibleValues: structuredClone(attribute.possible_values ?? [])
      }
    });
  }
  for (const rfi of config.rfis ?? []) {
    const projectId = seedProjectId(aps, rfi.project_id);
    if (resourceExists(aps.rfis.all(), projectId, (candidate) => candidate.rfi_id, rfi.id)) continue;
    if (!aps.rfiTypes.findBy("project_id", projectId).some((candidate) => candidate.rfi_type_id === rfi.rfi_type_id)) {
      throw new Error(`APS RFI '${rfi.id}' references unknown RFI type '${rfi.rfi_type_id}'.`);
    }
    const assignedTo = actors(aps, rfi.assigned_to);
    const status = rfi.status ?? "draft";
    const createdBy = userId(aps, rfi.created_by);
    const updatedBy = userId(aps, rfi.updated_by ?? rfi.created_by);
    const createdAt = rfi.created_at ?? now;
    const updatedAt = rfi.updated_at ?? createdAt;
    const reference = rfi.reference ?? rfi.custom_identifier;
    const priority = rfi.priority ?? "Normal";
    aps.rfis.insert({
      project_id: projectId,
      rfi_id: rfi.id,
      rfi_type_id: rfi.rfi_type_id,
      custom_identifier: rfi.custom_identifier,
      title: rfi.title,
      status,
      assigned_to: assignedTo.map((actor) => actor.id),
      reference,
      priority,
      payload: {
        id: rfi.id,
        customIdentifier: rfi.custom_identifier,
        title: rfi.title,
        question: rfi.question ?? "",
        virtualFolderUrn: `urn:adsk.wip:fs.folder:co.${Buffer.from(rfi.id).toString("base64url")}`,
        status,
        previousStatus: rfi.previous_status ?? null,
        workflowType: rfi.workflow_type ?? "US",
        assignedTo,
        managerId: userId(aps, rfi.manager_id),
        constructionManagerId: null,
        architects: [],
        reviewers: [],
        dueDate: rfi.due_date ?? null,
        locationDescription: rfi.location_description ?? "",
        locations: structuredClone(rfi.locations ?? []),
        commentsCount: 0,
        officialResponse: rfi.official_response ?? null,
        officialResponseStatus: rfi.official_response_status ?? "unanswered",
        officialResponseActors: [],
        officialResponseEditByManagerState: false,
        respondedAt: null,
        respondedBy: null,
        createdBy,
        createdAt,
        updatedBy,
        updatedAt,
        closedAt: status === "closed" ? updatedAt : null,
        closedBy: status === "closed" ? updatedBy : null,
        containerId: bareProjectId(projectId),
        projectId: bareProjectId(projectId),
        suggestedAnswer: null,
        coReviewers: [],
        watchers: [],
        answeredAt: null,
        answeredBy: null,
        costImpact: "Unknown",
        scheduleImpact: "Unknown",
        priority,
        discipline: structuredClone(rfi.discipline ?? []),
        category: structuredClone(rfi.category ?? []),
        reference,
        customAttributes: [],
        rfiTypeId: rfi.rfi_type_id,
        bridgedSource: null,
        bridgedTarget: null,
        bridgeSyncOutdated: false,
        syncVersion: null,
        responses: [],
        draftResponses: []
      }
    });
  }
  for (const collection of config.sheet_collections ?? []) {
    const projectId = seedProjectId(aps, collection.project_id);
    if (resourceExists(aps.sheetCollections.all(), projectId, (candidate) => candidate.collection_id, collection.id)) {
      continue;
    }
    const createdAt = collection.created_at ?? now;
    aps.sheetCollections.insert({
      project_id: projectId,
      collection_id: collection.id,
      payload: {
        id: collection.id,
        name: collection.name,
        createdAt,
        createdBy: userId(aps, collection.created_by),
        createdByName: collection.created_by_name ?? "",
        updatedAt: collection.updated_at ?? createdAt,
        updatedBy: userId(aps, collection.updated_by ?? collection.created_by),
        updatedByName: collection.updated_by_name ?? collection.created_by_name ?? ""
      }
    });
  }
  for (const versionSet of config.sheet_version_sets ?? []) {
    const projectId = seedProjectId(aps, versionSet.project_id);
    if (resourceExists(aps.sheetVersionSets.all(), projectId, (candidate) => candidate.version_set_id, versionSet.id)) {
      continue;
    }
    const collection = versionSet.collection_id ? aps.sheetCollections.findBy("project_id", projectId).find((candidate) => candidate.collection_id === versionSet.collection_id) : void 0;
    if (versionSet.collection_id && !collection) {
      throw new Error(`APS Sheet version set '${versionSet.id}' references unknown collection.`);
    }
    const createdAt = versionSet.created_at ?? now;
    aps.sheetVersionSets.insert({
      project_id: projectId,
      version_set_id: versionSet.id,
      collection_id: versionSet.collection_id ?? null,
      issuance_date: versionSet.issuance_date,
      payload: {
        id: versionSet.id,
        name: versionSet.name,
        issuanceDate: versionSet.issuance_date,
        createdAt,
        createdBy: userId(aps, versionSet.created_by),
        createdByName: versionSet.created_by_name ?? "",
        updatedAt: versionSet.updated_at ?? createdAt,
        updatedBy: userId(aps, versionSet.updated_by ?? versionSet.created_by),
        updatedByName: versionSet.updated_by_name ?? versionSet.created_by_name ?? "",
        collection: collection ? { id: collection.collection_id, name: collection.payload.name } : null
      }
    });
  }
  for (const sheet of config.sheets ?? []) {
    const projectId = seedProjectId(aps, sheet.project_id);
    if (resourceExists(aps.sheets.all(), projectId, (candidate) => candidate.sheet_id, sheet.id)) continue;
    const versionSet = aps.sheetVersionSets.findBy("project_id", projectId).find((candidate) => candidate.version_set_id === sheet.version_set_id);
    if (!versionSet) {
      throw new Error(`APS Sheet '${sheet.id}' references unknown version set '${sheet.version_set_id}'.`);
    }
    const collectionId = sheet.collection_id ?? versionSet.collection_id;
    const collection = collectionId ? aps.sheetCollections.findBy("project_id", projectId).find((candidate) => candidate.collection_id === collectionId) : void 0;
    if (collectionId && !collection) {
      throw new Error(`APS Sheet '${sheet.id}' references unknown collection '${collectionId}'.`);
    }
    const createdAt = sheet.created_at ?? now;
    const deleted = sheet.deleted ?? false;
    aps.sheets.insert({
      project_id: projectId,
      sheet_id: sheet.id,
      version_set_id: sheet.version_set_id,
      collection_id: collectionId ?? null,
      number: sheet.number,
      title: sheet.title,
      tags: structuredClone(sheet.tags ?? []),
      is_current: sheet.is_current ?? true,
      deleted,
      upload_file_name: sheet.upload_file_name ?? "",
      viewable_urn: sheet.viewable_urn ?? "",
      viewable_guid: sheet.viewable_guid ?? "",
      payload: {
        id: sheet.id,
        number: sheet.number,
        versionSet: {
          id: versionSet.version_set_id,
          name: versionSet.payload.name,
          issuanceDate: versionSet.issuance_date,
          deleted: false
        },
        createdAt,
        createdBy: userId(aps, sheet.created_by),
        createdByName: sheet.created_by_name ?? "",
        updatedAt: sheet.updated_at ?? createdAt,
        updatedBy: userId(aps, sheet.updated_by ?? sheet.created_by),
        updatedByName: sheet.updated_by_name ?? sheet.created_by_name ?? "",
        title: sheet.title,
        uploadFileName: sheet.upload_file_name ?? "",
        uploadId: sheet.upload_id ?? "",
        tags: structuredClone(sheet.tags ?? []),
        paperSize: structuredClone(sheet.paper_size ?? [0, 0]),
        isCurrent: sheet.is_current ?? true,
        deleted,
        deletedAt: null,
        deletedBy: null,
        deletedByName: null,
        viewable: {
          urn: sheet.viewable_urn ?? "",
          guid: sheet.viewable_guid ?? ""
        },
        collection: collection ? { id: collection.collection_id, name: collection.payload.name } : null
      }
    });
  }
}

// src/index.ts
function seedDefaults(store, baseUrl) {
  const aps = getApsStore(store);
  if (!aps.clients.findOneBy("client_id", DEFAULT_CONFIDENTIAL_CLIENT_ID)) {
    aps.clients.insert(createDefaultConfidentialClient());
  }
  if (!aps.clients.findOneBy("client_id", DEFAULT_PUBLIC_CLIENT_ID)) {
    aps.clients.insert(createDefaultPublicClient());
  }
  if (!aps.users.findOneBy("email", DEFAULT_USER_EMAIL)) {
    aps.users.insert(createDefaultUser());
  }
  seedFromConfig(store, baseUrl, DEFAULT_DATA_SEED);
}
function seedFromConfig(store, _baseUrl, config) {
  const aps = getApsStore(store);
  if (config.clients) {
    for (const client of config.clients) {
      const existing = aps.clients.findOneBy("client_id", client.client_id);
      if (existing) continue;
      const type = normalizeClientType(client.type, client.client_secret ? "confidential" : "public");
      aps.clients.insert({
        client_id: client.client_id,
        client_secret: client.client_secret ?? "",
        name: client.name ?? client.client_id,
        type,
        redirect_uris: client.redirect_uris
      });
    }
  }
  if (config.users) {
    for (const user of config.users) {
      const byEmail = aps.users.findOneBy("email", user.email);
      if (byEmail) continue;
      const name = user.name ?? "Test User";
      const { first_name, last_name } = splitName(name, user.email);
      aps.users.insert({
        user_id: user.user_id ?? generateUserId(),
        email: user.email,
        name,
        first_name,
        last_name,
        picture: user.picture ?? null
      });
    }
  }
  if (config.hubs) {
    for (const hub of config.hubs) {
      if (aps.hubs.findOneBy("hub_id", hub.id)) continue;
      aps.hubs.insert({
        hub_id: hub.id,
        name: hub.name,
        region: hub.region ?? "US"
      });
    }
  }
  if (config.projects) {
    for (const project of config.projects) {
      if (aps.projects.findOneBy("project_id", project.id)) continue;
      if (!aps.hubs.findOneBy("hub_id", project.hub_id)) {
        throw new Error(`APS project '${project.id}' references unknown hub '${project.hub_id}'.`);
      }
      aps.projects.insert({
        project_id: project.id,
        hub_id: project.hub_id,
        name: project.name
      });
    }
  }
  seedAccFromConfig(aps, config);
  if (config.manifests) {
    for (const [urn, manifest] of Object.entries(config.manifests)) {
      if (aps.manifests.findOneBy("urn", urn)) continue;
      aps.manifests.insert({
        urn,
        type: manifest.type ?? "manifest",
        hasThumbnail: manifest.hasThumbnail ?? "false",
        status: manifest.status ?? "success",
        progress: manifest.progress ?? "complete",
        region: manifest.region ?? "US",
        version: manifest.version ?? "1.0",
        derivatives: structuredClone(manifest.derivatives ?? [])
      });
    }
  }
  if (config.webhook_timing) setWebhookTiming(store, config.webhook_timing);
  if (config.upload) setUploadConfig(store, config.upload);
  if (config.translation) setTranslationConfig(store, config.translation);
  seedDocumentTreeFromConfig(aps, config);
  seedModelCoordinationFromConfig(aps, store, config);
  for (const hook of config.webhooks ?? []) {
    const user = hook.creator_user_email ? aps.users.findOneBy("email", hook.creator_user_email) : void 0;
    const clientId = hook.creator_client_id ?? DEFAULT_CONFIDENTIAL_CLIENT_ID;
    if (hook.creator_user_email && !user) {
      throw new Error(`APS webhook references unknown user '${hook.creator_user_email}'.`);
    }
    if (!user && !aps.clients.findOneBy("client_id", clientId)) {
      throw new Error(`APS webhook references unknown client '${clientId}'.`);
    }
    const input = {
      system: hook.system,
      event: hook.event,
      callbackUrl: hook.callback_url,
      scope: hook.scope,
      tenant: hook.tenant,
      identity: user ? userIdentity(user.user_id) : appIdentity(clientId),
      region: (hook.region ?? "US").toUpperCase(),
      status: hook.status,
      autoReactivateHook: hook.auto_reactivate_hook,
      hookExpiry: hook.hook_expiry,
      hookAttribute: hook.hook_attribute,
      filter: hook.filter,
      token: hook.token,
      hubId: hook.hub_id,
      projectId: hook.project_id
    };
    if (findDuplicateHook(aps, input)) continue;
    createWebhookRecord(aps, input);
  }
}
var apsPlugin = {
  name: "aps",
  register(app, store, webhooks, baseUrl, tokenMap) {
    const ctx = { app, store, webhooks, baseUrl, tokenMap };
    oauthRoutes(ctx);
    dataManagementRoutes(ctx);
    ingestionRoutes(ctx);
    modelDerivativeRoutes(ctx);
    modelSetRoutes(ctx);
    clashRoutes(ctx);
    issueRoutes(ctx);
    rfiRoutes(ctx);
    sheetRoutes(ctx);
    webhookRoutes(ctx);
    signedBlobRoutes(ctx);
    simulateRoutes(ctx);
  },
  seed(store, baseUrl) {
    seedDefaults(store, baseUrl);
  }
};
var index_default = apsPlugin;
export {
  DEFAULT_DATA_SEED,
  DEFAULT_MODEL_COORDINATION_TIMING,
  DEFAULT_TRANSLATION_CONFIG,
  DEFAULT_UPLOAD_CONFIG,
  DEFAULT_WEBHOOK_TIMING,
  apsPlugin,
  index_default as default,
  getApsStore,
  getModelCoordinationTiming,
  getTranslationConfig,
  getUploadConfig,
  getWebhookTiming,
  seedFromConfig,
  setModelCoordinationTiming,
  setTranslationConfig,
  setUploadConfig,
  setWebhookTiming,
  simulateWebhookEvent,
  webhookDetails
};
//# sourceMappingURL=index.js.map
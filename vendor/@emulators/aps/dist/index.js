// src/helpers.ts
import { createHash, randomBytes } from "crypto";
var DEFAULT_CONFIDENTIAL_CLIENT_ID = "aps-test-client";
var DEFAULT_CONFIDENTIAL_CLIENT_SECRET = "aps-test-secret";
var DEFAULT_PUBLIC_CLIENT_ID = "aps-test-app";
var DEFAULT_USER_EMAIL = "testuser@autodesk.local";
var DEFAULT_HUB_ID = "b.emulate-hub";
var DEFAULT_PROJECT_ID = "b.emulate-project";
var DEFAULT_MANIFEST_URN = "dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6ZW11bGF0ZS1idWNrZXQvc2FtcGxlLnJ2dA";
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
var DEFAULT_DERIVATIVE_BASE = `urn:adsk.viewing:fs.file:${DEFAULT_MANIFEST_URN}/output`;
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
    }
  }
};

// src/routes/data-management.ts
import { randomUUID } from "crypto";

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
function storedAccessToken(c, store) {
  const token = c.get("authToken");
  return token ? getAccessTokens(store).get(token) ?? null : null;
}
function apsAuth(store, options) {
  return async (c, next) => {
    const token = bearerToken(c);
    const record = token ? await findActiveAccessToken(store, token) : null;
    if (!token || !record) return invalidToken(c);
    const grantedScopes = record.scope.split(/\s+/).filter(Boolean);
    if (options.scopes.some((scope) => !grantedScopes.includes(scope))) {
      return insufficientPrivilege(c);
    }
    if (options.requireUser && !record.apsUserId) {
      return insufficientPrivilege(c);
    }
    c.set("authToken", token);
    c.set("authScopes", grantedScopes);
    await next();
  };
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
    sheets: store.collection("aps.sheets", ["project_id", "sheet_id"])
  };
}

// src/routes/data-management.ts
function hubPath(hubId) {
  return `/project/v1/hubs/${encodeURIComponent(hubId)}`;
}
function projectPath(hubId, projectId) {
  return `${hubPath(hubId)}/projects/${encodeURIComponent(projectId)}`;
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
        schema: {
          href: "https://developer.api.autodesk.com/schema/v1/versions/hubs%3Aautodesk.bim360%3AAccount-1.0"
        },
        data: {}
      },
      region: hub.region
    },
    links: { self: { href: `${baseUrl}${path}` } },
    relationships: {
      projects: { links: { related: { href: `${baseUrl}${path}/projects` } } }
    }
  };
}
function projectData(baseUrl, project) {
  const path = projectPath(project.hub_id, project.project_id);
  const hub = hubPath(project.hub_id);
  const rootFolderId = `urn:adsk.wipprod:fs.folder:co.${Buffer.from(project.project_id).toString("base64url")}`;
  return {
    type: "projects",
    id: project.project_id,
    attributes: {
      name: project.name,
      scopes: ["global"],
      extension: {
        type: "projects:autodesk.bim360:Project",
        version: "1.0",
        schema: {
          href: "https://developer.api.autodesk.com/schema/v1/versions/projects%3Aautodesk.bim360%3AProject-1.0"
        },
        data: { projectType: "ACC" }
      }
    },
    links: { self: { href: `${baseUrl}${path}` } },
    relationships: {
      hub: {
        data: { type: "hubs", id: project.hub_id },
        links: { related: { href: `${baseUrl}${hub}` } }
      },
      rootFolder: {
        data: { type: "folders", id: rootFolderId },
        meta: {
          link: {
            href: `${baseUrl}/data/v1/projects/${encodeURIComponent(project.project_id)}/folders/${encodeURIComponent(rootFolderId)}`
          }
        }
      },
      topFolders: { links: { related: { href: `${baseUrl}${path}/topFolders` } } }
    }
  };
}
function jsonApiDocument(c, baseUrl, path, data) {
  c.header("Content-Type", "application/vnd.api+json");
  return c.json({
    jsonapi: { version: "1.0" },
    links: { self: { href: `${baseUrl}${path}` } },
    data
  });
}
function notFound(c, detail) {
  c.header("Content-Type", "application/vnd.api+json");
  return c.json(
    {
      jsonapi: { version: "1.0" },
      errors: [{ id: randomUUID(), status: "404", code: "NOT_FOUND", detail }]
    },
    404
  );
}
function dataManagementRoutes({ app, store, baseUrl }) {
  const aps = getApsStore(store);
  app.use("/project/v1/*", apsAuth(store, { scopes: ["data:read"], requireUser: true }));
  app.get("/project/v1/hubs", (c) => {
    const path = "/project/v1/hubs";
    return jsonApiDocument(
      c,
      baseUrl,
      path,
      aps.hubs.all().map((hub) => hubData(baseUrl, hub))
    );
  });
  app.get("/project/v1/hubs/:hubId", (c) => {
    const hub = aps.hubs.findOneBy("hub_id", c.req.param("hubId"));
    if (!hub) return notFound(c, `The hub ${c.req.param("hubId")} was not found.`);
    const path = hubPath(hub.hub_id);
    return jsonApiDocument(c, baseUrl, path, hubData(baseUrl, hub));
  });
  app.get("/project/v1/hubs/:hubId/projects", (c) => {
    const hubId = c.req.param("hubId");
    if (!aps.hubs.findOneBy("hub_id", hubId)) return notFound(c, `The hub ${hubId} was not found.`);
    const path = `${hubPath(hubId)}/projects`;
    return jsonApiDocument(
      c,
      baseUrl,
      path,
      aps.projects.findBy("hub_id", hubId).map((project) => projectData(baseUrl, project))
    );
  });
  app.get("/project/v1/hubs/:hubId/projects/:projectId", (c) => {
    const hubId = c.req.param("hubId");
    if (!aps.hubs.findOneBy("hub_id", hubId)) return notFound(c, `The hub ${hubId} was not found.`);
    const project = aps.projects.findOneBy("project_id", c.req.param("projectId"));
    if (!project || project.hub_id !== hubId) {
      return notFound(c, `The project ${c.req.param("projectId")} was not found in hub ${hubId}.`);
    }
    const path = projectPath(hubId, project.project_id);
    return jsonApiDocument(c, baseUrl, path, projectData(baseUrl, project));
  });
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
function findProjectResource(collection, projectId, idField, id) {
  return collection.findBy("project_id", projectId).find((item) => item[idField] === id);
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
function pageItems(items, pagination) {
  return items.slice(pagination.offset, pagination.offset + pagination.limit);
}
function offsetEnvelope(items, pagination, totalResults) {
  return {
    pagination: { ...pagination, totalResults },
    results: items
  };
}
function pageUrl(requestUrl, pagination, offset) {
  const url = new URL(requestUrl);
  url.searchParams.set("limit", String(pagination.limit));
  url.searchParams.set("offset", String(offset));
  return url.toString();
}
function sheetsEnvelope(items, pagination, totalResults, requestUrl) {
  const previousOffset = Math.max(0, pagination.offset - pagination.limit);
  const nextOffset = pagination.offset + pagination.limit;
  return {
    results: items,
    pagination: {
      ...pagination,
      previousUrl: pagination.offset > 0 ? pageUrl(requestUrl, pagination, previousOffset) : "",
      nextUrl: nextOffset < totalResults ? pageUrl(requestUrl, pagination, nextOffset) : "",
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
function resolveAccUser(c, store, aps) {
  const requestedUserId = storedAccessToken(c, store)?.apsUserId ?? c.req.header("x-user-id");
  if (!requestedUserId) return { kind: "app" };
  const user = aps.users.findOneBy("user_id", requestedUserId);
  return user ? { kind: "user", user } : { kind: "unknown-user" };
}
function accProjectUser(aps, projectId, userId2) {
  return findProjectResource(aps.accProjectUsers, projectId, "user_id", userId2) ?? null;
}
function accMemberContext(c, store, aps, options) {
  const projectResult = projectForAccId(aps, c.req.param("projectId"), options.idRule);
  if (projectResult.kind === "invalid") return options.error(c, "invalid-project-id");
  if (projectResult.kind === "missing") return options.error(c, "project-not-found");
  const resolution = resolveAccUser(c, store, aps);
  if (resolution.kind !== "user") return options.error(c, "user-required");
  const member = accProjectUser(aps, projectResult.project.project_id, resolution.user.user_id);
  if (!member) return options.error(c, "not-a-member");
  return { project: projectResult.project, user: resolution.user, member };
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
function issuesError(c, status, title, detail) {
  return c.json({ title, detail }, status);
}
function issuesRequestError(c, kind) {
  switch (kind) {
    case "invalid-project-id":
      return issuesError(c, 400, "Bad Request", "Issues project IDs must not include the 'b.' prefix.");
    case "project-not-found":
      return issuesError(c, 404, "Not Found", "The requested project was not found.");
    case "user-required":
      return issuesError(c, 403, "Forbidden", "User context is required.");
    case "not-a-member":
      return issuesError(c, 403, "Forbidden", "The user is not a member of this project.");
  }
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
    ...issuePermissions(member, issue.payload.status)
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
  return issues.filter(({ payload }) => {
    if (!matchesAny(payload.id, ids)) return false;
    if (!matchesAny(payload.issueTypeId, typeIds)) return false;
    if (!matchesAny(payload.issueSubtypeId, subtypeIds)) return false;
    if (!matchesAny(payload.status, statuses)) return false;
    if (!matchesAny(payload.assignedTo, assignees)) return false;
    if (displayIds.length > 0 && !displayIds.includes(String(payload.displayId))) return false;
    if (deletedFilter === "true" && !payload.deleted) return false;
    if ((deletedFilter === void 0 || deletedFilter === "false") && payload.deleted) return false;
    if (search && !payload.title.toLocaleLowerCase().includes(search) && !String(payload.displayId).includes(search)) {
      return false;
    }
    return true;
  });
}
function sortIssues(issues, sortBy) {
  const requestedSort = commaSeparated(sortBy)[0];
  if (!requestedSort) return issues;
  const descending = requestedSort.startsWith("-");
  const field = descending ? requestedSort.slice(1) : requestedSort;
  const valueFor = (issue) => {
    if (field === "displayId") return issue.payload.displayId;
    return String(issue.payload[field] ?? "");
  };
  return [...issues].sort((left, right) => {
    const a = valueFor(left);
    const b = valueFor(right);
    const result = typeof a === "number" && typeof b === "number" ? a - b : String(a).localeCompare(String(b));
    return descending ? -result : result;
  });
}
function issueRoutes(route) {
  const { app, store } = route;
  const aps = getApsStore(store);
  const requestContext = (c) => accMemberContext(c, store, aps, { idRule: "bare", error: issuesRequestError });
  app.use("/construction/issues/v1/*", apsAuth(store, { scopes: ["data:read"], requireUser: true }));
  app.get("/construction/issues/v1/projects/:projectId/users/me", (c) => {
    const context = requestContext(c);
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
          // Both casings are emitted deliberately until the shape is verified
          // against the live Issues API; clients have been seen reading either.
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
  app.get("/construction/issues/v1/projects/:projectId/issue-types", (c) => {
    const context = requestContext(c);
    if (context instanceof Response) return context;
    const pagination = queryPagination(c, { defaultLimit: 200, maxLimit: 200 });
    if (!pagination.ok) return issuesError(c, 400, "Bad Request", pagination.message);
    const isActive = c.req.query("filter[isActive]");
    const includeSubtypes = commaSeparated(c.req.query("include")).includes("subtypes");
    const resources = aps.issueTypes.findBy("project_id", context.project.project_id).filter((issueType) => isActive === void 0 || issueType.payload.isActive === (isActive === "true"));
    const results = pageItems(resources, pagination.value).map((issueType) => {
      const { subtypes, ...summary } = structuredClone(issueType.payload);
      return includeSubtypes ? { ...summary, subtypes } : summary;
    });
    return c.json(offsetEnvelope(results, pagination.value, resources.length));
  });
  app.get("/construction/issues/v1/projects/:projectId/issues", (c) => {
    const context = requestContext(c);
    if (context instanceof Response) return context;
    const pagination = queryPagination(c, { defaultLimit: 100, maxLimit: 100 });
    if (!pagination.ok) return issuesError(c, 400, "Bad Request", pagination.message);
    const filtered = sortIssues(
      filterIssues(c, aps.issues.findBy("project_id", context.project.project_id)),
      c.req.query("sortBy")
    );
    const results = pageItems(filtered, pagination.value).map((issue) => issuePayload(issue, context.member));
    return c.json(offsetEnvelope(results, pagination.value, filtered.length));
  });
  app.get("/construction/issues/v1/projects/:projectId/issues/:issueId", (c) => {
    const context = requestContext(c);
    if (context instanceof Response) return context;
    const issue = findProjectResource(aps.issues, context.project.project_id, "issue_id", c.req.param("issueId"));
    if (!issue) return issuesError(c, 404, "Not Found", "The requested issue was not found.");
    return c.json(issuePayload(issue, context.member));
  });
}

// src/routes/model-derivative.ts
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
function modelDerivativeRoutes({ app, store }) {
  const aps = getApsStore(store);
  app.use("/modelderivative/v2/*", apsAuth(store, { scopes: ["data:read"] }));
  app.get("/modelderivative/v2/designdata/formats", (c) => c.json(SUPPORTED_FORMATS));
  app.get("/modelderivative/v2/designdata/:urn/manifest", (c) => {
    const manifest = aps.manifests.findOneBy("urn", c.req.param("urn"));
    if (!manifest) return c.body(null, 404);
    return c.json({
      type: manifest.type,
      hasThumbnail: manifest.hasThumbnail,
      status: manifest.status,
      progress: manifest.progress,
      region: manifest.region,
      urn: manifest.urn,
      version: manifest.version,
      derivatives: manifest.derivatives
    });
  });
}

// src/routes/oauth.ts
import { createHash as createHash2, randomBytes as randomBytes2 } from "crypto";
import { SignJWT, exportJWK } from "jose";

// ../core/dist/index.js
import { jwtVerify as jwtVerify2 } from "jose";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { timingSafeEqual } from "crypto";
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
  return timingSafeEqual(bufA, bufB);
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
        const expected = createHash2("sha256").update(codeVerifier).digest("base64url");
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
      const familyId = randomBytes2(16).toString("hex");
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
function rfiError(c, status, code, message) {
  return c.json({ error: { code, message } }, status);
}
function rfiRequestError(c, kind) {
  switch (kind) {
    case "invalid-project-id":
      return rfiError(c, 400, "BAD_INPUT", "RFI project IDs must not include the 'b.' prefix.");
    case "project-not-found":
      return rfiError(c, 404, "NOT_FOUND", "The requested project was not found.");
    case "user-required":
      return rfiError(c, 403, "FORBIDDEN", "User context is required.");
    case "not-a-member":
      return rfiError(c, 403, "FORBIDDEN", "The user is not a member of this project.");
  }
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
function workflowStatuses(statuses, userId2) {
  const transitions = statuses.map((value) => transition(value, userId2));
  return { wfUS: transitions, wfEU: transitions };
}
function permittedActions(member, userId2, status) {
  const manageable = canManageRfis(member);
  const statuses = manageable ? ["draft", "submitted", "open", "answered", "closed"] : [status];
  return {
    share: manageable,
    nudge: manageable,
    updateRfi: {
      permittedStatuses: workflowStatuses(statuses, userId2),
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
  const { responses, draftResponses, ...summary } = structuredClone(rfi.payload);
  const common = { ...summary, permittedActions: permittedActions(member, userId2, rfi.payload.status) };
  return includeDetail ? { ...common, responses, draftResponses, maxAssignees: 10 } : common;
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
  let results = rfis.filter(({ payload }) => {
    if (ids.length > 0 && !ids.includes(payload.id)) return false;
    if (statuses.length > 0 && !statuses.includes(payload.status)) return false;
    if (rfiTypeIds.length > 0 && !rfiTypeIds.includes(payload.rfiTypeId)) return false;
    if (references.length > 0 && !references.includes(payload.reference)) return false;
    if (priorities.length > 0 && !priorities.includes(payload.priority)) return false;
    if (assignees.length > 0 && !payload.assignedTo.some((actor) => assignees.includes(actor.id))) return false;
    if (search) {
      if (!payload.title.toLocaleLowerCase().includes(search) && !payload.customIdentifier.toLocaleLowerCase().includes(search) && !payload.question.toLocaleLowerCase().includes(search)) {
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
  const sorted = [...rfis].sort(
    (left, right) => left.payload.customIdentifier.localeCompare(right.payload.customIdentifier, void 0, { numeric: true })
  );
  const current = sorted.at(-1)?.payload.customIdentifier ?? "0";
  const match = current.match(/^(.*?)(\d+)$/);
  if (!match) return { current, next: `${current}-1` };
  const prefix = match[1];
  const numeric = match[2];
  return { current, next: `${prefix}${String(Number(numeric) + 1).padStart(numeric.length, "0")}` };
}
function rfiRoutes(route) {
  const { app, store } = route;
  const aps = getApsStore(store);
  const requestContext = (c) => accMemberContext(c, store, aps, { idRule: "bare", error: rfiRequestError });
  app.use("/construction/rfis/v3/*", apsAuth(store, { scopes: ["data:read"], requireUser: true }));
  app.get("/construction/rfis/v3/projects/:projectId/users/me", (c) => {
    const context = requestContext(c);
    if (context instanceof Response) return context;
    const defaultType = aps.rfiTypes.findBy("project_id", context.project.project_id).find((candidate) => candidate.payload.isDefault);
    const createStatuses = canManageRfis(context.member) ? ["draft", "open"] : [];
    return c.json({
      user: {
        id: context.user.user_id,
        name: context.user.name,
        role: context.member.role
      },
      permittedActions: {
        createRfi: {
          permittedStatuses: workflowStatuses(createStatuses, context.user.user_id)
        }
      },
      workflow: { roles: context.member.rfi_roles, type: "US" },
      defaultRfiType: defaultType?.rfi_type_id ?? null,
      externalUsers: [],
      maintenanceEndDate: null
    });
  });
  app.get("/construction/rfis/v3/projects/:projectId/workflow", (c) => {
    const context = requestContext(c);
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
  app.get("/construction/rfis/v3/projects/:projectId/rfi-types", (c) => {
    const context = requestContext(c);
    if (context instanceof Response) return context;
    const pagination = queryPagination(c, { defaultLimit: 100, maxLimit: 200 });
    if (!pagination.ok) return rfiError(c, 400, "BAD_INPUT", pagination.message);
    const status = c.req.query("filter[status]");
    const resources = aps.rfiTypes.findBy("project_id", context.project.project_id).filter((candidate) => !status || candidate.payload.status === status);
    const results = pageItems(resources, pagination.value).map((candidate) => structuredClone(candidate.payload));
    return c.json(offsetEnvelope(results, pagination.value, resources.length));
  });
  app.get("/construction/rfis/v3/projects/:projectId/attributes", (c) => {
    const context = requestContext(c);
    if (context instanceof Response) return context;
    const pagination = queryPagination(c, { defaultLimit: 100, maxLimit: 200 });
    if (!pagination.ok) return rfiError(c, 400, "BAD_INPUT", pagination.message);
    const status = c.req.query("filter[status]");
    const resources = aps.rfiAttributes.findBy("project_id", context.project.project_id).filter((candidate) => !status || candidate.payload.status === status);
    const results = pageItems(resources, pagination.value).map((candidate) => structuredClone(candidate.payload));
    return c.json(offsetEnvelope(results, pagination.value, resources.length));
  });
  app.get("/construction/rfis/v3/projects/:projectId/rfis/custom-identifier", (c) => {
    const context = requestContext(c);
    if (context instanceof Response) return context;
    return c.json(nextCustomIdentifier(aps.rfis.findBy("project_id", context.project.project_id)));
  });
  app.post("/construction/rfis/v3/projects/:projectId/search:rfis", async (c) => {
    const context = requestContext(c);
    if (context instanceof Response) return context;
    const body = await readJsonObject(c);
    if (!body.ok) return rfiError(c, 400, "BAD_INPUT", body.message);
    const pagination = parseOffsetPagination(
      body.value.limit ?? c.req.query("limit"),
      body.value.offset ?? c.req.query("offset"),
      {
        defaultLimit: 100,
        maxLimit: 200
      }
    );
    if (!pagination.ok) return rfiError(c, 400, "BAD_INPUT", pagination.message);
    const filtered = filterRfis(aps.rfis.findBy("project_id", context.project.project_id), body.value);
    const results = pageItems(filtered, pagination.value).map(
      (rfi) => rfiPayload(rfi, context.member, context.user.user_id, false)
    );
    return c.json(offsetEnvelope(results, pagination.value, filtered.length));
  });
  app.get("/construction/rfis/v3/projects/:projectId/rfis/:rfiId", (c) => {
    const context = requestContext(c);
    if (context instanceof Response) return context;
    const rfi = findProjectResource(aps.rfis, context.project.project_id, "rfi_id", c.req.param("rfiId"));
    if (!rfi) return rfiError(c, 404, "NOT_FOUND", "The requested RFI was not found.");
    return c.json(rfiPayload(rfi, context.member, context.user.user_id, true));
  });
}

// src/routes/sheets.ts
function sheetsError(c, status, errorCode, message) {
  return c.json({ errorCode, message }, status);
}
function filterSheets(c, sheets) {
  const versionSetIds = commaSeparated(c.req.query("filter[versionSetId]"));
  const tags = commaSeparated(c.req.query("filter[tags]"));
  const searchTerms = commaSeparated(c.req.query("searchText")).map((value) => value.toLocaleLowerCase());
  const collectionId = c.req.query("collectionId");
  const currentOnly = c.req.query("currentOnly") === "true";
  const isDeleted = c.req.query("isDeleted");
  return sheets.filter(({ payload }) => {
    if (versionSetIds.length > 0 && !versionSetIds.includes(payload.versionSet.id)) return false;
    if (tags.length > 0 && !tags.some((tag) => payload.tags.includes(tag))) return false;
    if (currentOnly && !payload.isCurrent) return false;
    if (isDeleted === "true" && !payload.deleted) return false;
    if ((isDeleted === void 0 || isDeleted === "false") && payload.deleted) return false;
    if (collectionId && collectionId !== "*" && payload.collection?.id !== collectionId) return false;
    if (searchTerms.length > 0 && !searchTerms.some(
      (term) => payload.title.toLocaleLowerCase().includes(term) || payload.number.toLocaleLowerCase().includes(term)
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
  function requestContext(c) {
    const projectResult = projectForAccId(aps, c.req.param("projectId"), "bare-or-prefixed");
    if (projectResult.kind !== "found") {
      return sheetsError(c, 404, "ERR_RESOURCE_NOT_EXIST", "The requested project was not found.");
    }
    const resolution = resolveAccUser(c, store, aps);
    if (resolution.kind === "unknown-user") {
      return sheetsError(c, 403, "ERR_NOT_ALLOWED", "The x-user-id does not identify a seeded user.");
    }
    if (resolution.kind === "user" && !accProjectUser(aps, projectResult.project.project_id, resolution.user.user_id)) {
      return sheetsError(c, 403, "ERR_NOT_ALLOWED", "The user is not a member of this project.");
    }
    return { project: projectResult.project };
  }
  app.get("/construction/sheets/v1/projects/:projectId/sheets", (c) => {
    const context = requestContext(c);
    if (context instanceof Response) return context;
    const pagination = queryPagination(c, { defaultLimit: 100, maxLimit: 200 });
    if (!pagination.ok) return sheetsError(c, 400, "ERR_BAD_INPUT", pagination.message);
    const filtered = filterSheets(c, aps.sheets.findBy("project_id", context.project.project_id));
    const results = pageItems(filtered, pagination.value).map((sheet) => structuredClone(sheet.payload));
    return c.json(sheetsEnvelope(results, pagination.value, filtered.length, c.req.url));
  });
  app.post("/construction/sheets/v1/projects/:projectId/sheets:batch-get", async (c) => {
    const context = requestContext(c);
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
  app.get("/construction/sheets/v1/projects/:projectId/version-sets", (c) => {
    const context = requestContext(c);
    if (context instanceof Response) return context;
    const pagination = queryPagination(c, { defaultLimit: 100, maxLimit: 200 });
    if (!pagination.ok) return sheetsError(c, 400, "ERR_BAD_INPUT", pagination.message);
    const collectionId = c.req.query("collectionId");
    const resources = aps.sheetVersionSets.findBy("project_id", context.project.project_id).filter(
      (versionSet) => !collectionId || collectionId === "*" || versionSet.payload.collection?.id === collectionId
    );
    const results = pageItems(resources, pagination.value).map((versionSet) => structuredClone(versionSet.payload));
    return c.json(sheetsEnvelope(results, pagination.value, resources.length, c.req.url));
  });
  app.get("/construction/sheets/v1/projects/:projectId/collections", (c) => {
    const context = requestContext(c);
    if (context instanceof Response) return context;
    const pagination = queryPagination(c, { defaultLimit: 100, maxLimit: 200 });
    if (!pagination.ok) return sheetsError(c, 400, "ERR_BAD_INPUT", pagination.message);
    const resources = aps.sheetCollections.findBy("project_id", context.project.project_id);
    const results = pageItems(resources, pagination.value).map((collection) => structuredClone(collection.payload));
    return c.json(sheetsEnvelope(results, pagination.value, resources.length, c.req.url));
  });
  app.get("/construction/sheets/v1/projects/:projectId/collections/:collectionId", (c) => {
    const context = requestContext(c);
    if (context instanceof Response) return context;
    const collection = findProjectResource(
      aps.sheetCollections,
      context.project.project_id,
      "collection_id",
      c.req.param("collectionId")
    );
    if (!collection) {
      return sheetsError(c, 404, "ERR_RESOURCE_NOT_EXIST", "The collection does not exist.");
    }
    return c.json(structuredClone(collection.payload));
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
function auditFields(aps, seed, now) {
  const createdAt = seed.created_at ?? now;
  return {
    createdBy: userId(aps, seed.created_by),
    createdAt,
    updatedBy: userId(aps, seed.updated_by ?? seed.created_by),
    updatedAt: seed.updated_at ?? createdAt
  };
}
function namedAuditFields(aps, seed, now) {
  return {
    ...auditFields(aps, seed, now),
    createdByName: seed.created_by_name ?? "",
    updatedByName: seed.updated_by_name ?? seed.created_by_name ?? ""
  };
}
function seedAccFromConfig(aps, config) {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  for (const member of config.acc_project_users ?? []) {
    const projectId = seedProjectId(aps, member.project_id);
    const user = aps.users.findOneBy("email", member.user_email);
    if (!user) {
      throw new Error(`APS ACC project user references unknown user '${member.user_email}'.`);
    }
    if (findProjectResource(aps.accProjectUsers, projectId, "user_id", user.user_id)) continue;
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
    if (findProjectResource(aps.issueTypes, projectId, "issue_type_id", issueType.id)) continue;
    const createdBy = aps.accProjectUsers.findBy("project_id", projectId)[0]?.user_id ?? "";
    const isActive = issueType.is_active ?? true;
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
      payload: {
        id: issueType.id,
        containerId: bareProjectId(projectId),
        title: issueType.title,
        isActive,
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
    if (findProjectResource(aps.issues, projectId, "issue_id", issue.id)) continue;
    const issueType = findProjectResource(aps.issueTypes, projectId, "issue_type_id", issue.issue_type_id);
    if (!issueType || !issueType.payload.subtypes.some((subtype) => subtype.id === issue.issue_subtype_id)) {
      throw new Error(`APS issue '${issue.id}' references an unknown issue type or subtype.`);
    }
    const assignedTo = issue.assigned_to ? userId(aps, issue.assigned_to) : null;
    const audit = auditFields(aps, issue, now);
    const status = issue.status ?? "open";
    const displayId = issue.display_id ?? aps.issues.findBy("project_id", projectId).length + 1;
    aps.issues.insert({
      project_id: projectId,
      issue_id: issue.id,
      payload: {
        id: issue.id,
        containerId: bareProjectId(projectId),
        deleted: issue.deleted ?? false,
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
        openedBy: audit.createdBy,
        openedAt: audit.createdAt,
        closedBy: status === "closed" ? audit.updatedBy : null,
        closedAt: status === "closed" ? audit.updatedAt : null,
        ...audit,
        watchers: [],
        customAttributes: [],
        gpsCoordinates: null,
        snapshotHasMarkups: false
      }
    });
  }
  for (const rfiType of config.rfi_types ?? []) {
    const projectId = seedProjectId(aps, rfiType.project_id);
    if (findProjectResource(aps.rfiTypes, projectId, "rfi_type_id", rfiType.id)) continue;
    aps.rfiTypes.insert({
      project_id: projectId,
      rfi_type_id: rfiType.id,
      payload: {
        id: rfiType.id,
        name: rfiType.name,
        wfType: rfiType.workflow_type ?? "US",
        status: rfiType.status ?? "active",
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
    if (findProjectResource(aps.rfiAttributes, projectId, "attribute_id", attribute.id)) continue;
    aps.rfiAttributes.insert({
      project_id: projectId,
      attribute_id: attribute.id,
      payload: {
        id: attribute.id,
        name: attribute.name,
        type: attribute.type ?? "text",
        description: attribute.description ?? "",
        status: attribute.status ?? "active",
        multipleChoice: attribute.multiple_choice ?? false,
        possibleValues: structuredClone(attribute.possible_values ?? [])
      }
    });
  }
  for (const rfi of config.rfis ?? []) {
    const projectId = seedProjectId(aps, rfi.project_id);
    if (findProjectResource(aps.rfis, projectId, "rfi_id", rfi.id)) continue;
    if (!findProjectResource(aps.rfiTypes, projectId, "rfi_type_id", rfi.rfi_type_id)) {
      throw new Error(`APS RFI '${rfi.id}' references unknown RFI type '${rfi.rfi_type_id}'.`);
    }
    const audit = auditFields(aps, rfi, now);
    const status = rfi.status ?? "draft";
    aps.rfis.insert({
      project_id: projectId,
      rfi_id: rfi.id,
      payload: {
        id: rfi.id,
        customIdentifier: rfi.custom_identifier,
        title: rfi.title,
        question: rfi.question ?? "",
        virtualFolderUrn: `urn:adsk.wip:fs.folder:co.${Buffer.from(rfi.id).toString("base64url")}`,
        status,
        previousStatus: rfi.previous_status ?? null,
        workflowType: rfi.workflow_type ?? "US",
        assignedTo: actors(aps, rfi.assigned_to),
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
        ...audit,
        closedAt: status === "closed" ? audit.updatedAt : null,
        closedBy: status === "closed" ? audit.updatedBy : null,
        containerId: bareProjectId(projectId),
        projectId: bareProjectId(projectId),
        suggestedAnswer: null,
        coReviewers: [],
        watchers: [],
        answeredAt: null,
        answeredBy: null,
        costImpact: "Unknown",
        scheduleImpact: "Unknown",
        priority: rfi.priority ?? "Normal",
        discipline: structuredClone(rfi.discipline ?? []),
        category: structuredClone(rfi.category ?? []),
        reference: rfi.reference ?? rfi.custom_identifier,
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
    if (findProjectResource(aps.sheetCollections, projectId, "collection_id", collection.id)) continue;
    aps.sheetCollections.insert({
      project_id: projectId,
      collection_id: collection.id,
      payload: {
        id: collection.id,
        name: collection.name,
        ...namedAuditFields(aps, collection, now)
      }
    });
  }
  for (const versionSet of config.sheet_version_sets ?? []) {
    const projectId = seedProjectId(aps, versionSet.project_id);
    if (findProjectResource(aps.sheetVersionSets, projectId, "version_set_id", versionSet.id)) continue;
    const collection = versionSet.collection_id ? findProjectResource(aps.sheetCollections, projectId, "collection_id", versionSet.collection_id) : void 0;
    if (versionSet.collection_id && !collection) {
      throw new Error(`APS Sheet version set '${versionSet.id}' references unknown collection.`);
    }
    aps.sheetVersionSets.insert({
      project_id: projectId,
      version_set_id: versionSet.id,
      payload: {
        id: versionSet.id,
        name: versionSet.name,
        issuanceDate: versionSet.issuance_date,
        ...namedAuditFields(aps, versionSet, now),
        collection: collection ? { id: collection.collection_id, name: collection.payload.name } : null
      }
    });
  }
  for (const sheet of config.sheets ?? []) {
    const projectId = seedProjectId(aps, sheet.project_id);
    if (findProjectResource(aps.sheets, projectId, "sheet_id", sheet.id)) continue;
    const versionSet = findProjectResource(aps.sheetVersionSets, projectId, "version_set_id", sheet.version_set_id);
    if (!versionSet) {
      throw new Error(`APS Sheet '${sheet.id}' references unknown version set '${sheet.version_set_id}'.`);
    }
    const collectionId = sheet.collection_id ?? versionSet.payload.collection?.id;
    const collection = collectionId ? findProjectResource(aps.sheetCollections, projectId, "collection_id", collectionId) : void 0;
    if (collectionId && !collection) {
      throw new Error(`APS Sheet '${sheet.id}' references unknown collection '${collectionId}'.`);
    }
    aps.sheets.insert({
      project_id: projectId,
      sheet_id: sheet.id,
      payload: {
        id: sheet.id,
        number: sheet.number,
        versionSet: {
          id: versionSet.version_set_id,
          name: versionSet.payload.name,
          issuanceDate: versionSet.payload.issuanceDate,
          deleted: false
        },
        ...namedAuditFields(aps, sheet, now),
        title: sheet.title,
        uploadFileName: sheet.upload_file_name ?? "",
        uploadId: sheet.upload_id ?? "",
        tags: structuredClone(sheet.tags ?? []),
        paperSize: structuredClone(sheet.paper_size ?? [0, 0]),
        isCurrent: sheet.is_current ?? true,
        deleted: sheet.deleted ?? false,
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
}
var apsPlugin = {
  name: "aps",
  register(app, store, webhooks, baseUrl, tokenMap) {
    const ctx = { app, store, webhooks, baseUrl, tokenMap };
    oauthRoutes(ctx);
    dataManagementRoutes(ctx);
    modelDerivativeRoutes(ctx);
    issueRoutes(ctx);
    rfiRoutes(ctx);
    sheetRoutes(ctx);
  },
  seed(store, baseUrl) {
    seedDefaults(store, baseUrl);
  }
};
var index_default = apsPlugin;
export {
  DEFAULT_DATA_SEED,
  apsPlugin,
  index_default as default,
  getApsStore,
  seedFromConfig
};
//# sourceMappingURL=index.js.map
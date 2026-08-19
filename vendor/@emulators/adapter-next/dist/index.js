// src/index.ts
import {
  createServer,
  debug,
  serializeTokenMap,
  restoreTokenMap
} from "@emulators/core";
var MUTATING_METHODS = /* @__PURE__ */ new Set(["POST", "PUT", "PATCH", "DELETE"]);
function resolvePlugin(mod) {
  const plugin = mod.plugin ?? mod.default;
  if (!plugin) {
    throw new Error("Emulator module must export `plugin` or a default export implementing ServicePlugin");
  }
  return plugin;
}
function takeSnapshot(apps) {
  const mergedStore = { collections: {}, data: {} };
  const tokens = {};
  for (const [name, sa] of apps) {
    const snap = sa.store.snapshot();
    for (const [colName, colSnap] of Object.entries(snap.collections)) {
      mergedStore.collections[`${name}:${colName}`] = colSnap;
    }
    for (const [key, val] of Object.entries(snap.data)) {
      mergedStore.data[`${name}:${key}`] = val;
    }
    tokens[name] = serializeTokenMap(sa.tokenMap);
  }
  return { store: mergedStore, tokens };
}
function restoreFromSnapshot(apps, snapshot) {
  const storesByName = /* @__PURE__ */ new Map();
  for (const [qualifiedName, colSnap] of Object.entries(snapshot.store.collections)) {
    const sepIdx = qualifiedName.indexOf(":");
    const name = qualifiedName.slice(0, sepIdx);
    const colName = qualifiedName.slice(sepIdx + 1);
    if (!storesByName.has(name)) {
      storesByName.set(name, { collections: {}, data: {} });
    }
    storesByName.get(name).collections[colName] = colSnap;
  }
  for (const [qualifiedKey, val] of Object.entries(snapshot.store.data)) {
    const sepIdx = qualifiedKey.indexOf(":");
    const name = qualifiedKey.slice(0, sepIdx);
    const dataKey = qualifiedKey.slice(sepIdx + 1);
    if (!storesByName.has(name)) {
      storesByName.set(name, { collections: {}, data: {} });
    }
    storesByName.get(name).data[dataKey] = val;
  }
  for (const [name, sa] of apps) {
    const snap = storesByName.get(name);
    if (snap) {
      sa.store.restore(snap);
    }
    restoreTokenMap(sa.tokenMap, snapshot.tokens[name] ?? []);
  }
}
function detectPrefix(url, pathSegments) {
  const parsed = new URL(url);
  const fullPath = parsed.pathname;
  const restPath = "/" + pathSegments.join("/");
  const idx = fullPath.lastIndexOf(restPath);
  if (idx > 0) {
    return fullPath.slice(0, idx);
  }
  throw new Error(`Could not detect mount path from URL: ${url}`);
}
async function rewriteResponse(response, servicePrefix) {
  const contentType = response.headers.get("Content-Type") ?? "";
  const location = response.headers.get("Location");
  const isHtml = contentType.includes("text/html");
  const locationChanged = location != null && location.startsWith("/");
  if (!isHtml) {
    if (!locationChanged) return response;
    const headers2 = new Headers(response.headers);
    headers2.set("Location", servicePrefix + location);
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: headers2
    });
  }
  let html = await response.text();
  html = html.replace(/(action|href)="(\/[^"]*?)"/g, (_match, attr, path) => {
    if (path.startsWith(servicePrefix)) return `${attr}="${path}"`;
    return `${attr}="${servicePrefix}${path}"`;
  });
  html = html.replace(/url\('(\/[^']*?)'\)/g, (_match, path) => {
    if (path.startsWith(servicePrefix)) return `url('${path}')`;
    return `url('${servicePrefix}${path}')`;
  });
  const headers = new Headers(response.headers);
  if (locationChanged) {
    headers.set("Location", servicePrefix + location);
  }
  headers.delete("Content-Length");
  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
function createEmulateHandler(config) {
  const { services: serviceEntries, persistence } = config;
  let apps = null;
  let mountPath = null;
  let initPromise = null;
  let pendingSave = Promise.resolve();
  function enqueueSave() {
    if (!persistence || !apps) return;
    pendingSave = pendingSave.then(async () => {
      if (!apps) return;
      const snapshot = takeSnapshot(apps);
      const json = JSON.stringify(snapshot);
      try {
        await persistence.save(json);
      } catch (err) {
        debug("persistence", "save failed: %o", err);
      }
    });
  }
  async function initApps(origin, mountPath2) {
    const serviceApps = /* @__PURE__ */ new Map();
    for (const [name, entry] of Object.entries(serviceEntries)) {
      const plugin = resolvePlugin(entry.emulator);
      const servicePrefix = `${mountPath2}/${name}`;
      const baseUrl = `${origin}${servicePrefix}`;
      let appKeyResolver;
      const { app, store, tokenMap, webhooks } = createServer(plugin, {
        baseUrl,
        appKeyResolver: entry.emulator.createAppKeyResolver ? (appId) => appKeyResolver(appId) : void 0
      });
      if (entry.emulator.createAppKeyResolver) {
        appKeyResolver = entry.emulator.createAppKeyResolver(store);
      }
      serviceApps.set(name, { app, store, tokenMap, plugin, webhooks });
    }
    let restored = false;
    if (persistence) {
      const raw = await persistence.load();
      if (raw) {
        try {
          const snapshot = JSON.parse(raw);
          restoreFromSnapshot(serviceApps, snapshot);
          restored = true;
        } catch {
        }
      }
    }
    if (!restored) {
      for (const [name, entry] of Object.entries(serviceEntries)) {
        const sa = serviceApps.get(name);
        const servicePrefix = `${mountPath2}/${name}`;
        const baseUrl = `${origin}${servicePrefix}`;
        sa.plugin.seed?.(sa.store, baseUrl);
        if (entry.seed && entry.emulator.seedFromConfig) {
          entry.emulator.seedFromConfig(sa.store, baseUrl, entry.seed, sa.webhooks);
        }
      }
      if (persistence) {
        enqueueSave();
      }
    }
    return serviceApps;
  }
  async function ensureInit(req, pathSegments) {
    if (apps) return apps;
    if (!initPromise) {
      const url = new URL(req.url);
      const origin = url.origin;
      mountPath = detectPrefix(req.url, pathSegments);
      initPromise = initApps(origin, mountPath).then((result) => {
        apps = result;
      });
    }
    await initPromise;
    return apps;
  }
  async function handleRequest(req, ctx) {
    const { path: pathSegments } = await ctx.params;
    const serviceApps = await ensureInit(req, pathSegments);
    if (pathSegments.length === 0) {
      return new Response("Not found", { status: 404 });
    }
    const serviceName = pathSegments[0];
    const sa = serviceApps.get(serviceName);
    if (!sa) {
      return new Response(`Unknown service: ${serviceName}`, { status: 404 });
    }
    const restPath = "/" + pathSegments.slice(1).join("/");
    const url = new URL(req.url);
    const strippedUrl = new URL(restPath + url.search, url.origin);
    const strippedReq = new Request(strippedUrl.toString(), {
      method: req.method,
      headers: req.headers,
      body: req.body,
      duplex: "half"
    });
    let response = await sa.app.fetch(strippedReq);
    const servicePrefix = `${mountPath}/${serviceName}`;
    response = await rewriteResponse(response, servicePrefix);
    if (persistence && MUTATING_METHODS.has(req.method)) {
      enqueueSave();
    }
    return response;
  }
  const handler = handleRequest;
  return {
    GET: handler,
    POST: handler,
    PUT: handler,
    PATCH: handler,
    DELETE: handler
  };
}
function withEmulate(nextConfig, options) {
  const config = nextConfig;
  const prefix = options?.routePrefix ?? "/emulate";
  const routePattern = `${prefix}/**`;
  const fontGlob = "./node_modules/@emulators/core/dist/fonts/**";
  const topLevel = { ...config.outputFileTracingIncludes ?? {} };
  const existing = topLevel[routePattern] ?? [];
  if (!existing.includes(fontGlob)) {
    topLevel[routePattern] = [...existing, fontGlob];
  }
  return { ...config, outputFileTracingIncludes: topLevel };
}
export {
  createEmulateHandler,
  withEmulate
};
//# sourceMappingURL=index.js.map
// src/store.ts
function serializeValue(value) {
  if (value instanceof Map) {
    return { __type: "Map", entries: [...value.entries()].map(([k, v]) => [k, serializeValue(v)]) };
  }
  if (value instanceof Set) {
    return { __type: "Set", values: [...value.values()] };
  }
  return value;
}
function deserializeValue(value) {
  if (value !== null && typeof value === "object" && "__type" in value) {
    const tagged = value;
    if (tagged.__type === "Map") {
      const entries = tagged.entries;
      return new Map(entries.map(([k, v]) => [k, deserializeValue(v)]));
    }
    if (tagged.__type === "Set") {
      return new Set(tagged.values);
    }
  }
  return value;
}
var Collection = class {
  constructor(indexFields = []) {
    this.indexFields = indexFields;
    this.fieldNames = indexFields.map(String).sort();
    for (const field of indexFields) {
      this.indexes.set(String(field), /* @__PURE__ */ new Map());
    }
  }
  items = /* @__PURE__ */ new Map();
  indexes = /* @__PURE__ */ new Map();
  autoId = 1;
  fieldNames;
  addToIndex(item) {
    for (const field of this.indexFields) {
      const value = item[field];
      if (value === void 0 || value === null) continue;
      const indexMap = this.indexes.get(String(field));
      const key = String(value);
      if (!indexMap.has(key)) {
        indexMap.set(key, /* @__PURE__ */ new Set());
      }
      indexMap.get(key).add(item.id);
    }
  }
  removeFromIndex(item) {
    for (const field of this.indexFields) {
      const value = item[field];
      if (value === void 0 || value === null) continue;
      const indexMap = this.indexes.get(String(field));
      const key = String(value);
      indexMap.get(key)?.delete(item.id);
    }
  }
  insert(data) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const explicitId = data.id != null && data.id > 0 ? data.id : void 0;
    const id = explicitId ?? this.autoId++;
    if (id >= this.autoId) {
      this.autoId = id + 1;
    }
    const item = {
      ...data,
      id,
      created_at: now,
      updated_at: now
    };
    this.items.set(id, item);
    this.addToIndex(item);
    return item;
  }
  get(id) {
    return this.items.get(id);
  }
  findBy(field, value) {
    if (this.indexes.has(String(field))) {
      const ids = this.indexes.get(String(field)).get(String(value));
      if (!ids) return [];
      return Array.from(ids).map((id) => this.items.get(id)).filter(Boolean);
    }
    return this.all().filter((item) => item[field] === value);
  }
  findOneBy(field, value) {
    return this.findBy(field, value)[0];
  }
  update(id, data) {
    const existing = this.items.get(id);
    if (!existing) return void 0;
    this.removeFromIndex(existing);
    const updated = {
      ...existing,
      ...data,
      id,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.items.set(id, updated);
    this.addToIndex(updated);
    return updated;
  }
  delete(id) {
    const existing = this.items.get(id);
    if (!existing) return false;
    this.removeFromIndex(existing);
    return this.items.delete(id);
  }
  all() {
    return Array.from(this.items.values());
  }
  query(options = {}) {
    let results = this.all();
    if (options.filter) {
      results = results.filter(options.filter);
    }
    const total_count = results.length;
    if (options.sort) {
      results.sort(options.sort);
    }
    const page = options.page ?? 1;
    const per_page = Math.min(options.per_page ?? 30, 100);
    const start = (page - 1) * per_page;
    const paged = results.slice(start, start + per_page);
    return {
      items: paged,
      total_count,
      page,
      per_page,
      has_next: start + per_page < total_count,
      has_prev: page > 1
    };
  }
  count(filter) {
    if (!filter) return this.items.size;
    return this.all().filter(filter).length;
  }
  clear() {
    this.items.clear();
    for (const indexMap of this.indexes.values()) {
      indexMap.clear();
    }
    this.autoId = 1;
  }
  snapshot() {
    return {
      items: this.all(),
      autoId: this.autoId,
      indexFields: this.fieldNames
    };
  }
  restore(snap) {
    this.clear();
    this.autoId = snap.autoId;
    for (const item of snap.items) {
      this.items.set(item.id, item);
      this.addToIndex(item);
    }
  }
};
var Store = class {
  collections = /* @__PURE__ */ new Map();
  _data = /* @__PURE__ */ new Map();
  collection(name, indexFields = []) {
    const existing = this.collections.get(name);
    if (existing) {
      if (indexFields.length > 0) {
        const requested = indexFields.map(String).sort();
        if (existing.fieldNames.length !== requested.length || existing.fieldNames.some((f, i) => f !== requested[i])) {
          throw new Error(
            `Collection "${name}" already exists with indexes [${existing.fieldNames}] but was requested with [${requested}]`
          );
        }
      }
      return existing;
    }
    const col = new Collection(indexFields);
    this.collections.set(name, col);
    return col;
  }
  getData(key) {
    return this._data.get(key);
  }
  setData(key, value) {
    this._data.set(key, value);
  }
  reset() {
    for (const collection of this.collections.values()) {
      collection.clear();
    }
    this._data.clear();
  }
  snapshot() {
    const collections = {};
    for (const [name, col] of this.collections) {
      collections[name] = col.snapshot();
    }
    const data = {};
    for (const [key, value] of this._data) {
      data[key] = serializeValue(value);
    }
    return { collections, data };
  }
  restore(snap) {
    const snapshotNames = new Set(Object.keys(snap.collections));
    for (const name of this.collections.keys()) {
      if (!snapshotNames.has(name)) {
        this.collections.delete(name);
      }
    }
    for (const [name, colSnap] of Object.entries(snap.collections)) {
      const indexFields = colSnap.indexFields;
      const col = this.collection(name, indexFields);
      col.restore(colSnap);
    }
    this._data.clear();
    for (const [key, value] of Object.entries(snap.data)) {
      this._data.set(key, deserializeValue(value));
    }
  }
};

// src/http.ts
import { createServer as createNodeServer } from "http";
var HonoRequest = class {
  constructor(request, params) {
    this.params = params;
    this.raw = request;
    this.url = request.url;
    this.method = request.method;
    this.path = new URL(request.url).pathname;
  }
  raw;
  url;
  method;
  path;
  header(name) {
    if (name) return this.raw.headers.get(name) ?? void 0;
    const headers = {};
    this.raw.headers.forEach((value, key) => {
      headers[key] = value;
    });
    return headers;
  }
  query(name) {
    return new URL(this.url).searchParams.get(name) ?? void 0;
  }
  queries(name) {
    const values = new URL(this.url).searchParams.getAll(name);
    return values.length > 0 ? values : void 0;
  }
  param(name) {
    if (!name) return { ...this.params };
    return this.params[name] ?? "";
  }
  json() {
    return this.raw.json();
  }
  text() {
    return this.raw.text();
  }
  arrayBuffer() {
    return this.raw.arrayBuffer();
  }
  async parseBody() {
    const contentType = this.header("Content-Type") ?? "";
    if (contentType.includes("multipart/form-data")) {
      return formDataToObject(await this.raw.formData());
    }
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const params = new URLSearchParams(await this.raw.text());
      const out = {};
      for (const [key, value] of params) {
        appendBodyValue(out, key, value);
      }
      return out;
    }
    if (contentType.includes("application/json")) {
      const body = await this.raw.json().catch(() => ({}));
      return body && typeof body === "object" && !Array.isArray(body) ? body : {};
    }
    return {};
  }
};
var Context = class {
  constructor(request, params, notFoundHandler) {
    this.notFoundHandler = notFoundHandler;
    this.req = new HonoRequest(request, params);
  }
  req;
  vars = /* @__PURE__ */ new Map();
  responseHeaders = new Headers();
  responseStatus = 200;
  get(key) {
    return this.vars.get(key);
  }
  set(key, value) {
    this.vars.set(key, value);
  }
  header(name, value) {
    this.responseHeaders.set(name, value);
  }
  status(status) {
    this.responseStatus = status;
  }
  json(data, status, headers) {
    return this.response(JSON.stringify(data), status, defaultContentType(headers, "application/json; charset=UTF-8"));
  }
  text(text, status, headers) {
    return this.response(text, status, defaultContentType(headers, "text/plain; charset=UTF-8"));
  }
  html(html, status, headers) {
    return this.response(html, status, defaultContentType(headers, "text/html; charset=UTF-8"));
  }
  body(body, status, headers) {
    return this.response(body, status, headers);
  }
  redirect(location, status = 302) {
    return this.response(null, status, { Location: location });
  }
  notFound() {
    return this.notFoundHandler(this);
  }
  finalize(response) {
    if (!hasHeaders(this.responseHeaders)) return response;
    const headers = new Headers(response.headers);
    this.responseHeaders.forEach((value, key) => {
      headers.set(key, value);
    });
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  }
  response(body, status, headers) {
    const merged = new Headers(headers);
    this.responseHeaders.forEach((value, key) => {
      merged.set(key, value);
    });
    return new Response(body, {
      status: status ?? this.responseStatus,
      headers: merged
    });
  }
};
var Hono = class {
  middleware = [];
  routes = [];
  errorHandler = (err) => {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return new Response(message, { status: 500 });
  };
  notFoundHandler = () => new Response("404 Not Found", { status: 404 });
  use(pathOrHandler, ...handlers) {
    if (typeof pathOrHandler === "string") {
      this.middleware.push({ method: "ALL", compiled: compilePath(pathOrHandler), handlers });
    } else {
      this.middleware.push({ method: "ALL", compiled: compilePath("*"), handlers: [pathOrHandler, ...handlers] });
    }
    return this;
  }
  on(method, path, ...handlers) {
    this.routes.push({ method: method.toUpperCase(), compiled: compilePath(path), handlers });
    return this;
  }
  get(path, ...handlers) {
    return this.on("GET", path, ...handlers);
  }
  post(path, ...handlers) {
    return this.on("POST", path, ...handlers);
  }
  put(path, ...handlers) {
    return this.on("PUT", path, ...handlers);
  }
  patch(path, ...handlers) {
    return this.on("PATCH", path, ...handlers);
  }
  delete(path, ...handlers) {
    return this.on("DELETE", path, ...handlers);
  }
  onError(handler) {
    this.errorHandler = handler;
    return this;
  }
  notFound(handler) {
    this.notFoundHandler = handler;
    return this;
  }
  async request(input, init) {
    if (input instanceof Request) return this.fetch(input);
    const url = input.startsWith("/") ? `http://localhost${input}` : input;
    return this.fetch(new Request(url, init));
  }
  fetch = async (request) => {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method.toUpperCase();
    const matched = this.match(method, path);
    const context = new Context(request, matched.params, this.notFoundHandler);
    try {
      const response = await this.dispatch(context, matched.handlers);
      return context.finalize(response ?? await this.notFoundHandler(context));
    } catch (err) {
      return context.finalize(await this.errorHandler(err, context));
    }
  };
  match(method, path) {
    const handlers = [];
    const params = {};
    for (const route2 of this.middleware) {
      const match = matchPath(route2.compiled, path);
      if (!match) continue;
      Object.assign(params, match);
      for (const handler of route2.handlers) {
        handlers.push({ handler, params: match });
      }
    }
    const route = this.routes.find((candidate) => candidate.method === method && matchPath(candidate.compiled, path) != null) ?? (method === "HEAD" ? this.routes.find((candidate) => candidate.method === "GET" && matchPath(candidate.compiled, path) != null) : void 0);
    if (route) {
      const match = matchPath(route.compiled, path) ?? {};
      Object.assign(params, match);
      for (const handler of route.handlers) {
        handlers.push({ handler, params: match });
      }
    }
    return { handlers, params };
  }
  async dispatch(context, handlers) {
    let index = -1;
    const run = async (nextIndex) => {
      if (nextIndex <= index) throw new Error("next() called multiple times");
      index = nextIndex;
      const matched = handlers[nextIndex];
      if (!matched) return void 0;
      const originalParams = context.req.param();
      Object.assign(originalParams, matched.params);
      let nextResponse = void 0;
      let nextCalled = false;
      const next = async () => {
        nextCalled = true;
        nextResponse = await run(nextIndex + 1);
      };
      const response = await matched.handler(context, next);
      if (response instanceof Response) return response;
      if (nextCalled) return nextResponse;
      return response;
    };
    return run(0);
  }
};
function cors(options = {}) {
  const origin = options.origin ?? "*";
  const allowMethods = options.allowMethods ?? ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH", "OPTIONS"];
  return async (c, next) => {
    c.header("Access-Control-Allow-Origin", origin);
    if (options.credentials) c.header("Access-Control-Allow-Credentials", "true");
    if (c.req.method.toUpperCase() === "OPTIONS") {
      c.header("Access-Control-Allow-Methods", allowMethods.join(","));
      const allowHeaders = options.allowHeaders?.join(",") ?? c.req.header("Access-Control-Request-Headers");
      if (allowHeaders) c.header("Access-Control-Allow-Headers", allowHeaders);
      if (options.maxAge != null) c.header("Access-Control-Max-Age", String(options.maxAge));
      return c.body(null, 204);
    }
    await next();
  };
}
function serve(options) {
  const port = options.port ?? 3e3;
  const server = createNodeServer(async (req, res) => {
    try {
      const request = nodeRequestToFetchRequest(req);
      const response = await options.fetch(request);
      await writeFetchResponse(res, response, req.method?.toUpperCase() === "HEAD");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Internal Server Error";
      res.statusCode = 500;
      res.setHeader("Content-Type", "text/plain; charset=UTF-8");
      res.end(message);
    }
  });
  server.listen(port, options.hostname);
  return server;
}
function compilePath(pattern) {
  if (pattern === "*" || pattern === "/*") {
    return { pattern, regex: /^.*$/, paramNames: [] };
  }
  const paramNames = [];
  let source = "^";
  for (let i = 0; i < pattern.length; i++) {
    const char = pattern[i];
    if (char !== ":") {
      source += escapeRegex(char);
      continue;
    }
    let name = "";
    i++;
    while (i < pattern.length && /[A-Za-z0-9_]/.test(pattern[i])) {
      name += pattern[i];
      i++;
    }
    i--;
    paramNames.push(name);
    if (pattern[i + 1] === "{") {
      const close = pattern.indexOf("}", i + 2);
      if (close < 0) throw new Error(`Invalid route pattern: ${pattern}`);
      const expr = pattern.slice(i + 2, close);
      source += `(${expr})`;
      i = close;
    } else {
      source += "([^/]+)";
    }
  }
  source += "$";
  return { pattern, regex: new RegExp(source), paramNames };
}
function matchPath(compiled, path) {
  const match = compiled.regex.exec(path);
  if (!match) return null;
  const params = {};
  for (let i = 0; i < compiled.paramNames.length; i++) {
    params[compiled.paramNames[i]] = decodePathParam(match[i + 1] ?? "");
  }
  return params;
}
function decodePathParam(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
function escapeRegex(value) {
  return value.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&");
}
function hasHeaders(headers) {
  for (const _ of headers) return true;
  return false;
}
function defaultContentType(headers, contentType) {
  const out = new Headers(headers);
  if (!out.has("Content-Type")) {
    out.set("Content-Type", contentType);
  }
  return out;
}
function formDataToObject(formData) {
  const out = {};
  for (const [key, value] of formData) {
    appendBodyValue(out, key, value);
  }
  return out;
}
function appendBodyValue(target, key, value) {
  const existing = target[key];
  if (existing === void 0) {
    target[key] = value;
  } else if (Array.isArray(existing)) {
    existing.push(value);
  } else {
    target[key] = [existing, value];
  }
}
function nodeRequestToFetchRequest(req) {
  const host = req.headers.host ?? "localhost";
  const url = new URL(req.url ?? "/", `http://${host}`);
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value == null) continue;
    if (Array.isArray(value)) {
      for (const item of value) headers.append(key, item);
    } else {
      headers.set(key, value);
    }
  }
  const method = req.method ?? "GET";
  const hasBody = method !== "GET" && method !== "HEAD";
  return new Request(url.toString(), {
    method,
    headers,
    body: hasBody ? req : void 0,
    duplex: "half"
  });
}
async function writeFetchResponse(res, response, headOnly) {
  res.statusCode = response.status;
  res.statusMessage = response.statusText;
  const headersWithCookies = response.headers;
  const cookies = headersWithCookies.getSetCookie?.();
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie" && cookies && cookies.length > 0) return;
    res.setHeader(key, value);
  });
  if (cookies && cookies.length > 0) {
    res.setHeader("Set-Cookie", cookies);
  }
  if (headOnly || !response.body) {
    res.end();
    return;
  }
  const reader = response.body.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!res.write(value)) {
        await new Promise((resolve) => res.once("drain", resolve));
      }
    }
    res.end();
  } catch (err) {
    res.destroy(err instanceof Error ? err : void 0);
  }
}

// src/webhooks.ts
import { createHmac } from "crypto";
var MAX_DELIVERIES = 1e3;
function githubHeaders({ event, body, subscription, deliveryId }) {
  const headers = {
    "Content-Type": "application/json",
    "X-GitHub-Event": event,
    "X-GitHub-Delivery": String(deliveryId)
  };
  if (subscription.secret) {
    const hmac = createHmac("sha256", subscription.secret).update(body).digest("hex");
    headers["X-Hub-Signature-256"] = `sha256=${hmac}`;
  }
  return headers;
}
var WebhookDispatcher = class {
  subscriptions = [];
  deliveries = [];
  subscriptionIdCounter = 1;
  deliveryIdCounter = 1;
  headerFactory = githubHeaders;
  setHeaderFactory(factory) {
    this.headerFactory = factory;
  }
  register(sub) {
    const { id: explicitId, ...rest } = sub;
    const id = explicitId !== void 0 ? explicitId : this.subscriptionIdCounter++;
    if (id >= this.subscriptionIdCounter) {
      this.subscriptionIdCounter = id + 1;
    }
    const subscription = { ...rest, id };
    this.subscriptions.push(subscription);
    return subscription;
  }
  unregister(id) {
    const idx = this.subscriptions.findIndex((s) => s.id === id);
    if (idx === -1) return false;
    this.subscriptions.splice(idx, 1);
    return true;
  }
  getSubscription(id) {
    return this.subscriptions.find((s) => s.id === id);
  }
  getSubscriptions(owner, repo) {
    return this.subscriptions.filter((s) => {
      if (owner && s.owner !== owner) return false;
      if (repo !== void 0 && s.repo !== repo) return false;
      return true;
    });
  }
  updateSubscription(id, data) {
    const sub = this.subscriptions.find((s) => s.id === id);
    if (!sub) return void 0;
    Object.assign(sub, data);
    return sub;
  }
  async dispatch(event, action, payload, owner, repo) {
    const matchingSubs = this.subscriptions.filter((s) => {
      if (!s.active) return false;
      if (s.owner !== owner) return false;
      if (repo !== void 0) {
        if (s.repo !== repo) return false;
      } else if (s.repo !== void 0) {
        return false;
      }
      return event === "ping" || s.events.includes("*") || s.events.includes(event);
    });
    for (const sub of matchingSubs) {
      const delivery = {
        id: this.deliveryIdCounter++,
        hook_id: sub.id,
        event,
        action,
        payload,
        status_code: null,
        delivered_at: (/* @__PURE__ */ new Date()).toISOString(),
        duration: null,
        success: false
      };
      const body = JSON.stringify(payload);
      try {
        const headers = this.headerFactory({ event, action, body, subscription: sub, deliveryId: delivery.id });
        const start = Date.now();
        const response = await fetch(sub.url, {
          method: "POST",
          headers,
          body,
          signal: AbortSignal.timeout(1e4)
        });
        delivery.duration = Date.now() - start;
        delivery.status_code = response.status;
        delivery.success = response.ok;
      } catch {
        delivery.duration = 0;
        delivery.success = false;
      }
      this.deliveries.push(delivery);
      if (this.deliveries.length > MAX_DELIVERIES) {
        this.deliveries.splice(0, this.deliveries.length - MAX_DELIVERIES);
      }
    }
  }
  getDeliveries(hookId) {
    if (hookId !== void 0) {
      return this.deliveries.filter((d) => d.hook_id === hookId);
    }
    return [...this.deliveries];
  }
  clear() {
    this.subscriptions.length = 0;
    this.deliveries.length = 0;
    this.subscriptionIdCounter = 1;
    this.deliveryIdCounter = 1;
  }
};

// src/middleware/error-handler.ts
var DEFAULT_DOCS_URL = "https://emulate.dev";
function getDocsUrl(c) {
  return c.get("docsUrl") ?? DEFAULT_DOCS_URL;
}
function errorStatus(err) {
  if (err && typeof err === "object" && "status" in err) {
    const s = err.status;
    if (typeof s === "number" && Number.isFinite(s)) return s;
  }
  return 500;
}
function createApiErrorHandler(documentationUrl) {
  return (err, c) => {
    if (documentationUrl) {
      c.set("docsUrl", documentationUrl);
    }
    const status = errorStatus(err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return c.json(
      {
        message,
        documentation_url: getDocsUrl(c)
      },
      status
    );
  };
}
function createErrorHandler(documentationUrl) {
  return async (c, next) => {
    if (documentationUrl) {
      c.set("docsUrl", documentationUrl);
    }
    await next();
  };
}
var errorHandler = createErrorHandler();
var ApiError = class extends Error {
  constructor(status, message, errors) {
    super(message);
    this.status = status;
    this.errors = errors;
    this.name = "ApiError";
  }
};
function notFound(resource) {
  return new ApiError(404, resource ? `${resource} not found` : "Not Found");
}
function validationError(message, errors) {
  return new ApiError(422, message, errors);
}
function unauthorized() {
  return new ApiError(401, "Requires authentication");
}
function forbidden() {
  return new ApiError(403, "Forbidden");
}
async function parseJsonBody(c) {
  try {
    const body = await c.req.json();
    if (body && typeof body === "object" && !Array.isArray(body)) {
      return body;
    }
    return {};
  } catch {
    throw new ApiError(400, "Problems parsing JSON");
  }
}

// src/middleware/auth.ts
import { createPublicKey } from "crypto";
import { jwtVerify } from "jose";

// src/debug.ts
var isDebug = typeof process !== "undefined" && (process.env.DEBUG === "1" || process.env.DEBUG === "true" || process.env.EMULATE_DEBUG === "1");
function debug(label, ...args) {
  if (isDebug) {
    console.log(`[${label}]`, ...args);
  }
}

// src/middleware/auth.ts
function serializeTokenMap(tokenMap) {
  return [...tokenMap.entries()].map(([token, user]) => ({
    token,
    login: user.login,
    id: user.id,
    scopes: user.scopes,
    ...user.installation ? { installation: user.installation } : {}
  }));
}
function restoreTokenMap(tokenMap, tokens) {
  tokenMap.clear();
  for (const t of tokens) {
    tokenMap.set(t.token, {
      login: t.login,
      id: t.id,
      scopes: t.scopes,
      ...t.installation ? { installation: t.installation } : {}
    });
  }
}
function authMiddleware(tokens, appKeyResolver, fallbackUser) {
  return async (c, next) => {
    const authHeader = c.req.header("Authorization");
    if (authHeader) {
      const token = authHeader.replace(/^(Bearer|token)\s+/i, "").trim();
      if (token.startsWith("eyJ") && appKeyResolver) {
        try {
          const [, payloadB64] = token.split(".");
          const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString());
          const appId = typeof payload.iss === "string" ? parseInt(payload.iss, 10) : payload.iss;
          if (typeof appId === "number" && !isNaN(appId)) {
            const appInfo = appKeyResolver(appId);
            if (appInfo) {
              const publicKey = createPublicKey(appInfo.privateKey);
              await jwtVerify(token, publicKey, { algorithms: ["RS256"] });
              c.set("authApp", {
                appId,
                slug: appInfo.slug,
                name: appInfo.name
              });
            }
          }
        } catch {
        }
      } else {
        let user = tokens.get(token);
        if (!user && fallbackUser && token.length > 0) {
          debug("auth", "fallback user for unknown token", { login: fallbackUser.login, id: fallbackUser.id });
          user = { login: fallbackUser.login, id: fallbackUser.id, scopes: fallbackUser.scopes };
        }
        if (user) {
          c.set("authUser", user);
          c.set("authToken", token);
          c.set("authScopes", user.scopes);
        }
      }
    }
    await next();
  };
}
function requireAuth() {
  return async (c, next) => {
    if (!c.get("authUser")) {
      const docsUrl = c.get("docsUrl") ?? "https://emulate.dev";
      return c.json(
        {
          message: "Requires authentication",
          documentation_url: docsUrl
        },
        401
      );
    }
    await next();
  };
}
function requireAppAuth() {
  return async (c, next) => {
    if (!c.get("authApp")) {
      const docsUrl = c.get("docsUrl") ?? "https://emulate.dev";
      return c.json(
        {
          message: "A JSON web token could not be decoded",
          documentation_url: docsUrl
        },
        401
      );
    }
    await next();
  };
}

// src/fonts.ts
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
var __dirname = dirname(fileURLToPath(import.meta.url));
var FONTS = {
  "geist-sans.woff2": readFileSync(join(__dirname, "fonts", "geist-sans.woff2")),
  "GeistPixel-Square.woff2": readFileSync(join(__dirname, "fonts", "GeistPixel-Square.woff2"))
};
var FAVICON = readFileSync(join(__dirname, "fonts", "favicon.ico"));
function registerFontRoutes(app) {
  app.get("/_emulate/fonts/:name", (c) => {
    const name = c.req.param("name");
    const buf = FONTS[name];
    if (!buf) return c.notFound();
    return new Response(buf, {
      headers: {
        "Content-Type": "font/woff2",
        "Cache-Control": "public, max-age=31536000, immutable",
        "Access-Control-Allow-Origin": "*"
      }
    });
  });
  app.get("/_emulate/favicon.ico", (c) => {
    return new Response(FAVICON, {
      headers: {
        "Content-Type": "image/x-icon",
        "Cache-Control": "public, max-age=31536000, immutable"
      }
    });
  });
}

// src/server.ts
function createServer(plugin, options = {}) {
  const port = options.port ?? 4e3;
  const baseUrl = options.baseUrl ?? `http://localhost:${port}`;
  const app = new Hono();
  const store = new Store();
  const webhooks = new WebhookDispatcher();
  const tokenMap = /* @__PURE__ */ new Map();
  if (options.tokens) {
    for (const [token, user] of Object.entries(options.tokens)) {
      tokenMap.set(token, {
        login: user.login,
        id: user.id,
        scopes: user.scopes ?? ["repo", "user", "admin:org", "admin:repo_hook"]
      });
    }
  }
  const docsUrl = options.docsUrl ?? `https://emulate.dev/${plugin.name}`;
  registerFontRoutes(app);
  app.onError(createApiErrorHandler(docsUrl));
  app.use("*", cors());
  app.use("*", createErrorHandler(docsUrl));
  app.use("*", authMiddleware(tokenMap, options.appKeyResolver, options.fallbackUser));
  const rateLimitCounters = /* @__PURE__ */ new Map();
  let lastPruneAt = Math.floor(Date.now() / 1e3);
  app.use("*", async (c, next) => {
    const token = c.get("authToken") ?? "__anonymous__";
    const now = Math.floor(Date.now() / 1e3);
    if (now - lastPruneAt > 3600) {
      for (const [key, val] of rateLimitCounters) {
        if (val.resetAt <= now) rateLimitCounters.delete(key);
      }
      lastPruneAt = now;
    }
    let counter = rateLimitCounters.get(token);
    if (!counter || counter.resetAt <= now) {
      counter = { remaining: 5e3, resetAt: now + 3600 };
      rateLimitCounters.set(token, counter);
    }
    counter.remaining = Math.max(0, counter.remaining - 1);
    c.header("X-RateLimit-Limit", "5000");
    c.header("X-RateLimit-Remaining", String(counter.remaining));
    c.header("X-RateLimit-Reset", String(counter.resetAt));
    c.header("X-RateLimit-Resource", "core");
    if (counter.remaining === 0) {
      return c.json(
        {
          message: "API rate limit exceeded",
          documentation_url: docsUrl
        },
        403
      );
    }
    await next();
  });
  plugin.register(app, store, webhooks, baseUrl, tokenMap);
  app.notFound(
    (c) => c.json(
      {
        message: "Not Found",
        documentation_url: docsUrl
      },
      404
    )
  );
  return { app, store, webhooks, port, baseUrl, tokenMap };
}

// src/middleware/pagination.ts
function parsePagination(c) {
  const page = Math.max(1, parseInt(c.req.query("page") ?? "1", 10) || 1);
  const per_page = Math.min(100, Math.max(1, parseInt(c.req.query("per_page") ?? "30", 10) || 30));
  return { page, per_page };
}
function setLinkHeader(c, totalCount, page, perPage) {
  const lastPage = Math.max(1, Math.ceil(totalCount / perPage));
  const baseUrl = new URL(c.req.url);
  const links = [];
  const makeLink = (p, rel) => {
    baseUrl.searchParams.set("page", String(p));
    baseUrl.searchParams.set("per_page", String(perPage));
    return `<${baseUrl.toString()}>; rel="${rel}"`;
  };
  if (page < lastPage) {
    links.push(makeLink(page + 1, "next"));
    links.push(makeLink(lastPage, "last"));
  }
  if (page > 1) {
    links.push(makeLink(1, "first"));
    links.push(makeLink(page - 1, "prev"));
  }
  if (links.length > 0) {
    c.header("Link", links.join(", "));
  }
}

// src/ui.ts
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
function renderSettingsPage(title, sidebarHtml, bodyHtml, service) {
  return `${head(title)}
<body>
${emuBar(service)}
<div class="settings-layout">
  <nav class="settings-sidebar">${sidebarHtml}</nav>
  <div class="settings-main">${bodyHtml}</div>
</div>
${POWERED_BY}
</body></html>`;
}
function renderInspectorPage(title, tabs, activeTab, body, service) {
  const tabLinks = tabs.map(
    (t) => `<a href="${escapeAttr(t.href)}" class="${t.id === activeTab ? "active" : ""}">${escapeHtml(t.label)}</a>`
  ).join("");
  return `${head(title)}
<body>
${emuBar(service)}
<div class="inspector-layout">
  <nav class="inspector-tabs">${tabLinks}</nav>
  ${body}
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
function renderCheckoutPage(opts, service) {
  const fmt = (cents, cur) => `$${(cents / 100).toFixed(2)} ${cur.toUpperCase()}`;
  const fmtShort = (cents) => `$${(cents / 100).toFixed(2)}`;
  const itemsHtml = opts.lineItems.length > 0 ? opts.lineItems.map((li) => {
    const initial = li.name.charAt(0).toUpperCase();
    const unitNote = li.quantity > 1 ? `<div class="checkout-item-unit">${fmtShort(li.unitPrice)} each</div>` : "";
    return `<div class="checkout-line-item">
  <div class="checkout-item-icon">${escapeHtml(initial)}</div>
  <div class="checkout-item-details">
    <div class="checkout-item-name">${escapeHtml(li.name)}</div>
    <div class="checkout-item-qty">Qty ${li.quantity}</div>
  </div>
  <div>
    <div class="checkout-item-price">${fmtShort(li.totalPrice)}</div>
    ${unitNote}
  </div>
</div>`;
  }).join("") : '<p class="empty">No line items</p>';
  const totalsHtml = `<div class="checkout-totals">
  <div class="checkout-totals-row">
    <span>Subtotal</span><span>${fmtShort(opts.subtotal)}</span>
  </div>
  <div class="checkout-totals-row total">
    <span>Total due</span><span>${fmt(opts.total, opts.currency)}</span>
  </div>
</div>`;
  const cancelHtml = opts.cancelUrl ? `<div class="checkout-cancel"><a href="${escapeAttr(opts.cancelUrl)}">Cancel</a></div>` : "";
  const merchant = opts.merchantName ? escapeHtml(opts.merchantName) : "Checkout";
  return `${head("Checkout")}
<body>
${emuBar(service)}
<div class="checkout-layout">
  <div class="checkout-summary">
    <div class="checkout-merchant">
      <span class="checkout-merchant-name">${merchant}</span>
      <span class="checkout-test-badge">Test Mode</span>
    </div>
    <div class="checkout-total">${fmtShort(opts.total)}</div>
    ${itemsHtml}
    ${totalsHtml}
  </div>
  <div class="checkout-form-side">
    <form method="post" action="/checkout/${escapeAttr(opts.sessionId)}/complete">
      <div class="checkout-form-section">
        <label class="checkout-form-label">Email</label>
        <input type="email" name="email" class="checkout-input" placeholder="you@example.com"/>
      </div>
      <div class="checkout-form-section">
        <label class="checkout-form-label">Card information</label>
        <div class="checkout-card-box">
          <input type="text" class="checkout-input" placeholder="1234 1234 1234 1234" disabled/>
          <div class="checkout-card-row">
            <input type="text" class="checkout-input" placeholder="MM / YY" disabled/>
            <input type="text" class="checkout-input" placeholder="CVC" disabled/>
          </div>
        </div>
        <div class="checkout-sim-note">Card fields are simulated. Payment will be auto-approved.</div>
      </div>
      <button type="submit" class="checkout-pay-btn">Pay ${fmtShort(opts.total)}</button>
    </form>
    ${cancelHtml}
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

// src/oauth-helpers.ts
import { timingSafeEqual } from "crypto";
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
function parseCookies(header) {
  const cookies = {};
  for (const part of header.split(";")) {
    const [k, ...v] = part.split("=");
    if (k) cookies[k.trim()] = v.join("=").trim();
  }
  return cookies;
}

// src/persistence.ts
import { readFile, writeFile, mkdir } from "fs/promises";
import { dirname as dirname2 } from "path";
function filePersistence(path) {
  return {
    async load() {
      try {
        return await readFile(path, "utf-8");
      } catch {
        return null;
      }
    },
    async save(data) {
      await mkdir(dirname2(path), { recursive: true });
      await writeFile(path, data, "utf-8");
    }
  };
}
export {
  ApiError,
  Collection,
  Context,
  Hono,
  HonoRequest,
  Store,
  WebhookDispatcher,
  authMiddleware,
  bodyStr,
  constantTimeSecretEqual,
  cors,
  createApiErrorHandler,
  createErrorHandler,
  createServer,
  debug,
  deserializeValue,
  errorHandler,
  escapeAttr,
  escapeHtml,
  filePersistence,
  forbidden,
  matchesRedirectUri,
  normalizeUri,
  notFound,
  parseCookies,
  parseJsonBody,
  parsePagination,
  registerFontRoutes,
  renderCardPage,
  renderCheckoutPage,
  renderErrorPage,
  renderFormPostPage,
  renderInspectorPage,
  renderSettingsPage,
  renderUserButton,
  requireAppAuth,
  requireAuth,
  restoreTokenMap,
  serializeTokenMap,
  serializeValue,
  serve,
  setLinkHeader,
  unauthorized,
  validationError
};
//# sourceMappingURL=index.js.map
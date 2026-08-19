// src/helpers.ts
import { createHash, randomBytes } from "crypto";
var DEFAULT_CONFIDENTIAL_CLIENT_ID = "aps-test-client";
var DEFAULT_CONFIDENTIAL_CLIENT_SECRET = "aps-test-secret";
var DEFAULT_PUBLIC_CLIENT_ID = "aps-test-app";
var DEFAULT_USER_EMAIL = "testuser@autodesk.local";
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
function analyticsIdFor(userId) {
  return createHash("sha256").update(userId).digest("hex").slice(0, 32);
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

// src/routes/oauth.ts
import { createHash as createHash2, randomBytes as randomBytes2 } from "crypto";
import { SignJWT, exportJWK, generateKeyPair } from "jose";

// ../core/dist/index.js
import { jwtVerify } from "jose";
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

// src/store.ts
function getApsStore(store) {
  return {
    clients: store.collection("aps.clients", ["client_id"]),
    users: store.collection("aps.users", ["user_id", "email"])
  };
}

// src/routes/oauth.ts
var SERVICE_LABEL = "Autodesk Platform Services";
var KID = "emulate-aps-1";
var TOKEN_ISSUER = "https://developer.api.autodesk.com";
var TOKEN_AUDIENCE = "https://autodesk.com";
var AUTHORIZATION_CODE_TTL_MS = 5 * 60 * 1e3;
var ACCESS_TOKEN_TTL_SECONDS = 3600;
var ACCESS_TOKEN_EXPIRES_IN = 3599;
var ID_TOKEN_TTL_SECONDS = 60 * 60;
var REFRESH_TOKEN_TTL_MS = 15 * 24 * 60 * 60 * 1e3;
function getKeyPair(store) {
  let pair = store.getData("aps.oauth.keyPair");
  if (!pair) {
    pair = generateKeyPair("RS256");
    store.setData("aps.oauth.keyPair", pair);
  }
  return pair;
}
function getPendingCodes(store) {
  let map = store.getData("aps.oauth.pendingCodes");
  if (!map) {
    map = /* @__PURE__ */ new Map();
    store.setData("aps.oauth.pendingCodes", map);
  }
  return map;
}
function getAccessTokens(store) {
  let map = store.getData("aps.oauth.accessTokens");
  if (!map) {
    map = /* @__PURE__ */ new Map();
    store.setData("aps.oauth.accessTokens", map);
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
  const { privateKey } = await getKeyPair(store);
  const claims = {
    scope: parseScope(options.scope),
    client_id: options.clientId,
    jti: generateJti()
  };
  if (options.apsUserId) claims.userid = options.apsUserId;
  return new SignJWT(claims).setProtectedHeader({ alg: "RS256", kid: KID }).setIssuer(TOKEN_ISSUER).setAudience(TOKEN_AUDIENCE).setExpirationTime(options.now + ACCESS_TOKEN_TTL_SECONDS).sign(privateKey);
}
async function createIdToken(store, user, clientId, nonce, baseUrl, now) {
  const { privateKey } = await getKeyPair(store);
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
  return new SignJWT(claims).setProtectedHeader({ alg: "RS256", kid: KID, typ: "JWT" }).setIssuer(baseUrl).setAudience(clientId).setIssuedAt(now).setExpirationTime(now + ID_TOKEN_TTL_SECONDS).sign(privateKey);
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
    const { publicKey } = await getKeyPair(store);
    const jwk = await exportJWK(publicKey);
    c.header("Cache-Control", "max-age=604800");
    return c.json({
      keys: [{ kty: jwk.kty, kid: KID, use: "sig", n: jwk.n, e: jwk.e }]
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
    const userId = bodyStr(body.user_id);
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
    const user = aps.users.findOneBy("user_id", userId);
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
    const now = Math.floor(Date.now() / 1e3);
    const access = getAccessTokens(store).get(token);
    if (access && access.expiresAt > now) {
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
  app.get("/userinfo", (c) => {
    const authHeader = c.req.header("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    const record = token ? getAccessTokens(store).get(token) : void 0;
    const now = Math.floor(Date.now() / 1e3);
    if (!record || record.expiresAt <= now || !record.apsUserId) {
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

// src/index.ts
function seedDefaults(store, _baseUrl) {
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
}
var apsPlugin = {
  name: "aps",
  register(app, store, webhooks, baseUrl, tokenMap) {
    const ctx = { app, store, webhooks, baseUrl, tokenMap };
    oauthRoutes(ctx);
  },
  seed(store, baseUrl) {
    seedDefaults(store, baseUrl);
  }
};
var index_default = apsPlugin;
export {
  apsPlugin,
  index_default as default,
  getApsStore,
  seedFromConfig
};
//# sourceMappingURL=index.js.map
import { Server } from 'node:http';

interface Entity {
    id: number;
    created_at: string;
    updated_at: string;
}
type InsertInput<T extends Entity> = Omit<T, "id" | "created_at" | "updated_at"> & {
    id?: number;
};
type FilterFn<T> = (item: T) => boolean;
type SortFn<T> = (a: T, b: T) => number;
interface QueryOptions<T> {
    filter?: FilterFn<T>;
    sort?: SortFn<T>;
    page?: number;
    per_page?: number;
}
interface PaginatedResult<T> {
    items: T[];
    total_count: number;
    page: number;
    per_page: number;
    has_next: boolean;
    has_prev: boolean;
}
interface CollectionSnapshot<T extends Entity = Entity> {
    items: T[];
    autoId: number;
    indexFields: string[];
}
interface StoreSnapshot {
    collections: Record<string, CollectionSnapshot>;
    data: Record<string, unknown>;
}
declare function serializeValue(value: unknown): unknown;
declare function deserializeValue(value: unknown): unknown;
declare class Collection<T extends Entity> {
    private indexFields;
    private items;
    private indexes;
    private autoId;
    readonly fieldNames: string[];
    constructor(indexFields?: (keyof T)[]);
    private addToIndex;
    private removeFromIndex;
    insert(data: InsertInput<T>): T;
    get(id: number): T | undefined;
    findBy(field: keyof T, value: T[keyof T] | string | number): T[];
    findOneBy(field: keyof T, value: T[keyof T] | string | number): T | undefined;
    update(id: number, data: Partial<T>): T | undefined;
    delete(id: number): boolean;
    all(): T[];
    query(options?: QueryOptions<T>): PaginatedResult<T>;
    count(filter?: FilterFn<T>): number;
    clear(): void;
    snapshot(): CollectionSnapshot<T>;
    restore(snap: CollectionSnapshot<T>): void;
}
declare class Store {
    private collections;
    private _data;
    collection<T extends Entity>(name: string, indexFields?: (keyof T)[]): Collection<T>;
    getData<V>(key: string): V | undefined;
    setData<V>(key: string, value: V): void;
    reset(): void;
    snapshot(): StoreSnapshot;
    restore(snap: StoreSnapshot): void;
}

type BodyInit = ConstructorParameters<typeof Response>[0];
type HeadersInit = ConstructorParameters<typeof Headers>[0];
type FormDataEntryValue = string | File;
type ContentfulStatusCode = number;
type Next = () => Promise<void>;
type VariablesOf<E> = unknown extends E ? Record<string, any> : E extends {
    Variables: infer V;
} ? V : Record<string, any>;
type HandlerResult = Response | void | Promise<Response | void>;
type Handler<E = unknown, P extends string = string> = (c: Context<E, P>, next: Next) => HandlerResult;
type MiddlewareHandler<E = unknown> = Handler<E>;
type ErrorHandler<E = unknown> = (err: unknown, c: Context<E>) => Response | Promise<Response>;
type FetchHandler = (request: Request) => Response | Promise<Response>;
interface ServeOptions {
    fetch: FetchHandler;
    port?: number;
    hostname?: string;
}
interface CorsOptions {
    origin?: string;
    allowMethods?: string[];
    allowHeaders?: string[];
    credentials?: boolean;
    maxAge?: number;
}
declare class HonoRequest<P extends string = string> {
    private readonly params;
    readonly raw: Request;
    readonly url: string;
    readonly method: string;
    readonly path: string;
    constructor(request: Request, params: Record<string, string>);
    header(): Record<string, string>;
    header(name: string): string | undefined;
    query(name: string): string | undefined;
    queries(name: string): string[] | undefined;
    param(): Record<string, string>;
    param(name: string): string;
    json<T = any>(): Promise<T>;
    text(): Promise<string>;
    arrayBuffer(): Promise<ArrayBuffer>;
    parseBody(): Promise<Record<string, FormDataEntryValue | FormDataEntryValue[]>>;
}
declare class Context<E = unknown, P extends string = string> {
    private readonly notFoundHandler;
    readonly req: HonoRequest<P>;
    private readonly vars;
    private readonly responseHeaders;
    private responseStatus;
    constructor(request: Request, params: Record<string, string>, notFoundHandler: (c: Context<E>) => Response | Promise<Response>);
    get<K extends keyof VariablesOf<E> & string>(key: K): VariablesOf<E>[K] | undefined;
    set<K extends keyof VariablesOf<E> & string>(key: K, value: VariablesOf<E>[K]): void;
    header(name: string, value: string): void;
    status(status: number): void;
    json(data: unknown, status?: ContentfulStatusCode, headers?: HeadersInit): Response;
    text(text: string, status?: ContentfulStatusCode, headers?: HeadersInit): Response;
    html(html: string, status?: ContentfulStatusCode, headers?: HeadersInit): Response;
    body(body: BodyInit | null, status?: ContentfulStatusCode, headers?: HeadersInit): Response;
    redirect(location: string, status?: ContentfulStatusCode): Response;
    notFound(): Response | Promise<Response>;
    finalize(response: Response): Response;
    private response;
}
declare class Hono<E = unknown> {
    private readonly middleware;
    private readonly routes;
    private errorHandler;
    private notFoundHandler;
    use<P extends string = string>(path: string, ...handlers: Handler<E, P>[]): this;
    use(...handlers: Handler<E>[]): this;
    on<P extends string = string>(method: string, path: string, ...handlers: Handler<E, P>[]): this;
    get<P extends string = string>(path: string, ...handlers: Handler<E, P>[]): this;
    post<P extends string = string>(path: string, ...handlers: Handler<E, P>[]): this;
    put<P extends string = string>(path: string, ...handlers: Handler<E, P>[]): this;
    patch<P extends string = string>(path: string, ...handlers: Handler<E, P>[]): this;
    delete<P extends string = string>(path: string, ...handlers: Handler<E, P>[]): this;
    onError(handler: ErrorHandler<E>): this;
    notFound(handler: (c: Context<E>) => Response | Promise<Response>): this;
    request(input: string | Request, init?: RequestInit): Promise<Response>;
    fetch: (request: Request) => Promise<Response>;
    private match;
    private dispatch;
}
declare function cors(options?: CorsOptions): MiddlewareHandler;
declare function serve(options: ServeOptions): Server;

interface WebhookSubscription {
    id: number;
    url: string;
    events: string[];
    active: boolean;
    secret?: string;
    owner: string;
    repo?: string;
}
interface WebhookDelivery {
    id: number;
    hook_id: number;
    event: string;
    action?: string;
    payload: unknown;
    status_code: number | null;
    delivered_at: string;
    duration: number | null;
    success: boolean;
}
interface WebhookHeaderContext {
    event: string;
    action?: string;
    body: string;
    subscription: Readonly<WebhookSubscription>;
    deliveryId: number;
}
type WebhookHeaderFactory = (context: WebhookHeaderContext) => Record<string, string>;
declare class WebhookDispatcher {
    private subscriptions;
    private deliveries;
    private subscriptionIdCounter;
    private deliveryIdCounter;
    private headerFactory;
    setHeaderFactory(factory: WebhookHeaderFactory): void;
    register(sub: Omit<WebhookSubscription, "id"> & {
        id?: number;
    }): WebhookSubscription;
    unregister(id: number): boolean;
    getSubscription(id: number): WebhookSubscription | undefined;
    getSubscriptions(owner?: string, repo?: string): WebhookSubscription[];
    updateSubscription(id: number, data: Partial<Pick<WebhookSubscription, "url" | "events" | "active" | "secret">>): WebhookSubscription | undefined;
    dispatch(event: string, action: string | undefined, payload: unknown, owner: string, repo?: string): Promise<void>;
    getDeliveries(hookId?: number): WebhookDelivery[];
    clear(): void;
}

interface AuthUser {
    login: string;
    id: number;
    scopes: string[];
    installation?: AuthInstallation;
}
interface AuthApp {
    appId: number;
    slug: string;
    name: string;
}
interface AuthInstallation {
    installationId: number;
    appId: number;
    accountId: number;
    accountType: "User" | "Organization";
    permissions: Record<string, string>;
    repositoryIds: number[];
    repositorySelection: "all" | "selected";
}
type TokenMap = Map<string, AuthUser>;
interface TokenEntry {
    token: string;
    login: string;
    id: number;
    scopes: string[];
    installation?: AuthInstallation;
}
declare function serializeTokenMap(tokenMap: TokenMap): TokenEntry[];
declare function restoreTokenMap(tokenMap: TokenMap, tokens: TokenEntry[]): void;
type AppEnv = {
    Variables: {
        authUser?: AuthUser;
        authApp?: AuthApp;
        authToken?: string;
        authScopes?: string[];
        docsUrl?: string;
    };
};
interface AppKeyResolver {
    (appId: number): {
        privateKey: string;
        slug: string;
        name: string;
    } | null;
}
interface AuthFallback {
    login: string;
    id: number;
    scopes: string[];
}
declare function authMiddleware(tokens: TokenMap, appKeyResolver?: AppKeyResolver, fallbackUser?: AuthFallback): (c: Context, next: Next) => Promise<void>;
declare function requireAuth(): (c: Context, next: Next) => Promise<Response | undefined>;
declare function requireAppAuth(): (c: Context, next: Next) => Promise<Response | undefined>;

interface RouteContext {
    app: Hono<AppEnv>;
    store: Store;
    webhooks: WebhookDispatcher;
    baseUrl: string;
    tokenMap?: TokenMap;
}
interface ServicePlugin {
    name: string;
    register(app: Hono<AppEnv>, store: Store, webhooks: WebhookDispatcher, baseUrl: string, tokenMap?: TokenMap): void;
    seed?(store: Store, baseUrl: string): void;
}

interface ServerOptions {
    port?: number;
    baseUrl?: string;
    docsUrl?: string;
    tokens?: Record<string, {
        login: string;
        id: number;
        scopes?: string[];
    }>;
    appKeyResolver?: AppKeyResolver;
    fallbackUser?: AuthFallback;
}
declare function createServer(plugin: ServicePlugin, options?: ServerOptions): {
    app: Hono<AppEnv>;
    store: Store;
    webhooks: WebhookDispatcher;
    port: number;
    baseUrl: string;
    tokenMap: TokenMap;
};

/**
 * Use with `app.onError(...)`. Route handlers throw to the app error handler.
 */
declare function createApiErrorHandler(documentationUrl?: string): ErrorHandler;
/** Sets `docsUrl` on the context for successful responses; register `createApiErrorHandler` for thrown `ApiError`s. */
declare function createErrorHandler(documentationUrl?: string): MiddlewareHandler;
declare const errorHandler: MiddlewareHandler;
declare class ApiError extends Error {
    status: number;
    errors?: Array<{
        resource: string;
        field: string;
        code: string;
    }> | undefined;
    constructor(status: number, message: string, errors?: Array<{
        resource: string;
        field: string;
        code: string;
    }> | undefined);
}
declare function notFound(resource?: string): ApiError;
declare function validationError(message: string, errors?: ApiError["errors"]): ApiError;
declare function unauthorized(): ApiError;
declare function forbidden(): ApiError;
declare function parseJsonBody(c: Context): Promise<Record<string, unknown>>;

interface PaginationParams {
    page: number;
    per_page: number;
}
declare function parsePagination(c: Context): PaginationParams;
declare function setLinkHeader(c: Context, totalCount: number, page: number, perPage: number): void;

declare function escapeHtml(s: string): string;
declare function escapeAttr(s: string): string;
declare function renderCardPage(title: string, subtitle: string, body: string, service?: string): string;
declare function renderErrorPage(title: string, message: string, service?: string): string;
declare function renderSettingsPage(title: string, sidebarHtml: string, bodyHtml: string, service?: string): string;
interface InspectorTab {
    id: string;
    label: string;
    href: string;
}
declare function renderInspectorPage(title: string, tabs: InspectorTab[], activeTab: string, body: string, service?: string): string;
declare function renderFormPostPage(action: string, fields: Record<string, string>, service?: string): string;
interface CheckoutLineItem {
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    currency: string;
}
interface CheckoutPageOptions {
    merchantName?: string;
    lineItems: CheckoutLineItem[];
    subtotal: number;
    total: number;
    currency: string;
    sessionId: string;
    cancelUrl?: string | null;
}
declare function renderCheckoutPage(opts: CheckoutPageOptions, service?: string): string;
interface UserButtonOptions {
    letter: string;
    login: string;
    name?: string;
    email?: string;
    formAction: string;
    hiddenFields: Record<string, string>;
}
declare function renderUserButton(opts: UserButtonOptions): string;

declare function registerFontRoutes(app: Hono<AppEnv>): void;

declare function normalizeUri(uri: string): string;
declare function matchesRedirectUri(incoming: string, registered: string[]): boolean;
declare function constantTimeSecretEqual(a: string, b: string): boolean;
declare function bodyStr(v: unknown): string;
declare function parseCookies(header: string): Record<string, string>;

declare function debug(label: string, ...args: unknown[]): void;

interface PersistenceAdapter {
    load(): Promise<string | null>;
    save(data: string): Promise<void>;
}
declare function filePersistence(path: string): PersistenceAdapter;

export { ApiError, type AppEnv, type AppKeyResolver, type AuthApp, type AuthFallback, type AuthInstallation, type AuthUser, type CheckoutLineItem, type CheckoutPageOptions, Collection, type CollectionSnapshot, type ContentfulStatusCode, Context, type CorsOptions, type Entity, type ErrorHandler, type FetchHandler, type FilterFn, type Handler, Hono, HonoRequest, type InsertInput, type InspectorTab, type MiddlewareHandler, type Next, type PaginatedResult, type PaginationParams, type PersistenceAdapter, type QueryOptions, type RouteContext, type ServeOptions, type ServerOptions, type ServicePlugin, type SortFn, Store, type StoreSnapshot, type TokenEntry, type TokenMap, type UserButtonOptions, type WebhookDelivery, WebhookDispatcher, type WebhookHeaderContext, type WebhookHeaderFactory, type WebhookSubscription, authMiddleware, bodyStr, constantTimeSecretEqual, cors, createApiErrorHandler, createErrorHandler, createServer, debug, deserializeValue, errorHandler, escapeAttr, escapeHtml, filePersistence, forbidden, matchesRedirectUri, normalizeUri, notFound, parseCookies, parseJsonBody, parsePagination, registerFontRoutes, renderCardPage, renderCheckoutPage, renderErrorPage, renderFormPostPage, renderInspectorPage, renderSettingsPage, renderUserButton, requireAppAuth, requireAuth, restoreTokenMap, serializeTokenMap, serializeValue, serve, setLinkHeader, unauthorized, validationError };

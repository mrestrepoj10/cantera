import { ServicePlugin, Store, WebhookDispatcher, AppKeyResolver, PersistenceAdapter } from '@emulators/core';
export { PersistenceAdapter } from '@emulators/core';

interface EmulatorModule {
    plugin?: ServicePlugin;
    default?: ServicePlugin;
    seedFromConfig?(store: Store, baseUrl: string, config: unknown, webhooks?: WebhookDispatcher): void;
    createAppKeyResolver?(store: Store): AppKeyResolver;
}
interface EmulatorEntry {
    emulator: EmulatorModule;
    seed?: Record<string, unknown>;
}
interface EmulateHandlerConfig {
    services: Record<string, EmulatorEntry>;
    persistence?: PersistenceAdapter;
}
type NextRequest = Request;
type NextResponse = Response;
type RouteHandler = (req: NextRequest, ctx: {
    params: Promise<{
        path: string[];
    }>;
}) => Promise<NextResponse>;
declare function createEmulateHandler(config: EmulateHandlerConfig): {
    GET: RouteHandler;
    POST: RouteHandler;
    PUT: RouteHandler;
    PATCH: RouteHandler;
    DELETE: RouteHandler;
};
declare function withEmulate<T>(nextConfig: T, options?: {
    routePrefix?: string;
}): T;

export { type EmulateHandlerConfig, type EmulatorModule, createEmulateHandler, withEmulate };

import { Entity, Collection, Store, ServicePlugin } from '@emulators/core';

type ApsClientType = "confidential" | "public";
interface ApsClient extends Entity {
    client_id: string;
    client_secret: string;
    name: string;
    type: ApsClientType;
    redirect_uris: string[];
}
interface ApsUser extends Entity {
    user_id: string;
    email: string;
    name: string;
    first_name: string;
    last_name: string;
    picture: string | null;
}

interface ApsStore {
    clients: Collection<ApsClient>;
    users: Collection<ApsUser>;
}
declare function getApsStore(store: Store): ApsStore;

interface ApsSeedConfig {
    clients?: Array<{
        client_id: string;
        client_secret?: string;
        name?: string;
        type?: ApsClientType;
        redirect_uris: string[];
    }>;
    users?: Array<{
        user_id?: string;
        email: string;
        name?: string;
        picture?: string;
    }>;
}
declare function seedFromConfig(store: Store, _baseUrl: string, config: ApsSeedConfig): void;
declare const apsPlugin: ServicePlugin;

export { type ApsClient, type ApsClientType, type ApsSeedConfig, type ApsStore, type ApsUser, apsPlugin, apsPlugin as default, getApsStore, seedFromConfig };

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
interface ApsHub extends Entity {
    hub_id: string;
    name: string;
    region: string;
}
interface ApsProject extends Entity {
    project_id: string;
    hub_id: string;
    name: string;
}
type ApsIssuePermission = "manage" | "full_visibility" | "read";
interface ApsAccProjectUser extends Entity {
    project_id: string;
    user_id: string;
    role: "project_admin" | "member";
    issue_permission: ApsIssuePermission;
    rfi_roles: string[];
}
interface ApsActorRef {
    id: string;
    type: string;
}
/**
 * ACC entities store the full API response document as a typed `payload`.
 * The payload is the single source of truth: the fields routes filter or sort
 * on are declared explicitly, the long tail of response-only fields rides
 * along through the index signature. Entities add only the store's lookup
 * keys next to the payload — never a second copy of payload data.
 */
interface ApsIssueSubtypeDoc extends Record<string, unknown> {
    id: string;
}
interface ApsIssueTypeDoc extends Record<string, unknown> {
    id: string;
    isActive: boolean;
    subtypes: ApsIssueSubtypeDoc[];
}
interface ApsIssueType extends Entity {
    project_id: string;
    issue_type_id: string;
    payload: ApsIssueTypeDoc;
}
interface ApsIssueDoc extends Record<string, unknown> {
    id: string;
    displayId: number;
    title: string;
    status: string;
    issueTypeId: string;
    issueSubtypeId: string;
    assignedTo: string | null;
    deleted: boolean;
}
interface ApsIssue extends Entity {
    project_id: string;
    issue_id: string;
    payload: ApsIssueDoc;
}
interface ApsRfiTypeDoc extends Record<string, unknown> {
    id: string;
    status: string;
    isDefault: boolean;
}
interface ApsRfiType extends Entity {
    project_id: string;
    rfi_type_id: string;
    payload: ApsRfiTypeDoc;
}
interface ApsRfiAttributeDoc extends Record<string, unknown> {
    id: string;
    status: string;
}
interface ApsRfiAttribute extends Entity {
    project_id: string;
    attribute_id: string;
    payload: ApsRfiAttributeDoc;
}
interface ApsRfiDoc extends Record<string, unknown> {
    id: string;
    customIdentifier: string;
    title: string;
    question: string;
    status: string;
    assignedTo: ApsActorRef[];
    rfiTypeId: string;
    reference: string;
    priority: string;
    responses: unknown[];
    draftResponses: unknown[];
}
interface ApsRfi extends Entity {
    project_id: string;
    rfi_id: string;
    payload: ApsRfiDoc;
}
interface ApsSheetCollectionDoc extends Record<string, unknown> {
    id: string;
    name: string;
}
interface ApsSheetCollection extends Entity {
    project_id: string;
    collection_id: string;
    payload: ApsSheetCollectionDoc;
}
interface ApsSheetCollectionRef {
    id: string;
    name: string;
}
interface ApsSheetVersionSetDoc extends Record<string, unknown> {
    id: string;
    name: string;
    issuanceDate: string;
    collection: ApsSheetCollectionRef | null;
}
interface ApsSheetVersionSet extends Entity {
    project_id: string;
    version_set_id: string;
    payload: ApsSheetVersionSetDoc;
}
interface ApsSheetVersionSetRef {
    id: string;
    name: string;
    issuanceDate: string;
    deleted: boolean;
}
interface ApsSheetDoc extends Record<string, unknown> {
    id: string;
    number: string;
    title: string;
    tags: string[];
    isCurrent: boolean;
    deleted: boolean;
    versionSet: ApsSheetVersionSetRef;
    collection: ApsSheetCollectionRef | null;
}
interface ApsSheet extends Entity {
    project_id: string;
    sheet_id: string;
    payload: ApsSheetDoc;
}
type ApsManifestDerivative = Record<string, unknown>;
interface ApsManifest extends Entity {
    urn: string;
    type: string;
    hasThumbnail: string;
    status: string;
    progress: string;
    region: string;
    version: string;
    derivatives: ApsManifestDerivative[];
}

interface ApsAccActorSeed {
    id: string;
    type?: "user" | "role" | "company";
}
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
    hubs?: Array<{
        id: string;
        name: string;
        region?: string;
    }>;
    projects?: Array<{
        id: string;
        hub_id: string;
        name: string;
    }>;
    acc_project_users?: Array<{
        project_id: string;
        user_email: string;
        role?: "project_admin" | "member";
        issue_permission?: ApsIssuePermission;
        rfi_roles?: string[];
    }>;
    issue_types?: Array<{
        id: string;
        project_id: string;
        title: string;
        is_active?: boolean;
        order_index?: number;
        subtypes?: Array<{
            id: string;
            title: string;
            code?: string;
            is_active?: boolean;
            order_index?: number;
        }>;
    }>;
    issues?: Array<{
        id: string;
        project_id: string;
        title: string;
        description?: string;
        display_id?: number;
        issue_type_id: string;
        issue_subtype_id: string;
        status?: string;
        assigned_to?: string;
        assigned_to_type?: "user" | "role" | "company" | null;
        due_date?: string;
        start_date?: string;
        location_id?: string;
        location_details?: string;
        root_cause_id?: string;
        published?: boolean;
        deleted?: boolean;
        created_by?: string;
        created_at?: string;
        updated_by?: string;
        updated_at?: string;
    }>;
    rfi_types?: Array<{
        id: string;
        project_id: string;
        name: string;
        status?: string;
        is_default?: boolean;
        workflow_type?: string;
        due_date_offset?: number;
        manager?: ApsAccActorSeed[];
        reviewers?: ApsAccActorSeed[];
        watchers?: ApsAccActorSeed[];
    }>;
    rfi_attributes?: Array<{
        id: string;
        project_id: string;
        name: string;
        type?: string;
        description?: string;
        status?: string;
        multiple_choice?: boolean;
        possible_values?: Array<{
            id: string;
            name: string;
        }>;
    }>;
    rfis?: Array<{
        id: string;
        project_id: string;
        rfi_type_id: string;
        custom_identifier: string;
        title: string;
        question?: string;
        status?: string;
        previous_status?: string;
        workflow_type?: string;
        assigned_to?: ApsAccActorSeed[];
        manager_id?: string;
        due_date?: string;
        location_description?: string;
        locations?: string[];
        official_response?: string;
        official_response_status?: string;
        priority?: string;
        discipline?: string[];
        category?: string[];
        reference?: string;
        created_by?: string;
        created_at?: string;
        updated_by?: string;
        updated_at?: string;
    }>;
    sheet_collections?: Array<{
        id: string;
        project_id: string;
        name: string;
        created_by?: string;
        created_by_name?: string;
        created_at?: string;
        updated_by?: string;
        updated_by_name?: string;
        updated_at?: string;
    }>;
    sheet_version_sets?: Array<{
        id: string;
        project_id: string;
        name: string;
        issuance_date: string;
        collection_id?: string;
        created_by?: string;
        created_by_name?: string;
        created_at?: string;
        updated_by?: string;
        updated_by_name?: string;
        updated_at?: string;
    }>;
    sheets?: Array<{
        id: string;
        project_id: string;
        number: string;
        title: string;
        version_set_id: string;
        collection_id?: string;
        tags?: string[];
        upload_file_name?: string;
        upload_id?: string;
        paper_size?: [number, number];
        is_current?: boolean;
        deleted?: boolean;
        viewable_urn?: string;
        viewable_guid?: string;
        created_by?: string;
        created_by_name?: string;
        created_at?: string;
        updated_by?: string;
        updated_by_name?: string;
        updated_at?: string;
    }>;
    manifests?: Record<string, {
        type?: string;
        hasThumbnail?: string;
        status?: string;
        progress?: string;
        region?: string;
        version?: string;
        derivatives?: ApsManifestDerivative[];
    }>;
}
declare const DEFAULT_DATA_SEED: {
    hubs: {
        id: string;
        name: string;
        region: string;
    }[];
    projects: {
        id: string;
        hub_id: string;
        name: string;
    }[];
    acc_project_users: {
        project_id: string;
        user_email: string;
        role: "project_admin";
        issue_permission: "manage";
        rfi_roles: string[];
    }[];
    issue_types: {
        id: string;
        project_id: string;
        title: string;
        is_active: true;
        order_index: number;
        subtypes: {
            id: string;
            title: string;
            code: string;
            is_active: true;
            order_index: number;
        }[];
    }[];
    issues: {
        id: string;
        project_id: string;
        title: string;
        description: string;
        display_id: number;
        issue_type_id: string;
        issue_subtype_id: string;
        status: string;
        assigned_to: string;
        assigned_to_type: "user";
        due_date: string;
        location_details: string;
        published: true;
        created_by: string;
        created_at: string;
        updated_by: string;
        updated_at: string;
    }[];
    rfi_types: {
        id: string;
        project_id: string;
        name: string;
        status: string;
        is_default: true;
        workflow_type: string;
        due_date_offset: number;
        manager: {
            id: string;
        }[];
        reviewers: {
            id: string;
        }[];
        watchers: {
            id: string;
        }[];
    }[];
    rfi_attributes: {
        id: string;
        project_id: string;
        name: string;
        type: string;
        description: string;
        status: string;
    }[];
    rfis: ({
        id: string;
        project_id: string;
        rfi_type_id: string;
        custom_identifier: string;
        title: string;
        question: string;
        status: string;
        previous_status: string;
        workflow_type: string;
        assigned_to: {
            id: string;
        }[];
        manager_id: string;
        due_date: string;
        location_description: string;
        priority: string;
        discipline: string[];
        category: string[];
        reference: string;
        created_by: string;
        created_at: string;
        updated_by: string;
        updated_at: string;
    } | {
        id: string;
        project_id: string;
        rfi_type_id: string;
        custom_identifier: string;
        title: string;
        question: string;
        status: string;
        workflow_type: string;
        assigned_to: {
            id: string;
        }[];
        priority: string;
        discipline: string[];
        category: string[];
        reference: string;
        created_by: string;
        created_at: string;
        updated_by: string;
        updated_at: string;
        previous_status?: undefined;
        manager_id?: undefined;
        due_date?: undefined;
        location_description?: undefined;
    })[];
    sheet_collections: {
        id: string;
        project_id: string;
        name: string;
        created_by: string;
        created_by_name: string;
        created_at: string;
        updated_by: string;
        updated_by_name: string;
        updated_at: string;
    }[];
    sheet_version_sets: {
        id: string;
        project_id: string;
        name: string;
        issuance_date: string;
        collection_id: string;
        created_by: string;
        created_by_name: string;
        created_at: string;
        updated_by: string;
        updated_by_name: string;
        updated_at: string;
    }[];
    sheets: {
        id: string;
        project_id: string;
        number: string;
        title: string;
        version_set_id: string;
        collection_id: string;
        tags: string[];
        upload_file_name: string;
        upload_id: string;
        paper_size: [number, number];
        is_current: true;
        viewable_urn: string;
        viewable_guid: string;
        created_by: string;
        created_by_name: string;
        created_at: string;
        updated_by: string;
        updated_by_name: string;
        updated_at: string;
    }[];
    manifests: {
        dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6ZW11bGF0ZS1idWNrZXQvc2FtcGxlLnJ2dA: {
            type: string;
            hasThumbnail: string;
            status: string;
            progress: string;
            region: string;
            version: string;
            derivatives: ({
                name: string;
                hasThumbnail: string;
                status: string;
                progress: string;
                outputType: string;
                children: ({
                    guid: string;
                    type: string;
                    role: string;
                    urn: string;
                    mime: string;
                    status: string;
                    name?: undefined;
                    viewableID?: undefined;
                    hasThumbnail?: undefined;
                    progress?: undefined;
                    children?: undefined;
                } | {
                    guid: string;
                    type: string;
                    role: string;
                    name: string;
                    viewableID: string;
                    status: string;
                    hasThumbnail: string;
                    progress: string;
                    children: {
                        guid: string;
                        type: string;
                        role: string;
                        name: string;
                        status: string;
                        progress: string;
                    }[];
                    urn?: undefined;
                    mime?: undefined;
                })[];
            } | {
                status: string;
                progress: string;
                outputType: string;
                children: {
                    guid: string;
                    type: string;
                    role: string;
                    urn: string;
                    resolution: number[];
                    mime: string;
                    status: string;
                }[];
                name?: undefined;
                hasThumbnail?: undefined;
            })[];
        };
    };
};

interface ApsStore {
    clients: Collection<ApsClient>;
    users: Collection<ApsUser>;
    hubs: Collection<ApsHub>;
    projects: Collection<ApsProject>;
    manifests: Collection<ApsManifest>;
    accProjectUsers: Collection<ApsAccProjectUser>;
    issueTypes: Collection<ApsIssueType>;
    issues: Collection<ApsIssue>;
    rfiTypes: Collection<ApsRfiType>;
    rfiAttributes: Collection<ApsRfiAttribute>;
    rfis: Collection<ApsRfi>;
    sheetCollections: Collection<ApsSheetCollection>;
    sheetVersionSets: Collection<ApsSheetVersionSet>;
    sheets: Collection<ApsSheet>;
}
declare function getApsStore(store: Store): ApsStore;

declare function seedFromConfig(store: Store, _baseUrl: string, config: ApsSeedConfig): void;
declare const apsPlugin: ServicePlugin;

export { type ApsAccProjectUser, type ApsActorRef, type ApsClient, type ApsClientType, type ApsHub, type ApsIssue, type ApsIssueDoc, type ApsIssuePermission, type ApsIssueSubtypeDoc, type ApsIssueType, type ApsIssueTypeDoc, type ApsManifest, type ApsManifestDerivative, type ApsProject, type ApsRfi, type ApsRfiAttribute, type ApsRfiAttributeDoc, type ApsRfiDoc, type ApsRfiType, type ApsRfiTypeDoc, type ApsSeedConfig, type ApsSheet, type ApsSheetCollection, type ApsSheetCollectionDoc, type ApsSheetCollectionRef, type ApsSheetDoc, type ApsSheetVersionSet, type ApsSheetVersionSetDoc, type ApsSheetVersionSetRef, type ApsStore, type ApsUser, DEFAULT_DATA_SEED, apsPlugin, apsPlugin as default, getApsStore, seedFromConfig };

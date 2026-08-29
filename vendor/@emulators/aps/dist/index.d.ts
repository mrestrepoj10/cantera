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
interface ApsIssueType extends Entity {
    project_id: string;
    issue_type_id: string;
    is_active: boolean;
    payload: Record<string, unknown>;
}
interface ApsIssue extends Entity {
    project_id: string;
    issue_id: string;
    issue_type_id: string;
    issue_subtype_id: string;
    display_id: number;
    title: string;
    status: string;
    assigned_to: string | null;
    deleted: boolean;
    payload: Record<string, unknown>;
}
interface ApsRfiType extends Entity {
    project_id: string;
    rfi_type_id: string;
    status: string;
    payload: Record<string, unknown>;
}
interface ApsRfiAttribute extends Entity {
    project_id: string;
    attribute_id: string;
    status: string;
    payload: Record<string, unknown>;
}
interface ApsRfi extends Entity {
    project_id: string;
    rfi_id: string;
    rfi_type_id: string;
    custom_identifier: string;
    title: string;
    status: string;
    assigned_to: string[];
    reference: string;
    priority: string;
    payload: Record<string, unknown>;
}
interface ApsSheetCollection extends Entity {
    project_id: string;
    collection_id: string;
    payload: Record<string, unknown>;
}
interface ApsSheetVersionSet extends Entity {
    project_id: string;
    version_set_id: string;
    collection_id: string | null;
    issuance_date: string;
    payload: Record<string, unknown>;
}
interface ApsSheet extends Entity {
    project_id: string;
    sheet_id: string;
    version_set_id: string;
    collection_id: string | null;
    number: string;
    title: string;
    tags: string[];
    is_current: boolean;
    deleted: boolean;
    upload_file_name: string;
    viewable_urn: string;
    viewable_guid: string;
    payload: Record<string, unknown>;
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
type ApsWebhookStatus = "active" | "inactive" | "reactivated";
type ApsWebhookCreatorType = "Application" | "O2User";
type ApsWebhookFilter = string | string[];
interface ApsWebhookHook extends Entity {
    hook_id: string;
    tenant: string;
    callback_url: string;
    created_by: string;
    creator_type: ApsWebhookCreatorType;
    identity_key: string;
    event: string;
    system: string;
    status: ApsWebhookStatus;
    auto_reactivate_hook: boolean;
    hook_expiry: string | null;
    hook_attribute: Record<string, unknown> | null;
    filter: ApsWebhookFilter | null;
    scope: Record<string, string>;
    hub_id: string | null;
    project_id: string | null;
    token: string | null;
    region: string;
    failed_event_count: number;
    inactive_at: string | null;
    reactivation_count: number;
}
interface ApsWebhookSecret extends Entity {
    identity_key: string;
    region: string;
    token: string;
}
interface ApsWebhookDelivery extends Entity {
    delivery_id: string;
    hook_id: string;
    system: string;
    event: string;
    attempt: number;
    envelope: Record<string, unknown>;
    status_code: number | null;
    duration: number;
    success: boolean;
    signature_present: boolean;
}
interface ApsDocumentFolder extends Entity {
    folder_id: string;
    project_id: string;
    parent_folder_id: string | null;
    name: string;
    hidden: boolean;
    created_by: string;
    created_by_name: string;
    create_time: string;
    last_modified_by: string;
    last_modified_by_name: string;
    last_modified_time: string;
}
interface ApsDocumentItem extends Entity {
    item_id: string;
    project_id: string;
    folder_id: string;
    display_name: string;
    hidden: boolean;
    reserved: boolean;
    reserved_time: string | null;
    reserved_by: string | null;
    reserved_by_name: string | null;
    created_by: string;
    created_by_name: string;
    create_time: string;
    last_modified_by: string;
    last_modified_by_name: string;
    last_modified_time: string;
    extension_type: string;
}
interface ApsDocumentVersion extends Entity {
    version_id: string;
    item_id: string;
    project_id: string;
    version_number: number;
    display_name: string;
    file_type: string;
    mime_type: string;
    storage_size: number;
    storage_urn: string;
    region: string;
    bubble_urn: string | null;
    viewable_id: string;
    viewable_guid: string;
    created_by: string;
    created_by_name: string;
    create_time: string;
    last_modified_by: string;
    last_modified_by_name: string;
    last_modified_time: string;
}
interface ApsStorageObject extends Entity {
    object_id: string;
    bucket_key: string;
    object_key: string;
    project_id: string;
    folder_id: string;
    name: string;
    size: number;
    sha1: string;
    content_base64: string | null;
    uploaded_at: string | null;
}
interface ApsBucket extends Entity {
    bucket_key: string;
    policy_key: string;
    created_at: string;
}
interface ApsUploadSession extends Entity {
    upload_key: string;
    object_key: string;
    bucket_key: string;
    parts_base64: Array<string | null>;
    expected_parts: number;
    expires_at: string;
}
type ApsTranslationJobStatus = "pending" | "inprogress" | "success" | "failed";
interface ApsTranslationOutputFormat {
    type: "svf2" | "svf" | "thumbnail";
    views: string[];
}
interface ApsTranslationJob extends Entity {
    urn: string;
    source_name: string;
    region: string;
    status: ApsTranslationJobStatus;
    progress: string;
    started_at: string;
    completes_at: string;
    output_formats: ApsTranslationOutputFormat[];
    force_count: number;
    webhook_emitted: boolean;
}
type ApsModelSetVersionStatus = "Pending" | "Processing" | "Successful" | "Partial" | "Failed";
type ApsClashTestStatus = "Pending" | "Processing" | "Success" | "Failed";
interface ApsModelSetDocumentVersion {
    stableDocumentId: string;
    unstableDocumentId: string;
    documentLineage: {
        lineageUrn: string;
        parentFolderUrn: string;
        isAligned: boolean;
        tipVersionUrn: string;
    };
    alignment: {
        transform: number[];
        checksum: string;
        upAxis: number[];
        distanceUnit: string;
    };
    isTipVersion: boolean;
    documentStatus: "Succeeded" | "Failed" | "Running" | "Skipped";
    forgeType: "versions:autodesk.bim360:Document" | "versions:autodesk.bim360:File";
    versionUrn: string;
    displayName: string;
    revision: string;
    viewableName: string;
    createUserId: string;
    createTime: string;
    viewableGuid: string;
    viewableId: string;
    viewableMime: string;
    bubbleUrn: string;
    isSvf2Supported: boolean;
    originalSeedFileVersionSize: number;
    originalSeedFileVersionUrn: string;
    originalSeedFileVersionName: string;
}
interface ApsModelSet extends Entity {
    project_id: string;
    model_set_id: string;
    name: string;
    description: string;
    root_folder_urn: string;
    folder_urns: string[];
    created_by: string;
    created_time: string;
    modified_by: string;
    modified_time: string;
    disabled: boolean;
    deleted: boolean;
}
interface ApsModelSetVersion extends Entity {
    model_set_id: string;
    version: number;
    create_time: string;
    status: ApsModelSetVersionStatus;
    document_versions: ApsModelSetDocumentVersion[];
}
interface ApsModelSetView extends Entity {
    model_set_id: string;
    version: number;
    view_id: string;
    document_versions: string[];
}
interface ApsClashTest extends Entity {
    project_id: string;
    test_id: string;
    model_set_id: string;
    model_set_version: number;
    status: ApsClashTestStatus;
    completed_on: string | null;
}
interface ApsClashGroup extends Entity {
    test_id: string;
    disposition: "assigned" | "closed";
    group_id: string;
    original_clash_test_id: string;
    created_at_version: number;
    existing: number[];
    resolved: number[];
}
interface ApsSignedBlob extends Entity {
    blob_id: string;
    filename: string;
    content_type: string;
    content_base64: string;
}

interface ApsAccActorSeed {
    id: string;
    type?: "user" | "role" | "company";
}
interface ApsDocumentVersionSeed {
    version_id: string;
    item_id: string;
    folder_id?: string;
    ancestor_folder_ids?: string[];
    project_id: string;
    version_number?: number;
    display_name?: string;
    file_type?: string;
    mime_type?: string;
    storage_size?: number;
    storage_urn?: string;
    region?: string;
    bubble_urn?: string | null;
    viewable_id?: string;
    viewable_guid?: string;
    created_by?: string;
    created_by_name?: string;
    create_time?: string;
    last_modified_by?: string;
    last_modified_by_name?: string;
    last_modified_time?: string;
}
interface ApsDocumentFolderSeed {
    id: string;
    project_id: string;
    parent_folder_id?: string;
    name: string;
    hidden?: boolean;
    created_by?: string;
    created_by_name?: string;
    create_time?: string;
    last_modified_by?: string;
    last_modified_by_name?: string;
    last_modified_time?: string;
}
interface ApsDocumentItemSeed {
    id: string;
    project_id: string;
    folder_id: string;
    display_name: string;
    hidden?: boolean;
    reserved?: boolean;
    reserved_time?: string;
    reserved_by?: string;
    reserved_by_name?: string;
    extension_type?: string;
    created_by?: string;
    created_by_name?: string;
    create_time?: string;
    last_modified_by?: string;
    last_modified_by_name?: string;
    last_modified_time?: string;
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
    upload?: Partial<ApsUploadConfig>;
    translation?: Partial<ApsTranslationConfig>;
    webhook_timing?: Partial<ApsWebhookTimingConfig>;
    model_coordination_timing?: Partial<ApsModelCoordinationTimingConfig>;
    document_folders?: ApsDocumentFolderSeed[];
    document_items?: ApsDocumentItemSeed[];
    document_versions?: ApsDocumentVersionSeed[];
    /** @deprecated Use document_versions. */
    webhook_dm_versions?: ApsDocumentVersionSeed[];
    model_sets?: Array<{
        id: string;
        project_id: string;
        name: string;
        description?: string;
        root_folder_urn?: string;
        folder_urns?: string[];
        document_version_ids?: string[];
        created_by?: string;
        created_time?: string;
        disabled?: boolean;
        deleted?: boolean;
        test_id?: string;
    }>;
    webhooks?: Array<{
        system: string;
        event: string;
        callback_url: string;
        scope: Record<string, string>;
        tenant?: string;
        creator_client_id?: string;
        creator_user_email?: string;
        region?: string;
        status?: "active" | "inactive";
        auto_reactivate_hook?: boolean;
        hook_expiry?: string | null;
        hook_attribute?: Record<string, unknown>;
        filter?: string | string[];
        token?: string;
        hub_id?: string;
        project_id?: string;
    }>;
}
interface ApsWebhookTimingConfig {
    max_retries: number;
    retry_base_ms: number;
    retry_max_ms: number;
    failed_events_before_inactive: number;
    reactivate_after_ms: number;
    max_reactivation_cycles: number;
    delivery_timeout_ms: number;
}
interface ApsModelCoordinationTimingConfig {
    processing_ms: number;
    signed_url_ttl_ms: number;
}
interface ApsUploadConfig {
    maxObjectBytes: number;
}
interface ApsTranslationConfig {
    autoTranslateOnVersionAdd: boolean;
    durationMs: number;
    failForExtensions: string[];
}
declare const DEFAULT_UPLOAD_CONFIG: ApsUploadConfig;
declare const DEFAULT_TRANSLATION_CONFIG: ApsTranslationConfig;
declare const DEFAULT_MODEL_COORDINATION_TIMING: ApsModelCoordinationTimingConfig;
declare const DEFAULT_WEBHOOK_TIMING: ApsWebhookTimingConfig;
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
    document_folders: ({
        id: string;
        project_id: string;
        name: string;
        create_time: string;
        parent_folder_id?: undefined;
    } | {
        id: string;
        project_id: string;
        parent_folder_id: string;
        name: string;
        create_time: string;
    })[];
    document_items: {
        id: string;
        project_id: string;
        folder_id: string;
        display_name: string;
        create_time: string;
    }[];
    document_versions: ({
        version_id: string;
        item_id: string;
        project_id: string;
        version_number: number;
        display_name: string;
        file_type: string;
        mime_type: string;
        storage_size: number;
        storage_urn: string;
        region: string;
        bubble_urn: null;
        create_time: string;
    } | {
        version_id: string;
        item_id: string;
        project_id: string;
        version_number: number;
        display_name: string;
        file_type: string;
        mime_type: string;
        storage_size: number;
        storage_urn: string;
        region: string;
        create_time: string;
        bubble_urn?: undefined;
        viewable_id?: undefined;
        viewable_guid?: undefined;
    } | {
        version_id: string;
        item_id: string;
        project_id: string;
        version_number: number;
        display_name: string;
        file_type: string;
        mime_type: string;
        storage_size: number;
        storage_urn: string;
        region: string;
        bubble_urn: string;
        viewable_id: string;
        viewable_guid: string;
        create_time: string;
    })[];
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
        dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6ZW11bGF0ZS1idWNrZXQvc3RydWN0dXJhbC5ydnQ: {
            type: string;
            hasThumbnail: string;
            status: string;
            progress: string;
            region: string;
            version: string;
            derivatives: {
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
            }[];
        };
    };
    model_sets: {
        id: string;
        project_id: string;
        name: string;
        description: string;
        root_folder_urn: string;
        folder_urns: string[];
        document_version_ids: string[];
        created_by: string;
        created_time: string;
        test_id: string;
    }[];
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
    webhookHooks: Collection<ApsWebhookHook>;
    webhookSecrets: Collection<ApsWebhookSecret>;
    webhookDeliveries: Collection<ApsWebhookDelivery>;
    documentFolders: Collection<ApsDocumentFolder>;
    documentItems: Collection<ApsDocumentItem>;
    documentVersions: Collection<ApsDocumentVersion>;
    buckets: Collection<ApsBucket>;
    storageObjects: Collection<ApsStorageObject>;
    uploadSessions: Collection<ApsUploadSession>;
    translationJobs: Collection<ApsTranslationJob>;
    modelSets: Collection<ApsModelSet>;
    modelSetVersions: Collection<ApsModelSetVersion>;
    modelSetViews: Collection<ApsModelSetView>;
    clashTests: Collection<ApsClashTest>;
    clashGroups: Collection<ApsClashGroup>;
    signedBlobs: Collection<ApsSignedBlob>;
}
declare function getApsStore(store: Store): ApsStore;

declare function getModelCoordinationTiming(store: Store): ApsModelCoordinationTimingConfig;
declare function setModelCoordinationTiming(store: Store, timing: Partial<ApsModelCoordinationTimingConfig>): void;

declare function getUploadConfig(store: Store): ApsUploadConfig;
declare function setUploadConfig(store: Store, input: Partial<ApsUploadConfig>): void;
declare function getTranslationConfig(store: Store): ApsTranslationConfig;
declare function setTranslationConfig(store: Store, input: Partial<ApsTranslationConfig>): void;

interface ApsWebhookEventInput {
    system: string;
    event: string;
    resourceUrn: string;
    payload: Record<string, unknown>;
    region: string;
    tenant?: string;
    scopeValue?: string;
    scope?: Record<string, string>;
    folderAncestors?: string[];
}
interface ApsWebhookDeliveryReport {
    hookId: string;
    matched: boolean;
    delivered: boolean;
    statusCode: number | null;
    attempts: number;
    signaturePresent: boolean;
    reason?: string;
}
interface ApsWebhookSimulationReport {
    system: string;
    event: string;
    resourceUrn: string;
    deliveries: ApsWebhookDeliveryReport[];
}
declare function getWebhookTiming(store: Store): ApsWebhookTimingConfig;
declare function setWebhookTiming(store: Store, timing: Partial<ApsWebhookTimingConfig>): void;
declare function webhookDetails(hook: ApsWebhookHook): Record<string, unknown>;
declare function simulateWebhookEvent(aps: ApsStore, store: Store, input: ApsWebhookEventInput): Promise<ApsWebhookSimulationReport>;

declare function seedFromConfig(store: Store, _baseUrl: string, config: ApsSeedConfig): void;
declare const apsPlugin: ServicePlugin;

export { type ApsAccProjectUser, type ApsBucket, type ApsClashGroup, type ApsClashTest, type ApsClashTestStatus, type ApsClient, type ApsClientType, type ApsDocumentFolder, type ApsDocumentFolderSeed, type ApsDocumentItem, type ApsDocumentItemSeed, type ApsDocumentVersion, type ApsDocumentVersionSeed, type ApsHub, type ApsIssue, type ApsIssuePermission, type ApsIssueType, type ApsManifest, type ApsManifestDerivative, type ApsModelCoordinationTimingConfig, type ApsModelSet, type ApsModelSetDocumentVersion, type ApsModelSetVersion, type ApsModelSetVersionStatus, type ApsModelSetView, type ApsProject, type ApsRfi, type ApsRfiAttribute, type ApsRfiType, type ApsSeedConfig, type ApsSheet, type ApsSheetCollection, type ApsSheetVersionSet, type ApsSignedBlob, type ApsStorageObject, type ApsStore, type ApsTranslationConfig, type ApsTranslationJob, type ApsTranslationJobStatus, type ApsTranslationOutputFormat, type ApsUploadConfig, type ApsUploadSession, type ApsUser, type ApsWebhookCreatorType, type ApsWebhookDelivery, type ApsWebhookFilter, type ApsWebhookHook, type ApsWebhookSecret, type ApsWebhookStatus, type ApsWebhookTimingConfig, DEFAULT_DATA_SEED, DEFAULT_MODEL_COORDINATION_TIMING, DEFAULT_TRANSLATION_CONFIG, DEFAULT_UPLOAD_CONFIG, DEFAULT_WEBHOOK_TIMING, apsPlugin, apsPlugin as default, getApsStore, getModelCoordinationTiming, getTranslationConfig, getUploadConfig, getWebhookTiming, seedFromConfig, setModelCoordinationTiming, setTranslationConfig, setUploadConfig, setWebhookTiming, simulateWebhookEvent, webhookDetails };

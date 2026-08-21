/**
 * Minimal structural types for the parts of the Autodesk Viewer SDK this
 * package touches. The SDK ships no ESM types (it is a global-namespace
 * library loaded from Autodesk's CDN), so we describe only the surface we
 * use and stay zero-dependency. Escape hatches are typed as `any` on
 * purpose — the full SDK surface is enormous and version-dependent.
 */

export type Vec3 = { x: number; y: number; z: number }

export interface APSCameraState {
  position: Vec3
  target: Vec3
  up: Vec3
  isPerspective: boolean
}

export interface APSProperty {
  displayName: string
  displayValue: string | number | boolean
  displayCategory: string
  units: string | null
  hidden: boolean
  type: number
}

export interface APSPropertyResult {
  dbId: number
  name: string
  externalId: string
  properties: APSProperty[]
}

export interface APSContextMenuItem {
  title: string
  target: (() => void) | APSContextMenuItem[]
  icon?: string
  divider?: boolean
}

export interface APSContextMenuStatus {
  /** dbIds under the cursor when the menu opened (empty over empty space) */
  numSelected: number
  hasSelected: boolean
  canvasX: number
  canvasY: number
  [key: string]: any
}

export interface APSModel {
  id: number
  getData(): any
  getInstanceTree(): any
  [key: string]: any
}

export interface APSDocumentNode {
  data: any
  [key: string]: any
}

export interface APSDocument {
  getRoot(): {
    getDefaultGeometry(): APSDocumentNode
    search(query: Record<string, unknown>): APSDocumentNode[]
  }
  [key: string]: any
}

export interface APSViewer3D {
  start(url?: string, options?: unknown): number
  finish(): void
  addEventListener(type: string, listener: (event: any) => void): void
  removeEventListener(type: string, listener: (event: any) => void): void
  getSelection(): number[]
  select(dbIds: number[] | number): void
  clearSelection(): void
  isolate(dbIds?: number[] | number): void
  fitToView(dbIds?: number[] | null, model?: APSModel | null): void
  getProperties(
    dbId: number,
    onSuccess: (result: APSPropertyResult) => void,
    onError?: (error: unknown) => void,
  ): void
  loadDocumentNode(
    document: APSDocument,
    node: APSDocumentNode,
    options?: Record<string, unknown>,
  ): Promise<APSModel>
  loadExtension(id: string, options?: Record<string, unknown>): Promise<unknown>
  unloadExtension(id: string): boolean
  getExtension(id: string): unknown
  registerContextMenuCallback(
    id: string,
    callback: (menu: APSContextMenuItem[], status: APSContextMenuStatus) => void,
  ): void
  unregisterContextMenuCallback(id: string): boolean
  setTheme(theme: 'light-theme' | 'dark-theme'): void
  resize(): void
  navigation: {
    getPosition(): Vec3
    getTarget(): Vec3
    getCameraUpVector(): Vec3
    setView(position: Vec3, target: Vec3): void
    setCameraUpVector(up: Vec3): void
    getCamera(): { isPerspective: boolean; [key: string]: any }
  }
  model?: APSModel
  container: HTMLElement
  toolbar?: { container: HTMLElement }
  canvas?: HTMLCanvasElement
  impl?: any
  [key: string]: any
}

export interface APSViewerExtension {
  viewer: APSViewer3D
  options?: Record<string, unknown>
  load(): boolean | Promise<boolean>
  unload(): boolean | Promise<boolean>
  onToolbarCreated?(): void
}

export type APSViewerExtensionConstructor = new (
  viewer: APSViewer3D,
  options?: Record<string, unknown>,
) => APSViewerExtension

export interface APSViewingNamespace {
  Initializer(options: Record<string, unknown>, onInitialized: () => void): void
  shutdown(): void
  Document: {
    load(
      documentId: string,
      onSuccess: (doc: APSDocument) => void,
      onError: (errorCode: number, errorMsg: string, messages?: unknown) => void,
    ): void
  }
  GuiViewer3D: new (container: HTMLElement, config?: Record<string, unknown>) => APSViewer3D
  Viewer3D: new (container: HTMLElement, config?: Record<string, unknown>) => APSViewer3D
  Extension: APSViewerExtensionConstructor
  theExtensionManager: {
    registerExtension(id: string, extension: APSViewerExtensionConstructor): boolean
    getExtensionClass?(id: string): APSViewerExtensionConstructor | null
  }
  SELECTION_CHANGED_EVENT: string
  AGGREGATE_SELECTION_CHANGED_EVENT: string
  CAMERA_CHANGE_EVENT: string
  GEOMETRY_LOADED_EVENT: string
  OBJECT_TREE_CREATED_EVENT: string
  PROGRESS_UPDATE_EVENT: string
  EXTENSION_LOADED_EVENT: string
  TOOLBAR_CREATED_EVENT: string
  ERROR_EVENT: string
  [key: string]: any
}

export interface AutodeskGlobal {
  Viewing: APSViewingNamespace
  [key: string]: any
}

declare global {
  interface Window {
    Autodesk?: AutodeskGlobal
  }
}

/**
 * Token supplier. Called by the viewer runtime whenever it needs a fresh
 * 2-legged (or 3-legged) OAuth token. Fetch it from YOUR backend — never
 * embed APS credentials in the browser.
 */
export type GetAccessToken = () => Promise<{
  accessToken: string
  /** seconds until expiry; the runtime re-calls the supplier before then */
  expiresInSeconds: number
}>

export type APSViewerStatus = 'idle' | 'loading-runtime' | 'ready' | 'error'

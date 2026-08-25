/**
 * Typed surface for the Autodesk Platform Services (APS) Viewer SDK.
 *
 * The SDK is a global-namespace library loaded from Autodesk's CDN. Its types
 * come from Autodesk's official definitions — `@types/forge-viewer`, installed
 * as a dev dependency of this item — which declare the full `Autodesk.Viewing`
 * namespace ambiently. This file re-exports that surface under stable `APS*`
 * names and adds cantera's own domain types; the sibling `forge-viewer.d.ts`
 * declares the few members the official definitions are missing.
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
  [key: string]: unknown
}

/** The SDK surface under stable names. `Viewer3D` is the base class, so a
 * `GuiViewer3D` (the toolbar-bearing default) is an `APSViewer3D` too. */
export type APSViewer3D = Autodesk.Viewing.Viewer3D
export type APSModel = Autodesk.Viewing.Model
export type APSDocument = Autodesk.Viewing.Document
export type APSDocumentNode = Autodesk.Viewing.BubbleNode
export type APSViewerExtension = Autodesk.Viewing.Extension
export type APSViewerExtensionConstructor = new (
  viewer: Autodesk.Viewing.GuiViewer3D,
  options?: Record<string, unknown>,
) => Autodesk.Viewing.Extension
export type APSViewingNamespace = typeof Autodesk.Viewing
export type AutodeskGlobal = typeof Autodesk

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

/**
 * One extension to load with the viewer: a bare id, or an id with the options
 * `loadExtension` passes to the extension's constructor. The
 * `viewer-extension-types` item catalogs the public ids and types their
 * options; this shape deliberately accepts any string so consumer-registered
 * extensions need nothing extra.
 */
export type APSExtensionRequest = string | { id: string; options?: Record<string, unknown> }

/** Load lifecycle of one extension, keyed by id. */
export type APSExtensionStatus = 'loading' | 'ready' | 'error'

/** Named viewer settings profile, applied at viewer creation. */
export type APSViewerProfile = 'aec' | 'default' | 'fluent' | 'navis'

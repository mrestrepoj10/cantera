'use client'

export { APSViewer, type APSViewerProps } from '@/components/ui/aps-viewer/aps-viewer'
export {
  APSViewerContext,
  useAPSViewerStore,
} from '@/components/ui/aps-viewer/context'
export {
  type APSCamera,
  type APSPropertiesResult,
  type APSSelection,
  type BuildContextMenu,
  useAPSAutoResize,
  useAPSCamera,
  useAPSContextMenu,
  useAPSExtension,
  useAPSModelLoaded,
  useAPSProperties,
  useAPSSelection,
  useAPSViewer,
  useAPSViewerEvent,
} from '@/components/ui/aps-viewer/hooks'
export {
  acquireViewerRuntime,
  loadViewerScript,
  releaseViewerRuntime,
  toDocumentId,
  type ViewerRuntimeOptions,
} from '@/components/ui/aps-viewer/loader'
export { ViewerStore } from '@/components/ui/aps-viewer/store'
export type {
  APSCameraState,
  APSContextMenuItem,
  APSContextMenuStatus,
  APSDocument,
  APSDocumentNode,
  APSModel,
  APSProperty,
  APSPropertyResult,
  APSViewer3D,
  APSViewerExtension,
  APSViewerExtensionConstructor,
  APSViewerStatus,
  APSViewingNamespace,
  AutodeskGlobal,
  GetAccessToken,
  Vec3,
} from '@/lib/viewer-types'
